package com.lexygraphai.document.service;

import org.springframework.data.domain.Page;

import com.lexygraphai.document.ProcessRequestDto.java.CollectionRequest;
import com.lexygraphai.document.ProcessRequestDto.java.CollectionResponse;

import java.util.UUID;

public interface CollectionService {

    /**
     * Create a new document collection
     * 
     * @param request The collection request data
     * @return The created collection
     */
    CollectionResponse createCollection(CollectionRequest request);
    
    /**
     * Find all collections with pagination
     * 
     * @param page Page number
     * @param size Page size
     * @return Paged list of collections
     */
    Page<CollectionResponse> findCollections(int page, int size);
    
    /**
     * Get a collection by ID
     * 
     * @param collectionId The collection ID
     * @return The collection
     */
    CollectionResponse getCollectionById(UUID collectionId);
}
