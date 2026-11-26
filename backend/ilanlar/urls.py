from django.urls import path

from .views import IlanDetayi, IlanFotografiDetayi, IlanListesi

urlpatterns = [
    path("", IlanListesi.as_view(), name="ilan-listesi"),
    path("<int:pk>/", IlanDetayi.as_view(), name="ilan-detayi"),
    path("<int:ilan_id>/fotograflar/<int:sira>/", IlanFotografiDetayi.as_view(), name="ilan-fotografi"),
]
