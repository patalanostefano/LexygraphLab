package com.docprocessing.document.service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.docprocessing.document.dto.DocumentDto.*;
import com.docprocessing.document.exception.DocumentNotFoundException;
import com.docprocessing.document.model.Document;
import com.docprocessing.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {
    private static final Logger log = LoggerFactory.getLogger(DocumentService.class);
    private final DocumentRepository documentRepository;
    private final S3Service s3Service;
    private final SqsService sqsService;
    
    public DocumentSubmissionResponse uploadDocument(String userId, MultipartFile file, 
                                                  String name, String description, 
                                                  String collectionId, String processingType) {
        try {
            // Upload file to S3
            String s3Key = s3Service.uploadDocument(file, userId);
            
            // Determine processing type
            Document.ProcessingType docProcessingType = Document.ProcessingType.TEXT; // Default
            if (processingType != null) {
                try {
                    docProcessingType = Document.ProcessingType.valueOf(processingType);
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid processing type: {}, using default", processingType);
                }
            }
            
            // Create document record
            Document document = Document.createNew(
                    userId,
                    name,
                    description,
                    file.getOriginalFilename(),
                    file.getContentType(),
                    file.getSize(),
                    s3Key,
                    docProcessingType,
                    collectionId
            );
            
            // Save document
            Document savedDocument = documentRepository.save(document);
            
            // Queue document for processing
            queueDocumentForProcessing(savedDocument);
            
            // Create status check URL
            String statusCheckUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/documents/{id}/status")
                    .buildAndExpand(savedDocument.getId())
                    .toUriString();
            
            // Return response
            return DocumentSubmissionResponse.builder()
                    .id(savedDocument.getId())
                    .name(savedDocument.getName())
                    .status("SUBMITTED")
                    .estimatedCompletionTime(Instant.now().plus(5, ChronoUnit.MINUTES))
                    .statusCheckUrl(statusCheckUrl)
                    .collectionId(savedDocument.getCollectionId())
                    .build();
            
        } catch (IOException e) {
            log.error("Failed to upload document", e);
            throw new RuntimeException("Failed to upload document: " + e.getMessage());
        }
    }
    
    private void queueDocumentForProcessing(Document document) {
        Map<String, Object> messageBody = new HashMap<>();
        messageBody.put("documentId", document.getId());
        messageBody.put("userId", document.getUserId());
        messageBody.put("s3Key", document.getS3Key());
        messageBody.put("mimeType", document.getMimeType());
        messageBody.put("processingType", document.getProcessingType().name());
        messageBody.put("timestamp", Instant.now().toString());
        
        // Send to parser queue
        sqsService.sendToParserQueue(messageBody);
    }
    
    public DocumentMetadataResponse getDocument(String userId, String documentId) {
        Document document = findDocumentAndVerifyOwnership(documentId, userId);
        
        // Generate view URL
        String viewUrl = document.getS3Key() != null ? 
                s3Service.generatePresignedUrl(document.getS3Key(), document.getOriginalFilename(), 3600) : null;
        
        return buildDocumentResponse(document, viewUrl);
    }
    
    public DocumentMetadataResponse updateDocument(String userId, String documentId, DocumentUpdateRequest request) {
        Document document = findDocumentAndVerifyOwnership(documentId, userId);
        
        // Update fields if provided
        if (request.getName() != null) {
            document.setName(request.getName());
        }
        
        if (request.getDescription() != null) {
            document.setDescription(request.getDescription());
        }
        
        if (request.getCollectionId() != null) {
            document.setCollectionId(request.getCollectionId());
        }
        
        if (request.getTags() != null) {
            document.setTags(request.getTags());
        }
        
        document.setUpdatedAt(Instant.now());
        
        // Save updated document
        Document updatedDocument = documentRepository.save(document);
        
        // Generate view URL
        String viewUrl = updatedDocument.getS3Key() != null ? 
                s3Service.generatePresignedUrl(updatedDocument.getS3Key(), updatedDocument.getOriginalFilename(), 3600) : null;
        
        return buildDocumentResponse(updatedDocument, viewUrl);
    }
    
    public void deleteDocument(String userId, String documentId) {
        Document document = findDocumentAndVerifyOwnership(documentId, userId);
        
        // Delete the document from S3
        if (document.getS3Key() != null) {
            s3Service.deleteDocument(document.getS3Key());
        }
        
        // Delete the document from the database
        documentRepository.delete(document);
    }
    
    public List<DocumentMetadataResponse> getUserDocuments(String userId) {
        List<Document> documents = documentRepository.findByUserId(userId);
        
        return documents.stream()
                .map(document -> {
                    String viewUrl = document.getS3Key() != null ? 
                            s3Service.generatePresignedUrl(document.getS3Key(), document.getOriginalFilename(), 3600) : null;
                    
                    return buildDocumentResponse(document, viewUrl);
                })
                .collect(Collectors.toList());
    }
    
    public List<DocumentMetadataResponse> getDocumentsByCollection(String userId, String collectionId) {
        List<Document> documents = documentRepository.findByCollectionId(collectionId);
        
        // Filter documents that belong to the user
        return documents.stream()
                .filter(document -> document.getUserId().equals(userId))
                .map(document -> {
                    String viewUrl = document.getS3Key() != null ? 
                            s3Service.generatePresignedUrl(document.getS3Key(), document.getOriginalFilename(), 3600) : null;
                    
                    return buildDocumentResponse(document, viewUrl);
                })
                .collect(Collectors.toList());
    }
    
    public ProcessingStatusResponse getDocumentStatus(String userId, String documentId) {
        Document document = findDocumentAndVerifyOwnership(documentId, userId);
        
        // Build basic status response from document
        return ProcessingStatusResponse.builder()
                .documentId(documentId)
                .status(document.getStatus().name())
                .currentStep("Processing document")
                .progress(calculateProgress(document.getStatus()))
                .estimatedCompletionTime(Instant.now().plus(5, ChronoUnit.MINUTES))
                .build();
    }
    
    public DocumentUrlResponse getDocumentViewUrl(String userId, String documentId, Integer expiresIn) {
        Document document = findDocumentAndVerifyOwnership(documentId, userId);
        
        if (document.getS3Key() == null) {
            throw new DocumentNotFoundException("Document content not found");
        }
        
        long expiration = expiresIn != null ? expiresIn : 3600;
        String url = s3Service.generatePresignedUrl(
                document.getS3Key(),
                document.getOriginalFilename(),
                expiration);
        
        return DocumentUrlResponse.builder()
                .url(url)
                .expiresAt(Instant.now().plus(expiration, ChronoUnit.SECONDS))
                .build();
    }
    
    public DocumentUrlResponse getDocumentDownloadUrl(String userId, String documentId, Integer expiresIn) {
        Document document = findDocumentAndVerifyOwnership(documentId, userId);
        
        if (document.getS3Key() == null) {
            throw new DocumentNotFoundException("Document content not found");
        }
        
        long expiration = expiresIn != null ? expiresIn : 3600;
        String url = s3Service.generateDownloadUrl(
                document.getS3Key(),
                document.getOriginalFilename(),
                expiration);
        
        return DocumentUrlResponse.builder()
                .url(url)
                .filename(document.getOriginalFilename())
                .expiresAt(Instant.now().plus(expiration, ChronoUnit.SECONDS))
                .build();
    }
    
    private Document findDocumentAndVerifyOwnership(String documentId, String userId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new DocumentNotFoundException("Document not found with ID: " + documentId));
        
        if (!document.getUserId().equals(userId)) {
            throw new DocumentNotFoundException("Document not found with ID: " + documentId);
        }
        
        return document;
    }
    
    private DocumentMetadataResponse buildDocumentResponse(Document document, String viewUrl) {
        return DocumentMetadataResponse.builder()
                .id(document.getId())
                .name(document.getName())
                .description(document.getDescription())
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .size(document.getSize())
                .mimeType(document.getMimeType())
                .status(document.getStatus().name())
                .processingType(document.getProcessingType().name())
                .collectionId(document.getCollectionId())
                .hasSummary(document.getHasSummary())
                .hasEntities(document.getHasEntities())
                .pageCount(document.getPageCount())
                .viewUrl(viewUrl)
                .tags(document.getTags())
                .originalFilename(document.getOriginalFilename())
                .build();
    }
    
    private int calculateProgress(Document.DocumentStatus status) {
        switch (status) {
            case QUEUED: return 0;
            case PARSING: return 20;
            case PROCESSING: return 40;
            case OCR_PROCESSING: return 50;
            case TEXT_EXTRACTION: return 70;
            case SUMMARIZING: return 90;
            case COMPLETED: return 100;
            case FAILED: return 0;
            default: return 0;
        }
    }
}
