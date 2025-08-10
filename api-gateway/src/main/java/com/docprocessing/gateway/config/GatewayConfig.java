package com.docprocessing.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;

@Configuration
public class GatewayConfig {

    @Value("${services.document-service.url:http://document-service:8000}")
    private String documentServiceUrl;

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()

                // DOCUMENT SERVICE ROUTES
                .route("document_upload", r -> r
                        .path("/api/v1/documents/upload")
                        .and()
                        .method(HttpMethod.POST)
                        .filters(f -> f.setRequestHeader("X-Gateway-Source", "api-gateway"))
                        .uri(documentServiceUrl))

                .route("document_retrieve", r -> r
                        .path("/api/v1/documents/{userId}/{projectId}/{docId}")
                        .and()
                        .method(HttpMethod.GET)
                        .filters(f -> f.setRequestHeader("X-Gateway-Source", "api-gateway"))
                        .uri(documentServiceUrl))

                .route("document_text", r -> r
                        .path("/api/v1/documents/{userId}/{projectId}/{docId}/text")
                        .and()
                        .method(HttpMethod.GET)
                        .filters(f -> f.setRequestHeader("X-Gateway-Source", "api-gateway"))
                        .uri(documentServiceUrl))

                .route("documents_list", r -> r
                        .path("/api/v1/documents/{userId}/{projectId}")
                        .and()
                        .method(HttpMethod.GET)
                        .filters(f -> f.setRequestHeader("X-Gateway-Source", "api-gateway"))
                        .uri(documentServiceUrl))

                // HEALTH CHECK to Document Service
                .route("document_service_health_root", r -> r
                        .path("/")
                        .and()
                        .method(HttpMethod.GET)
                        .uri(documentServiceUrl))

                // AGENT SERVICE ROUTES
                .route("agent_process", r -> r
                        .path("/api/v1/agents/process")
                        .and()
                        .method(HttpMethod.POST)
                        .filters(f -> f.setRequestHeader("X-Gateway-Source", "api-gateway"))
                        .uri("forward:/api/v1/agents/process"))

                .route("agent_list", r -> r
                        .path("/api/v1/agents/list")
                        .and()
                        .method(HttpMethod.GET)
                        .uri("forward:/api/v1/agents/list"))

                // GATEWAY HEALTH
                .route("health_check", r -> r
                        .path("/api/health", "/health")
                        .and()
                        .method(HttpMethod.GET)
                        .filters(f -> f.setRequestHeader("X-Gateway-Source", "api-gateway"))
                        .uri("forward:/actuator/health"))

                .route("gateway_info", r -> r
                        .path("/api/v1/gateway/info")
                        .and()
                        .method(HttpMethod.GET)
                        .uri("forward:/gateway/info"))

                .build();
    }
}
