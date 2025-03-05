file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/service/CollectionServiceImpl.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
offset: 256
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/service/CollectionServiceImpl.java
text:
```scala
package com.lexygraphai.document.service;

import com.lexygraphai.document.dto.*;
import com.lexygraphai.document.exception.DocumentNotFoundException;
import com.lexygraphai.document.model.Collection;
import com.lexygraphai.document.model.Document;
import @@com.lexygraphai.document.model.DocumentChunk;
import com.lexygraphai.document.model.DocumentStatus;
import com.lexygraphai.document.repository.CollectionRepository;
import com.lexygraphai.document.repository.DocumentChunkRepository;
import com.lexygraphai.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository chunkRepository;
    private final CollectionRepository collectionRepository;
    private final StorageService storageService;
    private final DocumentProcessorService documentProcessorService;
    
    @Override
    public DocumentResponse uploadDocument(String userId, MultipartFile file, Map<String, Object> metadata) {
        log.debug("Uploading document for user {}", userId);
        
        try {
            // Extract metadata if provided
            String name = null;
            String description = null;
            Set<String> tags = new HashSet<>();
            String collectionId = null;
            String procedureId = null;
            
            if (metadata != null) {
                name = (String) metadata.getOrDefault("name", null);
                description = (String) metadata.getOrDefault("description", null);
                
                if (metadata.containsKey("tags") && metadata.get("tags") instanceof List) {
                    tags = new HashSet<>(((List<?>) metadata.get("tags")).stream()
                            .map(Object::toString)
                            .collect(Collectors.toList()));
                }
                
                collectionId = (String) metadata.getOrDefault("collectionId", null);
                procedureId = (String) metadata.getOrDefault("procedureId", null);
            }
            
            // Use filename if name not provided
            if (name == null || name.isBlank()) {
                name = file.getOriginalFilename();
                if (name == null || name.isBlank()) {
                    name = "document-" + UUID.randomUUID();
                }
            }
            
            // Store the file in S3
            String s3Key = storageService.store(userId, file);
            
            // Create document entity
            String documentId = UUID.randomUUID().toString();
            LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
            
            Document document = Document.builder()
                    .userId(userId)
                    .documentId(documentId)
                    .name(name)
                    .description(description)
                    .tags(tags)
                    .collectionId(collectionId)
                    .procedureId(procedureId)
                    .uploadDate(now)
                    .lastModifiedDate(now)
                    .mimeType(file.getContentType())
                    .size(file.getSize())
                    .status(DocumentStatus.PENDING)
                    .s3Key(s3Key)
                    .build();
            
            // Save to DynamoDB
            document = documentRepository.save(document);
            
            // If the document is part of a collection, update the collection's document count
            if (collectionId != null) {
                collectionRepository.incrementDocumentCount(userId, collectionId);
            }
            
            // Process document asynchronously
            processDocumentAsync(userId, documentId);
            
            log.info("Document uploaded: {}", documentId);
            
            // Convert to response DTO
            return mapToDocumentResponse(document);
            
        } catch (Exception e) {
            log.error("Error uploading document", e);
            throw e;
        }
    }

    @Override
    public Page<DocumentSummary> findDocuments(String userId, String tag, DocumentStatus status, 
                                              String collectionId, int page, int size) {
        List<Document> documents;
        
        if (tag != null && status != null) {
            // For demo purposes, this is a simplified implementation
            // In a production system, you would use query expressions with multiple conditions
            documents = documentRepository.findByUserIdAndStatus(userId, status)
                    .stream()
                    .filter(doc -> doc.getTags() != null && doc.getTags().contains(tag))
                    .collect(Collectors.toList());
        } else if (tag != null) {
            documents = documentRepository.findByUserId(userId)
                    .stream()
                    .filter(doc -> doc.getTags() != null && doc.getTags().contains(tag))
                    .collect(Collectors.toList());
        } else if (status != null) {
            documents = documentRepository.findByUserIdAndStatus(userId, status);
        } else if (collectionId != null) {
            documents = documentRepository.findByCollectionId(collectionId)
                    .stream()
                    .filter(doc -> doc.getUserId().equals(userId))
                    .collect(Collectors.toList());
        } else {
            documents = documentRepository.findByUserId(userId);
        }
        
        // Sort documents by upload date (descending)
        documents.sort(Comparator.comparing(Document::getUploadDate).reversed());
        
        // Apply pagination manually (since DynamoDB doesn't have built-in pagination)
        int start = page * size;
        int end = Math.min(start + size, documents.size());
        
        if (start >= documents.size()) {
            return new PageImpl<>(Collections.emptyList(), PageRequest.of(page, size), documents.size());
        }
        
        List<DocumentSummary> summaries = documents.subList(start, end).stream()
                .map(this::mapToDocumentSummary)
                .collect(Collectors.toList());
        
        return new PageImpl<>(summaries, PageRequest.of(page, size), documents.size());
    }

    @Override
    public DocumentResponse getDocumentDetails(String userId, String documentId) {
        Document document = documentRepository.findById(userId, documentId)
                .orElseThrow(() -> new DocumentNotFoundException("Document not found with ID: " + documentId));
        
        return mapToDocumentResponse(document);
    }

    @Override
    public void deleteDocument(String userId, String documentId) {
        Document document = documentRepository.findById(userId, documentId)
                .orElseThrow(() -> new DocumentNotFoundException("Document not found with ID: " + documentId));
        
        // Delete from S3
        storageService.delete(document.getS3Key());
        
        // Delete chunks
        chunkRepository.deleteByDocumentId(documentId);
        
        // If the document is part of a collection, update the collection's document count
        if (document.getCollectionId() != null) {
            collectionRepository.decrementDocumentCount(userId, document.getCollectionId());
        }
        
        // Delete from DynamoDB
        documentRepository.delete(userId, documentId);
        
        log.info("Document deleted: {}", documentId);
    }

    @Override
    public byte[] getDocumentContent(String userId, String documentId) {
        Document document = documentRepository.findById(userId, documentId)
                .orElseThrow(() -> new DocumentNotFoundException("Document not found with ID: " + documentId));
        
        return storageService.load(document.getS3Key());
    }

    @Override
    public String getDocumentMimeType(String userId, String documentId) {
        Document document = documentRepository.findById(userId, documentId)
                .orElseThrow(() -> new DocumentNotFoundException("Document not found with ID: " + documentId));
        
        return document.getMimeType();
    }

    @Override
    public String getDocumentName(String userId, String documentId) {
        Document document = documentRepository.findById(userId, documentId)
                .orElseThrow(() -> new DocumentNotFoundException("Document not found with ID: " + documentId));
        
        return document.getName();
    }
    
    @Override
    public List<DocumentChunkDto> getDocumentChunks(String userId, String documentId) {
        // Verify document exists and belongs to user
        documentRepository.findById(userId, documentId)
                .orElseThrow(() -> new DocumentNotFoundException("Document not found with ID: " + documentId));
        
        // Get all chunks for the document
        List<DocumentChunk> chunks = chunkRepository.findByDocumentId(documentId);
        
        return chunks.stream()
                .map(this::mapToDocumentChunkDto)
                .collect(Collectors.toList());
    }

    @Override
    public ProcessResponse processDocument(String userId, String documentId, ProcessRequest processRequest) {
        Document document = documentRepository.findById(userId, documentId)
                .orElseThrow(() -> new DocumentNotFoundException("Document not found with ID: " + documentId));
        
        // Update document status
        document.setStatus(DocumentStatus.PROCESSING);
        documentRepository.save(document);
        
        // Create a process ID and response
        String processId = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        
        ProcessResponse response = new ProcessResponse();
        response.setProcessId(processId);
        response.setDocumentId(documentId);
        response.setStatus("PENDING");
        response.setStartTime(now);
        response.setEstimatedCompletionTime(now.plusMinutes(5)); // Example
        response.setStatusCheckUrl("/api/v1/processes/" + processId);
        
        // This would normally call an external workflow/agent service
        // For demo purposes, we'll just log the request
        log.info("Document processing requested: userId={}, documentId={}, processId={}, requestType={}", 
                userId, documentId, processId, 
                processRequest.getClass().getSimpleName());
        
        // In a real implementation, you would initiate a workflow or agent process here
        
        return response;
    }
    
    @Async
    public CompletableFuture<Void> processDocumentAsync(String userId, String documentId) {
        return CompletableFuture.runAsync(() -> {
            try {
                // Update status to PROCESSING
                Document document = documentRepository.findById(userId, documentId)
                        .orElseThrow(() -> new DocumentNotFoundException("Document not found"));
                
                document.setStatus(DocumentStatus.PROCESSING);
                documentRepository.save(document);
                
                // Process the document
                documentProcessorService.processDocument(userId, documentId);
                
                // Update status to COMPLETED
                document.setStatus(DocumentStatus.COMPLETED);
                document.setLastModifiedDate(LocalDateTime.now(ZoneOffset.UTC));
                documentRepository.save(document);
                
                log.info("Document processing completed: {}", documentId);
            } catch (Exception e) {
                log.error("Error processing document {}: {}", documentId, e.getMessage(), e);
                
                // Update status to FAILED
                try {
                    Document document = documentRepository.findById(userId, documentId)
                            .orElseThrow(() -> new DocumentNotFoundException("Document not found"));
                    
                    document.setStatus(DocumentStatus.FAILED);
                    document.setLastModifiedDate(LocalDateTime.now(ZoneOffset.UTC));
                    documentRepository.save(document);
                    
                } catch (Exception ex) {
                    log.error("Failed to update document status after processing error", ex);
                }
            }
        });
    }
    
    // Helper methods to map entities to DTOs
    
    private DocumentResponse mapToDocumentResponse(Document document) {
        DocumentResponse response = new DocumentResponse();
        response.setId(document.getDocumentId());
        response.setName(document.getName());
        response.setDescription(document.getDescription());
        response.setUploadDate(document.getUploadDate());
        response.setLastModifiedDate(document.getLastModifiedDate());
        response.setSize(document.getSize());
        response.setMimeType(document.getMimeType());
        response.setStatus(document.getStatus().name());
        response.setTags(document.getTags() != null ? new ArrayList<>(document.getTags()) : new ArrayList<>());
        response.setCollectionId(document.getCollectionId());
        response.setSummary(document.getSummary());
        
        // In a real implementation, you might fetch and include processing results here
        
        return response;
    }
    
    private DocumentSummary mapToDocumentSummary(Document document) {
        DocumentSummary summary = new DocumentSummary();
        summary.setId(document.getDocumentId());
        summary.setName(document.getName());
        summary.setUploadDate(document.getUploadDate());
        summary.setSize(document.getSize());
        summary.setMimeType(document.getMimeType());
        summary.setStatus(document.getStatus().name());
        summary.setTags(document.getTags() != null ? new ArrayList<>(document.getTags()) : new ArrayList<>());
        summary.setCollectionId(document.getCollectionId());
        
        // Add a brief summary if available
        if (document.getSummary() != null && document.getSummary().length() > 100) {
            summary.setBriefSummary(document.getSummary().substring(0, 97) + "...");
        } else {
            summary.setBriefSummary(document.getSummary());
        }
        
        return summary;
    }
    
    private DocumentChunkDto mapToDocumentChunkDto(DocumentChunk chunk) {
        DocumentChunkDto dto = new DocumentChunkDto();
        dto.setId(chunk.getChunkId());
        dto.setDocumentId(chunk.getDocumentId());
        dto.setContent(chunk.getContent());
        dto.setSection(chunk.getSection());
        dto.setPageNumber(chunk.getPageNumber());
        dto.setOrder(chunk.getOrder());
        
        return dto;
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