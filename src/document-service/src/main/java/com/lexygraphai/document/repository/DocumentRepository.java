package com.lexygraphai.document.repository;

import com.lexygraphai.document.model.Document;
import com.lexygraphai.document.model.DocumentStatus;
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
public class DocumentRepository {

    private final DynamoDbEnhancedClient dynamoDbClient;
    
    @Value("${aws.dynamodb.document-table}")
    private String tableName;
    
    private DynamoDbTable<Document> getTable() {
        return dynamoDbClient.table(tableName, TableSchema.fromBean(Document.class));
    }
    
    public Document save(Document document) {
        getTable().putItem(document);
        return document;
    }
    
    public Optional<Document> findById(String userId, String documentId) {
        return Optional.ofNullable(
                getTable().getItem(Key.builder()
                        .partitionValue(userId)
                        .sortValue(documentId)
                        .build())
        );
    }
    
    public List<Document> findByUserId(String userId) {
        QueryEnhancedRequest queryRequest = QueryEnhancedRequest.builder()
                .queryConditional(QueryConditional.keyEqualTo(
                        Key.builder().partitionValue(userId).build()))
                .build();
                
        return getTable().query(queryRequest).items().stream().collect(Collectors.toList());
    }
    
    public List<Document> findByUserIdAndStatus(String userId, DocumentStatus status) {
        QueryEnhancedRequest queryRequest = QueryEnhancedRequest.builder()
                .queryConditional(QueryConditional.keyEqualTo(
                        Key.builder().partitionValue(userId).build()))
                .filterExpression(builder -> builder.expression("status = :status")
                        .putExpressionValue(":status", 
                            software.amazon.awssdk.enhanced.dynamodb.Expression
                                .builder().expression(status.name()).build()))
                .build();

        return getTable().query(queryRequest).items().stream().collect(Collectors.toList());
    }
    
    public List<Document> findByCollectionId(String collectionId) {
        DynamoDbTable<Document> documentTable = getTable();
        SdkIterable<Page<Document>> results = documentTable.index("CollectionIndex")
                .query(QueryEnhancedRequest.builder()
                        .queryConditional(QueryConditional.keyEqualTo(
                                Key.builder().partitionValue(collectionId).build()))
                        .build());
                
        return PageIterable.create(results)
                .items().stream().collect(Collectors.toList());
    }
    
    public List<Document> findByProcedureId(String procedureId) {
        DynamoDbTable<Document> documentTable = getTable();
        SdkIterable<Page<Document>> results = documentTable.index("ProcedureIndex")
                .query(QueryEnhancedRequest.builder()
                        .queryConditional(QueryConditional.keyEqualTo(
                                Key.builder().partitionValue(procedureId).build()))
                        .build());
                
        return PageIterable.create(results)
                .items().stream().collect(Collectors.toList());
    }
    
    public void delete(String userId, String documentId) {
        getTable().deleteItem(Key.builder()
                .partitionValue(userId)
                .sortValue(documentId)
                .build());
    }
    
    public long countByCollectionId(String collectionId) {
        SdkIterable<Page<Document>> results = getTable().index("CollectionIndex")
                .query(QueryEnhancedRequest.builder()
                        .queryConditional(QueryConditional.keyEqualTo(
                                Key.builder().partitionValue(collectionId).build()))
                        .build());
        
        return PageIterable.create(results).items().stream().count();
    }
}
