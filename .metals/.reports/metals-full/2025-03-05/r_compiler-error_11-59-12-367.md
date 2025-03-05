file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/controller/CollectionController.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/controller/CollectionController.java
text:
```scala
package com.lexygraphai.document.controller;

import com.lexygraphai.document.ProcessRequestDto.java.CollectionRequest;
import com.lexygraphai.document.ProcessRequestDto.java.CollectionResponse;
import com.lexygraphai.document.service.CollectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    @ApiResponse(responseCode = "400", description = "Invalid input")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    public ResponseEntity<CollectionResponse> createCollection(
            @Valid @RequestBody CollectionRequest collectionRequest) {
        
        CollectionResponse collection = collectionService.createCollection(collectionRequest);
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
            @Parameter(description = "Page number for pagination") 
            @RequestParam(defaultValue = "0") int page,
            
            @Parameter(description = "Page size for pagination") 
            @RequestParam(defaultValue = "20") int size) {
        
        Page<CollectionResponse> collections = collectionService.findCollections(page, size);
        return ResponseEntity.ok(collections);
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