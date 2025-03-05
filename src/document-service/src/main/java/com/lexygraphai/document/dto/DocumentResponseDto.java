package com.lexygraphai.document.ProcessRequestDto.java;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Data Transfer Object for document details
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {
    private String id;
    private String name;
    private String description;
    private LocalDateTime uploadDate;
    private LocalDateTime lastModifiedDate;
    private Long size;
    private String mimeType;
    private String status;
    private List<String> tags;
    private String collectionId;
    private String procedureId;
    private String summary;
    private List<ProcessingSummary> processingResults;
}
