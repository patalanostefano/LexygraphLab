file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/service/DocumentService.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
offset: 1035
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/service/DocumentService.java
text:
```scala
package com.docprocessing.document.service;

import com.docprocessing.document.model.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface DocumentService {
    DocumentSubmissionResponse submitDocument(String userId, 
                                             MultipartFile file,
                                             String name,
                                             String description,
                                             UUID collectionId,
                                             String processingType,
                                             String processingOptions,
                                             String priority,
                                             String language);
                                             
    Document getDocument(String userId, UUID documentId);
    List<Document> findByUserId(String userId, int page, int size, String sortBy, String order);

    ProcessingStatusResponse getDocumentStatus(Stri@@ng userId, UUID documentId);
    
    Document updateDocument(String userId, UUID documentId, Document documentUpdate);
    
    void deleteDocument(String userId, UUID documentId);
    
    ExtractedTextResponse getExtractedText(String userId, UUID documentId, Integer page, String format);
    
    SummaryResponse getDocumentSummary(String userId, UUID documentId, Integer maxLength);
    
    EntitiesResponse getDocumentEntities(String userId, UUID documentId, String[] types);
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