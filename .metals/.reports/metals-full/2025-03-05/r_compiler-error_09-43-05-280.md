file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/dto/DocumentResponseDto.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
offset: 340
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/dto/DocumentResponseDto.java
text:
```scala
package com.lexygraphai.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Data Transfer Object for document details
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentRespon@@se {
    private String id;
    private String name;
    private String description;
    private LocalDateTime uploadDate;
    private LocalDateTime lastModifiedDate;
    private Long size;
    private String mimeType;
    private String status;
    private List<String> tags;
    private String collectionId;
    private String procedureId;
    private String summary;
    private List<ProcessingSummary> processingResults;
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