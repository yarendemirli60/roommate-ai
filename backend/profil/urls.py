from django.urls import path

from .views import AdayDetayi, AdayListesi, ProfilDetay, ProfilOlustur, UyumAnalizi


urlpatterns = [
    path("adaylar/", AdayListesi.as_view(), name="aday-listesi"),
    path("adaylar/<int:pk>/", AdayDetayi.as_view(), name="aday-detayi"),
    path("olustur/", ProfilOlustur.as_view(), name="profil-olustur"),
    path("", ProfilDetay.as_view(), name="profil-detay"),
    path("uyum/", UyumAnalizi.as_view(), name="uyum-analizi"),
]