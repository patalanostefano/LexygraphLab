file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/service/DocumentService.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
offset: 1522
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/service/DocumentService.java
text:
```scala
package com.docprocessing.document.service;

import com.docprocessing.document.exception.DocumentNotFoundException;
import com.docprocessing.document.exception.UnauthorizedAccessException;
import com.docprocessing.document.model.*;
import com.docprocessing.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DocumentService {
    
    @Value("${RAW_BUCKET}")
    private String rawBucketName;
    
    private final DocumentRepository documentRepository;
    private final StorageService storageService;
    private final ProcessingService processingService;
    
    public DocumentBatchResponse findByUserId(String userId, int page, int limit, String sort, String direction) {
        // Get documents for the user with pagination
        List<DocumentMetadata> documents = documentRepository.findByUserId(userId, page, limit, sort, direction);
        
        // Calculate total pages and items
        int totalItems = documentRepository.countByUserId(userId);
        int totalPages = (int) Math.ceil((double) totalItems / limit);
        
        // Create pagination information
        Pagination pagination = new Pagination();
        pagination.setCurrentPage(page);
        pagination.setTotalPages(totalPages);
       @@ pagination.setTotalItems(totalItems);
        pagination.setItemsPerPage(limit);
        pagination.setHasNextPage(page < totalPages);
        pagination.setHasPreviousPage(page > 1);
        
        // Create response
        DocumentBatchResponse response = new DocumentBatchResponse();
        response.setDocuments(documents);
        response.setPagination(pagination);
        
        return response;
    }
    
    public DocumentSubmissionResponse submitDocument(
            String userId, 
            MultipartFile file, 
            String name, 
            String description, 
            UUID collectionId, 
            String processingType,
            String processingOptions,
            String priority,
            String language) {
            
        try {
            // Generate document ID
            UUID documentId = UUID.randomUUID();
            
            // Store the file in S3
            String s3Key = userId + "/" + documentId.toString();
            storageService.uploadFile(rawBucketName, s3Key, file);
            
            // Use original filename if name is not provided
            if (name == null || name.isEmpty()) {
                name = file.getOriginalFilename();
            }
            
            // Create document metadata
            DocumentMetadata metadata = new DocumentMetadata();
            metadata.setId(documentId);
            metadata.setName(name);
            metadata.setDescription(description);
            metadata.setCreatedAt(LocalDateTime.now());
            metadata.setUpdatedAt(LocalDateTime.now());
            metadata.setSize(file.getSize());
            metadata.setMimeType(file.getContentType());
            metadata.setStatus("SUBMITTED");
            metadata.setProcessingType(processingType);
            metadata.setCollectionId(collectionId);
            metadata.setHasSummary(false);
            metadata.setHasEntities(false);
            metadata.setOriginalFilename(file.getOriginalFilename());
            metadata.setUserId(userId);
            
            // Save metadata to database
            documentRepository.save(metadata);
            
            // Submit document for processing
            processingService.submitDocumentForProcessing(
                documentId, 
                s3Key, 
                userId, 
                processingType, 
                processingOptions, 
                priority, 
                language
            );
            
            // Create response
            DocumentSubmissionResponse response = new DocumentSubmissionResponse();
            response.setId(documentId);
            response.setName(name);
            response.setStatus("SUBMITTED");
            response.setEstimatedCompletionTime(LocalDateTime.now().plusMinutes(5)); // Estimate
            response.setStatusCheckUrl("/documents/" + documentId + "/status");
            response.setCollectionId(collectionId);
            
            return response;
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to submit document for processing: " + e.getMessage(), e);
        }
    }
    
    public Document getDocument(String userId, UUID documentId) {
        DocumentMetadata metadata = documentRepository.findById(documentId)
            .orElseThrow(() -> new DocumentNotFoundException("Document not found: " + documentId));
        
        // Security check: Only allow owner to view document
        if (!userId.equals(metadata.getUserId())) {
            throw new UnauthorizedAccessException("Not authorized to access this document");
        }
        
        // Convert metadata to full document if needed
        // For simplicity, we're just returning the metadata as Document
        Document document = new Document();
        // Copy all metadata properties to document
        document.setId(metadata.getId());
        document.setName(metadata.getName());
        document.setDescription(metadata.getDescription());
        document.setCreatedAt(metadata.getCreatedAt());
        document.setUpdatedAt(metadata.getUpdatedAt());
        document.setSize(metadata.getSize());
        document.setMimeType(metadata.getMimeType());
        document.setStatus(metadata.getStatus());
        document.setProcessingType(metadata.getProcessingType());
        document.setCollectionId(metadata.getCollectionId());
        document.setHasSummary(metadata.getHasSummary());
        document.setHasEntities(metadata.getHasEntities());
        document.setPageCount(metadata.getPageCount());
        document.setThumbnailUrl(metadata.getThumbnailUrl());
        document.setViewUrl(metadata.getViewUrl());
        document.setTags(metadata.getTags());
        document.setOriginalFilename(metadata.getOriginalFilename());
        document.setUserId(metadata.getUserId());
        
        // Add any additional processing details and content if needed
        if ("COMPLETED".equals(metadata.getStatus())) {
            // Add processing details and content preview
            Map<String, Object> processingDetails = new HashMap<>();
            processingDetails.put("contentType", "TEXT");
            processingDetails.put("language", "en");
            processingDetails.put("confidence", 0.95);
            document.setProcessingDetails(processingDetails);
            
            Map<String, String> content = new HashMap<>();
            content.put("preview", "Document content preview...");
            content.put("summaryPreview", "Document summary preview...");
            content.put("downloadUrl", "/documents/" + documentId + "/download-url");
            document.setContent(content);
        }
        
        return document;
    }
    
    public Document updateDocument(String userId, UUID documentId, Document documentUpdate) {
        // Find existing document
        DocumentMetadata existing = documentRepository.findById(documentId)
            .orElseThrow(() -> new DocumentNotFoundException("Document not found: " + documentId));
        
        // Security check: Only allow owner to update document
        if (!userId.equals(existing.getUserId())) {
            throw new UnauthorizedAccessException("Not authorized to update this document");
        }
        
        // Update fields
        if (documentUpdate.getName() != null) {
            existing.setName(documentUpdate.getName());
        }
        if (documentUpdate.getDescription() != null) {
            existing.setDescription(documentUpdate.getDescription());
        }
        if (documentUpdate.getTags() != null) {
            existing.setTags(documentUpdate.getTags());
        }
        if (documentUpdate.getCollectionId() != null) {
            existing.setCollectionId(documentUpdate.getCollectionId());
        }
        
        existing.setUpdatedAt(LocalDateTime.now());
        
        // Save updates
        documentRepository.save(existing);
        
        // Return updated document
        return getDocument(userId, documentId);
    }
    
    public void deleteDocument(String userId, UUID documentId) {
        // Find existing document
        DocumentMetadata existing = documentRepository.findById(documentId)
            .orElseThrow(() -> new DocumentNotFoundException("Document not found: " + documentId));
        
        // Security check: Only allow owner to delete document
        if (!userId.equals(existing.getUserId())) {
            throw new UnauthorizedAccessException("Not authorized to delete this document");
        }
        
        // Delete document file from S3
        String s3Key = userId + "/" + documentId.toString();
        storageService.deleteFile(rawBucketName, s3Key);
        
        // Delete metadata from database
        documentRepository.delete(documentId);
    }
    
    public ProcessingStatusResponse getDocumentStatus(String userId, UUID documentId) {
        // Find existing document
        DocumentMetadata metadata = documentRepository.findById(documentId)
            .orElseThrow(() -> new DocumentNotFoundException("Document not found: " + documentId));
        
        // Security check: Only allow owner to check status
        if (!userId.equals(metadata.getUserId())) {
            throw new UnauthorizedAccessException("Not authorized to access this document");
        }
        
        // Get processing status
        return processingService.getProcessingStatus(documentId);
    }
    
    public ExtractedTextResponse getExtractedText(String userId, UUID documentId, Integer page, String format) {
        // Find existing document
        DocumentMetadata metadata = documentRepository.findById(documentId)
            .orElseThrow(() -> new DocumentNotFoundException("Document not found: " + documentId));
        
        // Security check: Only allow owner to access text
        if (!userId.equals(metadata.getUserId())) {
            throw new UnauthorizedAccessException("Not authorized to access this document");
        }
        
        // Check if processing is complete
        if (!"COMPLETED".equals(metadata.getStatus())) {
            throw new RuntimeException("Document processing is not complete");
        }
        
        // Get document text from storage
        String text = processingService.getExtractedText(documentId, page, format);
        
        // Create response
        ExtractedTextResponse response = new ExtractedTextResponse();
        response.setDocumentId(documentId);
        response.setPage(page != null ? page : 1);
        response.setTotalPages(metadata.getPageCount() != null ? metadata.getPageCount() : 1);
        response.setFormat(format);
        response.setLanguage("en"); // Default for now
        response.setContent(text);
        
        // Add pagination URLs if needed
        if (page != null && page > 1) {
            response.setPreviousPageUrl("/documents/" + documentId + "/extracted-text?page=" + (page - 1) + "&format=" + format);
        }
        if (page != null && metadata.getPageCount() != null && page < metadata.getPageCount()) {
            response.setNextPageUrl("/documents/" + documentId + "/extracted-text?page=" + (page + 1) + "&format=" + format);
        }
        
        return response;
    }
    
    public SummaryResponse getDocumentSummary(String userId, UUID documentId, Integer maxLength) {
        // Find existing document
        DocumentMetadata metadata = documentRepository.findById(documentId)
            .orElseThrow(() -> new DocumentNotFoundException("Document not found: " + documentId));
        
        // Security check: Only allow owner to access summary
        if (!userId.equals(metadata.getUserId())) {
            throw new UnauthorizedAccessException("Not authorized to access this document");
        }
        
        // Check if processing is complete
        if (!"COMPLETED".equals(metadata.getStatus())) {
            throw new RuntimeException("Document processing is not complete");
        }
        
        // Get document summary from storage
        return processingService.getDocumentSummary(documentId, maxLength);
    }
    
    public EntitiesResponse getDocumentEntities(String userId, UUID documentId, String[] types) {
        // Find existing document
        DocumentMetadata metadata = documentRepository.findById(documentId)
            .orElseThrow(() -> new DocumentNotFoundException("Document not found: " + documentId));
        
        // Security check: Only allow owner to access entities
        if (!userId.equals(metadata.getUserId())) {
            throw new UnauthorizedAccessException("Not authorized to access this document");
        }
        
        // Check if processing is complete
        if (!"COMPLETED".equals(metadata.getStatus())) {
            throw new RuntimeException("Document processing is not complete");
        }
        
        // Get document entities from storage
        return processingService.getDocumentEntities(documentId, types);
    }
}

```



#### Error stacktrace:

```
scala.collection.Iterator$$anon$19.next(Iterator.scala:973)
	scala.collection.Iterator$$anon$19.next(Iterator.scala:971)
	scala.collection.mutable.MutationTracker$CheckedIterator.next(MutationTracker.scala:76)
	scala.collection.IterableOps.head(Iterable.scala:222)
	scala.collection.IterableOps.head$(Iterable.scala:222)
	scala.collection.AbstractIterable.head(Iterable.scala:935)
	dotty.tools.dotc.interactive.InteractiveDriver.run(InteractiveDriver.scala:164)
	dotty.tools.pc.MetalsDriver.run(MetalsDriver.scala:45)
	dotty.tools.pc.HoverProvider$.hover(HoverProvider.scala:40)
	dotty.tools.pc.ScalaPresentationCompiler.hover$$anonfun$1(ScalaPresentationCompiler.scala:376)
```
#### Short summary: 

java.util.NoSuchElementException: next on empty iterator