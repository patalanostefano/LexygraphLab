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
    
    // Manual builder implementation since Lombok isn't working properly
    public static CollectionBuilder manualBuilder() {
        return new CollectionBuilder();
    }
    
    public static class CollectionBuilder {
        private String id;
        private String userId;
        private String name;
        private String description;
        private Integer documentCount;
        private Instant createdAt;
        private Instant updatedAt;
        
        public CollectionBuilder id(String id) {
            this.id = id;
            return this;
        }
        
        public CollectionBuilder userId(String userId) {
            this.userId = userId;
            return this;
        }
        
        public CollectionBuilder name(String name) {
            this.name = name;
            return this;
        }
        
        public CollectionBuilder description(String description) {
            this.description = description;
            return this;
        }
        
        public CollectionBuilder documentCount(Integer documentCount) {
            this.documentCount = documentCount;
            return this;
        }
        
        public CollectionBuilder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }
        
        public CollectionBuilder updatedAt(Instant updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }
        
        public Collection build() {
            Collection collection = new Collection();
            collection.setId(id);
            collection.setUserId(userId);
            collection.setName(name);
            collection.setDescription(description);
            collection.setDocumentCount(documentCount);
            collection.setCreatedAt(createdAt);
            collection.setUpdatedAt(updatedAt);
            return collection;
        }
    }
    
    // Factory method to create a new collection - modified to use manualBuilder
    public static Collection createNew(String userId, String name, String description) {
        return Collection.manualBuilder()
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
