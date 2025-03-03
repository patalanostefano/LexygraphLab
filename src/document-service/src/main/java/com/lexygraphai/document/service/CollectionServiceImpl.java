package com.lexygraphai.document.service;

import com.lexygraphai.document.dto.CollectionRequest;
import com.lexygraphai.document.dto.CollectionResponse;
import com.lexygraphai.document.exception.CollectionNotFoundException;
import com.lexygraphai.document.model.Collection;
import com.lexygraphai.document.repository.CollectionRepository;
import com.lexygraphai.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class CollectionServiceImpl implements CollectionService {

    private final CollectionRepository collectionRepository;
    private final DocumentRepository documentRepository;

    @Override
    @Transactional
    public CollectionResponse createCollection(CollectionRequest request) {
        Collection collection = Collection.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();
        
        collection = collectionRepository.save(collection);
        
        log.info("Collection created: {}", collection.getId());
        
        return mapToCollectionResponse(collection, 0);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CollectionResponse> findCollections(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "name"));
        
        // Find all collections with their document counts
        List<Object[]> collectionsWithCount = collectionRepository.findCollectionsWithDocumentCount();
        
        // Convert to map of collection ID to document count
        Map<UUID, Long> documentCountMap = new HashMap<>();
        for (Object[] result : collectionsWithCount) {
            Collection collection = (Collection) result[0];
            Long count = (Long) result[1];
            documentCountMap.put(collection.getId(), count);
        }
        
        // Get the page of collections
        Page<Collection> collectionsPage = collectionRepository.findAll(pageRequest);
        
        // Convert to response DTOs with document counts
        List<CollectionResponse> responseList = collectionsPage.getContent().stream()
                .map(collection -> mapToCollectionResponse(
                        collection, 
                        documentCountMap.getOrDefault(collection.getId(), 0L).intValue()))
                .toList();
        
        return new PageImpl<>(
                responseList, 
                pageRequest, 
                collectionsPage.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public CollectionResponse getCollectionById(UUID collectionId) {
        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new CollectionNotFoundException("Collection not found with ID: " + collectionId));
        
        long documentCount = documentRepository.countByCollectionId(collectionId);
        
        return mapToCollectionResponse(collection, (int) documentCount);
    }
    
    private CollectionResponse mapToCollectionResponse(Collection collection, int documentCount) {
        CollectionResponse response = new CollectionResponse();
        response.setId(collection.getId());
        response.setName(collection.getName());
        response.setDescription(collection.getDescription());
        response.setCreationDate(collection.getCreationDate());
        response.setDocumentCount(documentCount);
        
        return response;
    }
}
