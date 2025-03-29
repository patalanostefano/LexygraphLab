file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/service/CollectionService.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
offset: 4902
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/service/CollectionService.java
text:
```scala
package com.docprocessing.document.service;

import com.docprocessing.document.exception.DocumentNotFoundException;
import com.docprocessing.document.exception.UnauthorizedAccessException;
import com.docprocessing.document.model.Collection;
import com.docprocessing.document.model.DocumentBatchResponse;
import com.docprocessing.document.model.DocumentMetadata;
import com.docprocessing.document.model.Pagination;
import com.docprocessing.document.repository.CollectionRepository;
import com.docprocessing.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CollectionService {

    private final CollectionRepository collectionRepository;
    private final DocumentRepository documentRepository;
    
    public DocumentBatchResponse listCollections(String userId, int page, int limit) {
        // Get collections for the user with pagination
        List<Collection> collections = collectionRepository.findByOwnerId(userId, page, limit);
        
        // Calculate total pages and items
        int totalItems = collectionRepository.countByOwnerId(userId);
        int totalPages = (int) Math.ceil((double) totalItems / limit);
        
        // Create pagination information
        Pagination pagination = new Pagination();
        pagination.setCurrentPage(page);
        pagination.setTotalPages(totalPages);
        pagination.setTotalItems(totalItems);
        pagination.setItemsPerPage(limit);
        pagination.setHasNextPage(page < totalPages);
        pagination.setHasPreviousPage(page > 1);
        
        // Create response
        DocumentBatchResponse response = new DocumentBatchResponse();
        response.setDocuments(collections);
        response.setPagination(pagination);
        
        return response;
    }
    
    public Collection createCollection(String userId, Collection collection) {
        // Generate collection ID
        UUID collectionId = UUID.randomUUID();
        
        // Set owner and timestamps
        collection.setId(collectionId);
        collection.setOwnerId(userId);
        collection.setCreatedAt(LocalDateTime.now());
        collection.setUpdatedAt(LocalDateTime.now());
        collection.setDocumentCount(0);
        
        // Save collection
        collectionRepository.save(collection);
        
        return collection;
    }
    
    public Collection getCollection(String userId, UUID collectionId) {
        Collection collection = collectionRepository.findById(collectionId)
            .orElseThrow(() -> new DocumentNotFoundException("Collection not found: " + collectionId));
        
        // Security check: Only allow owner to view collection
        if (!userId.equals(collection.getOwnerId())) {
            throw new UnauthorizedAccessException("Not authorized to access this collection");
        }
        
        return collection;
    }
    
    public Collection updateCollection(String userId, UUID collectionId, Collection collectionUpdate) {
        // Find existing collection
        Collection existing = collectionRepository.findById(collectionId)
            .orElseThrow(() -> new DocumentNotFoundException("Collection not found: " + collectionId));
        
        // Security check: Only allow owner to update collection
        if (!userId.equals(existing.getOwnerId())) {
            throw new UnauthorizedAccessException("Not authorized to update this collection");
        }
        
        // Update fields
        if (collectionUpdate.getName() != null) {
            existing.setName(collectionUpdate.getName());
        }
        if (collectionUpdate.getDescription() != null) {
            existing.setDescription(collectionUpdate.getDescription());
        }
        
        existing.setUpdatedAt(LocalDateTime.now());
        
        // Save updates
        collectionRepository.save(existing);
        
        return existing;
    }
    
    public void deleteCollection(String userId, UUID collectionId) {
        // Find existing collection
        Collection existing = collectionRepository.findById(collectionId)
            .orElseThrow(() -> new DocumentNotFoundException("Collection not found: " + collectionId));
        
        // Security check: Only allow owner to delete collection
        if (!userId.equals(existing.getOwnerId())) {
            throw new UnauthorizedAccessException("Not authorized to delete this collection");
        }
        
        // Delete collection
        collectionRepository.delete(collectionId);
        
        // Update documents to remove collection reference
        documentRepository.removeCollectionReference(collectionId);
    }
    
    public DocumentBatchResponse listCollectionDocuments(
            String use@@rId, 
            UUID collectionId, 
            int page, 
            int limit, 
            String sort, 
            String direction) {
            
        // Verify collection exists and user has access
        Collection collection = collectionRepository.findById(collectionId)
            .orElseThrow(() -> new DocumentNotFoundException("Collection not found: " + collectionId));
        
        // Security check: Only allow owner to view collection documents
        if (!userId.equals(collection.getOwnerId())) {
            throw new UnauthorizedAccessException("Not authorized to access this collection");
        }
        
        // Get documents in the collection
        List<DocumentMetadata> documents = documentRepository.findByCollectionId(collectionId, page, limit, sort, direction);
        
        // Calculate total pages and items
        int totalItems = documentRepository.countByCollectionId(collectionId);
        int totalPages = (int) Math.ceil((double) totalItems / limit);
        
        // Create pagination information
        Pagination pagination = new Pagination();
        pagination.setCurrentPage(page);
        pagination.setTotalPages(totalPages);
        pagination.setTotalItems(totalItems);
        pagination.setItemsPerPage(limit);
        pagination.setHasNextPage(page < totalPages);
        pagination.setHasPreviousPage(page > 1);
        
        // Create response
        DocumentBatchResponse response = new DocumentBatchResponse();
        response.setDocuments(documents);
        response.setPagination(pagination);
        
        return response;
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