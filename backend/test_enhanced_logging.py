#!/usr/bin/env python3
"""
Test Enhanced Logging and Test Audio Feature
"""
import asyncio
import websockets
import json
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_backend_logging():
    """Test the enhanced logging features"""
    backend_url = "ws://192.168.55.106:8000/ws/test-user"
    
    logger.info("🔍 Testing enhanced backend logging...")
    
    try:
        async with websockets.connect(backend_url) as websocket:
            logger.info("✅ Connected to backend")
            
            # Test 1: Start session
            logger.info("📤 Test 1: Starting session")
            await websocket.send(json.dumps({
                "type": "start_session"
            }))
            
            response = await websocket.recv()
            logger.info(f"📥 Session response: {response}")
            
            # Test 2: Send ping
            logger.info("📤 Test 2: Sending ping")
            await websocket.send(json.dumps({
                "type": "ping"
            }))
            
            response = await websocket.recv()
            logger.info(f"📥 Ping response: {response}")
            
            # Test 3: Send test audio (this should trigger product detection)
            logger.info("📤 Test 3: Sending test audio")
            await websocket.send(json.dumps({
                "type": "test_audio",
                "text": "Dodaj mleko do listy zakupów"
            }))
            
            # Wait for responses
            for i in range(3):  # Expect transcript + product_detected
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    response_data = json.loads(response)
                    logger.info(f"📥 Test audio response {i+1}: {response_data}")
                    
                    if response_data.get("type") == "product_detected":
                        logger.info("🎯 SUCCESS: Product detection working!")
                        logger.info(f"🛍️ Product: {response_data.get('product')}")
                    elif response_data.get("type") == "transcript":
                        logger.info("📝 SUCCESS: Transcript working!")
                        logger.info(f"📝 Text: {response_data.get('text')}")
                        
                except asyncio.TimeoutError:
                    logger.warning(f"⏰ Timeout waiting for response {i+1}")
                    break
            
            logger.info("✅ All tests completed")
            
    except Exception as e:
        logger.error(f"❌ Test failed: {e}")

if __name__ == "__main__":
    print("🧪 Testing Enhanced Backend Logging")
    print("=" * 50)
    asyncio.run(test_backend_logging()) 