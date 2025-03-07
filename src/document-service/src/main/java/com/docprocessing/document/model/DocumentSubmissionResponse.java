package com.docprocessing.document.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentSubmissionResponse {
    private UUID id;
    private String name;
    private String status;
    private Instant estimatedCompletionTime;
    private String statusCheckUrl;
    private UUID collectionId;
}
