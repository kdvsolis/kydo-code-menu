from django.contrib import admin
from django.urls import include, path

handler400 = "rest_framework.exceptions.bad_request"
handler500 = "rest_framework.exceptions.server_error"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("api_core.urls")),
]
