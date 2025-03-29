package com.docprocessing.document.controller;

import com.docprocessing.document.model.Document;
import com.docprocessing.document.model.DocumentSubmissionResponse;
import com.docprocessing.document.model.ProcessingStatusResponse;
import com.docprocessing.document.security.UserPrincipal;
import com.docprocessing.document.service.DocumentService;
import com.docprocessing.document.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.validation.Valid;
import java.util.Map;
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
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
            
        String userId = userPrincipal.getId();
        
        DocumentSubmissionResponse response = documentService.submitDocument(
            userId, file, name, description, collectionId, 
            processingType, processingOptions, priority, language);
            
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }
    
    @GetMapping("/{documentId}")
    public ResponseEntity<Document> getDocument(
            @PathVariable UUID documentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
            
        String userId = userPrincipal.getId();
        Document document = documentService.getDocument(userId, documentId);
        return ResponseEntity.ok(document);
    }
    
    @GetMapping
    public ResponseEntity<?> listDocuments(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "20") int limit,
            @RequestParam(value = "sort", defaultValue = "createdAt") String sort,
            @RequestParam(value = "direction", defaultValue = "desc") String direction,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
            
        String userId = userPrincipal.getId();
        var result = documentService.findByUserId(userId, page, limit, sort, direction);
        return ResponseEntity.ok(Map.of(
            "documents", result.getDocuments(),
            "pagination", result.getPagination()
        ));
    }
    
    @GetMapping("/{documentId}/status")
    public ResponseEntity<ProcessingStatusResponse> getDocumentStatus(
            @PathVariable UUID documentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
            
        String userId = userPrincipal.getId();
        ProcessingStatusResponse status = documentService.getDocumentStatus(userId, documentId);
        return ResponseEntity.ok(status);
    }
    
    @GetMapping("/{documentId}/view-url")
    public ResponseEntity<?> getDocumentViewUrl(
            @PathVariable UUID documentId,
            @RequestParam(value = "expiresIn", defaultValue = "3600") Integer expiresIn,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
            
        String userId = userPrincipal.getId();
        var viewUrl = storageService.generateViewUrl(userId, documentId, expiresIn);
        return ResponseEntity.ok(viewUrl);
    }
    
    @GetMapping("/{documentId}/download-url")
    public ResponseEntity<?> getDocumentDownloadUrl(
            @PathVariable UUID documentId,
            @RequestParam(value = "expiresIn", defaultValue = "3600") Integer expiresIn,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
            
        String userId = userPrincipal.getId();
        var downloadUrl = storageService.generateDownloadUrl(userId, documentId, expiresIn);
        return ResponseEntity.ok(downloadUrl);
    }
    
    @PutMapping("/{documentId}")
    public ResponseEntity<Document> updateDocument(
            @PathVariable UUID documentId,
            @Valid @RequestBody Document documentUpdate,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
            
        String userId = userPrincipal.getId();
        Document updated = documentService.updateDocument(userId, documentId, documentUpdate);
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/{documentId}")
    public ResponseEntity<?> deleteDocument(
            @PathVariable UUID documentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
            
        String userId = userPrincipal.getId();
        documentService.deleteDocument(userId, documentId);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/{documentId}/extracted-text")
    public ResponseEntity<?> getExtractedText(
            @PathVariable UUID documentId,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "format", defaultValue = "plain") String format,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
            
        String userId = userPrincipal.getId();
        var text = documentService.getExtractedText(userId, documentId, page, format);
        return ResponseEntity.ok(text);
    }
    
    @GetMapping("/{documentId}/summary")
    public ResponseEntity<?> getDocumentSummary(
            @PathVariable UUID documentId,
            @RequestParam(value = "maxLength", defaultValue = "500") Integer maxLength,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
            
        String userId = userPrincipal.getId();
        var summary = documentService.getDocumentSummary(userId, documentId, maxLength);
        return ResponseEntity.ok(summary);
    }
    
    @GetMapping("/{documentId}/entities")
    public ResponseEntity<?> getDocumentEntities(
            @PathVariable UUID documentId,
            @RequestParam(value = "types", required = false) String[] types,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
            
        String userId = userPrincipal.getId();
        var entities = documentService.getDocumentEntities(userId, documentId, types);
        return ResponseEntity.ok(entities);
    }
}
