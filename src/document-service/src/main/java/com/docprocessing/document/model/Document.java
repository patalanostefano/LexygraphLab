package com.docprocessing.document.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Document {
    private UUID id;
    private String name;
    private String description;
    private String userId;
    private UUID collectionId;
    private String status;
    private String mimeType;
    private Long size;
    private Instant uploadedAt;
    private Instant updatedAt;
    private String processingType;
    private Integer pageCount;
    private String language;
    private Boolean hasEntities;
    private Boolean hasSummary;
    private List<String> tags;
    private String originalFilename;
    
    @JsonIgnore
    private String fileKey;
    
    private String thumbnailUrl;
    
    private ProcessingDetails processingDetails;
    private Content content;
    
    @DynamoDbPartitionKey
    @JsonIgnore
    public String getPK() {
        return "doc#" + id.toString();
    }
    
    @DynamoDbSortKey
    @JsonIgnore
    public String getSK() {
        return "metadata";
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProcessingDetails {
        private String contentType;
        private String language;
        private Float confidence;
        private String extractionMethod;
        private Long processingTime;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Content {
        private String preview;
        private String summaryPreview;
        private String downloadUrl;
    }
}
