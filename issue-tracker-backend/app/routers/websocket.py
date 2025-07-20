from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.websocket import websocket_manager, EventType
import json
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    connection_id = None

    try:
        # Accept the connection
        await websocket.accept()
        connection_id = str(id(websocket))
        websocket_manager.active_connections[connection_id] = websocket

        # Send connection established message
        await websocket.send_text(
            json.dumps(
                {
                    "type": "connection_established",
                    "message": "Connected to real-time updates",
                    "connection_id": connection_id,
                }
            )
        )

        logger.info(f"WebSocket connected: {connection_id}")

        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for messages from client
                data = await websocket.receive_text()
                message = json.loads(data)

                # Handle ping/pong for connection health
                if message.get("type") == "ping":
                    await websocket.send_text(
                        json.dumps(
                            {"type": "pong", "timestamp": message.get("timestamp")}
                        )
                    )

            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected: {connection_id}")
                break
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
                await websocket.send_text(
                    json.dumps({"type": "error", "message": "Internal server error"})
                )

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected during connection: {connection_id}")
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
    finally:
        # Clean up connection
        if connection_id:
            websocket_manager.disconnect(connection_id)
            logger.info(f"Cleaned up WebSocket connection: {connection_id}")


@router.get("/ws/status")
async def websocket_status():
    """Get WebSocket connection status"""
    return {
        "active_connections": websocket_manager.get_connection_count(),
        "active_users": websocket_manager.get_user_count(),
        "status": "running",
    }
