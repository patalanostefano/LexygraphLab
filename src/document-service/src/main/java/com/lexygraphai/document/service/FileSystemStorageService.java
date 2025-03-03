package com.lexygraphai.document.service;

import com.lexygraphai.document.exception.StorageException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Implementation of StorageService that uses the local file system
 */
@Service
public class FileSystemStorageService implements StorageService {

    private final Path rootLocation;

    public FileSystemStorageService(@Value("${document.storage.local.directory}") String storageDir) {
        this.rootLocation = Paths.get(storageDir);
        init();
    }

    /**
     * Initialize the storage directory
     */
    private void init() {
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new StorageException("Could not initialize storage", e);
        }
    }

    @Override
    public String store(MultipartFile file) {
        try {
            if (file.isEmpty()) {
                throw new StorageException("Failed to store empty file");
            }
            
            // Generate a unique filename to avoid collisions
            String originalFilename = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = UUID.randomUUID().toString() + fileExtension;
            
            // Create storage path structure (using year/month directories for better organization)
            Path yearMonth = Paths.get(String.format("%1$tY/%1$tm", System.currentTimeMillis()));
            Path directory = rootLocation.resolve(yearMonth);
            Files.createDirectories(directory);
            
            Path destinationFile = directory.resolve(filename)
                    .normalize().toAbsolutePath();
            
            // Security check - make sure the file is being stored under the root location
            if (!destinationFile.getParent().startsWith(rootLocation.toAbsolutePath())) {
                throw new StorageException("Cannot store file outside of designated storage directory");
            }
            
            // Copy file to destination
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            }
            
            // Return the relative path (without the root location) as the storage path
            return yearMonth.resolve(filename).toString();
            
        } catch (IOException e) {
            throw new StorageException("Failed to store file", e);
        }
    }

    @Override
    public byte[] load(String storagePath) {
        try {
            Path file = rootLocation.resolve(storagePath);
            return Files.readAllBytes(file);
        } catch (IOException e) {
            throw new StorageException("Failed to read stored file", e);
        }
    }

    @Override
    public void delete(String storagePath) {
        try {
            Path file = rootLocation.resolve(storagePath);
            Files.deleteIfExists(file);
            
            // Try to remove empty parent directories (month, year)
            Path directory = file.getParent();
            if (directory != null && Files.isDirectory(directory)) {
                if (isDirectoryEmpty(directory)) {
                    Files.delete(directory);
                    
                    // Try to remove year directory if month directory was the last one
                    Path yearDir = directory.getParent();
                    if (yearDir != null && Files.isDirectory(yearDir) && isDirectoryEmpty(yearDir)) {
                        Files.delete(yearDir);
                    }
                }
            }
        } catch (IOException e) {
            throw new StorageException("Failed to delete file", e);
        }
    }
    
    private boolean isDirectoryEmpty(Path directory) throws IOException {
        try (var entries = Files.list(directory)) {
            return !entries.findFirst().isPresent();
        }
    }
}
