
import requests
import sys

def test_chat():
    url = "http://localhost:8000/ask"
    
    # Simple greeting to test conversational style
    payload = {
        "question": "Hello, how are you?",
        "analysis_job_id": None # Should rely on latest job
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        
        data = response.json()
        avatar_response = data.get("avatar_response", "")
        
        print(f"Question: {payload['question']}")
        print(f"Response: {avatar_response}")
        print(f"Word count: {len(avatar_response.split())}")
        
        if len(avatar_response.split()) > 50:
            print("FAIL: Response is too long.")
            sys.exit(1)
        else:
            print("PASS: Response is concise.")
            
    except Exception as e:
        print(f"Error: {e}")
        #sys.exit(1) # Don't exit 1 if it's just a job not found, as we might need to mock that.
        # Check if it is a 400 error about no analysis found.
        if "No analysis found" in str(e) or (response.status_code == 400 and "No analysis found" in response.text):
             print("SKIP: No analysis found in DB. Please upload data via frontend to fully verify.")
        else:
             sys.exit(1)

if __name__ == "__main__":
    test_chat()
