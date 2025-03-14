file://<WORKSPACE>/api-gateway/src/main/java/com/docprocessing/gateway/config/GatewayConfig.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
offset: 788
uri: file://<WORKSPACE>/api-gateway/src/main/java/com/docprocessing/gateway/config/GatewayConfig.java
text:
```scala
package main.java.com.docprocessing.gateway.config;

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
                .route("collections_rout@@e", r -> r
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