package com.docprocessing.document.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProcessingStatusResponse {
    private UUID documentId;
    private String status;
    private String currentStep;
    private Integer progress;
    private Instant estimatedCompletionTime;
    private List<String> completedSteps;
    private Long elapsedTime;
    private String error;
}
