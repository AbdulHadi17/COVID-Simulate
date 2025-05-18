from flask import Flask, jsonify, request
from api.routes import setup_routes

# Initialize Flask application
app = Flask(__name__)

# Set up CORS for cross-origin requests
from flask_cors import CORS
CORS(app)

# Configure routes
setup_routes(app)

if __name__ == "__main__":
    app.run(debug=True, port=5000)