package com.lexygraphai.document.ProcessRequestDto.java;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Data Transfer Object for document summary information
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentSummary {
    private String id;
    private String name;
    private LocalDateTime uploadDate;
    private Long size;
    private String mimeType;
    private String status;
    private List<String> tags;
    private String collectionId;
    private String briefSummary;
}
