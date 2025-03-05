file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/dto/ProcessingSummaryDto.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
offset: 357
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/dto/ProcessingSummaryDto.java
text:
```scala
package com.lexygraphai.document.ProcessRequestDto.java;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for document processing result summary
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessingSummary@@ {
    private String id;
    private String agentId;
    private String agentName;
    private String workflowId;
    private String workflowName;
    private String status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String outputType;
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