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
        
        // Manual builder implementation
        public static CollectionRequestBuilder manualBuilder() {
            return new CollectionRequestBuilder();
        }
        
        public static class CollectionRequestBuilder {
            private String name;
            private String description;
            
            public CollectionRequestBuilder name(String name) {
                this.name = name;
                return this;
            }
            
            public CollectionRequestBuilder description(String description) {
                this.description = description;
                return this;
            }
            
            public CollectionRequest build() {
                CollectionRequest request = new CollectionRequest();
                request.setName(name);
                request.setDescription(description);
                return request;
            }
        }
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
        
        // Manual builder implementation
        public static CollectionResponseBuilder manualBuilder() {
            return new CollectionResponseBuilder();
        }
        
        public static class CollectionResponseBuilder {
            private String id;
            private String name;
            private String description;
            private Integer documentCount;
            private Instant createdAt;
            private Instant updatedAt;
            private String ownerId;
            private String thumbnailUrl;
            
            public CollectionResponseBuilder id(String id) {
                this.id = id;
                return this;
            }
            
            public CollectionResponseBuilder name(String name) {
                this.name = name;
                return this;
            }
            
            public CollectionResponseBuilder description(String description) {
                this.description = description;
                return this;
            }
            
            public CollectionResponseBuilder documentCount(Integer documentCount) {
                this.documentCount = documentCount;
                return this;
            }
            
            public CollectionResponseBuilder createdAt(Instant createdAt) {
                this.createdAt = createdAt;
                return this;
            }
            
            public CollectionResponseBuilder updatedAt(Instant updatedAt) {
                this.updatedAt = updatedAt;
                return this;
            }
            
            public CollectionResponseBuilder ownerId(String ownerId) {
                this.ownerId = ownerId;
                return this;
            }
            
            public CollectionResponseBuilder thumbnailUrl(String thumbnailUrl) {
                this.thumbnailUrl = thumbnailUrl;
                return this;
            }
            
            public CollectionResponse build() {
                CollectionResponse response = new CollectionResponse();
                response.setId(id);
                response.setName(name);
                response.setDescription(description);
                response.setDocumentCount(documentCount);
                response.setCreatedAt(createdAt);
                response.setUpdatedAt(updatedAt);
                response.setOwnerId(ownerId);
                response.setThumbnailUrl(thumbnailUrl);
                return response;
            }
        }
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CollectionDocumentsResponse {
        private List<DocumentDto.DocumentMetadataResponse> documents;
        
        // Manual builder implementation
        public static CollectionDocumentsResponseBuilder manualBuilder() {
            return new CollectionDocumentsResponseBuilder();
        }
        
        public static class CollectionDocumentsResponseBuilder {
            private List<DocumentDto.DocumentMetadataResponse> documents;
            
            public CollectionDocumentsResponseBuilder documents(List<DocumentDto.DocumentMetadataResponse> documents) {
                this.documents = documents;
                return this;
            }
            
            public CollectionDocumentsResponse build() {
                CollectionDocumentsResponse response = new CollectionDocumentsResponse();
                response.setDocuments(documents);
                return response;
            }
        }
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CollectionUpdateRequest {
        private String name;
        private String description;
        
        // Manual builder implementation
        public static CollectionUpdateRequestBuilder manualBuilder() {
            return new CollectionUpdateRequestBuilder();
        }
        
        public static class CollectionUpdateRequestBuilder {
            private String name;
            private String description;
            
            public CollectionUpdateRequestBuilder name(String name) {
                this.name = name;
                return this;
            }
            
            public CollectionUpdateRequestBuilder description(String description) {
                this.description = description;
                return this;
            }
            
            public CollectionUpdateRequest build() {
                CollectionUpdateRequest request = new CollectionUpdateRequest();
                request.setName(name);
                request.setDescription(description);
                return request;
            }
        }
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CollectionListResponse {
        private List<CollectionResponse> collections;
        
        // Manual builder implementation
        public static CollectionListResponseBuilder manualBuilder() {
            return new CollectionListResponseBuilder();
        }
        
        public static class CollectionListResponseBuilder {
            private List<CollectionResponse> collections;
            
            public CollectionListResponseBuilder collections(List<CollectionResponse> collections) {
                this.collections = collections;
                return this;
            }
            
            public CollectionListResponse build() {
                CollectionListResponse response = new CollectionListResponse();
                response.setCollections(collections);
                return response;
            }
        }
    }
}
