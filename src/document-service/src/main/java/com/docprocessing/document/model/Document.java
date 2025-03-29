package com.docprocessing.document.model;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
public class Document extends DocumentMetadata {
    private Map<String, Object> processingDetails;
    private Map<String, String> content;
}
