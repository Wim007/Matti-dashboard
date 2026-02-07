#!/bin/bash

# Test script for /api/analytics/events endpoint
API_URL="http://localhost:3000"
API_KEY="ak_test_12345678901234567890123456789012345678901234567890"

echo "🧪 Testing /api/analytics/events endpoint..."
echo ""

# First, we need to create an API key in the database
# For now, we'll test with a mock key and expect 401

echo "1. Testing SESSION_START event (expecting 401 without valid API key)..."
curl -X POST "$API_URL/api/analytics/events" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "type": "SESSION_START",
    "userId": "test-user-123",
    "leeftijd": 15,
    "leeftijdsgroep": "15-17",
    "gemeente": "1234",
    "is_new_user": true,
    "timestamp": '$(date +%s000)',
    "app_type": "matti"
  }' \
  -w "\nStatus: %{http_code}\n\n"

echo "2. Testing RISK_DETECTED event..."
curl -X POST "$API_URL/api/analytics/events" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "type": "RISK_DETECTED",
    "sessionId": "test-session-456",
    "riskLevel": "high",
    "riskType": "pesten",
    "action_taken": "escalated",
    "timestamp": '$(date +%s000)'
  }' \
  -w "\nStatus: %{http_code}\n\n"

echo "3. Testing SESSION_END event..."
curl -X POST "$API_URL/api/analytics/events" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "type": "SESSION_END",
    "sessionId": "test-session-789",
    "duration_seconds": 1200,
    "total_messages": 15,
    "satisfaction_score": 8,
    "timestamp": '$(date +%s000)'
  }' \
  -w "\nStatus: %{http_code}\n\n"

echo "4. Testing without API key (should return 401)..."
curl -X POST "$API_URL/api/analytics/events" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "SESSION_START",
    "userId": "test-user-999"
  }' \
  -w "\nStatus: %{http_code}\n\n"

echo "5. Testing without event type (should return 400)..."
curl -X POST "$API_URL/api/analytics/events" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "userId": "test-user-999"
  }' \
  -w "\nStatus: %{http_code}\n\n"

echo "🎉 All tests completed!"
