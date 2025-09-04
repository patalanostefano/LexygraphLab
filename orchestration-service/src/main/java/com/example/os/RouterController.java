package com.example.os;

import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.*;

@RestController
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
@Validated
public class RouterController {

  private final WebClient client;
  private final String extractionUrl;
  private final String searchUrl;

  public RouterController(@Value("${agents.extraction}") String extractionUrl,
                          @Value("${agents.search}") String searchUrl) {
    this.extractionUrl = extractionUrl;
    this.searchUrl = searchUrl;
    // WebClient con timeout e maxInMemory aumentato (risposte corpose dagli agent)
    this.client = WebClient.builder()
        .exchangeStrategies(ExchangeStrategies.builder()
            .codecs(c -> c.defaultCodecs().maxInMemorySize(16 * 1024 * 1024))
            .build())
        .build();
  }

  /** Body accettato da OS (inviato da OA) */
  public static class RouteBody {
    @NotBlank
    private String targetAgent;             // es: "extraction-agent" | "search-agent"
    private Map<String, Object> agentPayload;  // payload “logico” lato OA (prompt, titles, params, ecc.)
    private Map<String, String> titleToIdMap;  // opzionale: {"Q3 Revenue Report":"user:proj:doc1", ...}
    private List<String> documentTitles;       // opzionale: ["Q3 Revenue Report", "Q3 Expenses"]

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
  public Mono<Map> route(@RequestBody RouteBody body) {
    final String target = body.getTargetAgent();
    final Map<String, Object> payload = body.getAgentPayload() != null ? new LinkedHashMap<>(body.getAgentPayload()) : new LinkedHashMap<>();

    // 1) Normalizzazione titles -> ids (se fornito)
    List<String> docIds = extractDocIdsFromPayload(payload);
    if ((docIds == null || docIds.isEmpty()) && body.getDocumentTitles() != null && body.getTitleToIdMap() != null) {
      docIds = resolveTitlesToIds(body.getDocumentTitles(), body.getTitleToIdMap());
      // inserisco nel payload come si aspettano gli agent (document_ids)
      if (!docIds.isEmpty()) {
        payload.putIfAbsent("document_ids", docIds);
      }
    }

    // 2) Determina URL dell’agente target
    String url;
    if ("extraction-agent".equalsIgnoreCase(target)) {
      url = extractionUrl + "/api/v1/agents/extract";
      // opzionale: garantisci che il campo si chiami document_ids per l'extraction agent
      if (!payload.containsKey("document_ids") && docIds != null && !docIds.isEmpty()) {
        payload.put("document_ids", docIds);
      }
    } else if ("search-agent".equalsIgnoreCase(target)) {
      url = searchUrl + "/api/v1/search";
      // di solito il search agent non richiede docIds
    } else {
      return Mono.just(Map.of(
          "error", "unknown target agent: " + target,
          "status", HttpStatus.BAD_REQUEST.value()));
    }

    // 3) Chiamata sincrona all’agente target con timeout e gestione errori
    return client.post().uri(url)
        .contentType(MediaType.APPLICATION_JSON)
        .body(BodyInserters.fromValue(payload))
        .retrieve()
        .onStatus(org.springframework.http.HttpStatusCode::isError, resp ->
            resp.bodyToMono(String.class).defaultIfEmpty("")
                .flatMap(bodyStr -> Mono.error(new RuntimeException(
                    "Agent returned " + resp.statusCode() + ": " + bodyStr)))
        )
        .bodyToMono(Map.class)
        .timeout(Duration.ofSeconds(90))
        .map(agentResponse -> Map.of(
            "targetAgent", target,
            "requestPayload", payload,
            "agentResponse", agentResponse
        ));
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
}