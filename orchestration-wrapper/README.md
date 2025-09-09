# orchestration-wrapper

A lightweight FastAPI middleware between your **orchestration-service** and downstream agents.
It translates, filters, and normalizes requests/responses with timeouts, retries, and JSON logging.

## Env via docker-compose
Configure env vars directly in `docker-compose.yml` under the service `environment:` block:
- WRAPPER_PORT
- SEARCH_AGENT_URL
- EXTRACTION_AGENT_URL
- GENERATION_AGENT_URL
- REQUEST_TIMEOUT_SECONDS
- RETRY_ATTEMPTS
- ALLOWED_ORIGINS

> Note: The `.env.example` file has been removed. Use compose `environment:` or a real `.env` only if you explicitly reference it.
