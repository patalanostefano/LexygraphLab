package com.lexygraphai.document.dto;

import lombok.Data;

@Data
public class DocumentChunkDto {
    private String id;
    private String documentId;
    private String content;
    private String section;
    private Integer pageNumber;
    private Integer order;
}
