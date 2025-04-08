package com.docprocessing.document.repository;

import com.docprocessing.document.model.Document;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class DocumentRepository {

    private final DynamoDbEnhancedClient dynamoDbEnhancedClient;
    
    @Value("${aws.dynamodb.documents-table}")
    private String tableName;
    
    private DynamoDbTable<Document> getTable() {
        return dynamoDbEnhancedClient.table(tableName, TableSchema.fromBean(Document.class));
    }
    
    public Document save(Document document) {
        getTable().putItem(document);
        return document;
    }
    
    public Optional<Document> findById(String id) {
        return Optional.ofNullable(getTable().getItem(Key.builder().partitionValue(id).build()));
    }
    
    public void delete(Document document) {
        getTable().deleteItem(document);
    }
    
    public List<Document> findByUserId(String userId) {
        QueryEnhancedRequest request = QueryEnhancedRequest.builder()
                .queryConditional(QueryConditional.keyEqualTo(Key.builder().partitionValue(userId).build()))
                .limit(100) // Limiting to 100 items for lambda efficiency
                .build();
        
        List<Document> result = new ArrayList<>();
        getTable().index("UserIdIndex").query(request).forEach(page -> 
            page.items().forEach(result::add)
        );
        
        return result;
    }
    
    public List<Document> findByCollectionId(String collectionId) {
        QueryEnhancedRequest request = QueryEnhancedRequest.builder()
                .queryConditional(QueryConditional.keyEqualTo(Key.builder().partitionValue(collectionId).build()))
                .limit(100) // Limiting to 100 items for lambda efficiency
                .build();
        
        List<Document> result = new ArrayList<>();
        getTable().index("CollectionIndex").query(request).forEach(page -> 
            page.items().forEach(result::add)
        );
        
        return result;
    }
    
}
