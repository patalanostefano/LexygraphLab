package com.docprocessing.document.repository;

import com.docprocessing.document.model.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DocumentRepository {
    Document save(Document document);
    Optional<Document> findById(UUID id);
    void delete(Document document);
    DocumentBatchResponse findByCollectionId(UUID collectionId, int page, int limit, String sort, String direction);
    DocumentBatchResponse findByUserId(String userId, int page, int limit, String sort, String direction);
    ExtractedTextResponse getExtractedText(UUID documentId, Integer page, String format);
    SummaryResponse getDocumentSummary(UUID documentId, Integer maxLength);
    EntitiesResponse getDocumentEntities(UUID documentId, String[] types);
}
