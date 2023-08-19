from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from api_core.seed import views as seed_views

urlpatterns = [
    path("api/all-users", seed_views.UserView.as_view()),
    path("api/login", seed_views.AuthUsers.as_view()),
    path("api/register", seed_views.AuthUsers.as_view())
]
