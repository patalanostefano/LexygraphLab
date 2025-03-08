file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/service/CollectionService.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
offset: 0
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/service/CollectionService.java
text:
```scala
@@package com.docprocessing.document.service;

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
	dotty.tools.pc.HoverProvider$.hover(HoverProvider.scala:40)
	dotty.tools.pc.ScalaPresentationCompiler.hover$$anonfun$1(ScalaPresentationCompiler.scala:376)
```
#### Short summary: 

java.util.NoSuchElementException: next on empty iterator