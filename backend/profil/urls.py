from django.urls import path

from .views import  AdayListesi,ProfilDetay, ProfilOlustur, UyumAnalizi


urlpatterns = [
    path("adaylar/", AdayListesi.as_view(), name="aday-listesi"),
    path("olustur/", ProfilOlustur.as_view(), name="profil-olustur"),
    path("", ProfilDetay.as_view(), name="profil-detay"),
    path("uyum/", UyumAnalizi.as_view(), name="uyum-analizi"),
]