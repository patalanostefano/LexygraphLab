package com.lexygraphai.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response for a document processing request
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessResponse {
    private String processId;
    private String documentId;
    private String status;
    private LocalDateTime startTime;
    private LocalDateTime estimatedCompletionTime;
    private String statusCheckUrl;
}
