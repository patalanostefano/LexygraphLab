package com.docprocessing.document.model;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class ProcessingStatusResponse {
    private UUID documentId;
    private String status;
    private String currentStep;
    private Integer progress;
    private LocalDateTime estimatedCompletionTime;
    private List<String> completedSteps;
    private Integer elapsedTime;
    private String error;
}
