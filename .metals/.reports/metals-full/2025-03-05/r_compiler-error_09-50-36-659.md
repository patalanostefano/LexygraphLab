file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/model/DocumentChunk.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
offset: 791
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/model/DocumentChunk.java
text:
```scala
package com.lexygraphai.document.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSecondaryPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

/**
 * Represents a chunk of text extracted from a document
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class DocumentChunk {

    private String documentId;
    private String chunkId;
    private String userId;
    private String content;
    private@@ String section;
    private Integer pageNumber;
    private Integer order;
    private byte[] embedding;

    @DynamoDbPartitionKey
    public String getDocumentId() {
        return documentId;
    }

    @DynamoDbSortKey
    public String getChunkId() {
        return chunkId;
    }
    
    @DynamoDbSecondaryPartitionKey(indexNames = {"UserChunksIndex"})
    public String getUserId() {
        return userId;
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