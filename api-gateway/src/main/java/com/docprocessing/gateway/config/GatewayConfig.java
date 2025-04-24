package com.docprocessing.gateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {
    
    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                // Document service routes
                .route("documents_route", r -> r
                        .path("/api/v1/documents/**")
                        .uri("http://document-service:8080"))
                        
                // Collections service routes
                .route("collections_route", r -> r
                        .path("/api/v1/collections/**")
                        .uri("http://document-service:8080"))
                
                // Health check route
                .route("health_route", r -> r
                        .path("/api/health/**")
                        .uri("http://document-service:8080/actuator/health"))
                
                // Fallback route - redirects to our own controller
                .route("fallback_route", r -> r
                        .path("/**")
                        .uri("forward:/fallback"))
                .build();
    }
}
