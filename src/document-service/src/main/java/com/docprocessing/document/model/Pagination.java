package com.docprocessing.document.model;

import lombok.Data;

@Data
public class Pagination {
    private Integer currentPage;
    private Integer totalPages;
    private Integer totalItems;
    private Integer itemsPerPage;
    private Boolean hasNextPage;
    private Boolean hasPreviousPage;
}
