file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/repository/DocumentRepository.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
offset: 515
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/repository/DocumentRepository.java
text:
```scala
package com.lexygraphai.document.repository;

import com.lexygraphai.document.model.Document;
import com.lexygraphai.document.model.DocumentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Re@@pository
public interface DocumentRepository extends JpaRepository<Document, UUID> {

    // Find all documents with a specific tag
    @Query("SELECT d FROM Document d JOIN d.tags t WHERE t = :tag")
    Page<Document> findByTag(@Param("tag") String tag, Pageable pageable);

    // Find documents by status
    Page<Document> findByStatus(DocumentStatus status, Pageable pageable);

    // Find documents by collection ID
    Page<Document> findByCollectionId(UUID collectionId, Pageable pageable);

    // Find documents by a combination of tag, status, and collection ID
    @Query("SELECT DISTINCT d FROM Document d LEFT JOIN d.tags t WHERE " +
           "(:tag IS NULL OR t = :tag) AND " +
           "(:status IS NULL OR d.status = :status) AND " +
           "(:collectionId IS NULL OR d.collectionId = :collectionId)")
    Page<Document> findByTagAndStatusAndCollectionId(
            @Param("tag") String tag,
            @Param("status") DocumentStatus status,
            @Param("collectionId") UUID collectionId,
            Pageable pageable
    );

    // Count documents in a collection
    Long countByCollectionId(UUID collectionId);
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