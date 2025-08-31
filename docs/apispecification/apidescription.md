# 1 documents: pdf storage based on the only id and 1 table containing

the yml file containing the simple communication between
the frontend and the storage service:

basic doc memorizing functionality storage + retrieval based on simple ids and we will use supabase for all the databases so you just need to also design a super simple database schema for such user + project + project docs
each proj will have docs which will have titles and id and plain text content

-

for doc longer than 4000char (threshold can be modified) we will (on storage)chunk and embed chunks for that doc and store this again into supabase
on doc text request from agent side with a query if doc longer than threshold best sets of chunks will be returned

# agents:

frontend will call agent service with a simple prompt + ids (variable numb) of documents the user will select to attach to the prompt
the orchestrator will answer with a strategy ie a simple text answer explaining the plan

the frontend will answer again to either confirm ( so a bool?) or modify with additional instruction for the orchestrator

continue like this till: finally the frontend confirm the plan then the orchestrator should again call the api gateway with a variable lenght json payload containing an object like:agent name + prompt for that specific agent
the api gateway should JUST route this json payload to the correspondant agent service and wait for an answer being: just equal but the response of the agent instead of the answer

more precisely the interaction will always be between these services:
-orchestrator-agent(python container: will call the model) OA
-ochestration-service(springboot gateway on top of the python agent, should route all the request) OS
-api-gateway AG
-document-service DS
-other agents(accessible trhough api-gateway)

normal interaction:
-the frontend will call api-gateway with first prompt (intiaial prompt of user)+list of documents ids(selected from frontend)
-api-gateway route this request to the ochestration-service
-orchestration-service calls document service to retrieve text of all the included documents in the list (will go in the context of the orchestrator (translating for titles!!))
-orchestrator-agent will call the model to generate a plan out of the prompt once received answer from model orchestrator-service again via orchestratin-service and api-gateway will go trough frontend to show the plan the the user

(optional step here: the user can even execute proposed plan or modify the structured prompt in some way)
-if user modify plan the structured prompt goes trough AG->OS->OA to receive the STRUCTURED PROMPT

-after this the OA through OS and AG will call other agent that will return (async waiting) wile frontend poll the OS to see wheter we have result or not (important OA will use titles of document to prompt to each agent, OS will translate such titles into actual docids)
-after received the results from all the agents OA will return a small summary to frontend (small)

- structured results of what the agents proposed that will be printed on the canvas instead (OS should again handle this difference of passing)

5. Agent Service Modifications
   Modify your existing agent endpoints to accept the orchestrator format. Update both extraction and search agents to handle:
   json{
   "agentId": "extraction", // or "search"
   "prompt": "specific task prompt",
   "documents": [
   {
   "title": "Document Title",
   "content": "document text content"
   }
   ],
   "executionId": "exec_123",
   "taskId": "task_456"
   }
   Response format:
   json{
   "agentId": "extraction",
   "taskId": "task_456",
   "executionId": "exec_123",
   "response": "agent response",
   "completedAt": "2025-01-01T12:00:00Z"
   }
6. Implementation Flow (Using Existing Infrastructure)
   Phase 1: Plan Creation

Frontend → API Gateway → Orchestrator Service: POST /api/v1/orchestrator/plan
Orchestrator Service → API Gateway → Document Service: GET /api/v1/documents/{user_id}/{project_id}/{doc_id}/text
Orchestrator Service → Orchestrator Agent (Python): Generate plan
Store in existing execution_plans table

Phase 2: Plan Confirmation

Frontend → API Gateway → Orchestrator Service: POST /api/v1/orchestrator/plan/{plan_id}/confirm
Update execution_plans.status and additional_instructions

Phase 3: Execution

Frontend → API Gateway → Orchestrator Service: POST /api/v1/orchestrator/execute
Orchestrator Service creates tasks and calls agents via API Gateway
API Gateway routes to existing Extraction Agent (localhost:8001) and Search Agent (localhost:8002)
Store results in existing execution_results table

Phase 4: Status Polling

Frontend polls API Gateway → Orchestrator Service: GET /api/v1/orchestrator/status/{execution_id}
Return data from execution_results.agent_results JSON field
