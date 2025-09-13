import os
from flask import Flask, request, jsonify
from rasa.core.agent import Agent
from rasa.utils.endpoints import EndpointConfig
import asyncio

# --- 1. Initialization ---
app = Flask(__name__)

# --- 2. Load The Rasa Model ---
# This is an asynchronous operation, so we need to run it in an event loop.
print("🚀 Loading Rasa NLU model...")

# Find the latest model file in the 'models' directory
model_path = os.path.join("models", sorted(os.listdir("models"))[-1])

# We only need the NLU part, so we don't load an action endpoint
agent = Agent.load(model_path, action_endpoint=None)
print(f"✅ Rasa NLU model loaded from: {model_path}")

# --- 3. Define the API Endpoint ---
@app.route('/parse', methods=['POST'])
async def parse_message():
    """
    This endpoint receives a text message and returns the parsed NLU data.
    """
    # Get the JSON data from the request
    data = request.get_json()

    if not data or 'text' not in data:
        return jsonify({"error": "Invalid request. JSON with 'text' field is required."}), 400

    message = data.get('text')
    print(f"-> Received text for parsing: \"{message}\"")

    try:
        # 4. Run the text through the Rasa model
        # The 'agent.parse_message' function is asynchronous
        parsed_data = await agent.parse_message(message)
        
        # 5. Format the output into a clean JSON response
        response_data = {
            "intent": parsed_data.get('intent', {}).get('name', None),
            "confidence": parsed_data.get('intent', {}).get('confidence', 0.0),
            "entities": parsed_data.get('entities', [])
        }
        
        print(f"<- Responding with: {response_data}")
        return jsonify(response_data)

    except Exception as e:
        print(f"🔴 Error processing message: {e}")
        return jsonify({"error": "An internal error occurred."}), 500

# --- Health Check Endpoint ---
@app.route('/health', methods=['GET'])
def health_check():
    """A simple endpoint to confirm the service is running."""
    return jsonify({"status": "UP"}), 200


if __name__ == '__main__':
    # Flask runs on port 5000 by default. 
    # Rasa's default port is 5005, so this avoids conflicts.
    app.run(debug=True, port=5005)