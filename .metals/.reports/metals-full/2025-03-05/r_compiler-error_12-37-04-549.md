file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/controller/CollectionController.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
offset: 1701
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/controller/CollectionController.java
text:
```scala
package com.lexygraphai.document.controller;

import com.lexygraphai.document.dto.CollectionRequest;
import com.lexygraphai.document.dto.CollectionResponse;
import com.lexygraphai.document.dto.ErrorResponse;
import com.lexygraphai.document.security.UserPrincipal;
import com.lexygraphai.document.service.CollectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/collections")
@Tag(name = "collections", description = "Document collection operations")
@RequiredArgsConstructor
public class CollectionController {

    private final CollectionService collectionService;

    @PostMapping
    @Operation(
        summary = "Create a document collection",
        description = "Create a new collection to organize documents",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "201", description = "Collection created")
    @ApiResponse(responseCode = "400", description = "Invalid input", 
                 content = @Content(schema = @Schema(@@implementation = ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    public ResponseEntity<CollectionResponse> createCollection(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody CollectionRequest request) {
        
        CollectionResponse collection = collectionService.createCollection(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(collection);
    }

    @GetMapping
    @Operation(
        summary = "List collections",
        description = "Get a list of document collections",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "List of collections")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    public ResponseEntity<Page<CollectionResponse>> listCollections(
            @AuthenticationPrincipal UserPrincipal currentUser,
            
            @Parameter(description = "Page number for pagination") 
            @RequestParam(defaultValue = "0") int page,
            
            @Parameter(description = "Page size for pagination") 
            @RequestParam(defaultValue = "20") int size) {
        
        Page<CollectionResponse> collections = collectionService.findCollections(currentUser.getId(), page, size);
        return ResponseEntity.ok(collections);
    }
    
    @GetMapping("/{collectionId}")
    @Operation(
        summary = "Get collection details",
        description = "Get details of a specific collection",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "Collection details")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @ApiResponse(responseCode = "404", description = "Collection not found")
    public ResponseEntity<CollectionResponse> getCollection(
            @AuthenticationPrincipal UserPrincipal currentUser,
            
            @Parameter(description = "Collection ID", required = true)
            @PathVariable String collectionId) {
        
        CollectionResponse collection = collectionService.getCollectionById(currentUser.getId(), collectionId);
        return ResponseEntity.ok(collection);
    }
    
    @DeleteMapping("/{collectionId}")
    @Operation(
        summary = "Delete a collection",
        description = "Delete a collection and optionally its documents",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "204", description = "Collection deleted")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @ApiResponse(responseCode = "404", description = "Collection not found")
    public ResponseEntity<Void> deleteCollection(
            @AuthenticationPrincipal UserPrincipal currentUser,
            
            @Parameter(description = "Collection ID", required = true)
            @PathVariable String collectionId,
            
            @Parameter(description = "Whether to delete documents in the collection") 
            @RequestParam(defaultValue = "false") boolean deleteDocuments) {
        
        collectionService.deleteCollection(currentUser.getId(), collectionId, deleteDocuments);
        return ResponseEntity.noContent().build();
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