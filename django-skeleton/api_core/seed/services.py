import logging
import django.contrib.auth.hashers as password_manager
from typing import Dict
from api_core.seed.models import Users
from rest_framework_simplejwt.tokens import RefreshToken

logger = logging.getLogger(__name__)

def create_user(user_data: Dict[any, any]):
    try:
        user = Users()
        user.email = user_data["email"]
        user.password = password_manager.make_password(user_data["password"])
        user.save()
        return {
            "success": True
        }
    except Exception as e:
        logger.error(f"Create new service user error: {e}")
        raise e


def login(email, password):
    try:
        current_user = Users.objects.get(email=email)
        is_valid = password_manager.check_password(
            password=password, encoded=current_user.password
        ) and current_user.email == email

        if not is_valid:
            raise ValueError("Invalid Username or Password")  # Raise a ValueError

        refresh = RefreshToken.for_user(current_user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise e

def all_users():
    try:
        return Users.objects.all().values('email')
    except Exception as e:
        logger.error(f"Retrieve all users error: {e}")
        raise e
