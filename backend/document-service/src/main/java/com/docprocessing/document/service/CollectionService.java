package com.docprocessing.document.service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.docprocessing.document.dto.CollectionDto.*;
import com.docprocessing.document.dto.DocumentDto.DocumentMetadataResponse;
import com.docprocessing.document.exception.CollectionNotFoundException;
import com.docprocessing.document.exception.InvalidRequestException;
import com.docprocessing.document.model.Collection;
import com.docprocessing.document.repository.CollectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CollectionService {

    private final CollectionRepository collectionRepository;
    private final DocumentService documentService;
    
    public CollectionResponse createCollection(String userId, CollectionRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new InvalidRequestException("Collection name is required");
        }
        
        Collection collection = Collection.createNew(
                userId,
                request.getName(),
                request.getDescription()
        );
        
        Collection savedCollection = collectionRepository.save(collection);
        
        return buildCollectionResponse(savedCollection);
    }
    
    public CollectionResponse getCollection(String userId, String collectionId) {
        Collection collection = findCollectionAndVerifyOwnership(collectionId, userId);
        return buildCollectionResponse(collection);
    }
    
    public CollectionListResponse getUserCollections(String userId) {
        List<Collection> collections = collectionRepository.findByUserId(userId);
        
        List<CollectionResponse> collectionResponses = collections.stream()
                .map(this::buildCollectionResponse)
                .collect(Collectors.toList());
        
        return CollectionListResponse.builder()
                .collections(collectionResponses)
                .build();
    }
    
    public CollectionResponse updateCollection(String userId, String collectionId, CollectionUpdateRequest request) {
        Collection collection = findCollectionAndVerifyOwnership(collectionId, userId);
        
        // Update fields if provided
        if (request.getName() != null) {
            collection.setName(request.getName());
        }
        
        if (request.getDescription() != null) {
            collection.setDescription(request.getDescription());
        }
        
        collection.setUpdatedAt(Instant.now());
        
        // Save updated collection
        Collection updatedCollection = collectionRepository.save(collection);
        
        return buildCollectionResponse(updatedCollection);
    }
    
    public void deleteCollection(String userId, String collectionId) {
        Collection collection = findCollectionAndVerifyOwnership(collectionId, userId);
        collectionRepository.delete(collection);
    }
    
    public CollectionDocumentsResponse getCollectionDocuments(String userId, String collectionId) {
        // Verify collection ownership
        findCollectionAndVerifyOwnership(collectionId, userId);
        
        // Get documents
        List<DocumentMetadataResponse> documents = documentService.getDocumentsByCollection(userId, collectionId);
        
        return CollectionDocumentsResponse.builder()
                .documents(documents)
                .build();
    }
    
    private Collection findCollectionAndVerifyOwnership(String collectionId, String userId) {
        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new CollectionNotFoundException("Collection not found with ID: " + collectionId));
        
        if (!collection.getUserId().equals(userId)) {
            throw new CollectionNotFoundException("Collection not found with ID: " + collectionId);
        }
        
        return collection;
    }
    
    private CollectionResponse buildCollectionResponse(Collection collection) {
        return CollectionResponse.builder()
                .id(collection.getId())
                .name(collection.getName())
                .description(collection.getDescription())
                .documentCount(collection.getDocumentCount())
                .createdAt(collection.getCreatedAt())
                .updatedAt(collection.getUpdatedAt())
                .ownerId(collection.getUserId())
                .build();
    }
}
