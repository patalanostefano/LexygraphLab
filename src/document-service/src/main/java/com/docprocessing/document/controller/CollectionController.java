package com.docprocessing.document.controller;

import com.docprocessing.document.model.Collection;
import com.docprocessing.document.security.UserPrincipal;
import com.docprocessing.document.service.CollectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/collections")
@RequiredArgsConstructor
public class CollectionController {

    private final CollectionService collectionService;
    
    @GetMapping
    public ResponseEntity<?> listCollections(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "20") int limit,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
            
        String userId = userPrincipal.getId();
        var result = collectionService.listCollections(userId, page, limit);
        
        return ResponseEntity.ok(Map.of(
            "collections", result.getDocuments(),
            "pagination", result.getPagination()
        ));
    }
    
    @PostMapping
    public ResponseEntity<Collection> createCollection(
            @Valid @RequestBody Collection collection,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
            
        String userId = userPrincipal.getId();
        Collection created = collectionService.createCollection(userId, collection);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    @GetMapping("/{collectionId}")
    public ResponseEntity<Collection> getCollection(
            @PathVariable UUID collectionId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
            
        String userId = userPrincipal.getId();
        Collection collection = collectionService.getCollection(userId, collectionId);
        
        return ResponseEntity.ok(collection);
    }
    
    @PutMapping("/{collectionId}")
    public ResponseEntity<Collection> updateCollection(
            @PathVariable UUID collectionId,
            @Valid @RequestBody Collection collection,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
            
        String userId = userPrincipal.getId();
        Collection updated = collectionService.updateCollection(userId, collectionId, collection);
        
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/{collectionId}")
    public ResponseEntity<?> deleteCollection(
            @PathVariable UUID collectionId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
            
        String userId = userPrincipal.getId();
        collectionService.deleteCollection(userId, collectionId);
        
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/{collectionId}/documents")
    public ResponseEntity<?> listCollectionDocuments(
            @PathVariable UUID collectionId,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "20") int limit,
            @RequestParam(value = "sort", defaultValue = "createdAt") String sort,
            @RequestParam(value = "direction", defaultValue = "desc") String direction,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
            
        String userId = userPrincipal.getId();
        var result = collectionService.listCollectionDocuments(
            userId, collectionId, page, limit, sort, direction);
        
        return ResponseEntity.ok(Map.of(
            "documents", result.getDocuments(),
            "pagination", result.getPagination()
        ));
    }
}
