#!/usr/bin/env python3
"""
Unit Test for Extraction Agent
Simulates orchestrator request through API Gateway
"""

import requests
import json
import sys
import time
from typing import List, Optional

class ExtractionAgentTester:
    def __init__(self, api_gateway_url: str = "http://localhost:8080"):
        self.api_gateway_url = api_gateway_url
        self.extraction_endpoint = f"{api_gateway_url}/api/v1/agents/extract"
        self.process_endpoint = f"{api_gateway_url}/api/v1/agents/process"
        self.health_endpoint = f"{api_gateway_url}/api/v1/agents/health"

    def check_health(self) -> bool:
        """Check if extraction agent is healthy"""
        try:
            response = requests.get(self.health_endpoint, timeout=10)
            if response.status_code == 200:
                health_data = response.json()
                print(f"✅ Health Check: {health_data}")
                return health_data.get("model_loaded", False)
            else:
                print(f"❌ Health check failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Health check error: {str(e)}")
            return False

    def test_extraction_endpoint(self, document_ids: List[str], execution_id: Optional[str] = None) -> Optional[str]:
        """Test the main extraction endpoint"""
        print(f"\n🧪 Testing extraction endpoint with document IDs: {document_ids}")
        
        payload = {
            "document_ids": document_ids,
            "agent_id": "extractor-agent"
        }
        
        if execution_id:
            payload["execution_id"] = execution_id

        try:
            response = requests.post(
                self.extraction_endpoint,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=60
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Extraction successful!")
                print(f"Extracted entities: {result['extracted_entities']}")
                print(f"Message: {result['message']}")
                
                # Print detailed entities
                print("\n📋 Entities by category:")
                for entity_group in result.get('entities_by_label', []):
                    print(f"  {entity_group['label']}: {', '.join(entity_group['entities'])}")
                
                return result['extracted_entities']
            else:
                print(f"❌ Extraction failed: {response.status_code}")
                print(f"Response: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Request error: {str(e)}")
            return None

    def test_orchestrator_compatibility(self, document_ids: List[str], execution_id: Optional[str] = None) -> Optional[str]:
        """Test the orchestrator compatibility endpoint"""
        print(f"\n🤖 Testing orchestrator compatibility endpoint with document IDs: {document_ids}")
        
        payload = {
            "agentId": "extractor-agent",
            "prompt": "Extract named entities from the provided documents",
            "documentIds": document_ids
        }
        
        if execution_id:
            payload["executionId"] = execution_id

        try:
            response = requests.post(
                self.process_endpoint,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=60
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Orchestrator endpoint successful!")
                print(f"Agent Response: {result['response']}")
                
                # Print full result if available
                if 'fullResult' in result:
                    full_result = result['fullResult']
                    print(f"Message: {full_result['message']}")
                
                return result['response']
            else:
                print(f"❌ Orchestrator endpoint failed: {response.status_code}")
                print(f"Response: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Request error: {str(e)}")
            return None

    def run_comprehensive_test(self, document_ids: List[str]):
        """Run comprehensive tests"""
        print("🚀 Starting Extraction Agent Tests")
        print("=" * 50)
        
        # 1. Health check
        print("\n1. Health Check:")
        if not self.check_health():
            print("❌ Health check failed. Stopping tests.")
            return False
        
        # Wait a moment for model to be ready
        print("⏳ Waiting 2 seconds for model readiness...")
        time.sleep(2)
        
        # 2. Test main extraction endpoint
        print("\n2. Main Extraction Endpoint:")
        extraction_result = self.test_extraction_endpoint(document_ids, "test-execution-001")
        
        # 3. Test orchestrator compatibility
        print("\n3. Orchestrator Compatibility Endpoint:")
        orchestrator_result = self.test_orchestrator_compatibility(document_ids, "test-execution-002")
        
        # 4. Compare results
        print("\n4. Results Comparison:")
        if extraction_result and orchestrator_result:
            print(f"✅ Both endpoints returned results!")
            print(f"Results match: {extraction_result == orchestrator_result}")
            
            print(f"\n📊 Final Concatenated Entities String:")
            print(f"'{extraction_result}'")
        else:
            print("❌ One or both endpoints failed")
        
        print("\n" + "=" * 50)
        print("🏁 Tests completed!")
        
        return extraction_result is not None and orchestrator_result is not None

def main():
    """Main test function"""
    
    # Example document IDs (replace with actual IDs from your system)
    test_document_ids = [
        "2e6263a5-4238-488d-bdfe-77839ad24a67_provaprog1_16b79616-cf98-4628-a1af-d5ad84a8f9fd",  
        "2e6263a5-4238-488d-bdfe-77839ad24a67_provaprog1_5f4a9563-b76f-4782-869f-5c45fc710270"
    ]
    
    # Check command line arguments
    if len(sys.argv) > 1:
        api_gateway_url = sys.argv[1]
    else:
        api_gateway_url = "http://localhost:8080"
    
    if len(sys.argv) > 2:
        # Document IDs from command line
        test_document_ids = sys.argv[2].split(',')
    
    print(f"🎯 Target API Gateway: {api_gateway_url}")
    print(f"📄 Test Document IDs: {test_document_ids}")
    
    # IMPORTANT: Check if documents exist first
    print("\n🔍 Checking if test documents exist...")
    document_exists = False
    for doc_id in test_document_ids:
        try:
            parts = doc_id.split('_')
            if len(parts) == 3:
                user_id, project_id, doc_id_part = parts
                check_url = f"{api_gateway_url}/api/v1/documents/{user_id}/{project_id}/{doc_id_part}/text"
                response = requests.get(check_url, timeout=10)
                if response.status_code == 200:
                    print(f"✅ Document {doc_id} exists and accessible")
                    document_exists = True
                else:
                    print(f"❌ Document {doc_id} not found: {response.status_code}")
        except Exception as e:
            print(f"❌ Error checking document {doc_id}: {str(e)}")
    
    if not document_exists:
        print("\n⚠️  No test documents found!")
        print("To test with real documents:")
        print("1. Upload a document first via the document service")
        print("2. Use the returned document ID in format: userId_projectId_docId")
        print("3. Run: python test_extraction_agent.py http://localhost:8080 'real_user_real_project_real_doc'")
        print("\n🧪 Proceeding with tests anyway (will show expected errors)...")
    
    # Run tests
    tester = ExtractionAgentTester(api_gateway_url)
    success = tester.run_comprehensive_test(test_document_ids)
    
    if success:
        print("🎉 All tests passed!")
        sys.exit(0)
    else:
        print("💥 Tests failed!")
        if not document_exists:
            print("ℹ️  This is expected since test documents don't exist")
        sys.exit(1)

if __name__ == "__main__":
    main()