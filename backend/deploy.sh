#!/bin/bash

# Gemini Live API Backend Deployment Script
# This script builds and deploys the backend service to Google Cloud Run

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="gemini-live-backend"
REGION="us-central1"
MIN_INSTANCES=1
MAX_INSTANCES=10
MEMORY="1Gi"
CPU="1"

# Functions
print_step() {
    echo -e "${BLUE}🚀 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if logged in to gcloud
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1 > /dev/null; then
        print_error "Please login to gcloud first: gcloud auth login"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

get_project_info() {
    # Get current project
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
    
    if [ -z "$PROJECT_ID" ]; then
        print_error "No project set. Please set a project: gcloud config set project YOUR_PROJECT_ID"
        exit 1
    fi
    
    # Get project number for service account
    PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
    
    print_success "Using project: $PROJECT_ID (Number: $PROJECT_NUMBER)"
}

enable_apis() {
    print_step "Enabling required Google Cloud APIs..."
    
    gcloud services enable run.googleapis.com
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable secretmanager.googleapis.com
    
    print_success "APIs enabled"
}

setup_secret() {
    print_step "Setting up Gemini API key secret..."
    
    # Check if secret already exists
    if gcloud secrets describe gemini-api-key &>/dev/null; then
        print_warning "Secret 'gemini-api-key' already exists. Skipping creation."
    else
        # Prompt for API key if not provided
        if [ -z "$GEMINI_API_KEY" ]; then
            echo -n "Enter your Gemini API key: "
            read -s GEMINI_API_KEY
            echo
        fi
        
        if [ -z "$GEMINI_API_KEY" ]; then
            print_error "Gemini API key is required"
            exit 1
        fi
        
        # Create secret
        echo "$GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=-
        print_success "Secret created"
    fi
    
    # Grant access to Cloud Run service account
    gcloud secrets add-iam-policy-binding gemini-api-key \
        --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
        --role="roles/secretmanager.secretAccessor" \
        --quiet
    
    print_success "Secret access granted to Cloud Run"
}

build_image() {
    print_step "Building container image..."
    
    # Build using Cloud Build
    gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME
    
    print_success "Container image built"
}

deploy_service() {
    print_step "Deploying to Cloud Run..."
    
    gcloud run deploy $SERVICE_NAME \
        --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --memory $MEMORY \
        --cpu $CPU \
        --min-instances $MIN_INSTANCES \
        --max-instances $MAX_INSTANCES \
        --set-env-vars PORT=8000,HOST=0.0.0.0 \
        --update-secrets GEMINI_API_KEY=gemini-api-key:latest \
        --timeout 3600 \
        --concurrency 1000 \
        --quiet
    
    print_success "Service deployed to Cloud Run"
}

get_service_url() {
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)")
    print_success "Service URL: $SERVICE_URL"
}

test_deployment() {
    print_step "Testing deployment..."
    
    # Test health endpoint
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/health" || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Health check passed"
    else
        print_warning "Health check failed (HTTP $HTTP_CODE). Service might still be starting up."
    fi
}

show_summary() {
    echo
    echo "=========================================="
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
    echo "=========================================="
    echo
    echo "Service Details:"
    echo "  Name: $SERVICE_NAME"
    echo "  Region: $REGION"
    echo "  URL: $SERVICE_URL"
    echo
    echo "WebSocket URL for React Native:"
    echo "  ${SERVICE_URL/https:/wss:}/ws/{user_id}"
    echo
    echo "Useful Commands:"
    echo "  View logs: gcloud run services logs tail $SERVICE_NAME --region $REGION"
    echo "  View service: gcloud run services describe $SERVICE_NAME --region $REGION"
    echo "  Update service: ./deploy.sh"
    echo
    echo "Next Steps:"
    echo "  1. Update your React Native app with the new WebSocket URL"
    echo "  2. Test the WebSocket connection"
    echo "  3. Monitor logs and metrics in Google Cloud Console"
    echo
}

# Main deployment flow
main() {
    echo "=========================================="
    echo -e "${BLUE}🚀 Gemini Live API Backend Deployment${NC}"
    echo "=========================================="
    echo
    
    check_prerequisites
    get_project_info
    enable_apis
    setup_secret
    build_image
    deploy_service
    get_service_url
    test_deployment
    show_summary
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --project)
            PROJECT_ID="$2"
            gcloud config set project $PROJECT_ID
            shift 2
            ;;
        --region)
            REGION="$2"
            shift 2
            ;;
        --api-key)
            GEMINI_API_KEY="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo
            echo "Options:"
            echo "  --project PROJECT_ID    Set Google Cloud project ID"
            echo "  --region REGION         Set deployment region (default: us-central1)"
            echo "  --api-key KEY           Set Gemini API key"
            echo "  --help                  Show this help message"
            echo
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run main deployment
main 