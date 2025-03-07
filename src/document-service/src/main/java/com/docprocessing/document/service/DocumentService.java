package com.docprocessing.document.service;

import com.docprocessing.document.model.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface DocumentService {
    DocumentSubmissionResponse submitDocument(String userId, 
                                             MultipartFile file,
                                             String name,
                                             String description,
                                             UUID collectionId,
                                             String processingType,
                                             String processingOptions,
                                             String priority,
                                             String language);
                                             
    Document getDocument(String userId, UUID documentId);
    
    ProcessingStatusResponse getDocumentStatus(String userId, UUID documentId);
    
    Document updateDocument(String userId, UUID documentId, Document documentUpdate);
    
    void deleteDocument(String userId, UUID documentId);
    
    ExtractedTextResponse getExtractedText(String userId, UUID documentId, Integer page, String format);
    
    SummaryResponse getDocumentSummary(String userId, UUID documentId, Integer maxLength);
    
    EntitiesResponse getDocumentEntities(String userId, UUID documentId, String[] types);
}
