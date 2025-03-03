package com.lexygraphai.document.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * Interface for document storage operations
 */
public interface StorageService {

    /**
     * Store a file and return its storage path
     *
     * @param file The file to store
     * @return A storage path that can be used to retrieve the file later
     */
    String store(MultipartFile file);

    /**
     * Load a file's contents from the given storage path
     *
     * @param storagePath The path to the stored file
     * @return The file content as a byte array
     */
    byte[] load(String storagePath);

    /**
     * Delete a file from storage
     *
     * @param storagePath The path to the stored file to delete
     */
    void delete(String storagePath);
}
