file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/repository/DocumentRepositoryImpl.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
offset: 197
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/repository/DocumentRepositoryImpl.java
text:
```scala
package com.docprocessing.document.repository;

import com.docprocessing.document.exception.DocumentNotFoundException;
import com.docprocessing.document.model.*;
import com.docprocessing.document.m@@odel.EntitiesResponse;
import com.docprocessing.document.model.Entity;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
@Slf4j
public class DocumentRepositoryImpl implements DocumentRepository {

    private final DynamoDbEnhancedClient dynamoDbEnhancedClient;
    private final S3Client s3Client;
    private final ObjectMapper objectMapper;
    
    @Value("${aws.dynamodb.documents-table}")
    private String documentsTable;
    
    @Value("${aws.s3.processed-bucket}")
    private String processedBucket;

    @Override
    public Document save(Document document) {
        DynamoDbTable<Document> table = getDocumentsTable();
        table.putItem(document);
        return document;
    }

    @Override
    public Optional<Document> findById(UUID id) {
        DynamoDbTable<Document> table = getDocumentsTable();
        Key key = Key.builder()
                .partitionValue("doc#" + id.toString())
                .sortValue("metadata")
                .build();
                
        return Optional.ofNullable(table.getItem(key));
    }

    @Override
    public void delete(Document document) {
        DynamoDbTable<Document> table = getDocumentsTable();
        Key key = Key.builder()
                .partitionValue("doc#" + document.getId().toString())
                .sortValue("metadata")
                .build();
        table.deleteItem(key);
    }

    @Override
    public DocumentBatchResponse findByCollectionId(UUID collectionId, int page, int limit, String sort, String direction) {
        Map<String, AttributeValue> expressionValues = new HashMap<>();
        expressionValues.put(":collectionId", AttributeValue.builder().s(collectionId.toString()).build());
        expressionValues.put(":sk", AttributeValue.builder().s("metadata").build());
        
        // This is a simplified version - in a real implementation, you would use GSI for collectionId
        // The current implementation would require client-side filtering
        DynamoDbTable<Document> table = getDocumentsTable();
        List<Document> allDocuments = new ArrayList<>();
        table.scan().items().forEach(allDocuments::add);
        
        List<Document> filteredDocuments = allDocuments.stream()
                .filter(doc -> collectionId.equals(doc.getCollectionId()))
                .collect(Collectors.toList());
        
        // Apply pagination
        int totalItems = filteredDocuments.size();
        int totalPages = (int) Math.ceil((double) totalItems / limit);
        int startIndex = (page - 1) * limit;
        int endIndex = Math.min(startIndex + limit, totalItems);
        
        List<Document> pageDocuments = filteredDocuments.subList(startIndex, endIndex);
        
        Pagination pagination = Pagination.builder()
                .currentPage(page)
                .totalPages(totalPages)
                .totalItems(totalItems)
                .itemsPerPage(limit)
                .hasNextPage(page < totalPages)
                .hasPreviousPage(page > 1)
                .build();
        
        return DocumentBatchResponse.builder()
                .documents(pageDocuments)
                .pagination(pagination)
                .build();
    }

    @Override
    public DocumentBatchResponse findByUserId(String userId, int page, int limit, String sort, String direction) {
        // Similar to findByCollectionId, but filtering by userId
        // In a real implementation, you would use GSI or a different query approach
        DynamoDbTable<Document> table = getDocumentsTable();
        List<Document> allDocuments = new ArrayList<>();
        table.scan().items().forEach(allDocuments::add);
        
        List<Document> filteredDocuments = allDocuments.stream()
                .filter(doc -> userId.equals(doc.getUserId()))
                .collect(Collectors.toList());
        
        // Apply pagination
        int totalItems = filteredDocuments.size();
        int totalPages = (int) Math.ceil((double) totalItems / limit);
        int startIndex = (page - 1) * limit;
        int endIndex = Math.min(startIndex + limit, totalItems);
        
        List<Document> pageDocuments = filteredDocuments.subList(startIndex, endIndex);
        
        Pagination pagination = Pagination.builder()
                .currentPage(page)
                .totalPages(totalPages)
                .totalItems(totalItems)
                .itemsPerPage(limit)
                .hasNextPage(page < totalPages)
                .hasPreviousPage(page > 1)
                .build();
        
        return DocumentBatchResponse.builder()
                .documents(pageDocuments)
                .pagination(pagination)
                .build();
    }

    @Override
    public ExtractedTextResponse getExtractedText(UUID documentId, Integer page, String format) {
        Document document = findById(documentId)
                .orElseThrow(() -> new DocumentNotFoundException("Document not found: " + documentId));
        
        // Determine page number
        int pageNumber = page != null ? page : 1;
        if (pageNumber > document.getPageCount()) {
            throw new IllegalArgumentException("Page number exceeds document page count");
        }
        
        // Construct S3 key for the extracted text
        String s3Key;
        if (format.equals("html")) {
            s3Key = String.format("users/%s/documents/%s/processed/page_%d.html", 
                    document.getUserId(), documentId, pageNumber);
        } else if (format.equals("markdown")) {
            s3Key = String.format("users/%s/documents/%s/processed/page_%d.md", 
                    document.getUserId(), documentId, pageNumber);
        } else {
            // Default to plain text
            s3Key = String.format("users/%s/documents/%s/processed/page_%d.txt", 
                    document.getUserId(), documentId, pageNumber);
        }
        
        // Try to get content from S3
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(processedBucket)
                    .key(s3Key)
                    .build();
                    
            ResponseInputStream<GetObjectResponse> s3Response = s3Client.getObject(getObjectRequest);
            String content = new String(s3Response.readAllBytes());
            
            // Build response
            ExtractedTextResponse response = new ExtractedTextResponse();
            response.setDocumentId(documentId);
            response.setPage(pageNumber);
            response.setTotalPages(document.getPageCount());
            response.setFormat(format);
            response.setLanguage(document.getLanguage());
            response.setContent(content);
            
            // Add navigation URLs
            if (pageNumber > 1) {
                response.setPreviousPageUrl("/documents/" + documentId + "/extracted-text?page=" + (pageNumber - 1));
            }
            if (pageNumber < document.getPageCount()) {
                response.setNextPageUrl("/documents/" + documentId + "/extracted-text?page=" + (pageNumber + 1));
            }
            
            return response;
        } catch (NoSuchKeyException e) {
            log.error("Extracted text not found for document {}, page {}", documentId, pageNumber, e);
            throw new DocumentNotFoundException("Extracted text not found for the specified page");
        } catch (IOException e) {
            log.error("Error reading extracted text for document {}", documentId, e);
            throw new RuntimeException("Error reading extracted text", e);
        }
    }

    @Override
    public SummaryResponse getDocumentSummary(UUID documentId, Integer maxLength) {
        Document document = findById(documentId)
                .orElseThrow(() -> new DocumentNotFoundException("Document not found: " + documentId));
                
        if (!Boolean.TRUE.equals(document.getHasSummary())) {
            throw new UnsupportedOperationException("Summary not available for this document");
        }
        
        // Construct S3 key for the summary
        String s3Key = String.format("users/%s/documents/%s/processed/summary.json", 
                document.getUserId(), documentId);
                
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(processedBucket)
                    .key(s3Key)
                    .build();
                    
            ResponseInputStream<GetObjectResponse> s3Response = s3Client.getObject(getObjectRequest);
            Map<String, Object> summaryData = objectMapper.readValue(s3Response, new TypeReference<Map<String, Object>>() {});
            
            String summary = (String) summaryData.get("summary");
            List<String> keyPoints = (List<String>) summaryData.get("keyPoints");
            
            // Truncate summary if maxLength is specified
            if (maxLength != null && summary.length() > maxLength) {
                summary = summary.substring(0, maxLength) + "...";
            }
            
            SummaryResponse response = new SummaryResponse();
            response.setDocumentId(documentId);
            response.setSummary(summary);
            response.setKeyPoints(keyPoints);
            response.setConfidence(0.9f); // This would normally come from the summarizer
            
            return response;
        } catch (NoSuchKeyException e) {
            log.error("Summary not found for document {}", documentId, e);
            throw new DocumentNotFoundException("Summary not found for this document");
        } catch (IOException e) {
            log.error("Error reading summary for document {}", documentId, e);
            throw new RuntimeException("Error reading summary", e);
        }
    }

    @Override
    public EntitiesResponse getDocumentEntities(UUID documentId, String[] types) {
        Document document = findById(documentId)
                .orElseThrow(() -> new DocumentNotFoundException("Document not found: " + documentId));
                
        if (!Boolean.TRUE.equals(document.getHasEntities())) {
            throw new UnsupportedOperationException("Entities not available for this document");
        }
        
        // Construct S3 key for the entities
        String s3Key = String.format("users/%s/documents/%s/processed/entities.json", 
                document.getUserId(), documentId);
                
                try {
                    GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                            .bucket(processedBucket)
                            .key(s3Key)
                            .build();
                            
                    ResponseInputStream<GetObjectResponse> s3Response = s3Client.getObject(getObjectRequest);
                    List<Entity> allEntities = objectMapper.readValue(s3Response, 
                            new TypeReference<List<Entity>>() {});
                    
                    // Filter by types if specified
                    List<Entity> filteredEntities;
                    if (types != null && types.length > 0) {
                        Set<String> typeSet = new HashSet<>(Arrays.asList(types));
                        filteredEntities = allEntities.stream()
                                .filter(entity -> typeSet.contains(entity.getType()))
                                .collect(Collectors.toList());
                    } else {
                        filteredEntities = allEntities;
                    }
                    
                    EntitiesResponse response = new EntitiesResponse();
                    response.setDocumentId(documentId);
                    response.setEntities(filteredEntities);
            
            return response;
        } catch (NoSuchKeyException e) {
            log.error("Entities not found for document {}", documentId, e);
            throw new DocumentNotFoundException("Entities not found for this document");
        } catch (IOException e) {
            log.error("Error reading entities for document {}", documentId, e);
            throw new RuntimeException("Error reading entities", e);
        }
    }
    
    private DynamoDbTable<Document> getDocumentsTable() {
        return dynamoDbEnhancedClient.table(documentsTable, TableSchema.fromBean(Document.class));
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