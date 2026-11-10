from django.urls import path

from .views import cikis, giris, kayit


urlpatterns = [
    path("kayit/", kayit, name="kayit"),
    path("giris/", giris, name="giris"),
    path("cikis/", cikis, name="cikis"),
]