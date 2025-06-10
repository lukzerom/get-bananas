#!/usr/bin/env python3
"""
Local Development Runner for Gemini Live API Backend

This script sets up the development environment and runs the FastAPI server locally.
"""

import os
import sys
import subprocess
from pathlib import Path

def check_requirements():
    """Check if all requirements are installed."""
    try:
        import fastapi
        import uvicorn
        import websockets
        print("✅ All requirements are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing requirements: {e}")
        print("Run: pip install -r requirements.txt")
        return False

def setup_environment():
    """Set up environment variables for local development."""
    # Default environment variables
    defaults = {
        "HOST": "0.0.0.0",
        "PORT": "8000",
        "DEBUG": "true",
        "CORS_ORIGINS": "http://localhost:3000,http://localhost:8081,http://localhost:19006",
        "WEBSOCKET_PING_INTERVAL": "30"
    }
    
    # Set defaults if not already set
    for key, value in defaults.items():
        if key not in os.environ:
            os.environ[key] = value
    
    # Check for Gemini API key
    if not os.environ.get("GEMINI_API_KEY"):
        print("⚠️  GEMINI_API_KEY not found in environment variables")
        api_key = input("Please enter your Gemini API key: ").strip()
        if api_key:
            os.environ["GEMINI_API_KEY"] = api_key
        else:
            print("❌ Gemini API key is required to run the server")
            sys.exit(1)
    
    print("✅ Environment variables configured")

def run_server():
    """Run the FastAPI server with uvicorn."""
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 8000))
    
    print(f"""
🚀 Starting Gemini Live API Backend Server

Configuration:
  Host: {host}
  Port: {port}
  Debug: {os.environ.get('DEBUG', 'false')}
  CORS Origins: {os.environ.get('CORS_ORIGINS', 'not set')}

WebSocket URL: ws://{host}:{port}/ws/{{user_id}}
Health Check: http://{host}:{port}/health

Press Ctrl+C to stop the server
""")
    
    # Import and run the main application
    try:
        import uvicorn
        uvicorn.run(
            "main:app",
            host=host,
            port=port,
            reload=True,  # Enable auto-reload for development
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error running server: {e}")
        sys.exit(1)

def main():
    """Main function to run the development server."""
    print("🔧 Setting up Gemini Live API Backend for local development")
    
    # Change to the backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # Check requirements
    if not check_requirements():
        sys.exit(1)
    
    # Setup environment
    setup_environment()
    
    # Run the server
    run_server()

if __name__ == "__main__":
    main() 