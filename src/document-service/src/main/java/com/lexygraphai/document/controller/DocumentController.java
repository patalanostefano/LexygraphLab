package com.lexygraphai.document.controller;

import com.lexygraphai.document.dto.*;
import com.lexygraphai.document.model.DocumentStatus;
import com.lexygraphai.document.security.UserPrincipal;
import com.lexygraphai.document.service.DocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/documents")
@Tag(name = "documents", description = "Document operations")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
        summary = "Upload a new document",
        description = "Upload a document file with metadata for processing",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "201", description = "Document successfully uploaded")
    @ApiResponse(responseCode = "400", description = "Invalid input", 
                 content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @ApiResponse(responseCode = "413", description = "File too large")
    public ResponseEntity<DocumentResponse> uploadDocument(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Parameter(description = "The document file to upload (PDF, DOCX, JPG, PNG, etc.)")
            @RequestPart("file") MultipartFile file,
            
            @Parameter(description = "Document metadata (optional)")
            @RequestPart(value = "metadata", required = false) Map<String, Object> metadata) {
        
        DocumentResponse response = documentService.uploadDocument(currentUser.getId(), file, metadata);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(
        summary = "List documents",
        description = "Get a list of documents with optional filtering",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "List of documents")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    public ResponseEntity<Page<DocumentSummary>> listDocuments(
            @AuthenticationPrincipal UserPrincipal currentUser,
            
            @Parameter(description = "Filter by tag") 
            @RequestParam(required = false) String tag,
            
            @Parameter(description = "Filter by document status") 
            @RequestParam(required = false) DocumentStatus status,
            
            @Parameter(description = "Filter by collection ID") 
            @RequestParam(required = false) String collectionId,
            
            @Parameter(description = "Page number for pagination") 
            @RequestParam(defaultValue = "0") int page,
            
            @Parameter(description = "Page size for pagination") 
            @RequestParam(defaultValue = "20") int size) {
        
        Page<DocumentSummary> documents = documentService.findDocuments(
                currentUser.getId(), tag, status, collectionId, page, size);
        return ResponseEntity.ok(documents);
    }

    @GetMapping("/{documentId}")
    @Operation(
        summary = "Get document details",
        description = "Retrieve detailed information about a document",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "Document details")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @ApiResponse(responseCode = "404", description = "Document not found")
    public ResponseEntity<DocumentResponse> getDocument(
            @AuthenticationPrincipal UserPrincipal currentUser,
            
            @Parameter(description = "Document ID", required = true)
            @PathVariable String documentId) {
        
        DocumentResponse document = documentService.getDocumentDetails(currentUser.getId(), documentId);
        return ResponseEntity.ok(document);
    }

    @DeleteMapping("/{documentId}")
    @Operation(
        summary = "Delete a document",
        description = "Remove a document and associated data",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "204", description = "Document deleted")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @ApiResponse(responseCode = "404", description = "Document not found")
    public ResponseEntity<Void> deleteDocument(
            @AuthenticationPrincipal UserPrincipal currentUser,
            
            @Parameter(description = "Document ID", required = true)
            @PathVariable String documentId) {
        
        documentService.deleteDocument(currentUser.getId(), documentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{documentId}/content")
    @Operation(
        summary = "Download document content",
        description = "Download the original document file",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "Document file")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @ApiResponse(responseCode = "404", description = "Document not found")
    public ResponseEntity<byte[]> downloadDocument(
            @AuthenticationPrincipal UserPrincipal currentUser,
            
            @Parameter(description = "Document ID", required = true)
            @PathVariable String documentId) {
        
        byte[] content = documentService.getDocumentContent(currentUser.getId(), documentId);
        String mimeType = documentService.getDocumentMimeType(currentUser.getId(), documentId);
        String filename = documentService.getDocumentName(currentUser.getId(), documentId);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(mimeType));
        headers.setContentDispositionFormData("attachment", filename);
        
        return new ResponseEntity<>(content, headers, HttpStatus.OK);
    }

    @GetMapping("/{documentId}/chunks")
    @Operation(
        summary = "Get document chunks",
        description = "Get all text chunks for a document",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "Document chunks")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @ApiResponse(responseCode = "404", description = "Document not found")
    public ResponseEntity<List<DocumentChunkDto>> getDocumentChunks(
            @AuthenticationPrincipal UserPrincipal currentUser,
            
            @Parameter(description = "Document ID", required = true)
            @PathVariable String documentId) {
        
        List<DocumentChunkDto> chunks = documentService.getDocumentChunks(currentUser.getId(), documentId);
        return ResponseEntity.ok(chunks);
    }

    @PostMapping("/{documentId}/process")
    @Operation(
        summary = "Process a document",
        description = "Start processing a document with an agent or workflow",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "202", description = "Processing initiated")
    @ApiResponse(responseCode = "400", description = "Invalid input")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @ApiResponse(responseCode = "404", description = "Document not found")
    public ResponseEntity<ProcessResponse> processDocument(
            @AuthenticationPrincipal UserPrincipal currentUser,
            
            @Parameter(description = "Document ID", required = true)
            @PathVariable String documentId,
            
            @Parameter(description = "Processing configuration", required = true)
            @Valid @RequestBody ProcessRequest processRequest) {
        
        ProcessResponse response = documentService.processDocument(
                currentUser.getId(), documentId, processRequest);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }
}
