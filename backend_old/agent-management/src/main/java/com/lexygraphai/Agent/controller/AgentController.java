package com.lexygraphai.Agent.controller;

import com.lexygraphai.Agent.dto.Agent;
import com.lexygraphai.Agent.dto.AgentInvocationResponse;
import com.lexygraphai.Agent.dto.AgentRequest;
import com.lexygraphai.Agent.dto.AgentResponse;
import com.lexygraphai.Agent.service.AgentService;
import com.lexygraphai.Agent.service.DocumentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/agents")
public class AgentController {

    private final AgentService agentService;
    private final DocumentService documentService;
    public Object output;
    //private final BedrockClient bedrockClient; // Assume you have a BedrockClient for actual model inference

    public AgentController(AgentService agentService,
                           DocumentService documentService)
                           //BedrockClient bedrockClient)
    {
        this.agentService = agentService;
        this.documentService = documentService;
        //this.bedrockClient = bedrockClient;
    }

    @PostMapping("/custom")
    public ResponseEntity<AgentResponse> createCustomAgent(@RequestBody AgentService.CreateCustomAgentRequest request) {
        Agent agent = agentService.isCustomAgent(request);
        assert AgentResponse.from(agent) != null;
        return ResponseEntity.status(HttpStatus.CREATED).body(AgentResponse.from(agent));
    }

    @PostMapping("/invoke")
    public ResponseEntity<RequestResponseDto.java> invokeAgent(@RequestBody AgentRequest request) {
        Agent agent = agentService.getAgentById(request.getAgentId());
        List<String> documentTexts = documentService.getDocumentsText(request.getDocumentIds());

        String prompt = agentService.buildFinalPrompt(agent, request.getPrompt());
        String fullInput = prompt + "\n\n" + documentService.formatDocumentsForPrompt(documentTexts);

       // String output = bedrockClient.invokeModel(agent.getBaseType(), fullInput);

        AgentInvocationResponse response;
        response = new AgentInvocationResponse(
                "exec-" + UUID.randomUUID(), // executionId
                agent.getId(),
                output,
                request.getDocumentIds(),
                Instant.now()
        );

        return response.notify(response);
    }
}