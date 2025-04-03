package com.docprocessing.document.dto;

import com.docprocessing.document.model.Document;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Set;

public class DocumentDto {
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentSubmissionResponse {
        private String id;
        private String name;
        private String status;
        private Instant estimatedCompletionTime;
        private String statusCheckUrl;
        private String collectionId;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentMetadataResponse {
        private String id;
        private String name;
        private String description;
        private Instant createdAt;
        private Instant updatedAt;
        private Long size;
        private String mimeType;
        private String status;
        private String processingType;
        private String collectionId;
        private Boolean hasSummary;
        private Boolean hasEntities;
        private Integer pageCount;
        private String thumbnailUrl;
        private String viewUrl;
        private Set<String> tags;
        private String originalFilename;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentUpdateRequest {
        private String name;
        private String description;
        private String collectionId;
        private Set<String> tags;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentUrlResponse {
        private String url;
        private Instant expiresAt;
        private String filename;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProcessingStatusResponse {
        private String documentId;
        private String status;
        private String currentStep;
        private Integer progress;
        private Instant estimatedCompletionTime;
        private List<String> completedSteps;
        private Long elapsedTime;
        private String error;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExtractedTextResponse {
        private String documentId;
        private Integer page;
        private Integer totalPages;
        private String format;
        private String language;
        private String content;
        private String nextPageUrl;
        private String previousPageUrl;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SummaryResponse {
        private String documentId;
        private String summary;
        private List<String> keyPoints;
        private Float confidence;
    }
}
