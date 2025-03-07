package com.docprocessing.document.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SummaryResponse {
    private UUID documentId;
    private String summary;
    private List<String> keyPoints;
    private Float confidence;
}
