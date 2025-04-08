
package com.docprocessing.document.service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class S3Service {
    private static final Logger log = LoggerFactory.getLogger(S3Service.class);
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    
    @Value("${aws.s3.raw-bucket}")
    private String rawBucket;
    
    public String uploadDocument(MultipartFile file, String userId) throws IOException {
        String key = generateKey(userId, file.getOriginalFilename());
        
        Map<String, String> metadata = new HashMap<>();
        metadata.put("userId", userId);
        metadata.put("originalFilename", file.getOriginalFilename());

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(rawBucket)
                .key(key)
                .contentType(file.getContentType())
                .contentLength(file.getSize())
                .metadata(metadata)
                .build();
        
        s3Client.putObject(putObjectRequest, RequestBody.fromBytes(file.getBytes()));
        log.info("Uploaded document to S3: {}", key);
        
        return key;
    }
    
    public void deleteDocument(String key) {
        DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                .bucket(rawBucket)
                .key(key)
                .build();
        
        s3Client.deleteObject(deleteRequest);
        log.info("Deleted document from S3: {}", key);
    }
    
    public String generatePresignedUrl(String key, String filename, long expiresInSeconds) {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(rawBucket)
                .key(key)
                .responseContentDisposition("inline; filename=\"" + filename + "\"")
                .build();
        
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofSeconds(expiresInSeconds))
                .getObjectRequest(getObjectRequest)
                .build();
        
        PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
        
        return presignedRequest.url().toString();
    }
    
    public String generateDownloadUrl(String key, String filename, long expiresInSeconds) {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(rawBucket)
                .key(key)
                .responseContentDisposition("attachment; filename=\"" + filename + "\"")
                .build();
        
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofSeconds(expiresInSeconds))
                .getObjectRequest(getObjectRequest)
                .build();
        
        PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
        
        return presignedRequest.url().toString();
    }
    
    private String generateKey(String userId, String filename) {
        return userId + "/" + UUID.randomUUID() + "/" + sanitizeFilename(filename);
    }
    
    private String sanitizeFilename(String filename) {
        return filename.replaceAll("[^a-zA-Z0-9.-]", "_");
    }
}
