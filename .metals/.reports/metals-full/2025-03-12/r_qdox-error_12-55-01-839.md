error id: file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/security/SupabaseJwtService.java
file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/security/SupabaseJwtService.java
### com.thoughtworks.qdox.parser.ParseException: syntax error @[3,8]

error in qdox parser
file content:
```java
offset: 54
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/security/SupabaseJwtService.java
text:
```scala
package com.docprocessing.document.security;

public p@@ackage com.docprocessing.document.security;

import com.auth0.jwk.Jwk;
import com.auth0.jwk.JwkException;
import com.auth0.jwk.JwkProvider;
import com.auth0.jwk.UrlJwkProvider;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

import java.net.URL;
import java.security.interfaces.RSAPublicKey;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Service
public class SupabaseJwtService {

    @Value("${auth.jwt.issuer}")
    private String issuer;

    @Value("${auth.jwt.jwk-set-uri}")
    private String jwkSetUri;

    /**
     * Validates a Supabase JWT token and extracts user information
     * @param token The JWT token to validate
     * @return Authentication object with user principal if valid, null otherwise
     */
    public Authentication validateToken(String token) {
        try {
            DecodedJWT jwt = JWT.decode(token);
            
            // Verify issuer
            if (!issuer.equals(jwt.getIssuer())) {
                return null;
            }
            
            // Verify expiration
            if (jwt.getExpiresAt().before(new Date())) {
                return null;
            }
            
            // Verify signature with JWK
            JwkProvider provider = new UrlJwkProvider(new URL(jwkSetUri));
            Jwk jwk = provider.get(jwt.getKeyId());
            Algorithm algorithm = Algorithm.RSA256((RSAPublicKey) jwk.getPublicKey(), null);
            
            JWTVerifier verifier = JWT.require(algorithm)
                .withIssuer(issuer)
                .build();
            
            verifier.verify(token);
            
            // Extract user information
            String userId = jwt.getSubject();
            String email = jwt.getClaim("email").asString();
            
            // Create user principal
            UserPrincipal userPrincipal = UserPrincipal.builder()
                .id(userId)
                .email(email)
                .roles(List.of("USER")) // Default role
                .build();
            
            // Check for admin role in app_metadata if available
            Map<String, Object> appMetadata = jwt.getClaim("app_metadata").asMap();
            if (appMetadata != null && Boolean.TRUE.equals(appMetadata.get("admin"))) {
                userPrincipal.setRoles(List.of("USER", "ADMIN"));
            }
            
            return new UsernamePasswordAuthenticationToken(
                userPrincipal,
                null,
                userPrincipal.getAuthorities()
            );
        } catch (Exception e) {
            return null;
        }
    }
}
 {
    
}

```

```



#### Error stacktrace:

```
com.thoughtworks.qdox.parser.impl.Parser.yyerror(Parser.java:2025)
	com.thoughtworks.qdox.parser.impl.Parser.yyparse(Parser.java:2147)
	com.thoughtworks.qdox.parser.impl.Parser.parse(Parser.java:2006)
	com.thoughtworks.qdox.library.SourceLibrary.parse(SourceLibrary.java:232)
	com.thoughtworks.qdox.library.SourceLibrary.parse(SourceLibrary.java:190)
	com.thoughtworks.qdox.library.SourceLibrary.addSource(SourceLibrary.java:94)
	com.thoughtworks.qdox.library.SourceLibrary.addSource(SourceLibrary.java:89)
	com.thoughtworks.qdox.library.SortedClassLibraryBuilder.addSource(SortedClassLibraryBuilder.java:162)
	com.thoughtworks.qdox.JavaProjectBuilder.addSource(JavaProjectBuilder.java:174)
	scala.meta.internal.mtags.JavaMtags.indexRoot(JavaMtags.scala:48)
	scala.meta.internal.metals.SemanticdbDefinition$.foreachWithReturnMtags(SemanticdbDefinition.scala:97)
	scala.meta.internal.metals.Indexer.indexSourceFile(Indexer.scala:485)
	scala.meta.internal.metals.Indexer.$anonfun$reindexWorkspaceSources$3(Indexer.scala:583)
	scala.meta.internal.metals.Indexer.$anonfun$reindexWorkspaceSources$3$adapted(Indexer.scala:580)
	scala.collection.IterableOnceOps.foreach(IterableOnce.scala:619)
	scala.collection.IterableOnceOps.foreach$(IterableOnce.scala:617)
	scala.collection.AbstractIterator.foreach(Iterator.scala:1306)
	scala.meta.internal.metals.Indexer.reindexWorkspaceSources(Indexer.scala:580)
	scala.meta.internal.metals.MetalsLspService.$anonfun$onChange$2(MetalsLspService.scala:927)
	scala.runtime.java8.JFunction0$mcV$sp.apply(JFunction0$mcV$sp.scala:18)
	scala.concurrent.Future$.$anonfun$apply$1(Future.scala:687)
	scala.concurrent.impl.Promise$Transformation.run(Promise.scala:467)
	java.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1136)
	java.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:635)
	java.base/java.lang.Thread.run(Thread.java:840)
```
#### Short summary: 

QDox parse error in file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/security/SupabaseJwtService.java