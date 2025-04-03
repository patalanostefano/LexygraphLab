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
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class Document {
    
    private String id;
    private String userId;
    private String name;
    private String description;
    private Instant createdAt;
    private Instant updatedAt;
    private Long size;
    private String mimeType;
    private String s3Key;
    private String originalFilename;
    private DocumentStatus status;
    private ProcessingType processingType;
    private String collectionId;
    private Boolean hasSummary;
    private Boolean hasEntities;
    private Integer pageCount;
    private String thumbnailKey;
    private Set<String> tags;
    
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
    
    @DynamoDbSecondaryPartitionKey(indexNames = "CollectionIndex")
    public String getCollectionId() {
        return collectionId;
    }
    
    public enum DocumentStatus {
        QUEUED, PARSING, PROCESSING, OCR_PROCESSING, TEXT_EXTRACTION, SUMMARIZING, COMPLETED, FAILED
    }
    
    public enum ProcessingType {
        TEXT, TABLE, IMAGE, HANDWRITTEN, COMPLEX
    }
    
    // Factory method to create a new document
    public static Document createNew(String userId, String name, String description, 
                                   String originalFilename, String mimeType, Long size, 
                                   String s3Key, ProcessingType processingType, 
                                   String collectionId) {
        return Document.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .name(name != null ? name : originalFilename)
                .description(description)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .size(size)
                .mimeType(mimeType)
                .s3Key(s3Key)
                .originalFilename(originalFilename)
                .status(DocumentStatus.QUEUED)
                .processingType(processingType)
                .collectionId(collectionId)
                .hasSummary(false)
                .hasEntities(false)
                .build();
    }
}
