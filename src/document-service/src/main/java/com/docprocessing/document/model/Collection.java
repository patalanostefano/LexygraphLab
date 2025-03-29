package com.docprocessing.document.model;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class Collection {
    private UUID id;
    
    @NotBlank(message = "Collection name is required")
    private String name;
    
    private String description;
    private Integer documentCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String ownerId;
    private String thumbnailUrl;
}
