error id: file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/model/DocumentStatus.java
file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/model/DocumentStatus.java
### com.thoughtworks.qdox.parser.ParseException: syntax error @[3,8]

error in qdox parser
file content:
```java
offset: 49
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/model/DocumentStatus.java
text:
```scala
package com.lexygraphai.document.model;

public p@@ackage com.lexygraphai.document.model;

/**
 * Represents the processing status of a document
 */
public enum DocumentStatus {
    PENDING,    // Document is uploaded but not yet processed
    PROCESSING, // Document is currently being processed
    COMPLETED,  // Document processing is successfully completed
    FAILED      // Document processing failed
}
 {
    
}

```

```



#### Error stacktrace:

```
com.thoughtworks.qdox.parser.impl.Parser.yyerror(Parser.java:2025)
	com.thoughtworks.qdox.parser.impl.Parser.yyparse(Parser.java:2147)
	com.thoughtworks.qdox.parser.impl.Parser.parse(Parser.java:2006)
	com.thoughtworks.qdox.library.SourceLibrary.parse(SourceLibrary.java:232)
	com.thoughtworks.qdox.library.SourceLibrary.parse(SourceLibrary.java:190)
	com.thoughtworks.qdox.library.SourceLibrary.addSource(SourceLibrary.java:94)
	com.thoughtworks.qdox.library.SourceLibrary.addSource(SourceLibrary.java:89)
	com.thoughtworks.qdox.library.SortedClassLibraryBuilder.addSource(SortedClassLibraryBuilder.java:162)
	com.thoughtworks.qdox.JavaProjectBuilder.addSource(JavaProjectBuilder.java:174)
	scala.meta.internal.mtags.JavaMtags.indexRoot(JavaMtags.scala:48)
	scala.meta.internal.metals.SemanticdbDefinition$.foreachWithReturnMtags(SemanticdbDefinition.scala:97)
	scala.meta.internal.metals.Indexer.indexSourceFile(Indexer.scala:485)
	scala.meta.internal.metals.Indexer.$anonfun$reindexWorkspaceSources$3(Indexer.scala:583)
	scala.meta.internal.metals.Indexer.$anonfun$reindexWorkspaceSources$3$adapted(Indexer.scala:580)
	scala.collection.IterableOnceOps.foreach(IterableOnce.scala:619)
	scala.collection.IterableOnceOps.foreach$(IterableOnce.scala:617)
	scala.collection.AbstractIterator.foreach(Iterator.scala:1306)
	scala.meta.internal.metals.Indexer.reindexWorkspaceSources(Indexer.scala:580)
	scala.meta.internal.metals.MetalsLspService.$anonfun$onChange$2(MetalsLspService.scala:927)
	scala.runtime.java8.JFunction0$mcV$sp.apply(JFunction0$mcV$sp.scala:18)
	scala.concurrent.Future$.$anonfun$apply$1(Future.scala:687)
	scala.concurrent.impl.Promise$Transformation.run(Promise.scala:467)
	java.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1136)
	java.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:635)
	java.base/java.lang.Thread.run(Thread.java:840)
```
#### Short summary: 

QDox parse error in file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/model/DocumentStatus.java