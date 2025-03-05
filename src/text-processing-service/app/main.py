from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.api import chunking, summarization

app = FastAPI(
    title="LexygraphAI Text Processing Service",
    description="API for document chunking and summarization",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chunking.router, prefix="/api/v1", tags=["chunking"])
app.include_router(summarization.router, prefix="/api/v1", tags=["summarization"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8083, reload=True)
