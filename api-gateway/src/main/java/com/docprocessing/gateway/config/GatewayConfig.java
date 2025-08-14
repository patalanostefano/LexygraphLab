package com.docprocessing.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

@Configuration
public class GatewayConfig {

    @Value("${services.document-service.url:http://document-service:8000}")
    private String documentServiceUrl;

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfiguration = new CorsConfiguration();
        corsConfiguration.setAllowCredentials(true);
        corsConfiguration.addAllowedOrigin("http://localhost:3000"); // React dev server
        corsConfiguration.addAllowedOrigin("http://frontend:80");    // Docker container
        corsConfiguration.addAllowedHeader("*");
        corsConfiguration.addAllowedMethod("*");
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfiguration);
        
        return new CorsWebFilter(source);
    }

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()

                // DOCUMENT SERVICE ROUTES

                // Get user projects
                .route("user_projects", r -> r
                        .path("/api/v1/projects/{userId}")
                        .and()
                        .method(HttpMethod.GET)
                        .filters(f -> f.setRequestHeader("X-Gateway-Source", "api-gateway"))
                        .uri(documentServiceUrl))

                // Upload document
                .route("document_upload", r -> r
                        .path("/api/v1/documents/upload")
                        .and()
                        .method(HttpMethod.POST)
                        .filters(f -> f.setRequestHeader("X-Gateway-Source", "api-gateway"))
                        .uri(documentServiceUrl))

                // Get document PDF binary
                .route("document_retrieve", r -> r
                        .path("/api/v1/documents/{userId}/{projectId}/{docId}")
                        .and()
                        .method(HttpMethod.GET)
                        .filters(f -> f.setRequestHeader("X-Gateway-Source", "api-gateway"))
                        .uri(documentServiceUrl))

                // Get document text content
                .route("document_text", r -> r
                        .path("/api/v1/documents/{userId}/{projectId}/{docId}/text")
                        .and()
                        .method(HttpMethod.GET)
                        .filters(f -> f.setRequestHeader("X-Gateway-Source", "api-gateway"))
                        .uri(documentServiceUrl))

                // List documents in a project
                .route("documents_list", r -> r
                        .path("/api/v1/documents/{userId}/{projectId}")
                        .and()
                        .method(HttpMethod.GET)
                        .filters(f -> f.setRequestHeader("X-Gateway-Source", "api-gateway"))
                        .uri(documentServiceUrl))

                // HEALTH CHECKS
                .route("document_service_health", r -> r
                        .path("/")
                        .and()
                        .method(HttpMethod.GET)
                        .uri(documentServiceUrl))

                .route("document_service_health_explicit", r -> r
                        .path("/health")
                        .and()
                        .method(HttpMethod.GET)
                        .uri(documentServiceUrl))

                // AGENT SERVICE ROUTES (if you have them)
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
                        .path("/api/health")
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