# Gemini Live API Backend Service

A FastAPI backend service that handles Gemini Live API connections via WebSocket, providing real-time speech recognition and product detection for shopping lists.

## Features

- **WebSocket Support**: Real-time bidirectional communication with React Native clients
- **Gemini Live API Integration**: Direct connection to Google's Gemini 2.0 Live API with function calling
- **Session Management**: Handle multiple concurrent users with individual sessions
- **Audio Streaming**: Real-time audio processing and forwarding to Gemini
- **Product Detection**: AI-powered detection of shopping items with confidence scoring
- **Error Handling**: Robust error handling and automatic reconnection logic
- **Health Checks**: Built-in health monitoring endpoints
- **Scalable Architecture**: Designed for Google Cloud Run deployment

## Architecture

```
React Native App → WebSocket → Backend Service → Gemini Live API
                                     ↓
                               Product Detection
                                     ↓
                              Back to React Native
```

## API Endpoints

### WebSocket

- `WS /ws/{user_id}` - Main WebSocket endpoint for client connections

### HTTP Endpoints

- `GET /` - Service health check
- `GET /health` - Detailed health status
- `GET /sessions` - List active sessions (admin)
- `DELETE /sessions/{user_id}` - Terminate specific session (admin)

## WebSocket Message Types

### Client → Server

```json
{
  "type": "audio_chunk",
  "audio_data": "base64_encoded_audio"
}

{
  "type": "start_session"
}

{
  "type": "stop_session"
}

{
  "type": "ping"
}
```

### Server → Client

```json
{
  "type": "product_detected",
  "product": {
    "id": "uuid",
    "name": "mleko",
    "action": "add",
    "quantity": 1,
    "unit": "l",
    "category": "Nabiał",
    "confidence": 0.95,
    "timestamp": 1234567890
  }
}

{
  "type": "transcript",
  "text": "Dodaj mleko do listy",
  "isUser": false
}

{
  "type": "status",
  "status": "listening",
  "message": "Gemini Live API ready"
}

{
  "type": "error",
  "message": "Error description"
}
```

## Environment Variables

- `GEMINI_API_KEY` - Your Google Gemini API key (required)
- `PORT` - Server port (default: 8000)
- `HOST` - Server host (default: 0.0.0.0)

## Local Development

### Prerequisites

- Python 3.11+
- Google Gemini API key

### Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Run locally

```bash
export GEMINI_API_KEY="your_api_key_here"
python main.py
```

The service will be available at `http://localhost:8000`

### Test WebSocket connection

```bash
# Install wscat for testing
npm install -g wscat

# Connect to WebSocket
wscat -c ws://localhost:8000/ws/test-user

# Send test message
{"type": "ping"}
```

## Google Cloud Run Deployment

### 1. Setup Google Cloud Project

```bash
# Set project ID
export PROJECT_ID="your-project-id"

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 2. Store API Key as Secret

```bash
# Create secret for Gemini API key
echo "your_gemini_api_key" | gcloud secrets create gemini-api-key --data-file=-

# Grant Cloud Run access to the secret
gcloud secrets add-iam-policy-binding gemini-api-key \
    --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

### 3. Build and Deploy

```bash
# Build container image
gcloud builds submit --tag gcr.io/$PROJECT_ID/gemini-live-backend

# Deploy to Cloud Run
gcloud run deploy gemini-live-backend \
    --image gcr.io/$PROJECT_ID/gemini-live-backend \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --min-instances 1 \
    --max-instances 10 \
    --set-env-vars PORT=8000,HOST=0.0.0.0 \
    --update-secrets GEMINI_API_KEY=gemini-api-key:latest
```

### 4. Alternative: Deploy with YAML

```bash
# Update PROJECT_ID in deploy.yaml
sed -i 's/PROJECT_ID/'$PROJECT_ID'/g' deploy.yaml

# Deploy using configuration file
gcloud run services replace deploy.yaml --region us-central1
```

## Scaling Considerations

### Multi-User Support

- Each user gets an individual WebSocket connection
- Each connection maintains its own Gemini Live API session
- Sessions are automatically cleaned up when clients disconnect

### Resource Usage (per connection)

- Memory: ~50-100MB per active session
- CPU: Minimal when idle, bursts during audio processing
- Network: ~16kbps for audio streaming

### Scaling Limits

- **Google Cloud Run**: Up to 1000 concurrent requests per instance
- **Gemini Live API**: Rate limits apply per API key
- **WebSocket Connections**: ~100-500 concurrent connections per instance (depending on memory)

### Cost Estimation (1000 concurrent users)

- **Cloud Run**: ~$150-300/month
- **Gemini API**: ~$200-500/month (depending on usage)
- **Networking**: ~$50-100/month
- **Total**: ~$400-900/month

## Monitoring

### Health Checks

```bash
# Basic health check
curl https://your-service-url.run.app/health

# Check active sessions
curl https://your-service-url.run.app/sessions
```

### Logs

```bash
# View Cloud Run logs
gcloud run services logs read gemini-live-backend --region us-central1

# Follow real-time logs
gcloud run services logs tail gemini-live-backend --region us-central1
```

### Metrics

- Monitor via Google Cloud Console
- Set up alerts for error rates, latency, and memory usage
- Track WebSocket connection counts

## Security Considerations

1. **API Key Protection**: Stored as Google Secret Manager secret
2. **CORS**: Configure appropriately for production
3. **Authentication**: Consider adding auth middleware for production
4. **Rate Limiting**: Implement rate limiting for production usage
5. **Input Validation**: Audio data validation and size limits

## Troubleshooting

### Common Issues

**"Failed to connect to Gemini Live API"**

- Check if GEMINI_API_KEY is correctly set
- Verify API key has appropriate permissions
- Check network connectivity

**WebSocket connection drops**

- Implement reconnection logic in client
- Check Cloud Run timeout settings
- Monitor for memory/CPU limits

**High latency**

- Check region proximity to users
- Monitor Gemini API response times
- Consider connection pooling optimizations

### Debug Mode

Set environment variable for verbose logging:

```bash
export LOG_LEVEL=DEBUG
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and add tests
4. Submit a pull request

## License

This project is licensed under the MIT License.
