file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/service/CollectionServiceImpl.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/service/CollectionServiceImpl.java
text:
```scala
package com.lexygraphai.document.service;

import com.lexygraphai.document.dto.CollectionRequest;
import com.lexygraphai.document.dto.CollectionResponse;
import com.lexygraphai.document.exception.CollectionNotFoundException;
import com.lexygraphai.document.model.Collection;
import com.lexygraphai.document.repository.CollectionRepository;
import com.lexygraphai.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class CollectionServiceImpl implements CollectionService {

    private final CollectionRepository collectionRepository;
    private final DocumentRepository documentRepository;

    @Override
    @Transactional
    public CollectionResponse createCollection(CollectionRequest request) {
        Collection collection = Collection.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();
        
        collection = collectionRepository.save(collection);
        
        log.info("Collection created: {}", collection.getId());
        
        return mapToCollectionResponse(collection, 0);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CollectionResponse> findCollections(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "name"));
        
        // Find all collections with their document counts
        List<Object[]> collectionsWithCount = collectionRepository.findCollectionsWithDocumentCount();
        
        // Convert to map of collection ID to document count
        Map<UUID, Long> documentCountMap = new HashMap<>();
        for (Object[] result : collectionsWithCount) {
            Collection collection = (Collection) result[0];
            Long count = (Long) result[1];
            documentCountMap.put(collection.getId(), count);
        }
        
        // Get the page of collections
        Page<Collection> collectionsPage = collectionRepository.findAll(pageRequest);
        
        // Convert to response DTOs with document counts
        List<CollectionResponse> responseList = collectionsPage.getContent().stream()
                .map(collection -> mapToCollectionResponse(
                        collection, 
                        documentCountMap.getOrDefault(collection.getId(), 0L).intValue()))
                .toList();
        
        return new PageImpl<>(
                responseList, 
                pageRequest, 
                collectionsPage.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public CollectionResponse getCollectionById(UUID collectionId) {
        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new CollectionNotFoundException("Collection not found with ID: " + collectionId));
        
        long documentCount = documentRepository.countByCollectionId(collectionId);
        
        return mapToCollectionResponse(collection, (int) documentCount);
    }
    
    private CollectionResponse mapToCollectionResponse(Collection collection, int documentCount) {
        CollectionResponse response = new CollectionResponse();
        response.setId(collection.getId());
        response.setName(collection.getName());
        response.setDescription(collection.getDescription());
        response.setCreationDate(collection.getCreationDate());
        response.setDocumentCount(documentCount);
        
        return response;
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