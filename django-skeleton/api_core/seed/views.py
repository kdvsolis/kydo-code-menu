from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import permissions, authentication
from rest_framework_simplejwt.authentication import JWTAuthentication

from api_core.seed import services

class AuthUsers(APIView):
    permission_classes = []
    authentication_classes = []
    def post(self, request: Request):
        if request.path == "/api/login":
            return Response(data=services.login(request.data.get("email"), request.data.get("password")))
        if request.path == "/api/register":
            return Response(data=services.create_user(request.data))

class UserView(APIView):
    authentication_classes = [JWTAuthentication] 
    methods = ["GET", "POST"]
    def get(self, request: Request):
        if request.path == "/api/all-users":
            res = services.all_users()
            content = {"success": True, "data": res}
        return Response(data=content)