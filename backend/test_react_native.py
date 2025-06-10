#!/usr/bin/env python3
"""
Test script specifically for React Native connectivity
Tests the same connection that React Native will use
"""

import asyncio
import websockets
import json
import requests
import sys

# Use the same IP that React Native will use
BACKEND_URL = "http://192.168.55.106:8000"
WS_URL = "ws://192.168.55.106:8000/ws/test-react-native-user"

def test_react_native_http():
    """Test HTTP endpoints from React Native perspective"""
    print("🔍 Testing HTTP endpoints from React Native perspective...")
    
    try:
        # Test health endpoint
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health endpoint accessible from React Native")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
            return False
            
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ HTTP connection failed: {e}")
        print("   This is the same error React Native would get")
        return False

async def test_react_native_websocket():
    """Test WebSocket connection from React Native perspective"""
    print("🔍 Testing WebSocket connection from React Native perspective...")
    
    try:
        async with websockets.connect(WS_URL) as websocket:
            print("✅ WebSocket connected successfully from React Native IP")
            
            # Test the exact flow that React Native uses
            
            # 1. Send session start (what React Native does first)
            start_message = {"type": "start_session"}
            await websocket.send(json.dumps(start_message))
            print("📤 Sent start_session message (React Native flow)")
            
            # 2. Wait for response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=10)
                data = json.loads(response)
                print(f"📥 Received: {data}")
                
                if data.get("type") == "session_started":
                    print("✅ Session started successfully")
                elif data.get("type") == "error":
                    print(f"⚠️ Backend error: {data.get('message')}")
                    print("   This indicates Gemini API connection issue, not WebSocket issue")
                else:
                    print(f"⚠️ Unexpected response: {data}")
            except asyncio.TimeoutError:
                print("❌ No response to session start")
                return False
            
            # 3. Test ping (what React Native uses for keep-alive)
            ping_message = {"type": "ping"}
            await websocket.send(json.dumps(ping_message))
            print("📤 Sent ping message")
            
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5)
                data = json.loads(response)
                print(f"📥 Ping response: {data}")
                
                if data.get("type") == "pong":
                    print("✅ Ping/pong working")
                else:
                    print(f"⚠️ Unexpected ping response: {data}")
            except asyncio.TimeoutError:
                print("⚠️ No ping response (might be normal)")
            
            return True
            
    except websockets.exceptions.ConnectionClosed:
        print("❌ WebSocket connection closed unexpectedly")
        return False
    except ConnectionRefusedError:
        print("❌ Connection refused - server not accessible")
        print("   This is the same error React Native is getting")
        return False
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        print("   This is likely the same error React Native is getting")
        return False

def main():
    """Main test function"""
    print("📱 Testing Backend from React Native Perspective")
    print("=" * 55)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"WebSocket URL: {WS_URL}")
    print()
    
    # Test HTTP endpoints
    http_ok = test_react_native_http()
    print()
    
    if not http_ok:
        print("❌ HTTP tests failed")
        print("React Native won't be able to connect to the backend")
        sys.exit(1)
    
    # Test WebSocket
    try:
        ws_ok = asyncio.run(test_react_native_websocket())
        print()
        
        if ws_ok:
            print("🎉 React Native connection test passed!")
            print("\nReact Native should be able to connect to:")
            print(f"  HTTP: {BACKEND_URL}")
            print(f"  WebSocket: {WS_URL}")
            print("\nIf React Native still can't connect:")
            print("  1. Make sure React Native is using the IP address (not localhost)")
            print("  2. Check firewall settings")
            print("  3. Make sure you're on the same WiFi network")
        else:
            print("❌ React Native connection test failed")
            
    except Exception as e:
        print(f"❌ Connection test error: {e}")

if __name__ == "__main__":
    main() 