file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/service/QueueServiceImpl.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/service/QueueServiceImpl.java
text:
```scala
package com.docprocessing.document.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class QueueServiceImpl implements QueueService {

    private final SqsClient sqsClient;
    private final ObjectMapper objectMapper;
    
    @Value("${aws.sqs.document-parser-queue}")
    private String documentParserQueue;

    @Override
    public void queueDocumentForProcessing(
            UUID documentId, 
            String userId, 
            String processingType, 
            String processingOptions, 
            String priority,
            String language) {
            
        try {
            // Build message payload
            Map<String, Object> messagePayload = new HashMap<>();
            messagePayload.put("document_id", documentId.toString());
            messagePayload.put("user_id", userId);
            messagePayload.put("processing_type", processingType);
            messagePayload.put("timestamp", Instant.now().toString());
            
            if (processingOptions != null && !processingOptions.isEmpty()) {
                messagePayload.put("processing_options", processingOptions);
            }
            
            if (priority != null && !priority.isEmpty()) {
                messagePayload.put("priority", priority);
            }
            
            if (language != null && !language.isEmpty()) {
                messagePayload.put("language", language);
            }
            
            // Convert to JSON
            String messageBody = objectMapper.writeValueAsString(messagePayload);
            
            // Send message to SQS
            SendMessageRequest sendMessageRequest = SendMessageRequest.builder()
                    .queueUrl(documentParserQueue)
                    .messageBody(messageBody)
                    .build();
                    
            sqsClient.sendMessage(sendMessageRequest);
            
            log.info("Document {} queued for processing", documentId);
            
        } catch (JsonProcessingException e) {
            log.error("Error serializing message for document {}", documentId, e);
            throw new RuntimeException("Failed to queue document for processing", e);
        }
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