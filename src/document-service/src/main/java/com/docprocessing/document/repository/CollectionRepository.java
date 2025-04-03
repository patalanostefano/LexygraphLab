package com.docprocessing.document.repository;

import com.docprocessing.document.model.Collection;
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
public class CollectionRepository {

    private final DynamoDbEnhancedClient dynamoDbEnhancedClient;
    
    @Value("${aws.dynamodb.collections-table}")
    private String tableName;
    
    private DynamoDbTable<Collection> getTable() {
        return dynamoDbEnhancedClient.table(tableName, TableSchema.fromBean(Collection.class));
    }
    
    public Collection save(Collection collection) {
        getTable().putItem(collection);
        return collection;
    }
    
    public Optional<Collection> findById(String id) {
        return Optional.ofNullable(getTable().getItem(Key.builder().partitionValue(id).build()));
    }
    
    public void delete(Collection collection) {
        getTable().deleteItem(collection);
    }
    
    public List<Collection> findByUserId(String userId) {
        QueryEnhancedRequest request = QueryEnhancedRequest.builder()
                .queryConditional(QueryConditional.keyEqualTo(Key.builder().partitionValue(userId).build()))
                .limit(100) // Limiting to 100 items for lambda efficiency
                .build();
        
        List<Collection> result = new ArrayList<>();
        getTable().index("UserIdIndex").query(request).forEach(page -> 
            page.items().forEach(result::add)
        );
        
        return result;
    }
    
}
