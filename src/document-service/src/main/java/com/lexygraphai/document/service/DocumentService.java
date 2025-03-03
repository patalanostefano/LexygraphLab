package com.lexygraphai.document.service;

import com.lexygraphai.document.dto.*;
import com.lexygraphai.document.model.DocumentStatus;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

public interface DocumentService {

    /**
     * Upload a new document with optional metadata
     * 
     * @param file The document file
     * @param metadata Optional metadata for the document
     * @return The created document's details
     */
    DocumentResponse uploadDocument(MultipartFile file, Map<String, Object> metadata);
    
    /**
     * Find documents with optional filtering
     * 
     * @param tag Optional tag to filter by
     * @param status Optional status to filter by  
     * @param collectionId Optional collection ID to filter by
     * @param page Page number for pagination
     * @param size Page size for pagination
     * @return Paged list of document summaries matching the criteria
     */
    Page<DocumentSummary> findDocuments(String tag, DocumentStatus status, UUID collectionId, int page, int size);
    
    /**
     * Get detailed information about a document
     * 
     * @param documentId The document ID
     * @return The document details
     */
    DocumentResponse getDocumentDetails(UUID documentId);
    
    /**
     * Delete a document and associated resources
     * 
     * @param documentId The document ID
     */
    void deleteDocument(UUID documentId);
    
    /**
     * Get the binary content of a document
     * 
     * @param documentId The document ID
     * @return The document content as a byte array
     */
    byte[] getDocumentContent(UUID documentId);
    
    /**
     * Get a document's MIME type
     * 
     * @param documentId The document ID
     * @return The document's MIME type
     */
    String getDocumentMimeType(UUID documentId);
    
    /**
     * Get a document's name
     * 
     * @param documentId The document ID
     * @return The document's name
     */
    String getDocumentName(UUID documentId);
    
    /**
     * Process a document with an agent or workflow
     * 
     * @param documentId The document ID
     * @param processRequest The processing request details
     * @return The processing response with tracking information
     */
    ProcessResponse processDocument(UUID documentId, ProcessRequest processRequest);
}
