package com.lexygraphai.document.repository;

import com.lexygraphai.document.model.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CollectionRepository extends JpaRepository<Collection, UUID> {

    // Find collections with document count
    @Query("SELECT c, COUNT(d) FROM Collection c LEFT JOIN Document d ON d.collectionId = c.id GROUP BY c.id")
    List<Object[]> findCollectionsWithDocumentCount();
}
