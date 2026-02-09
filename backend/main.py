from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.settings import settings
from middleware.logger import logger
from middleware.error_handler import register_exception_handlers

# Import routes
from routes import upload, analyze, interact

def create_app() -> FastAPI:
    app = FastAPI(
        title="Social Media Avatar Analyzer",
        description="API for analyzing YouTube history and generating an AI-Twin avatar",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register Exception Handlers
    register_exception_handlers(app)

    @app.on_event("startup")
    async def startup_event():
        logger.info("Starting up Social Media Avatar Analyzer API...")

    @app.on_event("shutdown")
    async def shutdown_event():
        logger.info("Shutting down API...")

    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "version": "1.0.0"}

    # Register Routes
    app.include_router(upload.router, tags=["Upload"])
    app.include_router(analyze.router, tags=["Analysis"])
    app.include_router(interact.router, tags=["Interaction"])
    
    from websocket import handlers
    app.include_router(handlers.router, tags=["WebSocket"])

    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
