from fastapi import WebSocket
from typing import List
from middleware.logger import logger
import json
from .events import WSMessage

class ConnectionManager:
    """
    Manages active WebSocket connections and broadcasts messages.
    Singleton pattern usage recommended.
    """
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: WSMessage):
        """Sends a message to all connected clients."""
        payload = message.to_json()
        to_remove = []
        for connection in self.active_connections:
            try:
                await connection.send_json(payload)
            except Exception as e:
                logger.warning(f"Error sending to WS client: {e}")
                to_remove.append(connection)
        
        for conn in to_remove:
            self.disconnect(conn)

manager = ConnectionManager()
