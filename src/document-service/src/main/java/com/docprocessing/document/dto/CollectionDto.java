package com.docprocessing.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

public class CollectionDto {
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CollectionRequest {
        private String name;
        private String description;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CollectionResponse {
        private String id;
        private String name;
        private String description;
        private Integer documentCount;
        private Instant createdAt;
        private Instant updatedAt;
        private String ownerId;
        private String thumbnailUrl;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CollectionDocumentsResponse {
        private List<DocumentDto.DocumentMetadataResponse> documents;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CollectionUpdateRequest {
        private String name;
        private String description;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CollectionListResponse {
        private List<CollectionResponse> collections;
    }
}
