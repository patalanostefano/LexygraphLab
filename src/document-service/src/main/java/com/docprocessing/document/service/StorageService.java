package com.docprocessing.document.service;

import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

public interface StorageService {
    String storeFile(MultipartFile file, String userId, UUID documentId);
    
    void deleteFile(String userId, UUID documentId);
    
    Map<String, Object> generateViewUrl(String userId, UUID documentId, Integer expiresIn);
    
    Map<String, Object> generateDownloadUrl(String userId, UUID documentId, Integer expiresIn);
    
    String getCollectionThumbnailUrl(String userId, UUID collectionId);
}
