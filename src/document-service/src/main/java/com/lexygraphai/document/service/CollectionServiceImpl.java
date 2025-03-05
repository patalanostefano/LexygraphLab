package com.lexygraphai.document.service;

import com.lexygraphai.document.dto.CollectionRequest;
import com.lexygraphai.document.dto.CollectionResponse;
import com.lexygraphai.document.exception.CollectionNotFoundException;
import com.lexygraphai.document.model.Collection;
import com.lexygraphai.document.model.Document;
import com.lexygraphai.document.repository.CollectionRepository;
import com.lexygraphai.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class CollectionServiceImpl implements CollectionService {

    private final CollectionRepository collectionRepository;
    private final DocumentRepository documentRepository;
    private final DocumentService documentService;

    @Override
    @Transactional
    public CollectionResponse createCollection(String userId, CollectionRequest request) {
        String collectionId = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        
        Collection collection = Collection.builder()
                .userId(userId)
                .collectionId(collectionId)
                .name(request.getName())
                .description(request.getDescription())
                .creationDate(now)
                .documentCount(0)
                .build();
        
        collection = collectionRepository.save(collection);
        log.info("Collection created: userId={}, collectionId={}", userId, collectionId);
        
        return mapToCollectionResponse(collection);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CollectionResponse> findCollections(String userId, int page, int size) {
        // Get all collections for the user
        List<Collection> collections = collectionRepository.findByUserId(userId);
        
        // Apply pagination manually
        int start = page * size;
        int end = Math.min(start + size, collections.size());
        
        List<Collection> pageContent = collections.subList(
                Math.min(start, collections.size()),
                Math.min(end, collections.size())
        );
        
        // Convert to response DTOs
        List<CollectionResponse> responseList = pageContent.stream()
                .map(this::mapToCollectionResponse)
                .collect(Collectors.toList());
        
        return new PageImpl<>(responseList, PageRequest.of(page, size), collections.size());
    }

    @Override
    @Transactional(readOnly = true)
    public CollectionResponse getCollectionById(String userId, String collectionId) {
        Collection collection = collectionRepository.findById(userId, collectionId)
                .orElseThrow(() -> new CollectionNotFoundException("Collection not found with ID: " + collectionId));
        
        return mapToCollectionResponse(collection);
    }

    @Override
    @Transactional
    public void deleteCollection(String userId, String collectionId, boolean deleteDocuments) {
        Collection collection = collectionRepository.findById(userId, collectionId)
                .orElseThrow(() -> new CollectionNotFoundException("Collection not found with ID: " + collectionId));
        
        if (deleteDocuments) {
            // Get all documents in this collection
            List<Document> documents = documentRepository.findByCollectionId(collectionId)
                    .stream()
                    .filter(doc -> doc.getUserId().equals(userId))
                    .collect(Collectors.toList());
            
            // Delete each document
            for (Document doc : documents) {
                documentService.deleteDocument(userId, doc.getDocumentId());
            }
            
            log.info("Deleted {} documents from collection {}", documents.size(), collectionId);
        } else {
            // Just remove collection association from documents
            List<Document> documents = documentRepository.findByCollectionId(collectionId)
                    .stream()
                    .filter(doc -> doc.getUserId().equals(userId))
                    .collect(Collectors.toList());
            
            for (Document doc : documents) {
                doc.setCollectionId(null);
                documentRepository.save(doc);
            }
            
            log.info("Removed collection association from {} documents", documents.size());
        }
        
        // Delete the collection
        collectionRepository.delete(userId, collectionId);
        log.info("Collection deleted: userId={}, collectionId={}", userId, collectionId);
    }
    
    private CollectionResponse mapToCollectionResponse(Collection collection) {
        return CollectionResponse.builder()
                .id(collection.getCollectionId())
                .name(collection.getName())
                .description(collection.getDescription())
                .creationDate(collection.getCreationDate())
                .documentCount(collection.getDocumentCount())
                .build();
    }
}
