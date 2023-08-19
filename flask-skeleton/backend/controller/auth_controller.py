from app import app
from services.auth_service import login
from flask import request, jsonify

@app.route('/login', methods=['GET'])
def loginController():
    if request.method == 'GET':
        #request.json["username"]
        #request.json["password"]
        return login("username", "password")