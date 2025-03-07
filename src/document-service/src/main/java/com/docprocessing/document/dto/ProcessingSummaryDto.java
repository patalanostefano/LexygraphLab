package com.lexygraphai.document.ProcessRequestDto.java;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for document processing result summary
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessingSummary {
    private String id;
    private String agentId;
    private String agentName;
    private String workflowId;
    private String workflowName;
    private String status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String outputType;
}
