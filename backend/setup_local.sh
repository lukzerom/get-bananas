#!/bin/bash

# Local Development Setup Script for Gemini Live API Backend
# This script sets up the Python environment and dependencies

set -e

echo "🔧 Setting up Gemini Live API Backend for local development"
echo

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

echo
echo "🎉 Setup complete!"
echo
echo "Next steps:"
echo "1. Set your Gemini API key:"
echo "   export GEMINI_API_KEY='your_api_key_here'"
echo
echo "2. Run the server:"
echo "   python run_local.py"
echo "   # OR"
echo "   source venv/bin/activate && python main.py"
echo
echo "3. Test the server:"
echo "   curl http://localhost:8000/health"
echo
echo "WebSocket URL for React Native:"
echo "   ws://localhost:8000/ws/{user_id}"
echo 