package com.docprocessing.document.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Component
@Slf4j
public class JwtUtil {
    
    // This simplified version just extracts the user ID from JWT
    public String extractUserIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        
        String token = authHeader.substring(7);
        try {
            // Basic parsing - in production you'd validate the signature properly
            String[] chunks = token.split("\\.");
            Base64.Decoder decoder = Base64.getUrlDecoder();
            
            String payload = new String(decoder.decode(chunks[1]));
            // Very simple extraction - assumes "sub" claim is the user ID
            if (payload.contains("\"sub\"")) {
                int start = payload.indexOf("\"sub\"") + 7;
                int end = payload.indexOf("\"", start);
                return payload.substring(start, end);
            }
            return null;
        } catch (Exception e) {
            log.warn("Could not extract user ID from token", e);
            return null;
        }
    }
}
