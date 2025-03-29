package com.docprocessing.document.model;

import lombok.Data;
import java.util.List;

@Data
public class DocumentBatchResponse {
    private List<?> documents;
    private Pagination pagination;
}
