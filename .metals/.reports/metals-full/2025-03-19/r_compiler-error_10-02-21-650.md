file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/model/Document.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
offset: 0
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/docprocessing/document/model/Document.java
text:
```scala
@@package com.docprocessing.document.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Document {
    private UUID id;
    private String name;
    private String description;
    private String userId;
    private UUID collectionId;
    private String status;
    private String mimeType;
    private Long size;
    private Instant uploadedAt;
    private Instant updatedAt;
    private String processingType;
    private Integer pageCount;
    private String language;
    private Boolean hasEntities;
    private Boolean hasSummary;
    private List<String> tags;
    private String originalFilename;
    
    @JsonIgnore
    private String fileKey;
    
    private String thumbnailUrl;
    
    private ProcessingDetails processingDetails;
    private Content content;
    
    @DynamoDbPartitionKey
    @JsonIgnore
    public String getPK() {
        return "doc#" + id.toString();
    }
    
    @DynamoDbSortKey
    @JsonIgnore
    public String getSK() {
        return "metadata";
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProcessingDetails {
        private String contentType;
        private String language;
        private Float confidence;
        private String extractionMethod;
        private Long processingTime;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Content {
        private String preview;
        private String summaryPreview;
        private String downloadUrl;
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