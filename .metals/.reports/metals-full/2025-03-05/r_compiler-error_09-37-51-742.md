file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/service/S3StorageService.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
offset: 63
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/service/S3StorageService.java
text:
```scala
package com.lexygraphai.document.service;

import com.lexygraph@@ai.document.exception.StorageException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.net.URL;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class S3StorageService implements StorageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    
    @Value("${aws.s3.bucket}")
    private String bucketName;
    
    @Override
    public String store(String userId, MultipartFile file) {
        try {
            if (file.isEmpty()) {
                throw new StorageException("Failed to store empty file");
            }
            
            // Generate a unique key with user/year/month prefixes for better organization and isolation
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy/MM");
            String datePrefix = LocalDateTime.now().format(formatter);
            
            String originalFilename = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            
            // Create a key structure that isolates user data: users/{userId}/documents/{year}/{month}/{uuid}.ext
            String key = String.format("users/%s/documents/%s/%s%s", 
                    userId, datePrefix, UUID.randomUUID(), fileExtension);
            
            // Upload file to S3
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();
            
            s3Client.putObject(putObjectRequest, 
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            
            log.info("Document stored in S3: bucket={}, key={}", bucketName, key);
            
            return key;
            
        } catch (IOException e) {
            log.error("Failed to store file in S3: {}", e.getMessage());
            throw new StorageException("Failed to store file in S3", e);
        } catch (SdkException e) {
            log.error("AWS SDK exception storing file in S3: {}", e.getMessage());
            throw new StorageException("AWS error storing file", e);
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
            
        } catch (IOException e) {
            log.error("Failed to read file from S3: {}", e.getMessage());
            throw new StorageException("Failed to read file from S3", e);
        } catch (S3Exception e) {
            log.error("S3 exception reading file: {}", e.getMessage());
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
            log.info("Document deleted from S3: bucket={}, key={}", bucketName, key);
            
        } catch (S3Exception e) {
            log.error("Failed to delete file from S3: {}", e.getMessage());
            throw new StorageException("Failed to delete file from S3", e);
        }
    }
    
    // Get a presigned URL for temporary direct access
    public URL generatePresignedUrl(String key, Duration expiration) {
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(expiration)
                .getObjectRequest(GetObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .build())
                .build();

        PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
        return presignedRequest.url();
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
	dotty.tools.pc.HoverProvider$.hover(HoverProvider.scala:40)
	dotty.tools.pc.ScalaPresentationCompiler.hover$$anonfun$1(ScalaPresentationCompiler.scala:376)
```
#### Short summary: 

java.util.NoSuchElementException: next on empty iterator