package com.docprocessing.document.model;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class DocumentMetadata {
    private UUID id;
    private String name;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long size;
    private String mimeType;
    private String status;
    private String processingType;
    private UUID collectionId;
    private Boolean hasSummary;
    private Boolean hasEntities;
    private Integer pageCount;
    private String thumbnailUrl;
    private String viewUrl;
    private List<String> tags;
    private String originalFilename;
    private String userId;
}
