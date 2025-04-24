package com.lexygraphai.Agent.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class DocumentService {

    private final DynamoDbDocumentRepository documentRepository;

    public DocumentService(DynamoDbDocumentRepository documentRepository) {
        this.documentRepository = documentRepository;
    }

    public List<String> getDocumentsText(List<String> documentIds) {
        List<String> documents = new ArrayList<>();

        for (String id : documentIds) {
            String content = documentRepository.getDocumentTextById(id);
            if (content == null) {
                throw new DocumentNotFoundException(id);
            }
            documents.add(content);
        }

        return documents;
    }

    public String formatDocumentsForPrompt(List<String> documents) {
        StringBuilder builder = new StringBuilder();
        int count = 1;
        for (String doc : documents) {
            builder.append("Document ").append(count).append(":\n");
            builder.append(doc).append("\n\n");
            count++;
        }
        return builder.toString().trim();
    }

    public String getDocumentText(String documentId) {
        String content = documentRepository.getDocumentTextById(documentId);
        if (content == null || content.isEmpty()) {
            throw new DocumentNotFoundException("Document with ID " + documentId + " not found.");
        }
        return content;
    }

}
