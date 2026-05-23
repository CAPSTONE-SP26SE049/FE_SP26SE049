#!/bin/bash

# Cloud Run Deployment Script for Frontend
PROJECT_ID=${GCP_PROJECT_ID:-"project-be4c108d-da02-4864-a6e"}
REGION=${GCP_REGION:-"asia-southeast1"}
SERVICE_NAME="speakvn-frontend"
IMAGE_TAG="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

echo "Deploying ${SERVICE_NAME} to Google Cloud Run in project ${PROJECT_ID}..."

# 1. Build the Docker image using Google Cloud Build
echo "Building the Docker image..."
gcloud builds submit --tag ${IMAGE_TAG}

if [ $? -ne 0 ]; then
  echo "Error: Docker image build failed."
  exit 1
fi

# 2. Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_TAG} \
  --region ${REGION} \
  --platform managed \
  --port 8080 \
  --allow-unauthenticated

if [ $? -eq 0 ]; then
  echo "Deployment successful!"
else
  echo "Deployment failed."
  exit 1
fi
