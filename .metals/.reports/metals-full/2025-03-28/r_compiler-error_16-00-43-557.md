file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/service/ProcessingService.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/service/ProcessingService.java
text:
```scala
package com.docprocessing.document.service;

import com.docprocessing.document.model.EntitiesResponse;
import com.docprocessing.document.model.ProcessingStatusResponse;
import com.docprocessing.document.model.SummaryResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ProcessingService {

    @Value("${PARSER_QUEUE}")
    private String parserQueue;
    
    @Value("${OCR_QUEUE}")
    private String ocrQueue;
    
    @Value("${TEXT_PROCESSING_QUEUE}")
    private String textProcessingQueue;
    
    @Value("${SUMMARIZER_QUEUE}")
    private String summarizerQueue;
    
    private final SqsClient sqsClient;
    private final ObjectMapper objectMapper;
    
    public void submitDocumentForProcessing(
            UUID documentId, 
            String s3Key, 
            String userId, 
            String processingType, 
            String processingOptions,
            String priority,
            String language) {
            
        try {
            // Create message payload
            Map<String, Object> payload = new HashMap<>();
            payload.put("documentId", documentId.toString());
            payload.put("s3Key", s3Key);
            payload.put("userId", userId);
            payload.put("processingType", processingType);
            payload.put("priority", priority);
            payload.put("language", language);
            
            if (processingOptions != null && !processingOptions.isEmpty()) {
                payload.put("options", processingOptions);
            }
            
            String messageBody = objectMapper.writeValueAsString(payload);
            
            // Determine which queue to send to based on processing type
            String queueUrl;
            
            switch (processingType) {
                case "IMAGE":
                case "TABLE":
                case "HANDWRITTEN":
                case "COMPLEX":
                    queueUrl = ocrQueue;
                    break;
                case "TEXT":
                default:
                    queueUrl = parserQueue;
                    break;
            }
            
            // Send message to queue
            SendMessageRequest sendRequest = SendMessageRequest.builder()
                    .queueUrl(queueUrl)
                    .messageBody(messageBody)
                    .build();
                    
            sqsClient.sendMessage(sendRequest);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize processing request", e);
        }
    }
    
    public ProcessingStatusResponse getProcessingStatus(UUID documentId) {
        // This is a mock implementation
        // In a real implementation, you would query a database or processing service
        
        ProcessingStatusResponse status = new ProcessingStatusResponse();
        status.setDocumentId(documentId);
        status.setStatus("PROCESSING"); // Mock status
        status.setCurrentStep("TEXT_EXTRACTION");
        status.setProgress(65);
        status.setEstimatedCompletionTime(LocalDateTime.now().plusMinutes(2));
        status.setCompletedSteps(Arrays.asList("PARSING", "DOCUMENT_SPLITTING"));
        status.setElapsedTime(30); // seconds
        
        return status;
    }
    
    public String getExtractedText(UUID documentId, Integer page, String format) {
        // This is a mock implementation
        // In a real implementation, you would get the text from storage
        
        return "This is the extracted text content from the document. " +
               "It would contain the actual text extracted from the document " +
               "during the processing phase. For multi-page documents, " +
               "you can request specific pages.";
    }
    
    public SummaryResponse getDocumentSummary(UUID documentId, Integer maxLength) {
        // This is a mock implementation
        // In a real implementation, you would get the summary from storage
        
        SummaryResponse summary = new SummaryResponse();
        summary.setDocumentId(documentId);
        summary.setSummary("This document discusses important business strategies and future plans.");
        summary.setKeyPoints(Arrays.asList(
            "Market expansion planned for Q3 2023",
            "Budget allocation for new product development",
            "Team restructuring to support growth"
        ));
        summary.setConfidence(0.87f);
        
        return summary;
    }
    
    public EntitiesResponse getDocumentEntities(UUID documentId, String[] types) {
        // This is a mock implementation
        // In a real implementation, you would get entities from storage
        
        EntitiesResponse response = new EntitiesResponse();
        response.setDocumentId(documentId);
        
        List<EntitiesResponse.Entity> entities = new ArrayList<>();
        
        // Add some sample entities
        EntitiesResponse.Entity entity1 = new EntitiesResponse.Entity();
        entity1.setText("Microsoft");
        entity1.setType("ORGANIZATION");
        entity1.setConfidence(0.95f);
        entity1.setPage(1);
        
        EntitiesResponse.Entity.Position position1 = new EntitiesResponse.Entity.Position();
        position1.setStart(120);
        position1.setEnd(129);
        entity1.setPosition(position1);
        
        Map<String, Object> metadata1 = new HashMap<>();
        metadata1.put("industry", "Technology");
        entity1.setMetadata(metadata1);
        
        EntitiesResponse.Entity entity2 = new EntitiesResponse.Entity();
        entity2.setText("June 15, 2023");
        entity2.setType("DATE");
        entity2.setConfidence(0.98f);
        entity2.setPage(2);
        
        EntitiesResponse.Entity.Position position2 = new EntitiesResponse.Entity.Position();
        position2.setStart(45);
        position2.setEnd(58);
        entity2.setPosition(position2);
        
        entities.add(entity1);
        entities.add(entity2);
        
        // Filter by types if specified
        if (types != null && types.length > 0) {
            Set<String> typeSet = new HashSet<>(Arrays.asList(types));
            entities = entities.stream()
                .filter(e -> typeSet.contains(e.getType()))
                .toList();
        }
        
        response.setEntities(entities);
        return response;
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
	dotty.tools.pc.WithCompilationUnit.<init>(WithCompilationUnit.scala:31)
	dotty.tools.pc.SimpleCollector.<init>(PcCollector.scala:345)
	dotty.tools.pc.PcSemanticTokensProvider$Collector$.<init>(PcSemanticTokensProvider.scala:63)
	dotty.tools.pc.PcSemanticTokensProvider.Collector$lzyINIT1(PcSemanticTokensProvider.scala:63)
	dotty.tools.pc.PcSemanticTokensProvider.Collector(PcSemanticTokensProvider.scala:63)
	dotty.tools.pc.PcSemanticTokensProvider.provide(PcSemanticTokensProvider.scala:88)
	dotty.tools.pc.ScalaPresentationCompiler.semanticTokens$$anonfun$1(ScalaPresentationCompiler.scala:109)
```
#### Short summary: 

java.util.NoSuchElementException: next on empty iterator