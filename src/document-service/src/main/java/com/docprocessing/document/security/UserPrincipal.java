package com.docprocessing.document.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public class UserPrincipal {
    private final String id;
    private final String email;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(String id, String email, Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.email = email;
        this.authorities = authorities;
    }

    public static UserPrincipal create(Jwt jwt) {
        String userId = jwt.getSubject();
        
        // Extract email from token claims
        String email = null;
        if (jwt.getClaims().containsKey("email")) {
            email = jwt.getClaim("email");
        }
        
        // Extract roles/authorities
        List<SimpleGrantedAuthority> authorities = Collections.singletonList(
            new SimpleGrantedAuthority("ROLE_USER")
        );
        
        return new UserPrincipal(userId, email, authorities);
    }

    public String getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }
}
