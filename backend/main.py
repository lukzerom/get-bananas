#!/usr/bin/env python3
"""
Gemini Live API Backend Service

A FastAPI backend service that handles Gemini Live API connections via WebSocket,
providing real-time speech recognition and product detection for shopping lists.

Features:
- WebSocket connections from React Native clients
- Gemini Live API integration with function calling
- Session management for multiple users
- Audio streaming and processing
- Product detection with confidence scoring
- Error handling and reconnection logic
"""

import asyncio
import json
import logging
import os
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Set
import base64

import websockets
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Data models
class ShoppingListItem(BaseModel):
    name: str
    quantity: float = 1
    unit: Optional[str] = None
    category: str = "Ogólne"

class ShoppingListState(BaseModel):
    items: List[ShoppingListItem]
    conversation_context: str = ""
    last_update: float
    confidence: float = 0.8

class ProductDetection(BaseModel):
    id: str
    name: str
    action: str  # "add" or "remove"
    quantity: int = 1
    unit: Optional[str] = None
    category: str = "Ogólne"
    confidence: float
    timestamp: float

# Session data for serialization (no WebSocket objects)
class UserSessionData(BaseModel):
    user_id: str
    is_connected: bool = False
    created_at: datetime
    last_activity: datetime

# Session manager that includes WebSocket connections (not serializable)
class UserSession:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.websocket: Optional[WebSocket] = None
        self.gemini_service: Optional[GeminiLiveService] = None
        self.is_connected = False
        self.created_at = datetime.now()
        self.last_activity = datetime.now()
        self.shopping_list_state = ShoppingListState(
            items=[],
            last_update=datetime.now().timestamp()
        )
    
    def to_data(self) -> UserSessionData:
        """Convert to serializable data model"""
        return UserSessionData(
            user_id=self.user_id,
            is_connected=self.is_connected,
            created_at=self.created_at,
            last_activity=self.last_activity
        )

# Global state
app = FastAPI(title="Gemini Live API Backend", version="1.0.0")
active_sessions: Dict[str, UserSession] = {}
gemini_api_key = os.getenv("GEMINI_API_KEY")

if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY environment variable is required")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GeminiLiveService:
    """Handles Gemini Live API WebSocket connections"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.websocket = None
        self.is_connected = False
        self.message_count = 0
        
    async def connect(self):
        """Connect to Gemini Live API"""
        try:
            # Gemini Live API WebSocket URL
            ws_url = f"wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key={self.api_key}"
            
            logger.info(f"Connecting to Gemini Live API: {ws_url}")
            self.websocket = await websockets.connect(ws_url)
            self.is_connected = True
            
            # Send setup message
            await self._send_setup_message()
            logger.info("Gemini Live API connection established")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to Gemini Live API: {e}")
            self.is_connected = False
            return False
    
    async def _send_setup_message(self):
        """Send initial setup message to Gemini Live API"""
        setup_message = {
            "setup": {
                "model": "models/gemini-2.0-flash-exp",
                "systemInstruction": {
                    "parts": [{
                        "text": """Jesteś polskim asystentem zakupów. Słuchaj polskiej mowy i zarządzaj kompletną listą zakupów.

WAŻNE: Zawsze zwracaj CAŁĄ aktualną listę zakupów, nie tylko zmiany.

Przykłady:
- Użytkownik: "Dodaj mleko" → Zwróć: [{name: "mleko", quantity: 1}]
- Użytkownik: "Dodaj jeszcze mleko" → Zwróć: [{name: "mleko", quantity: 2}]  
- Użytkownik: "Dodaj cebulę" → Zwróć: [{name: "mleko", quantity: 2}, {name: "cebula", quantity: 1}]
- Użytkownik: "Usuń mleko" → Zwróć: [{name: "cebula", quantity: 1}]
- Użytkownik: "Właściwie 3 cebule" → Zwróć: [{name: "cebula", quantity: 3}]

Rozumiej kontekst konwersacji i operuj na całej liście."""
                    }]
                },
                "tools": [{
                    "functionDeclarations": [{
                        "name": "update_shopping_list",
                        "description": "Zaktualizuj całą listę zakupów na podstawie rozmowy",
                        "parameters": {
                            "type": "OBJECT",
                            "properties": {
                                "items": {
                                    "type": "ARRAY",
                                    "items": {
                                        "type": "OBJECT",
                                        "properties": {
                                            "name": {"type": "STRING"},
                                            "quantity": {"type": "NUMBER", "default": 1},
                                            "unit": {"type": "STRING"},
                                            "category": {"type": "STRING", "default": "Ogólne"}
                                        },
                                        "required": ["name", "quantity"]
                                    }
                                },
                                "confidence": {"type": "NUMBER", "default": 0.8}
                            },
                            "required": ["items"]
                        }
                    }]
                }]
            }
        }
        
        await self.websocket.send(json.dumps(setup_message))
        logger.info("Setup message sent to Gemini Live API")
    
    async def send_audio_chunk(self, audio_data: str):
        """Send audio chunk to Gemini Live API"""
        if not self.is_connected or not self.websocket:
            logger.warning("Cannot send audio - not connected to Gemini")
            return
            
        audio_message = {
            "realtimeInput": {
                "mediaChunks": [{
                    "mimeType": "audio/pcm",
                    "data": audio_data
                }]
            }
        }
        
        try:
            await self.websocket.send(json.dumps(audio_message))
            logger.debug(f"Audio chunk sent to Gemini ({len(audio_data)} chars)")
        except Exception as e:
            logger.error(f"Failed to send audio chunk: {e}")
    
    async def listen_for_responses(self, client_websocket: WebSocket):
        """Listen for responses from Gemini Live API and forward to client"""
        try:
            async for message in self.websocket:
                self.message_count += 1
                logger.debug(f"Received message #{self.message_count} from Gemini")
                
                try:
                    data = json.loads(message)
                    await self._handle_gemini_message(data, client_websocket)
                except json.JSONDecodeError:
                    logger.error("Failed to parse message from Gemini")
                except Exception as e:
                    logger.error(f"Error handling Gemini message: {e}")
                    
        except websockets.exceptions.ConnectionClosed:
            logger.info("Gemini WebSocket connection closed")
            self.is_connected = False
        except Exception as e:
            logger.error(f"Error listening to Gemini responses: {e}")
            self.is_connected = False
    
    async def _handle_gemini_message(self, data: dict, client_websocket: WebSocket):
        """Handle different types of messages from Gemini Live API"""
        
        logger.debug(f"🔍 Processing Gemini message: {list(data.keys())}")
        
        # Setup completion
        if data.get("setupComplete"):
            logger.info("✅ Gemini setup completed successfully")
            await client_websocket.send_json({
                "type": "status",
                "status": "listening",
                "message": "Gemini Live API ready"
            })
            return
        
        # Server content (text responses)
        if "serverContent" in data:
            content = data["serverContent"]
            logger.info(f"📝 Gemini server content received: {content}")
            if "parts" in content:
                for part in content["parts"]:
                    if "text" in part:
                        logger.info(f"📝 Gemini text response: {part['text']}")
                        await client_websocket.send_json({
                            "type": "transcript",
                            "text": part["text"],
                            "isUser": False
                        })
        
        # Tool calls (function calls)
        if "toolCall" in data:
            tool_call = data["toolCall"]
            logger.info(f"🔧 Gemini tool call received: {tool_call}")
            if "functionCalls" in tool_call:
                for func_call in tool_call["functionCalls"]:
                    logger.info(f"🔧 Function call: {func_call}")
                    if func_call["name"] == "update_shopping_list":
                        logger.info(f"🛍️ Processing shopping list update")
                        await self._handle_shopping_list_update(func_call, client_websocket)
                        
                        # Send function response back to Gemini
                        await self._send_function_response(func_call.get("id"), {"result": "success"})
    
    async def _handle_shopping_list_update(self, func_call: dict, client_websocket: WebSocket):
        """Handle shopping list update from Gemini function call"""
        args = func_call.get("args", {})
        items_data = args.get("items", [])
        confidence = args.get("confidence", 0.8)
        
        # Convert to ShoppingListItem objects
        items = []
        for item_data in items_data:
            item = ShoppingListItem(
                name=item_data.get("name", "unknown"),
                quantity=item_data.get("quantity", 1),
                unit=item_data.get("unit"),
                category=item_data.get("category", "Ogólne")
            )
            items.append(item)
        
        # Create shopping list state
        shopping_list_state = ShoppingListState(
            items=items,
            last_update=datetime.now().timestamp(),
            confidence=confidence
        )
        
        logger.info(f"🛒 [CONVERSATION] Shopping list updated: {len(items)} items")
        for item in items:
            logger.info(f"  - {item.name}: {item.quantity} {item.unit or ''}")
        
        # Send complete shopping list to client
        await client_websocket.send_json({
            "type": "shopping_list_updated",
            "shopping_list": shopping_list_state.dict()
        })
    
    async def _send_function_response(self, call_id: str, result: dict):
        """Send function response back to Gemini"""
        if not self.is_connected or not self.websocket:
            return
            
        response = {
            "toolResponse": {
                "functionResponses": [{
                    "name": "update_shopping_list",
                    "id": call_id,
                    "response": result
                }]
            }
        }
        
        try:
            await self.websocket.send(json.dumps(response))
            logger.debug("Function response sent to Gemini")
        except Exception as e:
            logger.error(f"Failed to send function response: {e}")
    
    async def disconnect(self):
        """Disconnect from Gemini Live API"""
        if self.websocket:
            await self.websocket.close()
        self.is_connected = False
        logger.info("Disconnected from Gemini Live API")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Gemini Live API Backend",
        "status": "running",
        "active_sessions": len(active_sessions),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "gemini_api_configured": bool(gemini_api_key),
        "active_sessions": len(active_sessions),
        "uptime": "running"
    }

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for client connections"""
    await websocket.accept()
    logger.info(f"WebSocket connection accepted for user: {user_id}")
    
    # Create or update user session
    session = UserSession(user_id)
    session.websocket = websocket
    session.is_connected = True
    active_sessions[user_id] = session
    
    # Create Gemini service instance
    gemini_service = GeminiLiveService(gemini_api_key)
    
    try:
        # Connect to Gemini Live API
        if await gemini_service.connect():
            # Start listening for Gemini responses in the background
            gemini_task = asyncio.create_task(
                gemini_service.listen_for_responses(websocket)
            )
            
            # Main message handling loop
            while True:
                try:
                    # Receive message from client
                    data = await websocket.receive_json()
                    message_type = data.get("type")
                    
                    # Update last activity
                    session.last_activity = datetime.now()
                    
                    if message_type == "audio_chunk":
                        # Forward audio to Gemini
                        audio_data = data.get("audio_data")
                        timestamp = data.get("timestamp", datetime.now().timestamp())
                        
                        if audio_data:
                            logger.info(f"🎙️ [REAL AUDIO] Received audio chunk from React Native: {len(audio_data)} chars (timestamp: {timestamp})")
                            
                            # Send to Gemini Live API
                            await gemini_service.send_audio_chunk(audio_data)
                            
                            # Optional: Send back confirmation that audio was received
                            await websocket.send_json({
                                "type": "audio_received",
                                "timestamp": timestamp,
                                "chunk_size": len(audio_data)
                            })
                        else:
                            logger.warning("⚠️ Received audio_chunk message but no audio_data")
                    
                    elif message_type == "start_session":
                        logger.info(f"🎯 Starting session for user: {user_id}")
                        await websocket.send_json({
                            "type": "session_started",
                            "user_id": user_id,
                            "message": "Session started successfully"
                        })
                        logger.info(f"✅ Session started successfully for user: {user_id}")
                    
                    elif message_type == "stop_session":
                        await websocket.send_json({
                            "type": "session_stopped",
                            "message": "Session stopped"
                        })
                        break
                    
                    elif message_type == "ping":
                        logger.debug(f"🏓 Ping received from user: {user_id}")
                        await websocket.send_json({
                            "type": "pong",
                            "timestamp": datetime.now().isoformat()
                        })
                        logger.debug(f"🏓 Pong sent to user: {user_id}")
                    
                    elif message_type == "test_audio":
                        # Test mode: simulate audio input
                        test_text = data.get("text", "Dodaj mleko do listy")
                        logger.info(f"🧪 Test mode: simulating speech '{test_text}' for user: {user_id}")
                        
                        # Simulate a shopping list update
                        test_shopping_list = ShoppingListState(
                            items=[
                                ShoppingListItem(name="mleko", quantity=1, category="Nabiał")
                            ],
                            last_update=datetime.now().timestamp(),
                            confidence=0.95
                        )
                        
                        # Send transcript
                        await websocket.send_json({
                            "type": "transcript",
                            "text": test_text,
                            "isUser": True
                        })
                        
                        # Send shopping list update
                        await websocket.send_json({
                            "type": "shopping_list_updated",
                            "shopping_list": test_shopping_list.dict()
                        })
                        
                        logger.info(f"🧪 Test shopping list sent: {test_shopping_list.dict()}")
                    
                    else:
                        logger.warning(f"Unknown message type: {message_type}")
                        
                except WebSocketDisconnect:
                    logger.info(f"WebSocket disconnected for user: {user_id}")
                    break
                except Exception as e:
                    logger.error(f"Error in WebSocket handler: {e}")
                    await websocket.send_json({
                        "type": "error",
                        "message": str(e)
                    })
            
            # Cancel the Gemini listening task
            gemini_task.cancel()
            
        else:
            await websocket.send_json({
                "type": "error",
                "message": "Failed to connect to Gemini Live API"
            })
            
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        await websocket.send_json({
            "type": "error",
            "message": f"Service error: {str(e)}"
        })
    
    finally:
        # Cleanup
        await gemini_service.disconnect()
        if user_id in active_sessions:
            del active_sessions[user_id]
        logger.info(f"Session cleanup completed for user: {user_id}")

@app.get("/sessions")
async def list_sessions():
    """List active sessions (admin endpoint)"""
    return {
        "active_sessions": len(active_sessions),
        "sessions": [
            session.to_data().dict()
            for session in active_sessions.values()
        ]
    }

@app.delete("/sessions/{user_id}")
async def terminate_session(user_id: str):
    """Terminate a specific session (admin endpoint)"""
    if user_id in active_sessions:
        session = active_sessions[user_id]
        if session.websocket:
            await session.websocket.close()
        del active_sessions[user_id]
        return {"message": f"Session {user_id} terminated"}
    else:
        raise HTTPException(status_code=404, detail="Session not found")

if __name__ == "__main__":
    # Configuration for different environments
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"Starting Gemini Live API Backend on {host}:{port}")
    
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info",
        access_log=True
    ) 