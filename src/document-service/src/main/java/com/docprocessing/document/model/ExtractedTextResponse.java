package com.docprocessing.document.model;

import lombok.Data;

import java.util.UUID;

@Data
public class ExtractedTextResponse {
    private UUID documentId;
    private Integer page;
    private Integer totalPages;
    private String format;
    private String language;
    private String content;
    private String nextPageUrl;
    private String previousPageUrl;
}
