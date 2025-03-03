package com.lexygraphai.document.service;

import com.lexygraphai.document.exception.StorageException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * Implementation of StorageService that uses AWS S3
 */
@Service
@ConditionalOnProperty(name = "document.storage.type", havingValue = "s3")
public class S3StorageService implements StorageService {

    private final S3Client s3Client;
    private final String bucketName;

    public S3StorageService(
            @Value("${document.storage.s3.bucket}") String bucketName,
            @Value("${document.storage.s3.region}") String region,
            @Value("${document.storage.s3.access-key:#{null}}") String accessKey,
            @Value("${document.storage.s3.secret-key:#{null}}") String secretKey) {
        
        this.bucketName = bucketName;
        
        // Configure S3 client
        S3Client.Builder builder = S3Client.builder()
                .region(Region.of(region));
                
        // For local development with explicit credentials
        // In production environments, use IAM roles instead of explicit credentials
        /*
        if (accessKey != null && secretKey != null) {
            AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);
            builder.credentialsProvider(StaticCredentialsProvider.create(credentials));
        }
        */
        
        this.s3Client = builder.build();
        
        // Check if bucket exists, create if it doesn't
        createBucketIfNotExists();
    }
    
    private void createBucketIfNotExists() {
        try {
            s3Client.headBucket(HeadBucketRequest.builder()
                    .bucket(bucketName)
                    .build());
        } catch (NoSuchBucketException e) {
            // Bucket doesn't exist, create it
            s3Client.createBucket(CreateBucketRequest.builder()
                    .bucket(bucketName)
                    .build());
        }
    }

    @Override
    public String store(MultipartFile file) {
        try {
            if (file.isEmpty()) {
                throw new StorageException("Failed to store empty file");
            }
            
            // Generate a unique key with year/month prefixes for better organization
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy/MM");
            String datePrefix = LocalDateTime.now().format(formatter);
            
            String originalFilename = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            
            String key = datePrefix + "/" + UUID.randomUUID().toString() + fileExtension;
            
            // Upload file to S3
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(file.getContentType())
                    .contentLength(file.getSize())
                    .build();
            
            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            
            return key;
            
        } catch (IOException e) {
            throw new StorageException("Failed to store file in S3", e);
        }
    }

    @Override
    public byte[] load(String key) {
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            
            ResponseInputStream<GetObjectResponse> response = s3Client.getObject(getObjectRequest);
            return response.readAllBytes();
            
        } catch (IOException | S3Exception e) {
            throw new StorageException("Failed to read file from S3", e);
        }
    }

    @Override
    public void delete(String key) {
        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            
            s3Client.deleteObject(deleteObjectRequest);
            
        } catch (S3Exception e) {
            throw new StorageException("Failed to delete file from S3", e);
        }
    }
}
