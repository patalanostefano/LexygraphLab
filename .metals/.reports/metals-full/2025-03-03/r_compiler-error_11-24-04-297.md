file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/service/CollectionService.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/service/CollectionService.java
text:
```scala
package com.lexygraphai.document.service;

import com.lexygraphai.document.dto.CollectionRequest;
import com.lexygraphai.document.dto.CollectionResponse;
import org.springframework.data.domain.Page;

import java.util.UUID;

public interface CollectionService {

    /**
     * Create a new document collection
     * 
     * @param request The collection request data
     * @return The created collection
     */
    CollectionResponse createCollection(CollectionRequest request);
    
    /**
     * Find all collections with pagination
     * 
     * @param page Page number
     * @param size Page size
     * @return Paged list of collections
     */
    Page<CollectionResponse> findCollections(int page, int size);
    
    /**
     * Get a collection by ID
     * 
     * @param collectionId The collection ID
     * @return The collection
     */
    CollectionResponse getCollectionById(UUID collectionId);
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