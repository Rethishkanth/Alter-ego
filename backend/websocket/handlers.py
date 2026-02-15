from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from .connection_manager import manager

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We don't necessarily expect msg from client in this unidirectional flow for status,
            # but we need to keep the loop open.
            data = await websocket.receive_text()
            # If client sends "ping", we can pong back or ignore.
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        manager.disconnect(websocket)
