file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/service/DocumentServiceImpl.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
offset: 298
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/service/DocumentServiceImpl.java
text:
```scala
package com.lexygraphai.document.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lexygraphai.document.dto.*;
import com.lexygraphai.document.exception.DocumentNotFoundException;
import com.lexygraphai.document.model.Document;
import com.lexygraphai.document.model.DocumentS@@tatus;
import com.lexygraphai.document.model.ProcessingResult;
import com.lexygraphai.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {

    private final DocumentRepository documentRepository;
    private final StorageService storageService;
    private final ObjectMapper objectMapper;
    
    @Override
    @Transactional
    public DocumentResponse uploadDocument(MultipartFile file, Map<String, Object> metadata) {
        try {
            // Extract metadata if provided
            String name = null;
            String description = null;
            List<String> tags = new ArrayList<>();
            UUID collectionId = null;
            
            if (metadata != null) {
                if (metadata.containsKey("name")) {
                    name = (String) metadata.get("name");
                }
                if (metadata.containsKey("description")) {
                    description = (String) metadata.get("description");
                }
                if (metadata.containsKey("tags") && metadata.get("tags") instanceof List) {
                    tags = ((List<?>) metadata.get("tags")).stream()
                            .map(Object::toString)
                            .collect(Collectors.toList());
                }
                if (metadata.containsKey("collectionId")) {
                    String collectionIdStr = (String) metadata.get("collectionId");
                    if (collectionIdStr != null && !collectionIdStr.isBlank()) {
                        collectionId = UUID.fromString(collectionIdStr);
                    }
                }
            }
            
            // Use filename if name not provided
            if (name == null || name.isBlank()) {
                name = file.getOriginalFilename();
                if (name == null || name.isBlank()) {
                    name = "document-" + UUID.randomUUID();
                }
            }
            
            // Store the file
            String storagePath = storageService.store(file);
            
            // Create document entity
            Document document = Document.builder()
                    .name(name)
                    .description(description)
                    .tags(tags)
                    .collectionId(collectionId)
                    .originalFilename(file.getOriginalFilename())
                    .mimeType(file.getContentType())
                    .size(file.getSize())
                    .status(DocumentStatus.PENDING)
                    .storagePath(storagePath)
                    .build();
            
            // Save to database
            document = documentRepository.save(document);
            
            log.info("Document uploaded: {}", document.getId());
            
            // Convert to response DTO
            return mapToDocumentResponse(document);
            
        } catch (Exception e) {
            log.error("Error uploading document", e);
            throw e;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DocumentSummary> findDocuments(String tag, DocumentStatus status, UUID collectionId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "uploadDate"));
        
        Page<Document> documents;
        if (tag != null || status != null || collectionId != null) {
            documents = documentRepository.findByTagAndStatusAndCollectionId(tag, status, collectionId, pageable);
        } else {
            documents = documentRepository.findAll(pageable);
        }
        
        return documents.map(this::mapToDocumentSummary);
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentResponse getDocumentDetails(UUID documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new DocumentNotFoundException("Document not found with ID: " + documentId));
        
        return mapToDocumentResponse(document);
    }

    @Override
    @Transactional
    public void deleteDocument(UUID documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new DocumentNotFoundException("Document not found with ID: " + documentId));
        
        // Delete from storage
        storageService.delete(document.getStoragePath());
        
        // Delete from database
        documentRepository.delete(document);
        
        log.info("Document deleted: {}", documentId);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] getDocumentContent(UUID documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new DocumentNotFoundException("Document not found with ID: " + documentId));
        
        return storageService.load(document.getStoragePath());
    }

    @Override
    @Transactional(readOnly = true)
    public String getDocumentMimeType(UUID documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new DocumentNotFoundException("Document not found with ID: " + documentId));
        
        return document.getMimeType();
    }

    @Override
    @Transactional(readOnly = true)
    public String getDocumentName(UUID documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new DocumentNotFoundException("Document not found with ID: " + documentId));
        
        return document.getOriginalFilename() != null ? document.getOriginalFilename() : document.getName();
    }

    @Override
    @Transactional
    public ProcessResponse processDocument(UUID documentId, ProcessRequest processRequest) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new DocumentNotFoundException("Document not found with ID: " + documentId));
        
        // Create a process ID
        UUID processId = UUID.randomUUID();
        
        // Update document status
        document.setStatus(DocumentStatus.PROCESSING);
        
        // Create a processing result record
        ProcessingResult result = new ProcessingResult();
        result.setDocument(document);
        result.setStartTime(LocalDateTime.now());
        result.setStatus("PENDING");
        
        if (processRequest instanceof AgentProcessRequest) {
            AgentProcessRequest agentRequest = (AgentProcessRequest) processRequest;
            result.setAgentId(agentRequest.getAgentId());
            // In a real implementation, you would call the agent service here
        } else if (processRequest instanceof WorkflowProcessRequest) {
            WorkflowProcessRequest workflowRequest = (WorkflowProcessRequest) processRequest;
            result.setWorkflowId(workflowRequest.getWorkflowId());
            // In a real implementation, you would call the workflow service here
        }
        
        document.getProcessingResults().add(result);
        documentRepository.save(document);
        
        // Create a response
        ProcessResponse response = new ProcessResponse();
        response.setProcessId(processId);
        response.setDocumentId(documentId);
        response.setStatus("PENDING");
        response.setStartTime(LocalDateTime.now());
        response.setEstimatedCompletionTime(LocalDateTime.now().plusMinutes(5)); // Example
        response.setStatusCheckUrl("/api/v1/processes/" + processId);
        
        log.info("Document processing initiated: {}, process: {}", documentId, processId);
        
        return response;
    }
    
    // Helper methods to map entities to DTOs
    
    private DocumentResponse mapToDocumentResponse(Document document) {
        DocumentResponse response = new DocumentResponse();
        response.setId(document.getId());
        response.setName(document.getName());
        response.setDescription(document.getDescription());
        response.setUploadDate(document.getUploadDate());
        response.setLastModifiedDate(document.getLastModifiedDate());
        response.setSize(document.getSize());
        response.setMimeType(document.getMimeType());
        response.setStatus(document.getStatus().toString());
        response.setTags(document.getTags());
        response.setCollectionId(document.getCollectionId());
        
        if (document.getProcessingResults() != null) {
            response.setProcessingResults(document.getProcessingResults().stream()
                    .map(this::mapToProcessingSummary)
                    .collect(Collectors.toList()));
        }
        
        return response;
    }
    
    private DocumentSummary mapToDocumentSummary(Document document) {
        DocumentSummary summary = new DocumentSummary();
        summary.setId(document.getId());
        summary.setName(document.getName());
        summary.setUploadDate(document.getUploadDate());
        summary.setSize(document.getSize());
        summary.setMimeType(document.getMimeType());
        summary.setStatus(document.getStatus().toString());
        summary.setTags(document.getTags());
        summary.setCollectionId(document.getCollectionId());
        
        return summary;
    }
    
    private ProcessingSummary mapToProcessingSummary(ProcessingResult result) {
        ProcessingSummary summary = new ProcessingSummary();
        summary.setId(UUID.randomUUID()); // In a real implementation, this would be the actual result ID
        summary.setAgentId(result.getAgentId());
        summary.setAgentName("Agent Name"); // In a real implementation, this would come from the agent service
        summary.setStatus(result.getStatus());
        summary.setStartTime(result.getStartTime());
        summary.setEndTime(result.getEndTime());
        summary.setOutputType(result.getOutputType());
        
        return summary;
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