file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/controller/CollectionController.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
offset: 1385
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/controller/CollectionController.java
text:
```scala
package com.docprocessing.document.controller;

import com.docprocessing.document.model.Collection;
import com.docprocessing.document.model.DocumentMetadata;
import com.docprocessing.document.model.Pagination;
import com.docprocessing.document.service.CollectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/collections")
@RequiredArgsConstructor
public class CollectionController {

    private final CollectionService collectionService;
    
    @GetMapping
    public ResponseEntity<?> listCollections(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "20") int limit,
            @AuthenticationPrincipal Jwt principal) {
            
        String userId = principal.getSubject();
        var result = collectionService.listCollections(userId, page, limit);
        
        return ResponseEntity.ok(Map.of(
            "collections", result.getCollections(),
            "pagination", resu@@lt.getPagination()
        ));
    }
    
    @PostMapping
    public ResponseEntity<Collection> createCollection(
            @Valid @RequestBody Collection collection,
            @AuthenticationPrincipal Jwt principal) {
            
        String userId = principal.getSubject();
        Collection created = collectionService.createCollection(userId, collection);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    @GetMapping("/{collectionId}")
    public ResponseEntity<Collection> getCollection(
            @PathVariable UUID collectionId,
            @AuthenticationPrincipal Jwt principal) {
            
        String userId = principal.getSubject();
        Collection collection = collectionService.getCollection(userId, collectionId);
        
        return ResponseEntity.ok(collection);
    }
    
    @PutMapping("/{collectionId}")
    public ResponseEntity<Collection> updateCollection(
            @PathVariable UUID collectionId,
            @Valid @RequestBody Collection collection,
            @AuthenticationPrincipal Jwt principal) {
            
        String userId = principal.getSubject();
        Collection updated = collectionService.updateCollection(userId, collectionId, collection);
        
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/{collectionId}")
    public ResponseEntity<?> deleteCollection(
            @PathVariable UUID collectionId,
            @AuthenticationPrincipal Jwt principal) {
            
        String userId = principal.getSubject();
        collectionService.deleteCollection(userId, collectionId);
        
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/{collectionId}/documents")
    public ResponseEntity<?> listCollectionDocuments(
            @PathVariable UUID collectionId,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "20") int limit,
            @RequestParam(value = "sort", defaultValue = "created_at") String sort,
            @RequestParam(value = "direction", defaultValue = "desc") String direction,
            @AuthenticationPrincipal Jwt principal) {
            
        String userId = principal.getSubject();
        var result = collectionService.listCollectionDocuments(
            userId, collectionId, page, limit, sort, direction);
        
        return ResponseEntity.ok(Map.of(
            "documents", result.getDocuments(),
            "pagination", result.getPagination()
        ));
    }
    
    @GetMapping("/{collectionId}/thumbnail")
    public ResponseEntity<?> getCollectionThumbnail(
            @PathVariable UUID collectionId,
            @AuthenticationPrincipal Jwt principal) {
            
        String userId = principal.getSubject();
        var thumbnailUrl = collectionService.getCollectionThumbnail(userId, collectionId);
        
        return ResponseEntity.ok(thumbnailUrl);
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