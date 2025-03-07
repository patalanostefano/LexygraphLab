package com.docprocessing.document.repository;

import com.docprocessing.document.model.Collection;
import com.docprocessing.document.model.DocumentBatchResponse;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CollectionRepository {
    Collection save(Collection collection);
    Optional<Collection> findById(UUID id);
    void delete(Collection collection);
    DocumentBatchResponse findAllByUserId(String userId, int page, int limit);
    void incrementDocumentCount(UUID collectionId);
    void decrementDocumentCount(UUID collectionId);
}
