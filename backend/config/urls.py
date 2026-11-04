from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET


@require_GET
@ensure_csrf_cookie
def session_csrf(request):
    return JsonResponse({"mesaj": "CSRF hazır."})


urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/session-csrf/", session_csrf),
    path("api/", include("accounts.urls")),
    path("api/profil/", include("profil.urls")),
]

