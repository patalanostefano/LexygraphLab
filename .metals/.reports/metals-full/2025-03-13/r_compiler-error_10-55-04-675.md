file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/service/DocumentService.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
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

    DocumentBatchResponse findByUserId(String userId, int page, int limit, String sort, String direction);

    ProcessingStatusResponse getDocumentStatus(String userId, UUID documentId);
    
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