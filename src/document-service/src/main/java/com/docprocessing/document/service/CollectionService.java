package com.docprocessing.document.service;

import com.docprocessing.document.model.Collection;
import com.docprocessing.document.model.DocumentBatchResponse;

import java.util.Map;
import java.util.UUID;

public interface CollectionService {
    DocumentBatchResponse listCollections(String userId, int page, int limit);
    
    Collection createCollection(String userId, Collection collection);
    
    Collection getCollection(String userId, UUID collectionId);
    
    Collection updateCollection(String userId, UUID collectionId, Collection collectionUpdate);
    
    void deleteCollection(String userId, UUID collectionId);
    
    DocumentBatchResponse listCollectionDocuments(String userId, UUID collectionId, int page, int limit, String sort, String direction);
    
    Map<String, Object> getCollectionThumbnail(String userId, UUID collectionId);
    
    void incrementDocumentCount(UUID collectionId);
    
    void decrementDocumentCount(UUID collectionId);
}
