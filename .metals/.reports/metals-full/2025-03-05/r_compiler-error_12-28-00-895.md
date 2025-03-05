file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/repository/DocumentChunkRepository.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/repository/DocumentChunkRepository.java
text:
```scala
package com.lexygraphai.document.repository;

import com.lexygraphai.document.model.DocumentChunk;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.core.pagination.sync.SdkIterable;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.Page;
import software.amazon.awssdk.enhanced.dynamodb.model.PageIterable;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class DocumentChunkRepository {

    private final DynamoDbEnhancedClient dynamoDbClient;
    
    @Value("${aws.dynamodb.chunk-table}")
    private String tableName;
    
    private DynamoDbTable<DocumentChunk> getTable() {
        return dynamoDbClient.table(tableName, TableSchema.fromBean(DocumentChunk.class));
    }
    
    public DocumentChunk save(DocumentChunk chunk) {
        getTable().putItem(chunk);
        return chunk;
    }
    
    public void saveAll(List<DocumentChunk> chunks) {
        DynamoDbTable<DocumentChunk> table = getTable();
        
        // DynamoDB doesn't have a native batch save, so we need to loop
        // In a production system, you would use the DynamoDB batch write API
        for (DocumentChunk chunk : chunks) {
            table.putItem(chunk);
        }
    }
    
    public Optional<DocumentChunk> findById(String documentId, String chunkId) {
        return Optional.ofNullable(
                getTable().getItem(Key.builder()
                        .partitionValue(documentId)
                        .sortValue(chunkId)
                        .build())
        );
    }
    
    public List<DocumentChunk> findByDocumentId(String documentId) {
        QueryEnhancedRequest queryRequest = QueryEnhancedRequest.builder()
                .queryConditional(QueryConditional.keyEqualTo(
                        Key.builder().partitionValue(documentId).build()))
                .build();
                
        return getTable().query(queryRequest).items().stream()
                .collect(Collectors.toList());
    }
    
    public List<DocumentChunk> findByUserId(String userId) {
        SdkIterable<Page<DocumentChunk>> results = getTable().index("UserChunksIndex")
                .query(QueryEnhancedRequest.builder()
                        .queryConditional(QueryConditional.keyEqualTo(
                                Key.builder().partitionValue(userId).build()))
                        .build());
                
        return PageIterable.create(results).items().stream()
                .collect(Collectors.toList());
    }
    
    public void deleteByDocumentId(String documentId) {
        DynamoDbTable<DocumentChunk> table = getTable();
        
        // Find all chunks for this document
        List<DocumentChunk> chunks = findByDocumentId(documentId);
        
        // Delete each chunk
        for (DocumentChunk chunk : chunks) {
            table.deleteItem(Key.builder()
                    .partitionValue(documentId)
                    .sortValue(chunk.getChunkId())
                    .build());
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