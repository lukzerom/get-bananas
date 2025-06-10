#!/usr/bin/env python3
"""
Test script to verify the backend server is running and responsive
"""

import asyncio
import websockets
import json
import requests
import sys

BACKEND_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000/ws/test-user"

def test_http_endpoints():
    """Test HTTP endpoints"""
    print("🔍 Testing HTTP endpoints...")
    
    try:
        # Test health endpoint
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health endpoint working")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
            return False
            
        # Test root endpoint
        response = requests.get(f"{BACKEND_URL}/", timeout=5)
        if response.status_code == 200:
            print("✅ Root endpoint working")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Root endpoint failed: {response.status_code}")
            return False
            
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ HTTP connection failed: {e}")
        return False

async def test_websocket():
    """Test WebSocket connection"""
    print("🔍 Testing WebSocket connection...")
    
    try:
        async with websockets.connect(WS_URL) as websocket:
            print("✅ WebSocket connected successfully")
            
            # Test ping
            ping_message = {"type": "ping"}
            await websocket.send(json.dumps(ping_message))
            print("📤 Sent ping message")
            
            # Wait for response
            response = await asyncio.wait_for(websocket.recv(), timeout=5)
            data = json.loads(response)
            print(f"📥 Received: {data}")
            
            if data.get("type") == "pong":
                print("✅ Ping/pong test successful")
            else:
                print(f"⚠️ Unexpected response: {data}")
            
            # Test session start
            start_message = {"type": "start_session"}
            await websocket.send(json.dumps(start_message))
            print("📤 Sent start_session message")
            
            # Wait for response
            response = await asyncio.wait_for(websocket.recv(), timeout=10)
            data = json.loads(response)
            print(f"📥 Received: {data}")
            
            if data.get("type") == "session_started":
                print("✅ Session start test successful")
            else:
                print(f"⚠️ Unexpected session response: {data}")
            
            return True
            
    except websockets.exceptions.ConnectionClosed:
        print("❌ WebSocket connection closed unexpectedly")
        return False
    except asyncio.TimeoutError:
        print("❌ WebSocket response timeout")
        return False
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        return False

async def test_audio_chunk():
    """Test sending audio chunk"""
    print("🔍 Testing audio chunk...")
    
    try:
        async with websockets.connect(WS_URL) as websocket:
            # Send fake audio chunk
            audio_message = {
                "type": "audio_chunk",
                "audio_data": "dGVzdCBhdWRpbyBkYXRh"  # base64 encoded "test audio data"
            }
            await websocket.send(json.dumps(audio_message))
            print("📤 Sent audio chunk")
            
            # Wait a bit to see if there are any responses
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=3)
                data = json.loads(response)
                print(f"📥 Audio response: {data}")
            except asyncio.TimeoutError:
                print("ℹ️ No immediate response to audio chunk (normal)")
            
            return True
            
    except Exception as e:
        print(f"❌ Audio chunk test error: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 Testing Gemini Live API Backend Server")
    print("=" * 50)
    
    # Test HTTP endpoints
    http_ok = test_http_endpoints()
    print()
    
    if not http_ok:
        print("❌ HTTP tests failed - server might not be running")
        print("Start the server with: python run_local.py")
        sys.exit(1)
    
    # Test WebSocket
    print("🔌 Testing WebSocket functionality...")
    try:
        ws_ok = asyncio.run(test_websocket())
        print()
        
        if ws_ok:
            # Test audio chunk
            audio_ok = asyncio.run(test_audio_chunk())
            print()
            
            if audio_ok:
                print("🎉 All tests passed!")
                print("\nBackend server is ready for React Native integration")
                print(f"WebSocket URL: {WS_URL}")
                print(f"Health URL: {BACKEND_URL}/health")
            else:
                print("⚠️ Audio chunk test failed")
        else:
            print("❌ WebSocket tests failed")
            
    except Exception as e:
        print(f"❌ WebSocket test error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 