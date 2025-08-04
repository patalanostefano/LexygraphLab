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
        
        // Manual builder implementation
        public static DocumentSubmissionResponseBuilder manualBuilder() {
            return new DocumentSubmissionResponseBuilder();
        }
        
        public static class DocumentSubmissionResponseBuilder {
            private String id;
            private String name;
            private String status;
            private Instant estimatedCompletionTime;
            private String statusCheckUrl;
            private String collectionId;
            
            public DocumentSubmissionResponseBuilder id(String id) {
                this.id = id;
                return this;
            }
            
            public DocumentSubmissionResponseBuilder name(String name) {
                this.name = name;
                return this;
            }
            
            public DocumentSubmissionResponseBuilder status(String status) {
                this.status = status;
                return this;
            }
            
            public DocumentSubmissionResponseBuilder estimatedCompletionTime(Instant estimatedCompletionTime) {
                this.estimatedCompletionTime = estimatedCompletionTime;
                return this;
            }
            
            public DocumentSubmissionResponseBuilder statusCheckUrl(String statusCheckUrl) {
                this.statusCheckUrl = statusCheckUrl;
                return this;
            }
            
            public DocumentSubmissionResponseBuilder collectionId(String collectionId) {
                this.collectionId = collectionId;
                return this;
            }
            
            public DocumentSubmissionResponse build() {
                DocumentSubmissionResponse response = new DocumentSubmissionResponse();
                response.setId(id);
                response.setName(name);
                response.setStatus(status);
                response.setEstimatedCompletionTime(estimatedCompletionTime);
                response.setStatusCheckUrl(statusCheckUrl);
                response.setCollectionId(collectionId);
                return response;
            }
        }
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
        
        // Manual builder implementation
        public static DocumentMetadataResponseBuilder manualBuilder() {
            return new DocumentMetadataResponseBuilder();
        }
        
        public static class DocumentMetadataResponseBuilder {
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
            
            public DocumentMetadataResponseBuilder id(String id) {
                this.id = id;
                return this;
            }
            
            public DocumentMetadataResponseBuilder name(String name) {
                this.name = name;
                return this;
            }
            
            public DocumentMetadataResponseBuilder description(String description) {
                this.description = description;
                return this;
            }
            
            public DocumentMetadataResponseBuilder createdAt(Instant createdAt) {
                this.createdAt = createdAt;
                return this;
            }
            
            public DocumentMetadataResponseBuilder updatedAt(Instant updatedAt) {
                this.updatedAt = updatedAt;
                return this;
            }
            
            public DocumentMetadataResponseBuilder size(Long size) {
                this.size = size;
                return this;
            }
            
            public DocumentMetadataResponseBuilder mimeType(String mimeType) {
                this.mimeType = mimeType;
                return this;
            }
            
            public DocumentMetadataResponseBuilder status(String status) {
                this.status = status;
                return this;
            }
            
            public DocumentMetadataResponseBuilder processingType(String processingType) {
                this.processingType = processingType;
                return this;
            }
            
            public DocumentMetadataResponseBuilder collectionId(String collectionId) {
                this.collectionId = collectionId;
                return this;
            }
            
            public DocumentMetadataResponseBuilder hasSummary(Boolean hasSummary) {
                this.hasSummary = hasSummary;
                return this;
            }
            
            public DocumentMetadataResponseBuilder hasEntities(Boolean hasEntities) {
                this.hasEntities = hasEntities;
                return this;
            }
            
            public DocumentMetadataResponseBuilder pageCount(Integer pageCount) {
                this.pageCount = pageCount;
                return this;
            }
            
            public DocumentMetadataResponseBuilder thumbnailUrl(String thumbnailUrl) {
                this.thumbnailUrl = thumbnailUrl;
                return this;
            }
            
            public DocumentMetadataResponseBuilder viewUrl(String viewUrl) {
                this.viewUrl = viewUrl;
                return this;
            }
            
            public DocumentMetadataResponseBuilder tags(Set<String> tags) {
                this.tags = tags;
                return this;
            }
            
            public DocumentMetadataResponseBuilder originalFilename(String originalFilename) {
                this.originalFilename = originalFilename;
                return this;
            }
            
            public DocumentMetadataResponse build() {
                DocumentMetadataResponse response = new DocumentMetadataResponse();
                response.setId(id);
                response.setName(name);
                response.setDescription(description);
                response.setCreatedAt(createdAt);
                response.setUpdatedAt(updatedAt);
                response.setSize(size);
                response.setMimeType(mimeType);
                response.setStatus(status);
                response.setProcessingType(processingType);
                response.setCollectionId(collectionId);
                response.setHasSummary(hasSummary);
                response.setHasEntities(hasEntities);
                response.setPageCount(pageCount);
                response.setThumbnailUrl(thumbnailUrl);
                response.setViewUrl(viewUrl);
                response.setTags(tags);
                response.setOriginalFilename(originalFilename);
                return response;
            }
        }
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
        
        // Manual builder implementation
        public static DocumentUpdateRequestBuilder manualBuilder() {
            return new DocumentUpdateRequestBuilder();
        }
        
        public static class DocumentUpdateRequestBuilder {
            private String name;
            private String description;
            private String collectionId;
            private Set<String> tags;
            
            public DocumentUpdateRequestBuilder name(String name) {
                this.name = name;
                return this;
            }
            
            public DocumentUpdateRequestBuilder description(String description) {
                this.description = description;
                return this;
            }
            
            public DocumentUpdateRequestBuilder collectionId(String collectionId) {
                this.collectionId = collectionId;
                return this;
            }
            
            public DocumentUpdateRequestBuilder tags(Set<String> tags) {
                this.tags = tags;
                return this;
            }
            
            public DocumentUpdateRequest build() {
                DocumentUpdateRequest request = new DocumentUpdateRequest();
                request.setName(name);
                request.setDescription(description);
                request.setCollectionId(collectionId);
                request.setTags(tags);
                return request;
            }
        }
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentUrlResponse {
        private String url;
        private Instant expiresAt;
        private String filename;
        
        // Manual builder implementation
        public static DocumentUrlResponseBuilder manualBuilder() {
            return new DocumentUrlResponseBuilder();
        }
        
        public static class DocumentUrlResponseBuilder {
            private String url;
            private Instant expiresAt;
            private String filename;
            
            public DocumentUrlResponseBuilder url(String url) {
                this.url = url;
                return this;
            }
            
            public DocumentUrlResponseBuilder expiresAt(Instant expiresAt) {
                this.expiresAt = expiresAt;
                return this;
            }
            
            public DocumentUrlResponseBuilder filename(String filename) {
                this.filename = filename;
                return this;
            }
            
            public DocumentUrlResponse build() {
                DocumentUrlResponse response = new DocumentUrlResponse();
                response.setUrl(url);
                response.setExpiresAt(expiresAt);
                response.setFilename(filename);
                return response;
            }
        }
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
        
        // Manual builder implementation
        public static ProcessingStatusResponseBuilder manualBuilder() {
            return new ProcessingStatusResponseBuilder();
        }
        
        public static class ProcessingStatusResponseBuilder {
            private String documentId;
            private String status;
            private String currentStep;
            private Integer progress;
            private Instant estimatedCompletionTime;
            private List<String> completedSteps;
            private Long elapsedTime;
            private String error;
            
            public ProcessingStatusResponseBuilder documentId(String documentId) {
                this.documentId = documentId;
                return this;
            }
            
            public ProcessingStatusResponseBuilder status(String status) {
                this.status = status;
                return this;
            }
            
            public ProcessingStatusResponseBuilder currentStep(String currentStep) {
                this.currentStep = currentStep;
                return this;
            }
            
            public ProcessingStatusResponseBuilder progress(Integer progress) {
                this.progress = progress;
                return this;
            }
            
            public ProcessingStatusResponseBuilder estimatedCompletionTime(Instant estimatedCompletionTime) {
                this.estimatedCompletionTime = estimatedCompletionTime;
                return this;
            }
            
            public ProcessingStatusResponseBuilder completedSteps(List<String> completedSteps) {
                this.completedSteps = completedSteps;
                return this;
            }
            
            public ProcessingStatusResponseBuilder elapsedTime(Long elapsedTime) {
                this.elapsedTime = elapsedTime;
                return this;
            }
            
            public ProcessingStatusResponseBuilder error(String error) {
                this.error = error;
                return this;
            }
            
            public ProcessingStatusResponse build() {
                ProcessingStatusResponse response = new ProcessingStatusResponse();
                response.setDocumentId(documentId);
                response.setStatus(status);
                response.setCurrentStep(currentStep);
                response.setProgress(progress);
                response.setEstimatedCompletionTime(estimatedCompletionTime);
                response.setCompletedSteps(completedSteps);
                response.setElapsedTime(elapsedTime);
                response.setError(error);
                return response;
            }
        }
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
        
        // Manual builder implementation
        public static ExtractedTextResponseBuilder manualBuilder() {
            return new ExtractedTextResponseBuilder();
        }
        
        public static class ExtractedTextResponseBuilder {
            private String documentId;
            private Integer page;
            private Integer totalPages;
            private String format;
            private String language;
            private String content;
            private String nextPageUrl;
            private String previousPageUrl;
            
            public ExtractedTextResponseBuilder documentId(String documentId) {
                this.documentId = documentId;
                return this;
            }
            
            public ExtractedTextResponseBuilder page(Integer page) {
                this.page = page;
                return this;
            }
            
            public ExtractedTextResponseBuilder totalPages(Integer totalPages) {
                this.totalPages = totalPages;
                return this;
            }
            
            public ExtractedTextResponseBuilder format(String format) {
                this.format = format;
                return this;
            }
            
            public ExtractedTextResponseBuilder language(String language) {
                this.language = language;
                return this;
            }
            
            public ExtractedTextResponseBuilder content(String content) {
                this.content = content;
                return this;
            }
            
            public ExtractedTextResponseBuilder nextPageUrl(String nextPageUrl) {
                this.nextPageUrl = nextPageUrl;
                return this;
            }
            
            public ExtractedTextResponseBuilder previousPageUrl(String previousPageUrl) {
                this.previousPageUrl = previousPageUrl;
                return this;
            }
            
            public ExtractedTextResponse build() {
                ExtractedTextResponse response = new ExtractedTextResponse();
                response.setDocumentId(documentId);
                response.setPage(page);
                response.setTotalPages(totalPages);
                response.setFormat(format);
                response.setLanguage(language);
                response.setContent(content);
                response.setNextPageUrl(nextPageUrl);
                response.setPreviousPageUrl(previousPageUrl);
                return response;
            }
        }
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
        
        // Manual builder implementation
        public static SummaryResponseBuilder manualBuilder() {
            return new SummaryResponseBuilder();
        }
        
        public static class SummaryResponseBuilder {
            private String documentId;
            private String summary;
            private List<String> keyPoints;
            private Float confidence;
            
            public SummaryResponseBuilder documentId(String documentId) {
                this.documentId = documentId;
                return this;
            }
            
            public SummaryResponseBuilder summary(String summary) {
                this.summary = summary;
                return this;
            }
            
            public SummaryResponseBuilder keyPoints(List<String> keyPoints) {
                this.keyPoints = keyPoints;
                return this;
            }
            
            public SummaryResponseBuilder confidence(Float confidence) {
                this.confidence = confidence;
                return this;
            }
            
            public SummaryResponse build() {
                SummaryResponse response = new SummaryResponse();
                response.setDocumentId(documentId);
                response.setSummary(summary);
                response.setKeyPoints(keyPoints);
                response.setConfidence(confidence);
                return response;
            }
        }
    }
}
