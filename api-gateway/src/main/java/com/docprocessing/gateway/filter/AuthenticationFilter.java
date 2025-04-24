package com.docprocessing.gateway.filter;

import com.docprocessing.gateway.security.SupabaseJwtService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

@Component
@Slf4j
public class AuthenticationFilter implements WebFilter {

    @Autowired
    private SupabaseJwtService supabaseJwtService;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        // Get authorization header
        ServerHttpRequest request = exchange.getRequest();
        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        
        // Check if public path - if so, continue without authentication
        if (isPublicPath(request.getPath().value())) {
            return chain.filter(exchange);
        }
        
        // Check for Bearer token
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            
            try {
                // Validate token and get authentication
                UsernamePasswordAuthenticationToken authentication = 
                        supabaseJwtService.validateToken(token);
                
                if (authentication != null) {
                    // Set authenticated user in the security context
                    return chain.filter(exchange)
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(authentication));
                }
            } catch (Exception e) {
                log.error("JWT authentication error: {}", e.getMessage());
            }
        }
        
        // If we get here and the path requires authentication, return 401
        if (!isPublicPath(request.getPath().value())) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
        
        // Continue filter chain
        return chain.filter(exchange);
    }
    
    private boolean isPublicPath(String path) {
        return path.startsWith("/api/health") || 
               path.startsWith("/actuator") ||
               path.startsWith("/fallback") ||
               path.startsWith("/api/v1/auth");
    }
}
