file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/service/StorageServiceImpl.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/service/StorageServiceImpl.java
text:
```scala
package com.docprocessing.document.service;

import com.docprocessing.document.exception.DocumentNotFoundException;
import com.docprocessing.document.model.Collection;
import com.docprocessing.document.repository.CollectionRepository;
import com.docprocessing.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StorageServiceImpl implements StorageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final DocumentRepository documentRepository;
    private final CollectionRepository collectionRepository;

    @Value("${aws.s3.raw-bucket}")
    private String rawBucket;

    @Value("${aws.s3.processed-bucket}")
    private String processedBucket;

    @Value("${aws.s3.thumbnails-bucket}")
    private String thumbnailsBucket;

    @Override
    public String storeFile(MultipartFile file, String userId, UUID documentId) {
        try {
            String extension = FilenameUtils.getExtension(file.getOriginalFilename());
            String key = String.format("users/%s/documents/%s/original.%s", userId, documentId, extension);
            
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(rawBucket)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();
                    
            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(file.getBytes()));
            
            return key;
        } catch (IOException e) {
            log.error("Error storing file in S3", e);
            throw new RuntimeException("Failed to store file", e);
        }
    }

    @Override
    public void deleteFile(String userId, UUID documentId) {
        // First, find the document to get the file key
        documentRepository.findById(documentId).ifPresent(document -> {
            try {
                // Delete the original file
                String fileKey = document.getFileKey();
                if (fileKey != null && !fileKey.isEmpty()) {
                    DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                            .bucket(rawBucket)
                            .key(fileKey)
                            .build();
                    s3Client.deleteObject(deleteObjectRequest);
                }
                
                // Delete processed files
                String processedPrefix = String.format("users/%s/documents/%s/processed/", userId, documentId);
                DeleteObjectsRequest deleteProcessedRequest = getDeleteObjectsRequest(processedBucket, processedPrefix);
                if (deleteProcessedRequest != null) {
                    s3Client.deleteObjects(deleteProcessedRequest);
                }
                
                // Delete thumbnails
                String thumbnailsPrefix = String.format("users/%s/documents/%s/thumbnails/", userId, documentId);
                DeleteObjectsRequest deleteThumbnailsRequest = getDeleteObjectsRequest(thumbnailsBucket, thumbnailsPrefix);
                if (deleteThumbnailsRequest != null) {
                    s3Client.deleteObjects(deleteThumbnailsRequest);
                }
                
            } catch (Exception e) {
                log.error("Error deleting files for document {}", documentId, e);
            }
        });
    }

    private DeleteObjectsRequest getDeleteObjectsRequest(String bucket, String prefix) {
        try {
            // List all objects with the prefix
            ListObjectsV2Request listRequest = ListObjectsV2Request.builder()
                    .bucket(bucket)
                    .prefix(prefix)
                    .build();
            
            ListObjectsV2Response listResponse = s3Client.listObjectsV2(listRequest);
            
            if (listResponse.contents().isEmpty()) {
                return null;
            }
            
            // Create delete request with all objects
            DeleteObjectsRequest deleteRequest = DeleteObjectsRequest.builder()
                    .bucket(bucket)
                    .delete(Delete.builder()
                            .objects(listResponse.contents().stream()
                                    .map(obj -> ObjectIdentifier.builder().key(obj.key()).build())
                                    .toList())
                            .build())
                    .build();
            
            return deleteRequest;
        } catch (Exception e) {
            log.error("Error listing objects with prefix {}", prefix, e);
            return null;
        }
    }

    @Override
    public Map<String, Object> generateViewUrl(String userId, UUID documentId, Integer expiresIn) {
        return documentRepository.findById(documentId)
                .map(document -> {
                    String fileKey = document.getFileKey();
                    if (fileKey == null || fileKey.isEmpty()) {
                        throw new DocumentNotFoundException("Document file not found");
                    }
                    
                    GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                            .bucket(rawBucket)
                            .key(fileKey)
                            .responseContentDisposition("inline")
                            .build();

                    GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                            .signatureDuration(Duration.ofSeconds(expiresIn))
                            .getObjectRequest(getObjectRequest)
                            .build();

                    PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
                    
                    Map<String, Object> result = new HashMap<>();
                    result.put("url", presignedRequest.url().toString());
                    result.put("expiresAt", Instant.now().plusSeconds(expiresIn).toString());
                    
                    return result;
                })
                .orElseThrow(() -> new DocumentNotFoundException("Document not found: " + documentId));
    }

    @Override
    public Map<String, Object> generateDownloadUrl(String userId, UUID documentId, Integer expiresIn) {
        return documentRepository.findById(documentId)
                .map(document -> {
                    String fileKey = document.getFileKey();
                    if (fileKey == null || fileKey.isEmpty()) {
                        throw new DocumentNotFoundException("Document file not found");
                    }
                    
                    // Create a presigned URL for downloading the file
                    String filename = document.getOriginalFilename() != null 
                            ? document.getOriginalFilename() 
                            : document.getName();
                            
                    GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                            .bucket(rawBucket)
                            .key(fileKey)
                            .responseContentDisposition("attachment; filename=\"" + filename + "\"")
                            .build();

                    GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                            .signatureDuration(Duration.ofSeconds(expiresIn))
                            .getObjectRequest(getObjectRequest)
                            .build();

                    PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
                    
                    Map<String, Object> result = new HashMap<>();
                    result.put("url", presignedRequest.url().toString());
                    result.put("filename", filename);
                    result.put("expiresAt", Instant.now().plusSeconds(expiresIn).toString());
                    
                    return result;
                })
                .orElseThrow(() -> new DocumentNotFoundException("Document not found: " + documentId));
    }

    @Override
    public String getCollectionThumbnailUrl(String userId, UUID collectionId) {
        // Get the collection to verify its existence
        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new DocumentNotFoundException("Collection not found: " + collectionId));
                
        // For a real implementation, you might:
        // 1. Check if a thumbnail already exists
        // 2. Generate a thumbnail based on collection contents
        // 3. Return a generic thumbnail if empty
                
        // For simplicity, we'll just return a presigned URL for a placeholder
        String thumbnailKey = String.format("collections/%s/thumbnail.png", collectionId);
        
        try {
            // Check if the thumbnail exists, otherwise use a default
            HeadObjectRequest headRequest = HeadObjectRequest.builder()
                    .bucket(thumbnailsBucket)
                    .key(thumbnailKey)
                    .build();
                    
            try {
                s3Client.headObject(headRequest);
            } catch (NoSuchKeyException e) {
                // Use a default thumbnail
                thumbnailKey = "defaults/collection-thumbnail.png";
            }
            
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(thumbnailsBucket)
                    .key(thumbnailKey)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofSeconds(3600)) // 1 hour
                    .getObjectRequest(getObjectRequest)
                    .build();

            PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
            return presignedRequest.url().toString();
        } catch (Exception e) {
            log.error("Error generating thumbnail URL for collection {}", collectionId, e);
            return "";
        }
    }
}

```



#### Error stacktrace:

```
scala.collection.Iterator$$anon$19.next(Iterator.scala:973)
	scala.collection.Iterator$$anon$19.next(Iterator.scala:971)
	scala.collection.mutable.MutationTracker$CheckedIterator.next(MutationTracker.scala:76)
	scala.collection.IterableOps.head(Iterable.scala:222)
	scala.collection.IterableOps.head$(Iterable.scala:222)
	scala.collection.AbstractIterable.head(Iterable.scala:935)
	dotty.tools.dotc.interactive.InteractiveDriver.run(InteractiveDriver.scala:164)
	dotty.tools.pc.MetalsDriver.run(MetalsDriver.scala:45)
	dotty.tools.pc.WithCompilationUnit.<init>(WithCompilationUnit.scala:31)
	dotty.tools.pc.SimpleCollector.<init>(PcCollector.scala:345)
	dotty.tools.pc.PcSemanticTokensProvider$Collector$.<init>(PcSemanticTokensProvider.scala:63)
	dotty.tools.pc.PcSemanticTokensProvider.Collector$lzyINIT1(PcSemanticTokensProvider.scala:63)
	dotty.tools.pc.PcSemanticTokensProvider.Collector(PcSemanticTokensProvider.scala:63)
	dotty.tools.pc.PcSemanticTokensProvider.provide(PcSemanticTokensProvider.scala:88)
	dotty.tools.pc.ScalaPresentationCompiler.semanticTokens$$anonfun$1(ScalaPresentationCompiler.scala:109)
```
#### Short summary: 

java.util.NoSuchElementException: next on empty iterator