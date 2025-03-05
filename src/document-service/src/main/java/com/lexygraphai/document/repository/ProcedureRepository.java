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
