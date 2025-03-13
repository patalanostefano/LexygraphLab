file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/security/SupabaseJwtService.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
offset: 684
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

import java.net.URL;@@
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