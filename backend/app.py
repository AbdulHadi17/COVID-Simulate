from flask import Flask, jsonify, request
from flask_cors import CORS
import traceback
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Initialize Flask application
app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

# Import and setup routes
from api.routes import setup_routes
setup_routes(app)

if __name__ == "__main__":
    print("Starting Flask server on http://localhost:5000")
    app.run(debug=True, port=5000)