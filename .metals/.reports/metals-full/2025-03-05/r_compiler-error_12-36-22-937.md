file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/exception/DocumentNotFoundException.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
offset: 147
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/exception/DocumentNotFoundException.java
text:
```scala
package com.lexygraphai.document.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseSta@@tus;

/**
 * Exception thrown when a document cannot be found
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class DocumentNotFoundException extends RuntimeException {
    
    public DocumentNotFoundException(String message) {
        super(message);
    }
    
    public DocumentNotFoundException(String message, Throwable cause) {
        super(message, cause);
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