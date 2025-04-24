package com.docprocessing.gateway.security;

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
