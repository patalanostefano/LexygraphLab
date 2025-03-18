package main.java.com.docprocessing.gateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Mono;

@Configuration
public class RouteConfig {
    
    // Simple rate limit key resolver based on the request path
    @Bean
    public KeyResolver pathKeyResolver() {
        return exchange -> Mono.just(
                exchange.getRequest().getPath().toString()
        );
    }
    
    // Rate limit key resolver based on authenticated user ID (or IP if not authenticated)
    @Bean
    public KeyResolver userKeyResolver() {
        return exchange -> {
            // Try to get user ID from the Authentication
            if (exchange.getPrincipal().hasElement().block() != null) {
                return exchange.getPrincipal()
                        .map(principal -> principal.getName())
                        .switchIfEmpty(Mono.just("anonymous"));
            }
            
            // Fallback to IP address
            String ip = exchange.getRequest().getRemoteAddress().getAddress().getHostAddress();
            return Mono.just(ip);
        };
    }
}
