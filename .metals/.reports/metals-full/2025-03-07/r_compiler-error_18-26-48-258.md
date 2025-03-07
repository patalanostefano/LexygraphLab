file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/repository/CollectionRepositoryImpl.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/repository/CollectionRepositoryImpl.java
text:
```scala
package com.docprocessing.document.repository;

import com.docprocessing.document.model.Collection;
import com.docprocessing.document.model.DocumentBatchResponse;
import com.docprocessing.document.model.Pagination;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
@Slf4j
public class CollectionRepositoryImpl implements CollectionRepository {

    private final DynamoDbEnhancedClient dynamoDbEnhancedClient;
    
    @Value("${aws.dynamodb.collections-table}")
    private String collectionsTable;

    @Override
    public Collection save(Collection collection) {
        DynamoDbTable<Collection> table = getCollectionsTable();
        table.putItem(collection);
        return collection;
    }

    @Override
    public Optional<Collection> findById(UUID id) {
        // This operation requires scanning or a well-designed GSI
        // For simplicity, we'll do a full scan
        DynamoDbTable<Collection> table = getCollectionsTable();
        
        List<Collection> allCollections = new ArrayList<>();
        table.scan().items().forEach(allCollections::add);
        
        return allCollections.stream()
                .filter(c -> id.equals(c.getId()))
                .findFirst();
    }

    @Override
    public void delete(Collection collection) {
        DynamoDbTable<Collection> table = getCollectionsTable();
        Key key = Key.builder()
                .partitionValue(collection.getPK())
                .sortValue(collection.getSK())
                .build();
        table.deleteItem(key);
    }

    @Override
    public DocumentBatchResponse findAllByUserId(String userId, int page, int limit) {
        DynamoDbTable<Collection> table = getCollectionsTable();
        
        QueryConditional queryConditional = QueryConditional
                .keyEqualTo(Key.builder()
                        .partitionValue("user#" + userId)
                        .build());
        
        // Query for collections by user ID
        QueryEnhancedRequest queryRequest = QueryEnhancedRequest.builder()
                .queryConditional(queryConditional)
                .build();
        
        List<Collection> allCollections = new ArrayList<>();
        table.query(queryRequest).items().forEach(allCollections::add);
        
        // Apply pagination
        int totalItems = allCollections.size();
        int totalPages = (int) Math.ceil((double) totalItems / limit);
        int startIndex = (page - 1) * limit;
        int endIndex = Math.min(startIndex + limit, totalItems);
        
        List<Collection> pageCollections;
        if (startIndex >= totalItems) {
            pageCollections = new ArrayList<>();
        } else {
            pageCollections = allCollections.subList(startIndex, endIndex);
        }
        
        Pagination pagination = Pagination.builder()
                .currentPage(page)
                .totalPages(totalPages)
                .totalItems(totalItems)
                .itemsPerPage(limit)
                .hasNextPage(page < totalPages)
                .hasPreviousPage(page > 1)
                .build();
        
        return DocumentBatchResponse.builder()
                .documents(pageCollections)
                .pagination(pagination)
                .build();
    }

    @Override
    public void incrementDocumentCount(UUID collectionId) {
        findById(collectionId).ifPresent(collection -> {
            Integer currentCount = collection.getDocumentCount();
            collection.setDocumentCount(currentCount != null ? currentCount + 1 : 1);
            save(collection);
        });
    }

    @Override
    public void decrementDocumentCount(UUID collectionId) {
        findById(collectionId).ifPresent(collection -> {
            Integer currentCount = collection.getDocumentCount();
            if (currentCount != null && currentCount > 0) {
                collection.setDocumentCount(currentCount - 1);
                save(collection);
            }
        });
    }
    
    private DynamoDbTable<Collection> getCollectionsTable() {
        return dynamoDbEnhancedClient.table(collectionsTable, TableSchema.fromBean(Collection.class));
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