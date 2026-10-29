from django.urls import path

from .views import ProfilDetay, ProfilOlustur


urlpatterns = [
    path("olustur/", ProfilOlustur.as_view(), name="profil-olustur"),
    path("", ProfilDetay.as_view(), name="profil-detay"),
]