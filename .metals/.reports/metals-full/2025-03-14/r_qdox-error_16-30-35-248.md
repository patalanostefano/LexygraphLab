error id: file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/security/SupabaseJwtService.java
file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/security/SupabaseJwtService.java
### com.thoughtworks.qdox.parser.ParseException: syntax error @[93,1]

error in qdox parser
file content:
```java
offset: 3090
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/security/SupabaseJwtService.java
text:
```scala

package com.docprocessing.document.security;

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
    
}@@

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
	scala.meta.internal.mtags.MtagsIndexer.index(MtagsIndexer.scala:21)
	scala.meta.internal.mtags.MtagsIndexer.index$(MtagsIndexer.scala:20)
	scala.meta.internal.mtags.JavaMtags.index(JavaMtags.scala:38)
	scala.meta.internal.mtags.Mtags$.allToplevels(Mtags.scala:150)
	scala.meta.internal.metals.DefinitionProvider.fromMtags(DefinitionProvider.scala:355)
	scala.meta.internal.metals.DefinitionProvider.$anonfun$positionOccurrence$4(DefinitionProvider.scala:274)
	scala.Option.orElse(Option.scala:477)
	scala.meta.internal.metals.DefinitionProvider.$anonfun$positionOccurrence$1(DefinitionProvider.scala:274)
	scala.Option.flatMap(Option.scala:283)
	scala.meta.internal.metals.DefinitionProvider.positionOccurrence(DefinitionProvider.scala:266)
	scala.meta.internal.metals.JavaDocumentHighlightProvider.$anonfun$documentHighlight$1(JavaDocumentHighlightProvider.scala:26)
	scala.collection.immutable.List.map(List.scala:247)
	scala.meta.internal.metals.JavaDocumentHighlightProvider.documentHighlight(JavaDocumentHighlightProvider.scala:22)
	scala.meta.internal.metals.MetalsLspService.$anonfun$documentHighlights$1(MetalsLspService.scala:1008)
	scala.meta.internal.metals.CancelTokens$.$anonfun$apply$2(CancelTokens.scala:26)
	scala.concurrent.Future$.$anonfun$apply$1(Future.scala:687)
	scala.concurrent.impl.Promise$Transformation.run(Promise.scala:467)
	java.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1136)
	java.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:635)
	java.base/java.lang.Thread.run(Thread.java:840)
```
#### Short summary: 

QDox parse error in file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/security/SupabaseJwtService.java