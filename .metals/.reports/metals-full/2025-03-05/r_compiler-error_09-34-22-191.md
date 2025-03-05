file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/service/DocumentProcessorService.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
offset: 1445
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/service/DocumentProcessorService.java
text:
```scala
package com.lexygraphai.document.service;

import com.lexygraphai.document.model.Document;
import com.lexygraphai.document.model.DocumentChunk;
import com.lexygraphai.document.repository.DocumentChunkRepository;
import com.lexygraphai.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.parser.Parser;
import org.apache.tika.sax.BodyContentHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.xml.sax.SAXException;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class DocumentProcessorService {

    private final StorageService storageService;
    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository chunkRepository;
    private final RestTemplate restTemplate;
    
    @Value("${document.processing.chunk-size}")
    private int chunkSize;
    
    @Value("${@@document.processing.chunk-overlap}")
    private int chunkOverlap;
    
    @Value("${document.processing.auto-summarize}")
    private boolean autoSummarize;
    
    @Value("${service.text-processing.url}")
    private String textProcessingServiceUrl;
    
    /**
     * Process a document: extract text, create chunks, and optionally generate a summary
     */
    public void processDocument(String userId, String documentId) {
        log.info("Processing document: userId={}, documentId={}", userId, documentId);
        
        // Retrieve the document
        Document document = documentRepository.findById(userId, documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        
        try {
            // Load document content from S3
            byte[] content = storageService.load(document.getS3Key());
            
            // Extract text from document
            String extractedText = extractText(content, document.getMimeType());
            
            // Create chunks
            List<DocumentChunk> chunks = createChunks(userId, documentId, extractedText);
            
            // Save chunks
            chunkRepository.saveAll(chunks);
            log.info("Saved {} chunks for document {}", chunks.size(), documentId);
            
            // Generate summary if enabled
            if (autoSummarize) {
                String summary = generateSummary(extractedText);
                document.setSummary(summary);
                documentRepository.save(document);
                log.info("Generated summary for document {}", documentId);
            }
            
        } catch (Exception e) {
            log.error("Error processing document {}: {}", documentId, e.getMessage(), e);
            throw new RuntimeException("Failed to process document", e);
        }
    }
    
    /**
     * Extract text from document content using Apache Tika
     */
    private String extractText(byte[] content, String mimeType) throws IOException, TikaException, SAXException {
        BodyContentHandler handler = new BodyContentHandler(-1); // -1 means no limit
        AutoDetectParser parser = new AutoDetectParser();
        Metadata metadata = new Metadata();
        ParseContext context = new ParseContext();
        
        try (ByteArrayInputStream stream = new ByteArrayInputStream(content)) {
            parser.parse(stream, handler, metadata, context);
            return handler.toString();
        }
    }
    
    /**
     * Create chunks from extracted text
     */
    private List<DocumentChunk> createChunks(String userId, String documentId, String text) {
        List<DocumentChunk> chunks = new ArrayList<>();
        
        // Simple chunking by character count
        int textLength = text.length();
        int position = 0;
        int chunkIndex = 0;
        
        while (position < textLength) {
            int end = Math.min(position + chunkSize, textLength);
            
            // Try to break at a natural boundary (paragraph or sentence)
            if (end < textLength) {
                int naturalBreak = findNaturalBreak(text, end);
                if (naturalBreak > 0) {
                    end = naturalBreak;
                }
            }
            
            String chunkText = text.substring(position, end);
            
            DocumentChunk chunk = DocumentChunk.builder()
                    .documentId(documentId)
                    .chunkId(UUID.randomUUID().toString())
                    .userId(userId)
                    .content(chunkText)
                    .section("main") // In a real implementation, detect sections from document structure
                    .pageNumber(0) // In a real implementation, track page numbers
                    .order(chunkIndex++)
                    .build();
            
            chunks.add(chunk);
            
            // Move position for next chunk, accounting for overlap
            position = end - chunkOverlap;
            if (position < 0) position = 0;
            
            // Avoid infinite loops if we can't advance
            if (position >= end && end < textLength) {
                position = end + 1;
            }
        }
        
        return chunks;
    }
    
    /**
     * Find a natural break point (paragraph or sentence) near the target position
     */
    private int findNaturalBreak(String text, int targetPos) {
        // Look for paragraph break
        int startSearch = Math.max(0, targetPos - 100);
        int endSearch = Math.min(text.length(), targetPos + 100);
        String searchRegion = text.substring(startSearch, endSearch);
        
        // Look for paragraph break
        int paragraphBreak = searchRegion.indexOf("\n\n");
        if (paragraphBreak >= 0) {
            return startSearch + paragraphBreak + 2; // +2 to include the double newline
        }
        
        // Look for single newline
        int newlineBreak = searchRegion.indexOf("\n");
        if (newlineBreak >= 0) {
            return startSearch + newlineBreak + 1;
        }
        
        // Look for sentence end (period followed by space)
        int lastPeriod = -1;
        for (int i = 0; i < searchRegion.length() - 1; i++) {
            if (searchRegion.charAt(i) == '.' && 
                    Character.isWhitespace(searchRegion.charAt(i + 1))) {
                lastPeriod = i;
                if (i >= targetPos - startSearch) {
                    return startSearch + i + 1; // +1 to include the period
                }
            }
        }
        
        // If we found a period but it was before the target, use it anyway
        if (lastPeriod >= 0) {
            return startSearch + lastPeriod + 1;
        }
        
        // No natural break found
        return -1;
    }
    
    /**
     * Generate a summary for the document using the text processing service
     */
    private String generateSummary(String text) {
        try {
            // Truncate extremely long text for summary
            String truncatedText = text;
            if (text.length() > 10000) {
                truncatedText = text.substring(0, 10000);
            }
            
            // Call the text processing service for summarization
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("text", truncatedText);
            requestBody.put("maxLength", 300);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            Map<String, String> response = restTemplate.postForObject(
                    textProcessingServiceUrl + "/summarize", 
                    request, 
                    Map.class);
            
            return response != null ? response.get("summary") : "Summary not available";
            
        } catch (Exception e) {
            log.error("Error generating summary: {}", e.getMessage());
            return "Failed to generate summary due to error: " + e.getMessage();
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
	dotty.tools.pc.HoverProvider$.hover(HoverProvider.scala:40)
	dotty.tools.pc.ScalaPresentationCompiler.hover$$anonfun$1(ScalaPresentationCompiler.scala:376)
```
#### Short summary: 

java.util.NoSuchElementException: next on empty iterator