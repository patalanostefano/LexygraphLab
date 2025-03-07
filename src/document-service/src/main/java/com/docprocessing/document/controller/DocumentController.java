package com.docprocessing.document.controller;

import com.docprocessing.document.model.DocumentSubmissionResponse;
import com.docprocessing.document.model.Document;
import com.docprocessing.document.model.ProcessingStatusResponse;
import com.docprocessing.document.service.DocumentService;
import com.docprocessing.document.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.validation.Valid;
import java.util.UUID;

@RestController
@RequestMapping("/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final StorageService storageService;
    
    @PostMapping
    public ResponseEntity<DocumentSubmissionResponse> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "collectionId", required = false) UUID collectionId,
            @RequestParam(value = "processingType", defaultValue = "TEXT") String processingType,
            @RequestParam(value = "processingOptions", required = false) String processingOptions,
            @RequestParam(value = "priority", defaultValue = "NORMAL") String priority,
            @RequestParam(value = "language", defaultValue = "en") String language,
            @AuthenticationPrincipal Jwt principal) {
            
        String userId = principal.getSubject();
        
        DocumentSubmissionResponse response = documentService.submitDocument(
            userId, file, name, description, collectionId, 
            processingType, processingOptions, priority, language);
            
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }
    
    @GetMapping("/{documentId}")
    public ResponseEntity<Document> getDocument(
            @PathVariable UUID documentId,
            @AuthenticationPrincipal Jwt principal) {
            
        String userId = principal.getSubject();
        Document document = documentService.getDocument(userId, documentId);
        return ResponseEntity.ok(document);
    }
    
    @GetMapping("/{documentId}/status")
    public ResponseEntity<ProcessingStatusResponse> getDocumentStatus(
            @PathVariable UUID documentId,
            @AuthenticationPrincipal Jwt principal) {
            
        String userId = principal.getSubject();
        ProcessingStatusResponse status = documentService.getDocumentStatus(userId, documentId);
        return ResponseEntity.ok(status);
    }
    
    @GetMapping("/{documentId}/view-url")
    public ResponseEntity<?> getDocumentViewUrl(
            @PathVariable UUID documentId,
            @RequestParam(value = "expiresIn", defaultValue = "3600") Integer expiresIn,
            @AuthenticationPrincipal Jwt principal) {
            
        String userId = principal.getSubject();
        var viewUrl = storageService.generateViewUrl(userId, documentId, expiresIn);
        return ResponseEntity.ok(viewUrl);
    }
    
    @GetMapping("/{documentId}/download-url")
    public ResponseEntity<?> getDocumentDownloadUrl(
            @PathVariable UUID documentId,
            @RequestParam(value = "expiresIn", defaultValue = "3600") Integer expiresIn,
            @AuthenticationPrincipal Jwt principal) {
            
        String userId = principal.getSubject();
        var downloadUrl = storageService.generateDownloadUrl(userId, documentId, expiresIn);
        return ResponseEntity.ok(downloadUrl);
    }
    
    @PutMapping("/{documentId}")
    public ResponseEntity<Document> updateDocument(
            @PathVariable UUID documentId,
            @Valid @RequestBody Document documentUpdate,
            @AuthenticationPrincipal Jwt principal) {
            
        String userId = principal.getSubject();
        Document updated = documentService.updateDocument(userId, documentId, documentUpdate);
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/{documentId}")
    public ResponseEntity<?> deleteDocument(
            @PathVariable UUID documentId,
            @AuthenticationPrincipal Jwt principal) {
            
        String userId = principal.getSubject();
        documentService.deleteDocument(userId, documentId);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/{documentId}/extracted-text")
    public ResponseEntity<?> getExtractedText(
            @PathVariable UUID documentId,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "format", defaultValue = "plain") String format,
            @AuthenticationPrincipal Jwt principal) {
            
        String userId = principal.getSubject();
        var text = documentService.getExtractedText(userId, documentId, page, format);
        return ResponseEntity.ok(text);
    }
    
    @GetMapping("/{documentId}/summary")
    public ResponseEntity<?> getDocumentSummary(
            @PathVariable UUID documentId,
            @RequestParam(value = "maxLength", defaultValue = "500") Integer maxLength,
            @AuthenticationPrincipal Jwt principal) {
            
        String userId = principal.getSubject();
        var summary = documentService.getDocumentSummary(userId, documentId, maxLength);
        return ResponseEntity.ok(summary);
    }
    
    @GetMapping("/{documentId}/entities")
    public ResponseEntity<?> getDocumentEntities(
            @PathVariable UUID documentId,
            @RequestParam(value = "types", required = false) String[] types,
            @AuthenticationPrincipal Jwt principal) {
            
        String userId = principal.getSubject();
        var entities = documentService.getDocumentEntities(userId, documentId, types);
        return ResponseEntity.ok(entities);
    }
}
