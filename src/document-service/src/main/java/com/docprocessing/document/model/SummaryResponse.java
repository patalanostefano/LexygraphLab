package com.docprocessing.document.model;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class SummaryResponse {
    private UUID documentId;
    private String summary;
    private List<String> keyPoints;
    private Float confidence;
}
