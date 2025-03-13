file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/service/DocumentServiceImpl.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
offset: 3376
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/service/DocumentServiceImpl.java
text:
```scala
package com.docprocessing.document.service;

import com.docprocessing.document.exception.DocumentNotFoundException;
import com.docprocessing.document.exception.NotAuthorizedException;
import com.docprocessing.document.model.*;
import com.docprocessing.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentServiceImpl implements DocumentService {

    private final DocumentRepository documentRepository;
    private final StorageService storageService;
    private final QueueService queueService;
    
    @Override
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
            
        // Generate document ID
        UUID documentId = UUID.randomUUID();
        
        // Store file in S3
        String fileKey = storageService.storeFile(file, userId, documentId);
        
        // Create document record with initial metadata
        Document document = new Document();
        document.setId(documentId);
        document.setName(name != null ? name : file.getOriginalFilename());
        document.setDescription(description);
        document.setUserId(userId);
        document.setCollectionId(collectionId);
        document.setMimeType(file.getContentType());
        document.setSize(file.getSize());
        document.setStatus("SUBMITTED");
        document.setProcessingType(processingType);
        document.setUploadedAt(Instant.now());
        document.setUpdatedAt(Instant.now());
        document.setOriginalFilename(file.getOriginalFilename());
        document.setFileKey(fileKey);
        
        // Save document record
        documentRepository.save(document);
        
        // Queue document for processing
        queueService.queueDocumentForProcessing(documentId, userId, processingType, 
            processingOptions, priority, language);
        
        // Prepare response
        DocumentSubmissionResponse response = new DocumentSubmissionResponse();
        response.setId(documentId);
        response.setName(document.getName());
        response.setStatus("SUBMITTED");
        response.setEstimatedCompletionTime(Instant.now().plus(2, ChronoUnit.MINUTES));
        response.setStatusCheckUrl("/documents/" + documentId + "/status");
        response.setCollectionId(collectionId);
        
        return response;
    }
    
    @Override
    public Document getDocument(String userId, UUID documentId) {
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new DocumentNotFoundException("Document not found: " + documentId));
            
        // Check if user has access
        if (!document.getUserId().equals(userId)) {
            throw new NotAuthorizedException("Not authorized to access this document");
        }
        
        return document;
    }

    @Override
@@        public DocumentBatchResponse findByUserId(String userId, int page, int limit, String sort, String direction) {
            return documentRepository.findByUserId(userId, page, limit, sort, direction);
        }
    
    @Override
    public ProcessingStatusResponse getDocumentStatus(String userId, UUID documentId) {
        Document document = getDocument(userId, documentId);
        
        // Get processing details from document record
        ProcessingStatusResponse status = new ProcessingStatusResponse();
        status.setDocumentId(documentId);
        status.setStatus(document.getStatus());
        
        // Additional processing status details would be fetched here
        // This would be populated from the Document Processing Table in DynamoDB
        
        return status;
    }
    
    @Override
    public Document updateDocument(String userId, UUID documentId, Document documentUpdate) {
        Document existingDocument = getDocument(userId, documentId);
        
        // Update mutable fields
        if (documentUpdate.getName() != null) {
            existingDocument.setName(documentUpdate.getName());
        }
        
        if (documentUpdate.getDescription() != null) {
            existingDocument.setDescription(documentUpdate.getDescription());
        }
        
        if (documentUpdate.getCollectionId() != null) {
            existingDocument.setCollectionId(documentUpdate.getCollectionId());
        }
        
        if (documentUpdate.getTags() != null) {
            existingDocument.setTags(documentUpdate.getTags());
        }
        
        existingDocument.setUpdatedAt(Instant.now());
        
        // Save updated document
        return documentRepository.save(existingDocument);
    }
    
    @Override
    public void deleteDocument(String userId, UUID documentId) {
        Document document = getDocument(userId, documentId);
        
        // Delete from storage
        storageService.deleteFile(userId, documentId);
        
        // Delete document record
        documentRepository.delete(document);
    }
    
    @Override
    public ExtractedTextResponse getExtractedText(String userId, UUID documentId, 
                                                  Integer page, String format) {
        // Verify access
        Document document = getDocument(userId, documentId);
        
        // Fetch extracted text
        return documentRepository.getExtractedText(documentId, page, format);
    }
    
    @Override
    public SummaryResponse getDocumentSummary(String userId, UUID documentId, Integer maxLength) {
        // Verify access
        Document document = getDocument(userId, documentId);
        
        // Fetch summary
        return documentRepository.getDocumentSummary(documentId, maxLength);
    }
    
    @Override
    public EntitiesResponse getDocumentEntities(String userId, UUID documentId, String[] types) {
        // Verify access
        Document document = getDocument(userId, documentId);
        
        // Fetch entities
        return documentRepository.getDocumentEntities(documentId, types);
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