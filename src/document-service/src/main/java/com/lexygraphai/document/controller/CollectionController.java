package com.lexygraphai.document.controller;

import com.lexygraphai.document.dto.CollectionRequest;
import com.lexygraphai.document.dto.CollectionResponse;
import com.lexygraphai.document.service.CollectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/collections")
@Tag(name = "collections", description = "Document collection operations")
@RequiredArgsConstructor
public class CollectionController {

    private final CollectionService collectionService;

    @PostMapping
    @Operation(
        summary = "Create a document collection",
        description = "Create a new collection to organize documents",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "201", description = "Collection created")
    @ApiResponse(responseCode = "400", description = "Invalid input")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    public ResponseEntity<CollectionResponse> createCollection(
            @Valid @RequestBody CollectionRequest collectionRequest) {
        
        CollectionResponse collection = collectionService.createCollection(collectionRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(collection);
    }

    @GetMapping
    @Operation(
        summary = "List collections",
        description = "Get a list of document collections",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "List of collections")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    public ResponseEntity<Page<CollectionResponse>> listCollections(
            @Parameter(description = "Page number for pagination") 
            @RequestParam(defaultValue = "0") int page,
            
            @Parameter(description = "Page size for pagination") 
            @RequestParam(defaultValue = "20") int size) {
        
        Page<CollectionResponse> collections = collectionService.findCollections(page, size);
        return ResponseEntity.ok(collections);
    }
}
