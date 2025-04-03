package com.docprocessing.document.controller;

import com.docprocessing.document.dto.DocumentDto.*;
import com.docprocessing.document.service.DocumentService;
import com.docprocessing.document.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/documents")
@RequiredArgsConstructor
@Slf4j
public class DocumentController {

    private final DocumentService documentService;
    private final JwtUtil jwtUtil;
    
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentSubmissionResponse> uploadDocument(
            HttpServletRequest request,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "collectionId", required = false) String collectionId,
            @RequestParam(value = "processingType", required = false) String processingType) {
        
        String userId = extractUserId(request);
        log.info("Uploading document for user {}: {}", userId, file.getOriginalFilename());
        
        DocumentSubmissionResponse response = documentService.uploadDocument(
                userId, file, name, description, collectionId, processingType);
                
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }
    
    @GetMapping
    public ResponseEntity<List<DocumentMetadataResponse>> getUserDocuments(HttpServletRequest request) {
        String userId = extractUserId(request);
        log.info("Getting documents for user {}", userId);
        
        List<DocumentMetadataResponse> documents = documentService.getUserDocuments(userId);
        return ResponseEntity.ok(documents);
    }
    
    @GetMapping("/{documentId}")
    public ResponseEntity<DocumentMetadataResponse> getDocument(
            HttpServletRequest request,
            @PathVariable String documentId) {
        
        String userId = extractUserId(request);
        log.info("Getting document {} for user {}", documentId, userId);
        
        DocumentMetadataResponse document = documentService.getDocument(userId, documentId);
        return ResponseEntity.ok(document);
    }
    
    @PutMapping("/{documentId}")
    public ResponseEntity<DocumentMetadataResponse> updateDocument(
            HttpServletRequest request,
            @PathVariable String documentId,
            @RequestBody DocumentUpdateRequest requestBody) {
        
        String userId = extractUserId(request);
        log.info("Updating document {} for user {}", documentId, userId);
        
        DocumentMetadataResponse document = documentService.updateDocument(userId, documentId, requestBody);
        return ResponseEntity.ok(document);
    }
    
    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> deleteDocument(
            HttpServletRequest request,
            @PathVariable String documentId) {
        
        String userId = extractUserId(request);
        log.info("Deleting document {} for user {}", documentId, userId);
        
        documentService.deleteDocument(userId, documentId);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/{documentId}/status")
    public ResponseEntity<ProcessingStatusResponse> getDocumentStatus(
            HttpServletRequest request,
            @PathVariable String documentId) {
        
        String userId = extractUserId(request);
        log.info("Checking status for document {} for user {}", documentId, userId);
        
        ProcessingStatusResponse status = documentService.getDocumentStatus(userId, documentId);
        return ResponseEntity.ok(status);
    }
    
    @GetMapping("/{documentId}/view-url")
    public ResponseEntity<DocumentUrlResponse> getDocumentViewUrl(
            HttpServletRequest request,
            @PathVariable String documentId,
            @RequestParam(value = "expiresIn", required = false) Integer expiresIn) {
        
        String userId = extractUserId(request);
        log.info("Getting view URL for document {} for user {}", documentId, userId);
        
        DocumentUrlResponse urlResponse = documentService.getDocumentViewUrl(userId, documentId, expiresIn);
        return ResponseEntity.ok(urlResponse);
    }
    
    @GetMapping("/{documentId}/download-url")
    public ResponseEntity<DocumentUrlResponse> getDocumentDownloadUrl(
            HttpServletRequest request,
            @PathVariable String documentId,
            @RequestParam(value = "expiresIn", required = false) Integer expiresIn) {
        
        String userId = extractUserId(request);
        log.info("Getting download URL for document {} for user {}", documentId, userId);
        
        DocumentUrlResponse urlResponse = documentService.getDocumentDownloadUrl(userId, documentId, expiresIn);
        return ResponseEntity.ok(urlResponse);
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
