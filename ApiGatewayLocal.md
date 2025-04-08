1. Use this Token

TEST_TOKEN = ${"access_token":"eyJhbGciOiJIUzI1NiIsImtpZCI6IklaZnJBaDNuWXFDdzFQT08iLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NqZmRrZ3ptamFhc2p0YXZ1aGZ1LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIyZjBhMDllNS00ZTRkLTRhMzItYmVhMy1iZTU0MDM1MzUwYTYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQzNzYyMTA5LCJpYXQiOjE3NDM3NTg1MDksImVtYWlsIjoic3QzcGF0YWxhbm9AZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NDM3NTg1MDl9XSwic2Vzc2lvbl9pZCI6IjRjNDg2NzIwLWI2NjUtNDU1MC05MDU5LTdlZjAwNmZmOGNkYiIsImlzX2Fub255bW91cyI6ZmFsc2V9.a-p59u28zGZlR57_BWzBcptn6pKuq9GpaEJcw0QwR1I","token_type":"bearer","expires_in":3600,"expires_at":1743762109,"refresh_token":"fI4hcx8rfVqRaYc5S6q4YQ","user":{"id":"2f0a09e5-4e4d-4a32-bea3-be54035350a6","aud":"authenticated","role":"authenticated","email":"st3patalano@gmail.com","email_confirmed_at":"2025-04-01T08:20:37.131294Z","phone":"","confirmed_at":"2025-04-01T08:20:37.131294Z","last_sign_in_at":"2025-04-04T09:21:49.894549298Z","app_metadata":{"provider":"email","providers":["email"]},"user_metadata":{"email_verified":true},"identities":[{"identity_id":"bbfae42b-fdcd-4124-9341-9940ec4cd42d","id":"2f0a09e5-4e4d-4a32-bea3-be54035350a6","user_id":"2f0a09e5-4e4d-4a32-bea3-be54035350a6","identity_data":{"email":"st3patalano@gmail.com","email_verified":false,"phone_verified":false,"sub":"2f0a09e5-4e4d-4a32-bea3-be54035350a6"},"provider":"email","last_sign_in_at":"2025-04-01T08:20:37.129074Z","created_at":"2025-04-01T08:20:37.129127Z","updated_at":"2025-04-01T08:20:37.129127Z","email":"st3patalano@gmail.com"}],"created_at":"2025-04-01T08:20:37.126262Z","updated_at":"2025-04-04T09:21:49.916965Z","is_anonymous":false}}





2. List Collections

curl -s -X GET "http://localhost:8080/collections" \
  -H "Authorization: Bearer $TEST_TOKEN" | jq



3. Create a Collection

curl -s -X POST "http://localhost:8080/collections" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Collection", "description": "A test collection"}' | jq



4. Upload a Document

curl -s -X POST "http://localhost:8080/documents" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -F "file=@./test-document.pdf" \
  -F "name=Test Document" \
  -F "description=A test document" \
  -F "collectionId=12345" | jq



5. Request Document Status

curl -s -X GET "http://localhost:8080/documents/12345/status" \
  -H "Authorization: Bearer $TEST_TOKEN" | jq



6. Request Document Summary

curl -s -X GET "http://localhost:8080/documents/12345/summary" \
  -H "Authorization: Bearer $TEST_TOKEN" | jq



7. Generate Document Summary On-Demand

curl -s -X POST "http://localhost:8080/documents/12345/generate-summary" \
  -H "Authorization: Bearer $TEST_TOKEN" | jq



8. Get Document View URL

curl -s -X GET "http://localhost:8080/documents/12345/view-url" \
  -H "Authorization: Bearer $TEST_TOKEN" | jq
Monitoring Test Results



To see the results of your API Gateway tests:

View Docker logs:

# Follow logs from all services
docker-compose logs -f

# Follow logs from a specific service
docker-compose logs -f api-gateway
