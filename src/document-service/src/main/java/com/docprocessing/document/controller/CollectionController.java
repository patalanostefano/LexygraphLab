package com.docprocessing.document.controller;

import com.docprocessing.document.dto.CollectionDto.*;
import com.docprocessing.document.service.CollectionService;
import com.docprocessing.document.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/collections")
@RequiredArgsConstructor
@Slf4j
public class CollectionController {

    private final CollectionService collectionService;
    private final JwtUtil jwtUtil;
    
    @GetMapping
    public ResponseEntity<CollectionListResponse> listCollections(HttpServletRequest request) {
        String userId = extractUserId(request);
        log.info("Listing collections for user {}", userId);
        
        CollectionListResponse response = collectionService.getUserCollections(userId);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping
    public ResponseEntity<CollectionResponse> createCollection(
            HttpServletRequest request,
            @RequestBody CollectionRequest collectionRequest) {
        
        String userId = extractUserId(request);
        log.info("Creating collection for user {}: {}", userId, collectionRequest.getName());
        
        CollectionResponse collection = collectionService.createCollection(userId, collectionRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(collection);
    }
    
    @GetMapping("/{collectionId}")
    public ResponseEntity<CollectionResponse> getCollection(
            HttpServletRequest request,
            @PathVariable String collectionId) {
        
        String userId = extractUserId(request);
        log.info("Getting collection {} for user {}", collectionId, userId);
        
        CollectionResponse collection = collectionService.getCollection(userId, collectionId);
        return ResponseEntity.ok(collection);
    }
    
    @PutMapping("/{collectionId}")
    public ResponseEntity<CollectionResponse> updateCollection(
            HttpServletRequest request,
            @PathVariable String collectionId,
            @RequestBody CollectionUpdateRequest collectionRequest) {
        
        String userId = extractUserId(request);
        log.info("Updating collection {} for user {}", collectionId, userId);
        
        CollectionResponse collection = collectionService.updateCollection(userId, collectionId, collectionRequest);
        return ResponseEntity.ok(collection);
    }
    
    @DeleteMapping("/{collectionId}")
    public ResponseEntity<Void> deleteCollection(
            HttpServletRequest request,
            @PathVariable String collectionId) {
        
        String userId = extractUserId(request);
        log.info("Deleting collection {} for user {}", collectionId, userId);
        
        collectionService.deleteCollection(userId, collectionId);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/{collectionId}/documents")
    public ResponseEntity<CollectionDocumentsResponse> listCollectionDocuments(
            HttpServletRequest request,
            @PathVariable String collectionId) {
        
        String userId = extractUserId(request);
        log.info("Listing documents for collection {} for user {}", collectionId, userId);
        
        CollectionDocumentsResponse response = collectionService.getCollectionDocuments(userId, collectionId);
        return ResponseEntity.ok(response);
    }
    
    private String extractUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        String userId = jwtUtil.extractUserIdFromToken(authHeader);
        
        if (userId == null) {
            throw new RuntimeException("User ID could not be extracted from token");
        }
        
        return userId;
    }
}
