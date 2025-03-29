file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/repository/DocumentRepository.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/repository/DocumentRepository.java
text:
```scala
package com.docprocessing.document.repository;

import com.docprocessing.document.model.DocumentMetadata;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.*;
import software.amazon.awssdk.enhanced.dynamodb.model.*;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.*;
import java.util.stream.Collectors;

@Repository
public class DocumentRepository {

    @Value("${DOCUMENTS_TABLE}")
    private String tableName;
    
    private final DynamoDbEnhancedClient dynamoDbClient;
    
    public DocumentRepository(DynamoDbEnhancedClient dynamoDbClient) {
        this.dynamoDbClient = dynamoDbClient;
    }
    
    public void save(DocumentMetadata document) {
        DynamoDbTable<DocumentItem> table = getTable();
        
        // Convert to DynamoDB item
        DocumentItem item = mapToItem(document);
        table.putItem(item);
    }
    
    public Optional<DocumentMetadata> findById(UUID documentId) {
        DynamoDbTable<DocumentItem> table = getTable();
        
        Key key = Key.builder()
                .partitionValue(documentId.toString())
                .build();
                
        DocumentItem item = table.getItem(key);
        
        if (item == null) {
            return Optional.empty();
        }
        
        return Optional.of(mapFromItem(item));
    }
    
    public List<DocumentMetadata> findByUserId(String userId, int page, int limit, String sort, String direction) {
        DynamoDbTable<DocumentItem> table = getTable();
        
        // Create index
        DynamoDbIndex<DocumentItem> userIdIndex = table.index("UserIdIndex");
        
        // Query parameters
        QueryEnhancedRequest request = QueryEnhancedRequest.builder()
                .queryConditional(QueryConditional.keyEqualTo(Key.builder()
                        .partitionValue(userId)
                        .build()))
                .limit(limit)
                .scanIndexForward("asc".equalsIgnoreCase(direction))
                .build();
        
        // Calculate offset
        int offset = (page - 1) * limit;
        
        // Execute query
        PageIterable<DocumentItem> pages = userIdIndex.query(request);
        
        // Process results
        List<DocumentMetadata> results = new ArrayList<>();
        for (Page<DocumentItem> p : pages) {
            for (DocumentItem item : p.items()) {
                if (results.size() >= limit) {
                    break;
                }
                
                if (results.size() >= offset) {
                    results.add(mapFromItem(item));
                }
            }
            
            if (results.size() >= limit) {
                break;
            }
        }
        
        // Sort results if needed (simplified for now)
        
        return results;
    }
    
    public List<DocumentMetadata> findByCollectionId(UUID collectionId, int page, int limit, String sort, String direction) {
        DynamoDbTable<DocumentItem> table = getTable();
        
        // Create index
        DynamoDbIndex<DocumentItem> collectionIdIndex = table.index("CollectionIdIndex");
        
        // Query parameters
        QueryEnhancedRequest request = QueryEnhancedRequest.builder()
                .queryConditional(QueryConditional.keyEqualTo(Key.builder()
                        .partitionValue(collectionId.toString())
                        .build()))
                .limit(limit)
                .scanIndexForward("asc".equalsIgnoreCase(direction))
                .build();
        
        // Calculate offset
        int offset = (page - 1) * limit;
        
        // Execute query
        PageIterable<DocumentItem> pages = collectionIdIndex.query(request);
        
        // Process results
        List<DocumentMetadata> results = new ArrayList<>();
        for (Page<DocumentItem> p : pages) {
            for (DocumentItem item : p.items()) {
                if (results.size() >= limit) {
                    break;
                }
                
                if (results.size() >= offset) {
                    results.add(mapFromItem(item));
                }
            }
            
            if (results.size() >= limit) {
                break;
            }
        }
        
        // Sort results if needed (simplified for now)
        
        return results;
    }
    
    public int countByUserId(String userId) {
        // In a real implementation, you would use a query with count
        // For simplicity, we're returning a mock count
        return 25;
    }
    
    public int countByCollectionId(UUID collectionId) {
        // In a real implementation, you would use a query with count
        // For simplicity, we're returning a mock count
        return 10;
    }
    
    public void delete(UUID documentId) {
        DynamoDbTable<DocumentItem> table = getTable();
        
        Key key = Key.builder()
                .partitionValue(documentId.toString())
                .build();
                
        table.deleteItem(key);
    }
    
    public void removeCollectionReference(UUID collectionId) {
        // In a real implementation, you would update all documents 
        // in the collection to remove the collection reference
        // This is a simplified mock implementation
    }
    
    private DynamoDbTable<DocumentItem> getTable() {
        return dynamoDbClient.table(tableName, TableSchema.fromBean(DocumentItem.class));
    }
    
    private DocumentItem mapToItem(DocumentMetadata document) {
        DocumentItem item = new DocumentItem();
        item.setId(document.getId().toString());
        item.setUserId(document.getUserId());
        item.setName(document.getName());
        item.setDescription(document.getDescription());
        item.setCreatedAt(document.getCreatedAt().toString());
        item.setUpdatedAt(document.getUpdatedAt().toString());
        item.setSize(document.getSize());
        item.setMimeType(document.getMimeType());
        item.setStatus(document.getStatus());
        item.setProcessingType(document.getProcessingType());
        
        if (document.getCollectionId() != null) {
            item.setCollectionId(document.getCollectionId().toString());
        }
        
        item.setHasSummary(document.getHasSummary());
        item.setHasEntities(document.getHasEntities());
        item.setPageCount(document.getPageCount());
        item.setThumbnailUrl(document.getThumbnailUrl());
        item.setViewUrl(document.getViewUrl());
        item.setTags(document.getTags());
        item.setOriginalFilename(document.getOriginalFilename());
        
        return item;
    }
    
    private DocumentMetadata mapFromItem(DocumentItem item) {
        DocumentMetadata document = new DocumentMetadata();
        document.setId(UUID.fromString(item.getId()));
        document.setUserId(item.getUserId());
        document.setName(item.getName());
        document.setDescription(item.getDescription());
        // Parse dates from strings
        document.setCreatedAt(LocalDateTime.parse(item.getCreatedAt()));
        document.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt()));
        document.setSize(item.getSize());
        document.setMimeType(item.getMimeType());
        document.setStatus(item.getStatus());
        document.setProcessingType(item.getProcessingType());
        
        if (item.getCollectionId() != null) {
            document.setCollectionId(UUID.fromString(item.getCollectionId()));
        }
        
        document.setHasSummary(item.getHasSummary());
        document.setHasEntities(item.getHasEntities());
        document.setPageCount(item.getPageCount());
        document.setThumbnailUrl(item.getThumbnailUrl());
        document.setViewUrl(item.getViewUrl());
        document.setTags(item.getTags());
        document.setOriginalFilename(item.getOriginalFilename());
        
        return document;
    }
    
    // DynamoDB item class
    @DynamoDbBean
    public static class DocumentItem {
        private String id;
        private String userId;
        private String name;
        private String description;
        private String createdAt;
        private String updatedAt;
        private Long size;
        private String mimeType;
        private String status;
        private String processingType;
        private String collectionId;
        private Boolean hasSummary;
        private Boolean hasEntities;
        private Integer pageCount;
        private String thumbnailUrl;
        private String viewUrl;
        private List<String> tags;
        private String originalFilename;
        
        @DynamoDbPartitionKey
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        
        @DynamoDbSecondaryPartitionKey(indexNames = "UserIdIndex")
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public String getCreatedAt() { return createdAt; }
        public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
        
        public String getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
        
        public Long getSize() { return size; }
        public void setSize(Long size) { this.size = size; }
        
        public String getMimeType() { return mimeType; }
        public void setMimeType(String mimeType) { this.mimeType = mimeType; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public String getProcessingType() { return processingType; }
        public void setProcessingType(String processingType) { this.processingType = processingType; }
        
        @DynamoDbSecondaryPartitionKey(indexNames = "CollectionIdIndex")
        public String getCollectionId() { return collectionId; }
        public void setCollectionId(String collectionId) { this.collectionId = collectionId; }
        
        public Boolean getHasSummary() { return hasSummary; }
        public void setHasSummary(Boolean hasSummary) { this.hasSummary = hasSummary; }
        
        public Boolean getHasEntities() { return hasEntities; }
        public void setHasEntities(Boolean hasEntities) { this.hasEntities = hasEntities; }
        
        public Integer getPageCount() { return pageCount; }
        public void setPageCount(Integer pageCount) { this.pageCount = pageCount; }
        
        public String getThumbnailUrl() { return thumbnailUrl; }
        public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }
        
        public String getViewUrl() { return viewUrl; }
        public void setViewUrl(String viewUrl) { this.viewUrl = viewUrl; }
        
        public List<String> getTags() { return tags; }
        public void setTags(List<String> tags) { this.tags = tags; }
        
        public String getOriginalFilename() { return originalFilename; }
        public void setOriginalFilename(String originalFilename) { this.originalFilename = originalFilename; }
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