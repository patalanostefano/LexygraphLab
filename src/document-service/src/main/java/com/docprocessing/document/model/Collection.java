package com.docprocessing.document.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSecondaryPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class Collection {
    
    private String id;
    private String userId;
    private String name;
    private String description;
    private Integer documentCount;
    private Instant createdAt;
    private Instant updatedAt;
    
    @DynamoDbPartitionKey
    public String getId() {
        return id;
    }
    
    @DynamoDbSecondaryPartitionKey(indexNames = "UserIdIndex")
    public String getUserId() {
        return userId;
    }
    
    @DynamoDbSortKey
    public Instant getCreatedAt() {
        return createdAt;
    }
    
    // Factory method to create a new collection
    public static Collection createNew(String userId, String name, String description) {
        return Collection.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .name(name)
                .description(description)
                .documentCount(0)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }
}
