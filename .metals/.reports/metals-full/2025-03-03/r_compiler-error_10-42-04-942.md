file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/service/StorageService.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
offset: 167
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/service/StorageService.java
text:
```scala
package com.lexygraphai.document.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * Interface for document storage operations
 */
public interfa@@ce StorageService {

    /**
     * Store a file and return its storage path
     *
     * @param file The file to store
     * @return A storage path that can be used to retrieve the file later
     */
    String store(MultipartFile file);

    /**
     * Load a file's contents from the given storage path
     *
     * @param storagePath The path to the stored file
     * @return The file content as a byte array
     */
    byte[] load(String storagePath);

    /**
     * Delete a file from storage
     *
     * @param storagePath The path to the stored file to delete
     */
    void delete(String storagePath);
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