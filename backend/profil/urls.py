from django.urls import path

from .views import  AdayListesi,ProfilDetay, ProfilOlustur


urlpatterns = [
    path("adaylar/", AdayListesi.as_view(), name="aday-listesi"),
    path("olustur/", ProfilOlustur.as_view(), name="profil-olustur"),
    path("", ProfilDetay.as_view(), name="profil-detay"),
]