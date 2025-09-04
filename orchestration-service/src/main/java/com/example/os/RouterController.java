package com.example.os;

import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.server.reactive.ServerHttpRequest;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.TimeoutException;
import java.util.function.Predicate;

import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@RestController
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
@Validated
public class RouterController {

  private final WebClient client;
  private final String extractionUrl;
  private final String searchUrl;

  private final long timeoutMs;
  private final int retryCount;
  private final long retryBackoffMs;

  public RouterController(
      @Value("${agents.extraction}") String extractionUrl,
      @Value("${agents.search}") String searchUrl,
      @Value("${orchestration.timeoutMs:90000}") long timeoutMs,
      @Value("${orchestration.retry.count:1}") int retryCount,
      @Value("${orchestration.retry.backoffMs:500}") long retryBackoffMs
  ) {
    this.extractionUrl = extractionUrl;
    this.searchUrl = searchUrl;
    this.timeoutMs = timeoutMs;
    this.retryCount = retryCount;
    this.retryBackoffMs = retryBackoffMs;

    this.client = WebClient.builder()
        .exchangeStrategies(ExchangeStrategies.builder()
            .codecs(c -> c.defaultCodecs().maxInMemorySize(16 * 1024 * 1024))
            .build())
        .build();
  }

  /** Body accettato da OS (inviato da OA) */
  public static class RouteBody {
    @NotBlank
    private String targetAgent;                // "extraction-agent" | "search-agent" | ...
    private Map<String, Object> agentPayload;  // payload per l’agente
    private Map<String, String> titleToIdMap;  // opzionale: { "title": "user:proj:doc" }
    private List<String> documentTitles;       // opzionale

    public RouteBody() {}
    public String getTargetAgent() { return targetAgent; }
    public void setTargetAgent(String targetAgent) { this.targetAgent = targetAgent; }
    public Map<String, Object> getAgentPayload() { return agentPayload; }
    public void setAgentPayload(Map<String, Object> agentPayload) { this.agentPayload = agentPayload; }
    public Map<String, String> getTitleToIdMap() { return titleToIdMap; }
    public void setTitleToIdMap(Map<String, String> titleToIdMap) { this.titleToIdMap = titleToIdMap; }
    public List<String> getDocumentTitles() { return documentTitles; }
    public void setDocumentTitles(List<String> documentTitles) { this.documentTitles = documentTitles; }
  }

  @PostMapping("/api/v1/agents/route")
  public Mono<Map<String, Object>> route(@RequestBody RouteBody body, ServerHttpRequest incoming) {
    final String target = body.getTargetAgent();
    final Map<String, Object> payload = body.getAgentPayload() != null
        ? new LinkedHashMap<>(body.getAgentPayload())
        : new LinkedHashMap<>();

    // 1) Normalizza titles -> document_ids se necessario
    List<String> docIds = extractDocIdsFromPayload(payload);
    if ((docIds == null || docIds.isEmpty())
        && body.getDocumentTitles() != null
        && body.getTitleToIdMap() != null) {
      docIds = resolveTitlesToIds(body.getDocumentTitles(), body.getTitleToIdMap());
      if (!docIds.isEmpty()) {
        payload.putIfAbsent("document_ids", docIds);
      }
    }

    // 2) Determina URL agente target
    final String url;
    if ("extraction-agent".equalsIgnoreCase(target)) {
      url = extractionUrl + "/api/v1/agents/extract";
      if (!payload.containsKey("document_ids") && docIds != null && !docIds.isEmpty()) {
        payload.put("document_ids", docIds);
      }
    } else if ("search-agent".equalsIgnoreCase(target)) {
      url = searchUrl + "/api/v1/search";
    } else {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "unknown target agent: " + target);
    }

    // 3) Propagazione header utili (Authorization, correlazione)
    Map<String, String> fwdHeaders = buildForwardHeaders(incoming);

    // 4) Chiamata sincrona con timeout e retry leggero
    Predicate<Throwable> isTransient = t ->
        t instanceof TimeoutException ||
        t instanceof WebClientRequestException ||
        (t instanceof WebClientResponseException w && w.getStatusCode().is5xxServerError());

    return client.post().uri(url)
        .headers(h -> fwdHeaders.forEach(h::set))
        .contentType(MediaType.APPLICATION_JSON)
        .body(BodyInserters.fromValue(payload))
        .retrieve()
        .onStatus(HttpStatusCode::isError, resp ->
            resp.bodyToMono(String.class).defaultIfEmpty("")
                .flatMap(bodyStr -> Mono.error(new WebClientResponseException(
                    "Agent returned " + resp.statusCode() + ": " + bodyStr,
                    resp.statusCode().value(), resp.statusCode().toString(), null, null, null)))
        )
        .bodyToMono(Map.class)
        .timeout(Duration.ofMillis(timeoutMs))
        .retryWhen(Retry.backoff(Math.max(0, retryCount), Duration.ofMillis(Math.max(0, retryBackoffMs)))
            .filter(isTransient))
        .map(agentResponse -> {
          Map<String, Object> out = new LinkedHashMap<>();
          out.put("targetAgent", target);
          out.put("requestPayload", payload);
          out.put("agentResponse", agentResponse);
          return out;
        })
        // 5) Mappatura errori → 502/504
        .onErrorMap(TimeoutException.class, t ->
            new ResponseStatusException(HttpStatus.GATEWAY_TIMEOUT, "Agent timeout (" + timeoutMs + " ms)"))
        .onErrorMap(WebClientRequestException.class, t ->
            new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Agent unreachable: " + t.getMessage()))
        .onErrorMap(WebClientResponseException.class, t ->
            // Propaga status dell’agente (4xx/5xx) come tale
            new ResponseStatusException(HttpStatusCode.valueOf(t.getStatusCode().value()), t.getMessage()));
  }

  @GetMapping("/health")
  public Map<String,Object> health(){
    return Map.of("status","ok","service","orchestration-service");
  }

  // ---- helpers ----
  @SuppressWarnings("unchecked")
  private List<String> extractDocIdsFromPayload(Map<String, Object> payload) {
    Object v = payload.get("document_ids");
    if (v instanceof List<?>) {
      List<?> raw = (List<?>) v;
      List<String> out = new ArrayList<>();
      for (Object o : raw) out.add(String.valueOf(o));
      return out;
    }
    return Collections.emptyList();
  }

  private List<String> resolveTitlesToIds(List<String> titles, Map<String, String> titleToIdMap) {
    List<String> ids = new ArrayList<>();
    for (String t : titles) {
      String id = titleToIdMap.get(t);
      if (id != null && !id.isBlank()) ids.add(id);
    }
    return ids;
  }

  private Map<String, String> buildForwardHeaders(ServerHttpRequest req) {
    Map<String, String> out = new HashMap<>();
    // Authorization (JWT)
    Optional.ofNullable(req.getHeaders().getFirst("Authorization"))
        .filter(h -> !h.isBlank())
        .ifPresent(h -> out.put("Authorization", h));

    // Correlation / Request-Id
    String rid = Optional.ofNullable(req.getHeaders().getFirst("X-Request-Id"))
        .orElseGet(() -> UUID.randomUUID().toString());
    out.put("X-Request-Id", rid);
    out.put("X-Correlation-Id", rid);

    // (opzionale) origini utili al logging
    out.put("X-Gateway-Source", "orchestration-service");
    return out;
  }
}
