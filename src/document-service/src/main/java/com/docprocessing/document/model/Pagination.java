package com.docprocessing.document.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Pagination {
    private Integer currentPage;
    private Integer totalPages;
    private Integer totalItems;
    private Integer itemsPerPage;
    private Boolean hasNextPage;
    private Boolean hasPreviousPage;
}
