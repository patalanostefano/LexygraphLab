# Agent Management Service - README
## Overview
The Agent Management Service is a lightweight Spring Boot application that interfaces with AWS Bedrock agents for legal document processing. It provides a simple API to:

## List available agents
each agent has a base type among:

extraction agents,

generation agents,

form filling agents,

orchestration agents,

orchestration agents,

 

 

the frontend will poll one or more of these agents of USE task with:

a prompt of the user

 

a set of documents id (stored in dynamo)


the frontend will poll for the creation of a new agent but a new agent wouldnt be created really , instead it will just be one of them + a custom base prompt from the user, this configuration should be just saved from the agent-management service inside dynamo as name of the agent, custom prompt, base type of the agent

 

the frontend will then be able to use this kind of new agents calling them by name in the same way it calls the others and the backend agent-management-service will do the rest ie translating this call to the actual agent attaching the actual prompt


of course the backend should then route back to the frontend the response

 

## Project Structure
agent-management-service/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── lexygraphai/
│   │   │           └── agent/
│   │   │               ├── AgentManagementServiceApplication.java
│   │   │               ├── config/
│   │   │               │   ├── AwsConfig.java
│   │   │               │   └── SecurityConfig.java
│   │   │               ├── controller/
│   │   │               │   └── AgentController.java
│   │   │               ├── dto/
│   │   │               │   ├── AgentDto.java
│   │   │               │   └── RequestResponseDto.java
│   │   │               ├── exception/
│   │   │               │   ├── AgentNotFoundException.java
│   │   │               │   ├── DocumentNotFoundException.java
│   │   │               │   └── GlobalExceptionHandler.java
│   │   │               ├── model/
│   │   │               │   ├── Agent.java
│   │   │               │   └── AgentType.java
│   │   │               ├── repository/
│   │   │               │   └── AgentRepository.java
│   │   │               └── service/
│   │   │                   ├── AgentService.java
│   │   │                   └── DocumentService.java
│   │   └── resources/
│   │       └── application.yml
│   └── test/
│       └── java/
│           └── com/
│               └── lexygraphai/
│                   └── agent/
│                       ├── controller/
│                       │   └── AgentControllerTest.java
│                       └── service/
│                           └── AgentServiceTest.java
├── Dockerfile
├── docker-compose.yml
├── pom.xml
└── README.md


## Getting Started
Prerequisites
Java 17+
Maven
Docker and Docker Compose
AWS account with access to Bedrock service

Configuration
Create an application.yml file with the following settings:


server:
  port: 8083
  servlet:
    context-path: /api/v1

spring:
  application:
    name: agent-management-service

aws:
  region: us-east-1
  credentials:
    access-key: ${AWS_ACCESS_KEY_ID}
    secret-key: ${AWS_SECRET_ACCESS_KEY}
  dynamodb:
    endpoint: ${DYNAMODB_ENDPOINT:}
    table-name: ${AGENT_TABLE_NAME:agents}
    document-table-name: ${DOCUMENT_TABLE_NAME:documents}

security:
  jwt:
    secret: ${JWT_SECRET:default-secret-key}
Building the Service

mvn clean package


## Running with Docker

Build Docker image:

docker build -t agent-management-service .

Run the service:

docker run -p 8083:8083 \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=your-access-key \
  -e AWS_SECRET_ACCESS_KEY=your-secret-key \
  -e DYNAMODB_ENDPOINT=http://dynamodb:8000 \
  -e AGENT_TABLE_NAME=agents \
  -e DOCUMENT_TABLE_NAME=documents \
  -e JWT_SECRET=your-jwt-secret \
  agent-management-service


## Docker Compose Setup
Create a docker-compose.yml file:


version: '3.8'

services:
  agent-management-service:
    build: .
    ports:
      - "8083:8083"
    environment:
      - AWS_REGION=us-east-1
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - DYNAMODB_ENDPOINT=http://dynamodb:8000
      - AGENT_TABLE_NAME=agents
      - DOCUMENT_TABLE_NAME=documents
      - JWT_SECRET=your-jwt-secret
    depends_on:
      - dynamodb

  dynamodb:
    image: amazon/dynamodb-local
    ports:
      - "8000:8000"
    command: "-jar DynamoDBLocal.jar -sharedDb -dbPath /data"
    volumes:
      - dynamodb-data:/data

volumes:
  dynamodb-data:


Run with:


docker-compose up -d




## Testing the API
Create a Custom Agent

curl -X POST http://localhost:8083/api/v1/agents/custom \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Contract Analyzer",
    "description": "Extracts key clauses from legal contracts",
    "baseType": "EXTRACTION",
    "customPrompt": "Analyze the following legal contract and extract the following information: parties involved, effective date, termination clauses, and liability clauses."
  }'



Response:


{
  "id": "cust-f47ac10b-58cc",
  "name": "Contract Analyzer",
  "description": "Extracts key clauses from legal contracts",
  "type": "EXTRACTION",
  "isCustom": true,
  "baseType": "EXTRACTION",
  "customPrompt": "Analyze the following legal contract and extract the following information: parties involved, effective date, termination clauses, and liability clauses.",
  "createdAt": "2023-09-22T12:00:00Z"
}



Invoke an Agent with Documents

curl -X POST http://localhost:8083/api/v1/agents/invoke \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "agentId": "cust-f47ac10b-58cc",
    "prompt": "Identify all liability clauses in these contracts",
    "documentIds": [
      "d290f1ee-6c54-4b01-90e6-d701748f0851",
      "d290f1ee-6c54-4b01-90e6-d701748f0852"
    ]
  }'



Response:


{
  "executionId": "exec-7b0a43e8-9c21",
  "agentId": "cust-f47ac10b-58cc",
  "result": "I found the following liability clauses:\n\n1. Document 1 (Contract A):\n   * Section 8.2: \"Neither party shall be liable for any indirect, special, incidental, or consequential damages...\"\n   * Section 8.5: \"Total liability shall not exceed the amounts paid under this agreement...\"\n\n2. Document 2 (Contract B):\n   * Section 7.1: \"Each party shall indemnify and hold harmless the other party...\"\n   * Section 7.3: \"Liability is capped at twice the contract value...\"\n\nThe key difference is that Contract B has a higher liability cap (2x contract value) compared to Contract A (1x contract value).",
  "documentIds": [
    "d290f1ee-6c54-4b01-90e6-d701748f0851",
    "d290f1ee-6c54-4b01-90e6-d701748f0852"
  ],
  "timestamp": "2023-09-22T12:15:30Z"
}



## Implementation Notes
How Agent Invocation Works
When a request comes to /agents/invoke:

The service identifies the agent (system or custom)
For custom agents, it retrieves the base agent type and custom prompt
It retrieves document content from DynamoDB using document IDs
For AWS Bedrock Integration:

The service uses AWS SDK to communicate with Bedrock
For custom agents, it combines the custom prompt with the user prompt
It includes document content in the agent input
Document Integration:

The service fetches document references from DynamoDB
It includes the document text in the prompt sent to the agent
For multiple documents, it clearly delineates each document in the prompt
Agent Storage
Custom agents are stored in DynamoDB with the following attributes:

id: Unique identifier (prefixed with "cust-" for custom agents)
name: Display name
description: Purpose description
baseType: The underlying agent type
customPrompt: The specialized prompt template
createdAt: Timestamp