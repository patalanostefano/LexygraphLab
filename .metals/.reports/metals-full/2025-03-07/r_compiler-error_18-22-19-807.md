file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/service/CollectionServiceImpl.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
offset: 914
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/service/CollectionServiceImpl.java
text:
```scala
package com.docprocessing.document.service;

import com.docprocessing.document.exception.CollectionNotFoundException;
import com.docprocessing.document.exception.NotAuthorizedException;
import com.docprocessing.document.model.Collection;
import com.docprocessing.document.model.DocumentBatchResponse;
import com.docprocessing.document.repository.CollectionRepository;
import com.docprocessing.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CollectionServiceImpl implements CollectionService {

    private final CollectionRepository collectionRepository;
    private final DocumentRepository documentRepository;
    private final StorageService storageService;
    
    @Override
    public Document@@BatchResponse listCollections(String userId, int page, int limit) {
        return collectionRepository.findAllByUserId(userId, page, limit);
    }
    
    @Override
    public Collection createCollection(String userId, Collection collection) {
        // Generate ID if not provided
        if (collection.getId() == null) {
            collection.setId(UUID.randomUUID());
        }
        
        // Set owner and timestamps
        collection.setOwnerId(userId);
        collection.setCreatedAt(Instant.now());
        collection.setUpdatedAt(Instant.now());
        collection.setDocumentCount(0);
        
        // Save collection
        return collectionRepository.save(collection);
    }
    
    @Override
    public Collection getCollection(String userId, UUID collectionId) {
        Collection collection = collectionRepository.findById(collectionId)
            .orElseThrow(() -> new CollectionNotFoundException("Collection not found: " + collectionId));
            
        // Check if user has access
        if (!collection.getOwnerId().equals(userId)) {
            throw new NotAuthorizedException("Not authorized to access this collection");
        }
        
        return collection;
    }
    
    @Override
    public Collection updateCollection(String userId, UUID collectionId, Collection collectionUpdate) {
        Collection existingCollection = getCollection(userId, collectionId);
        
        // Update mutable fields
        if (collectionUpdate.getName() != null) {
            existingCollection.setName(collectionUpdate.getName());
        }
        
        if (collectionUpdate.getDescription() != null) {
            existingCollection.setDescription(collectionUpdate.getDescription());
        }
        
        existingCollection.setUpdatedAt(Instant.now());
        
        // Save updated collection
        return collectionRepository.save(existingCollection);
    }
    
    @Override
    public void deleteCollection(String userId, UUID collectionId) {
        Collection collection = getCollection(userId, collectionId);
        
        // Delete collection
        collectionRepository.delete(collection);
        
        // Note: This doesn't delete documents in the collection
        // In a real application, you might want to either:
        // 1. Move documents to a default collection
        // 2. Delete all documents in the collection
        // 3. Make documents "orphaned" but still accessible
    }
    
    @Override
    public DocumentBatchResponse listCollectionDocuments(
            String userId, UUID collectionId, int page, int limit, String sort, String direction) {
        
        // Verify user has access to collection
        getCollection(userId, collectionId);
        
        // Get documents in collection
        return documentRepository.findByCollectionId(collectionId, page, limit, sort, direction);
    }
    
    @Override
    public Map<String, Object> getCollectionThumbnail(String userId, UUID collectionId) {
        // Verify user has access to collection
        Collection collection = getCollection(userId, collectionId);
        
        // Generate or retrieve thumbnail
        String thumbnailUrl = storageService.getCollectionThumbnailUrl(userId, collectionId);
        
        Map<String, Object> result = new HashMap<>();
        result.put("url", thumbnailUrl);
        result.put("expiresAt", Instant.now().plusSeconds(3600).toString());
        
        return result;
    }
    
    @Override
    public void incrementDocumentCount(UUID collectionId) {
        collectionRepository.incrementDocumentCount(collectionId);
    }
    
    @Override
    public void decrementDocumentCount(UUID collectionId) {
        collectionRepository.decrementDocumentCount(collectionId);
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