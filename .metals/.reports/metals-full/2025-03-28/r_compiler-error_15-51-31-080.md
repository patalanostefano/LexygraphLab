file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/model/DocumentMetadata.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
offset: 227
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/model/DocumentMetadata.java
text:
```scala
package com.docprocessing.document.model;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class DocumentMetadata {
    private UUID id;
    private String name;
@@    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long size;
    private String mimeType;
    private String status;
    private String processingType;
    private UUID collectionId;
    private Boolean hasSummary;
    private Boolean hasEntities;
    private Integer pageCount;
    private String thumbnailUrl;
    private String viewUrl;
    private List<String> tags;
    private String originalFilename;
    private String userId;
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