file://<WORKSPACE>/api-gateway/src/main/java/com/docprocessing/gateway/config/RouteConfig.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
offset: 29
uri: file://<WORKSPACE>/api-gateway/src/main/java/com/docprocessing/gateway/config/RouteConfig.java
text:
```scala
package com.docprocessing.gat@@eway.config;

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