package com.docprocessing.document.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SqsService {

    private final SqsClient sqsClient;
    private final ObjectMapper objectMapper;
    
    @Value("${aws.sqs.parser-queue}")
    private String parserQueueUrl;
    
    public void sendToParserQueue(Map<String, Object> messageBody) {
        try {
            SendMessageRequest sendMessageRequest = SendMessageRequest.builder()
                    .queueUrl(parserQueueUrl)
                    .messageBody(objectMapper.writeValueAsString(messageBody))
                    .messageDeduplicationId(UUID.randomUUID().toString())
                    .messageGroupId("document-processing")
                    .build();
            
            sqsClient.sendMessage(sendMessageRequest);
            log.info("Sent document to parser queue: {}", messageBody.get("documentId"));
        } catch (JsonProcessingException e) {
            log.error("Error serializing message body", e);
            throw new RuntimeException("Failed to send message to queue", e);
        }
    }
}
