package com.docprocessing.document.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StorageService {

    private final S3Client s3Client;
    
    public void uploadFile(String bucketName, String key, MultipartFile file) {
        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(file.getContentType())
                    .contentLength(file.getSize())
                    .build();
                    
            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(file.getBytes()));
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file to S3", e);
        }
    }
    
    public void deleteFile(String bucketName, String key) {
        DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();
                
        s3Client.deleteObject(deleteObjectRequest);
    }
    
    public Map<String, Object> generateViewUrl(String userId, UUID documentId, Integer expiresIn) {
        try (S3Presigner presigner = S3Presigner.create()) {
            String key = userId + "/" + documentId.toString();
            
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket("valis-documents-raw") // Use your bucket name
                    .key(key)
                    .build();
            
            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofSeconds(expiresIn))
                    .getObjectRequest(getObjectRequest)
                    .build();
            
            PresignedGetObjectRequest presignedRequest = presigner.presignGetObject(presignRequest);
            
            Map<String, Object> result = new HashMap<>();
            result.put("url", presignedRequest.url().toString());
            result.put("expiresAt", LocalDateTime.now().plusSeconds(expiresIn));
            
            return result;
        }
    }
    
    public Map<String, Object> generateDownloadUrl(String userId, UUID documentId, Integer expiresIn) {
        try (S3Presigner presigner = S3Presigner.create()) {
            String key = userId + "/" + documentId.toString();
            
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket("valis-documents-raw") // Use your bucket name
                    .key(key)
                    .build();
            
            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofSeconds(expiresIn))
                    .getObjectRequest(getObjectRequest)
                    .build();
            
            PresignedGetObjectRequest presignedRequest = presigner.presignGetObject(presignRequest);
            
            Map<String, Object> result = new HashMap<>();
            result.put("url", presignedRequest.url().toString());
            result.put("filename", "document.pdf"); // You should get the actual filename from metadata
            result.put("expiresAt", LocalDateTime.now().plusSeconds(expiresIn));
            
            return result;
        }
    }
}
