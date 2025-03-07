file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/service/CollectionService.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/service/CollectionService.java
text:
```scala
package com.docprocessing.document.service;

import com.docprocessing.document.model.Collection;
import com.docprocessing.document.model.DocumentBatchResponse;

import java.util.Map;
import java.util.UUID;

public interface CollectionService {
    DocumentBatchResponse listCollections(String userId, int page, int limit);
    
    Collection createCollection(String userId, Collection collection);
    
    Collection getCollection(String userId, UUID collectionId);
    
    Collection updateCollection(String userId, UUID collectionId, Collection collectionUpdate);
    
    void deleteCollection(String userId, UUID collectionId);
    
    DocumentBatchResponse listCollectionDocuments(String userId, UUID collectionId, int page, int limit, String sort, String direction);
    
    Map<String, Object> getCollectionThumbnail(String userId, UUID collectionId);
    
    void incrementDocumentCount(UUID collectionId);
    
    void decrementDocumentCount(UUID collectionId);
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