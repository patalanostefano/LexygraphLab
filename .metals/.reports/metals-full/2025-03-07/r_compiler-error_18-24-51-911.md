file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/repository/CollectionRepository.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/repository/CollectionRepository.java
text:
```scala
package com.lexygraphai.document.repository;

import com.lexygraphai.document.model.Collection;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class CollectionRepository {

    private final DynamoDbEnhancedClient dynamoDbClient;
    
    @Value("${aws.dynamodb.collection-table}")
    private String tableName;
    
    private DynamoDbTable<Collection> getTable() {
        return dynamoDbClient.table(tableName, TableSchema.fromBean(Collection.class));
    }
    
    public Collection save(Collection collection) {
        getTable().putItem(collection);
        return collection;
    }
    
    public Optional<Collection> findById(String userId, String collectionId) {
        return Optional.ofNullable(
                getTable().getItem(Key.builder()
                        .partitionValue(userId)
                        .sortValue(collectionId)
                        .build())
        );
    }
    
    public List<Collection> findByUserId(String userId) {
        QueryEnhancedRequest queryRequest = QueryEnhancedRequest.builder()
                .queryConditional(QueryConditional.keyEqualTo(
                        Key.builder().partitionValue(userId).build()))
                .build();
                
        return getTable().query(queryRequest).items().stream()
                .collect(Collectors.toList());
    }
    
    public void delete(String userId, String collectionId) {
        getTable().deleteItem(Key.builder()
                .partitionValue(userId)
                .sortValue(collectionId)
                .build());
    }
    
    public void incrementDocumentCount(String userId, String collectionId) {
        // Get the collection
        Collection collection = findById(userId, collectionId)
                .orElseThrow(() -> new RuntimeException("Collection not found"));
        
        // Increment the count
        collection.setDocumentCount(collection.getDocumentCount() + 1);
        
        // Save it back
        save(collection);
    }
    
    public void decrementDocumentCount(String userId, String collectionId) {
        // Get the collection
        Collection collection = findById(userId, collectionId)
                .orElseThrow(() -> new RuntimeException("Collection not found"));
        
        // Decrement the count, but don't go below zero
        collection.setDocumentCount(Math.max(0, collection.getDocumentCount() - 1));
        
        // Save it back
        save(collection);
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