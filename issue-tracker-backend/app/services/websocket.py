import json
import asyncio
from typing import Dict, Set, Any
from fastapi import WebSocket
from enum import Enum


class EventType(Enum):
    ISSUE_CREATED = "issue_created"
    ISSUE_UPDATED = "issue_updated"
    ISSUE_DELETED = "issue_deleted"
    USER_LOGGED_IN = "user_logged_in"
    USER_LOGGED_OUT = "user_logged_out"


class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_connections: Dict[str, Set[str]] = (
            {}
        )  # user_id -> set of connection_ids

    async def connect(self, websocket: WebSocket, user_id: str = None):
        await websocket.accept()
        connection_id = id(websocket)
        self.active_connections[str(connection_id)] = websocket

        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = set()
            self.user_connections[user_id].add(str(connection_id))

        # Send welcome message
        await websocket.send_text(
            json.dumps(
                {
                    "type": "connection_established",
                    "message": "Connected to real-time updates",
                    "connection_id": str(connection_id),
                }
            )
        )

        return connection_id

    def disconnect(self, connection_id: str, user_id: str = None):
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]

        if user_id and user_id in self.user_connections:
            self.user_connections[user_id].discard(connection_id)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

    async def broadcast_to_all(self, event_type: EventType, data: Any):
        """Broadcast to all connected clients"""
        message = {
            "type": event_type.value,
            "data": data,
            "timestamp": asyncio.get_event_loop().time(),
        }

        disconnected = []
        for connection_id, websocket in self.active_connections.items():
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                print(f"Error sending to connection {connection_id}: {e}")
                disconnected.append(connection_id)

        # Clean up disconnected connections
        for connection_id in disconnected:
            self.disconnect(connection_id)

    async def broadcast_to_user(self, user_id: str, event_type: EventType, data: Any):
        """Broadcast to specific user's connections"""
        if user_id not in self.user_connections:
            return

        message = {
            "type": event_type.value,
            "data": data,
            "timestamp": asyncio.get_event_loop().time(),
        }

        disconnected = []
        for connection_id in self.user_connections[user_id]:
            if connection_id in self.active_connections:
                try:
                    await self.active_connections[connection_id].send_text(
                        json.dumps(message)
                    )
                except Exception as e:
                    print(
                        f"Error sending to user {user_id} connection {connection_id}: {e}"
                    )
                    disconnected.append(connection_id)

        # Clean up disconnected connections
        for connection_id in disconnected:
            self.disconnect(connection_id, user_id)

    async def send_personal_message(
        self, connection_id: str, event_type: EventType, data: Any
    ):
        """Send message to specific connection"""
        if connection_id not in self.active_connections:
            return

        message = {
            "type": event_type.value,
            "data": data,
            "timestamp": asyncio.get_event_loop().time(),
        }

        try:
            await self.active_connections[connection_id].send_text(json.dumps(message))
        except Exception as e:
            print(f"Error sending personal message to {connection_id}: {e}")
            self.disconnect(connection_id)

    def get_connection_count(self) -> int:
        return len(self.active_connections)

    def get_user_count(self) -> int:
        return len(self.user_connections)


# Global instance
websocket_manager = WebSocketManager()
