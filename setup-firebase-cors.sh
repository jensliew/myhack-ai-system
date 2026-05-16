#!/bin/bash

# Firebase Storage CORS Configuration Script
# This sets up CORS for local development

# Create a cors.json file
cat > cors.json << 'EOF'
[
  {
    "origin": ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    "method": ["GET", "HEAD", "DELETE", "PUT", "POST", "OPTIONS"],
    "responseHeader": ["Content-Type", "x-goog-meta-*"],
    "maxAgeSeconds": 3600
  }
]
EOF

echo "CORS configuration created in cors.json"
echo ""
echo "To apply this configuration, run:"
echo "gsutil cors set cors.json gs://nexora-ai-5de34.firebasestorage.app"
echo ""
echo "Prerequisites:"
echo "1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install"
echo "2. Authenticate: gcloud auth login"
echo "3. Set project: gcloud config set project nexora-ai-5de34"
