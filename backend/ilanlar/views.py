from django.db.models import Prefetch
from django.http import HttpResponse
from rest_framework import generics
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated

from .models import Ilan, IlanFotografi
from .serializers import IlanFiltreSerializer, IlanSerializer


class IlanSayfalama(PageNumberPagination):
    page_size = 20


class YayindakiIlanlar:
    permission_classes = [IsAuthenticated]
    serializer_class = IlanSerializer
    queryset = Ilan.objects.filter(yayinda=True, sahip__is_active=True).select_related("sahip__profil").prefetch_related(
        Prefetch("fotograflar", queryset=IlanFotografi.objects.only("ilan_id", "sira"))
    )


class IlanListesi(YayindakiIlanlar, generics.ListCreateAPIView):
    pagination_class = IlanSayfalama

    def get_queryset(self):
        ilanlar = super().get_queryset()
        params = self.request.query_params
        filtre = IlanFiltreSerializer(data={
            key: params.getlist(key) if key == "ilce" else params[key]
            for key in ("sehir", "ilce", "min_kira", "max_kira", "ilan_turu", "oda_turu", "harita")
            if key in params
        })
        filtre.is_valid(raise_exception=True)
        data = filtre.validated_data
        alanlar = {
            "sehir": "sehir_kodu", "ilce": "ilce_kodu__in",
            "min_kira": "aylik_kira__gte", "max_kira": "aylik_kira__lte",
            "ilan_turu": "ilan_turu", "oda_turu": "oda_turu",
        }
        ilanlar = ilanlar.filter(**{alan: data[key] for key, alan in alanlar.items() if key in data})
        if data["harita"]:
            ilanlar = ilanlar.filter(enlem__isnull=False, boylam__isnull=False)
        return ilanlar

    def perform_create(self, serializer):
        serializer.save(sahip=self.request.user)


class IlanDetayi(YayindakiIlanlar, generics.RetrieveAPIView):
    pass


class IlanFotografiDetayi(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    queryset = IlanFotografi.objects.filter(ilan__yayinda=True, ilan__sahip__is_active=True)

    def get(self, request, ilan_id, sira):
        foto = generics.get_object_or_404(self.get_queryset(), ilan_id=ilan_id, sira=sira)
        return HttpResponse(
            bytes(foto.icerik), content_type=foto.mime_turu,
            headers={"X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store"},
        )
