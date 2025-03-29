file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/repository/CollectionRepository.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/repository/CollectionRepository.java
text:
```scala
package com.docprocessing.document.repository;

import com.docprocessing.document.model.Collection;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.*;
import software.amazon.awssdk.enhanced.dynamodb.model.*;

import java.time.LocalDateTime;
import java.util.*;

@Repository
public class CollectionRepository {

    @Value("${COLLECTIONS_TABLE}")
    private String tableName;
    
    private final DynamoDbEnhancedClient dynamoDbClient;
    
    public CollectionRepository(DynamoDbEnhancedClient dynamoDbClient) {
        this.dynamoDbClient = dynamoDbClient;
    }
    
    public void save(Collection collection) {
        DynamoDbTable<CollectionItem> table = getTable();
        
        // Convert to DynamoDB item
        CollectionItem item = mapToItem(collection);
        table.putItem(item);
    }
    
    public Optional<Collection> findById(UUID collectionId) {
        DynamoDbTable<CollectionItem> table = getTable();
        
        Key key = Key.builder()
                .partitionValue(collectionId.toString())
                .build();
                
        CollectionItem item = table.getItem(key);
        
        if (item == null) {
            return Optional.empty();
        }
        
        return Optional.of(mapFromItem(item));
    }
    
    public List<Collection> findByOwnerId(String ownerId, int page, int limit) {
        DynamoDbTable<CollectionItem> table = getTable();
        
        // Create index
        DynamoDbIndex<CollectionItem> ownerIdIndex = table.index("OwnerIdIndex");
        
        // Query parameters
        QueryEnhancedRequest request = QueryEnhancedRequest.builder()
                .queryConditional(QueryConditional.keyEqualTo(Key.builder()
                        .partitionValue(ownerId)
                        .build()))
                .limit(limit)
                .build();
        
        // Calculate offset
        int offset = (page - 1) * limit;
        
        // Execute query
        PageIterable<CollectionItem> pages = ownerIdIndex.query(request);
        
        // Process results
        List<Collection> results = new ArrayList<>();
        for (Page<CollectionItem> p : pages) {
            for (CollectionItem item : p.items()) {
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
        
        return results;
    }
    
    public int countByOwnerId(String ownerId) {
        // In a real implementation, you would use a query with count
        // For simplicity, we're returning a mock count
        return 5;
    }
    
    public void delete(UUID collectionId) {
        DynamoDbTable<CollectionItem> table = getTable();
        
        Key key = Key.builder()
                .partitionValue(collectionId.toString())
                .build();
                
        table.deleteItem(key);
    }
    
    private DynamoDbTable<CollectionItem> getTable() {
        return dynamoDbClient.table(tableName, TableSchema.fromBean(CollectionItem.class));
    }
    
    private CollectionItem mapToItem(Collection collection) {
        CollectionItem item = new CollectionItem();
        item.setId(collection.getId().toString());
        item.setName(collection.getName());
        item.setDescription(collection.getDescription());
        item.setOwnerId(collection.getOwnerId());
        item.setDocumentCount(collection.getDocumentCount());
        item.setCreatedAt(collection.getCreatedAt().toString());
        item.setUpdatedAt(collection.getUpdatedAt().toString());
        item.setThumbnailUrl(collection.getThumbnailUrl());
        
        return item;
    }
    
    private Collection mapFromItem(CollectionItem item) {
        Collection collection = new Collection();
        collection.setId(UUID.fromString(item.getId()));
        collection.setName(item.getName());
        collection.setDescription(item.getDescription());
        collection.setOwnerId(item.getOwnerId());
        collection.setDocumentCount(item.getDocumentCount());
        // Parse dates from strings
        collection.setCreatedAt(LocalDateTime.parse(item.getCreatedAt()));
        collection.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt()));
        collection.setThumbnailUrl(item.getThumbnailUrl());
        
        return collection;
    }
    
    // DynamoDB item class
    @DynamoDbBean
    public static class CollectionItem {
        private String id;
        private String name;
        private String description;
        private String ownerId;
        private Integer documentCount;
        private String createdAt;
        private String updatedAt;
        private String thumbnailUrl;
        
        @DynamoDbPartitionKey
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        @DynamoDbSecondaryPartitionKey(indexNames = "OwnerIdIndex")
        public String getOwnerId() { return ownerId; }
        public void setOwnerId(String ownerId) { this.ownerId = ownerId; }
        
        public Integer getDocumentCount() { return documentCount; }
        public void setDocumentCount(Integer documentCount) { this.documentCount = documentCount; }
        
        public String getCreatedAt() { return createdAt; }
        public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
        
        public String getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
        
        public String getThumbnailUrl() { return thumbnailUrl; }
        public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }
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