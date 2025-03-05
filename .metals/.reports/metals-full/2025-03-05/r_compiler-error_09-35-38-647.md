file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/repository/ProcedureRepository.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/repository/ProcedureRepository.java
text:
```scala
package com.lexygraphai.document.repository;

import com.lexygraphai.document.model.Procedure;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class ProcedureRepository {

    private final DynamoDbEnhancedClient dynamoDbClient;
    
    @Value("${aws.dynamodb.procedure-table}")
    private String tableName;
    
    private DynamoDbTable<Procedure> getTable() {
        return dynamoDbClient.table(tableName, TableSchema.fromBean(Procedure.class));
    }
    
    public Procedure save(Procedure procedure) {
        getTable().putItem(procedure);
        return procedure;
    }
    
    public Optional<Procedure> findById(String userId, String procedureId) {
        return Optional.ofNullable(
                getTable().getItem(Key.builder()
                        .partitionValue(userId)
                        .sortValue(procedureId)
                        .build())
        );
    }
    
    public List<Procedure> findByUserId(String userId) {
        QueryEnhancedRequest queryRequest = QueryEnhancedRequest.builder()
                .queryConditional(QueryConditional.keyEqualTo(
                        Key.builder().partitionValue(userId).build()))
                .build();
                
        return getTable().query(queryRequest).items().stream()
                .collect(Collectors.toList());
    }
    
    public void delete(String userId, String procedureId) {
        getTable().deleteItem(Key.builder()
                .partitionValue(userId)
                .sortValue(procedureId)
                .build());
    }
    
    public void addDocumentToProcedure(String userId, String procedureId, String documentId) {
        // Get the procedure
        Procedure procedure = findById(userId, procedureId)
                .orElseThrow(() -> new RuntimeException("Procedure not found"));
        
        // Add document to the set
        if (procedure.getDocumentIds() == null) {
            procedure.setDocumentIds(new HashSet<>());
        }
        procedure.getDocumentIds().add(documentId);
        
        // Save it back
        save(procedure);
    }
    
    public void removeDocumentFromProcedure(String userId, String procedureId, String documentId) {
        // Get the procedure
        Procedure procedure = findById(userId, procedureId)
                .orElseThrow(() -> new RuntimeException("Procedure not found"));
        
        // Remove document from the set
        if (procedure.getDocumentIds() != null) {
            procedure.getDocumentIds().remove(documentId);
        }
        
        // Save it back
        save(procedure);
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