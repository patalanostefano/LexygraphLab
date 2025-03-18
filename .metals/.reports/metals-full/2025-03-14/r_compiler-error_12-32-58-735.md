file://<WORKSPACE>/api-gateway/src/main/java/com/docprocessing/gateway/filter/LoggingFilter.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
offset: 32
uri: file://<WORKSPACE>/api-gateway/src/main/java/com/docprocessing/gateway/filter/LoggingFilter.java
text:
```scala
package com.docprocessing.gatewa@@y.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Component
@Slf4j
public class LoggingFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // Generate request ID for tracking
        String requestId = UUID.randomUUID().toString();
        
        // Add request ID to response header
        exchange.getResponse().getHeaders().add("X-Request-ID", requestId);
        
        // Get request details
        String path = exchange.getRequest().getPath().value();
        String method = exchange.getRequest().getMethod().name();
        String remoteAddress = exchange.getRequest().getRemoteAddress().getAddress().getHostAddress();
        
        // Log incoming request
        log.info("Request: [{}] {} {} from {}", requestId, method, path, remoteAddress);
        
        // Record start time
        long startTime = System.currentTimeMillis();
        
        // Continue the filter chain and log the response
        return chain.filter(exchange)
                .then(Mono.fromRunnable(() -> {
                    // Calculate request duration
                    long duration = System.currentTimeMillis() - startTime;
                    
                    // Log response details
                    int statusCode = exchange.getResponse().getStatusCode() != null ? 
                            exchange.getResponse().getStatusCode().value() : 0;
                            
                    log.info("Response: [{}] {} {} completed with status {} in {} ms", 
                            requestId, method, path, statusCode, duration);
                }));
    }

    @Override
    public int getOrder() {
        // Run this filter first
        return -1;
    }
}

```



#### Error stacktrace:

```
scala.collection.Iterator$$anon$19.next(Iterator.scala:973)
	scala.collection.Iterator$$anon$19.next(Iterator.scala:971)
	scala.collection.mutable.MutationTracker$CheckedIterator.next(MutationTracker.scala:76)
	scala.collection.IterableOps.head(Iterable.scala:222)
	scala.collection.IterableOps.head$(Iterable.scala:222)
	scala.collection.AbstractIterable.head(Iterable.scala:935)
	dotty.tools.dotc.interactive.InteractiveDriver.run(InteractiveDriver.scala:164)
	dotty.tools.pc.MetalsDriver.run(MetalsDriver.scala:45)
	dotty.tools.pc.HoverProvider$.hover(HoverProvider.scala:40)
	dotty.tools.pc.ScalaPresentationCompiler.hover$$anonfun$1(ScalaPresentationCompiler.scala:376)
```
#### Short summary: 

java.util.NoSuchElementException: next on empty iterator