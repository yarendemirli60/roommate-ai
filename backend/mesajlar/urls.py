from django.urls import path

from .views import KonusmaMesajlari, KonusmaListesi

urlpatterns = [
    path("<int:aday_profil_id>/",KonusmaMesajlari.as_view(),name="konusma-mesajlari",),
    path("", KonusmaListesi.as_view(), name="konusma-listesi"),
]