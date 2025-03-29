package com.docprocessing.document.model;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class DocumentSubmissionResponse {
    private UUID id;
    private String name;
    private String status;
    private LocalDateTime estimatedCompletionTime;
    private String statusCheckUrl;
    private UUID collectionId;
}
