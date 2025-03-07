package com.docprocessing.document.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
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
