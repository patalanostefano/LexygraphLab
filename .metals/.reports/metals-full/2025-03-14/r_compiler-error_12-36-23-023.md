file://<WORKSPACE>/api-gateway/src/main/java/com/docprocessing/gateway/security/SupabaseJwtService.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
uri: file://<WORKSPACE>/api-gateway/src/main/java/com/docprocessing/gateway/security/SupabaseJwtService.java
text:
```scala
package main.java.com.docprocessing.gateway.security;

import com.auth0.jwk.Jwk;
import com.auth0.jwk.JwkProvider;
import com.auth0.jwk.UrlJwkProvider;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

import java.net.URL;
import java.security.interfaces.RSAPublicKey;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SupabaseJwtService {

    @Value("${auth.jwt.issuer}")
    private String issuer;

    @Value("${auth.jwt.jwk-set-uri}")
    private String jwkSetUri;

    /**
     * Validates a Supabase JWT token and extracts user information
     */
    public UsernamePasswordAuthenticationToken validateToken(String token) throws Exception {
        DecodedJWT jwt = JWT.decode(token);
        
        // Verify issuer
        if (!issuer.equals(jwt.getIssuer())) {
            return null;
        }
        
        // Verify expiration
        if (jwt.getExpiresAt().before(new Date())) {
            return null;
        }
        
        // Get key ID from token header
        String keyId = jwt.getKeyId();
        
        // Fetch the JWK from Supabase JWKS endpoint
        URL jwkUrl = new URL(jwkSetUri);
        JwkProvider provider = new UrlJwkProvider(jwkUrl);
        Jwk jwk = provider.get(keyId);
        
        // Use the public key for verification
        RSAPublicKey publicKey = (RSAPublicKey) jwk.getPublicKey();
        
        // Create verifier with the public key
        Algorithm algorithm = Algorithm.RSA256(publicKey, null);
        JWTVerifier verifier = JWT.require(algorithm)
                .withIssuer(issuer)
                .build();
        
        // Verify token signature
        verifier.verify(token);
        
        // Extract user information
        String userId = jwt.getSubject();
        String email = jwt.getClaim("email").asString();
        
        // Create user principal with basic role
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
        
        // Check for admin role in app_metadata if available
        Map<String, Object> appMetadata = jwt.getClaim("app_metadata").asMap();
        if (appMetadata != null && Boolean.TRUE.equals(appMetadata.get("admin"))) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }
        
        // Create user principal
        UserPrincipal userPrincipal = new UserPrincipal();
        userPrincipal.setId(userId);
        userPrincipal.setEmail(email);
        
        // Create authentication token
        return new UsernamePasswordAuthenticationToken(
                userPrincipal, null, authorities);
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
	dotty.tools.pc.WithCompilationUnit.<init>(WithCompilationUnit.scala:31)
	dotty.tools.pc.SimpleCollector.<init>(PcCollector.scala:345)
	dotty.tools.pc.PcSemanticTokensProvider$Collector$.<init>(PcSemanticTokensProvider.scala:63)
	dotty.tools.pc.PcSemanticTokensProvider.Collector$lzyINIT1(PcSemanticTokensProvider.scala:63)
	dotty.tools.pc.PcSemanticTokensProvider.Collector(PcSemanticTokensProvider.scala:63)
	dotty.tools.pc.PcSemanticTokensProvider.provide(PcSemanticTokensProvider.scala:88)
	dotty.tools.pc.ScalaPresentationCompiler.semanticTokens$$anonfun$1(ScalaPresentationCompiler.scala:109)
```
#### Short summary: 

java.util.NoSuchElementException: next on empty iterator