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
    
    // Manual builder implementation
    public static DocumentBuilder manualBuilder() {
        return new DocumentBuilder();
    }
    
    public static class DocumentBuilder {
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
        
        public DocumentBuilder id(String id) {
            this.id = id;
            return this;
        }
        
        public DocumentBuilder userId(String userId) {
            this.userId = userId;
            return this;
        }
        
        public DocumentBuilder name(String name) {
            this.name = name;
            return this;
        }
        
        public DocumentBuilder description(String description) {
            this.description = description;
            return this;
        }
        
        public DocumentBuilder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }
        
        public DocumentBuilder updatedAt(Instant updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }
        
        public DocumentBuilder size(Long size) {
            this.size = size;
            return this;
        }
        
        public DocumentBuilder mimeType(String mimeType) {
            this.mimeType = mimeType;
            return this;
        }
        
        public DocumentBuilder s3Key(String s3Key) {
            this.s3Key = s3Key;
            return this;
        }
        
        public DocumentBuilder originalFilename(String originalFilename) {
            this.originalFilename = originalFilename;
            return this;
        }
        
        public DocumentBuilder status(DocumentStatus status) {
            this.status = status;
            return this;
        }
        
        public DocumentBuilder processingType(ProcessingType processingType) {
            this.processingType = processingType;
            return this;
        }
        
        public DocumentBuilder collectionId(String collectionId) {
            this.collectionId = collectionId;
            return this;
        }
        
        public DocumentBuilder hasSummary(Boolean hasSummary) {
            this.hasSummary = hasSummary;
            return this;
        }
        
        public DocumentBuilder hasEntities(Boolean hasEntities) {
            this.hasEntities = hasEntities;
            return this;
        }
        
        public DocumentBuilder pageCount(Integer pageCount) {
            this.pageCount = pageCount;
            return this;
        }
        
        public DocumentBuilder thumbnailKey(String thumbnailKey) {
            this.thumbnailKey = thumbnailKey;
            return this;
        }
        
        public DocumentBuilder tags(Set<String> tags) {
            this.tags = tags;
            return this;
        }
        
        public Document build() {
            Document document = new Document();
            document.setId(id);
            document.setUserId(userId);
            document.setName(name);
            document.setDescription(description);
            document.setCreatedAt(createdAt);
            document.setUpdatedAt(updatedAt);
            document.setSize(size);
            document.setMimeType(mimeType);
            document.setS3Key(s3Key);
            document.setOriginalFilename(originalFilename);
            document.setStatus(status);
            document.setProcessingType(processingType);
            document.setCollectionId(collectionId);
            document.setHasSummary(hasSummary);
            document.setHasEntities(hasEntities);
            document.setPageCount(pageCount);
            document.setThumbnailKey(thumbnailKey);
            document.setTags(tags);
            return document;
        }
    }
    
    // Factory method to create a new document - modified to use manualBuilder
    public static Document createNew(String userId, String name, String description, 
                                   String originalFilename, String mimeType, Long size, 
                                   String s3Key, ProcessingType processingType, 
                                   String collectionId) {
        return Document.manualBuilder()
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
