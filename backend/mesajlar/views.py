from django.db.models import Case, F, Q, When
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from profil.models import Profil

from .models import Mesaj
from .serializers import MesajSerializer

from rest_framework.response import Response
from rest_framework.views import APIView

class KonusmaMesajlari(generics.ListCreateAPIView):
    serializer_class = MesajSerializer
    permission_classes = [IsAuthenticated]

    def aday_profili_getir(self):
        adaylar = Profil.objects.filter(
            kullanici__is_active=True
        ).exclude(kullanici=self.request.user)

        return get_object_or_404(
            adaylar.select_related("kullanici"),
            pk=self.kwargs["aday_profil_id"],
        )

    def get_queryset(self):
        ben = self.request.user
        aday = self.aday_profili_getir().kullanici

        return Mesaj.objects.filter(
            Q(gonderen=ben, alici=aday) | Q(gonderen=aday, alici=ben)
        ).order_by("gonderilme_tarihi", "id")

    def perform_create(self, serializer):
        aday = self.aday_profili_getir()

        serializer.save(
            gonderen=self.request.user,
            alici=aday.kullanici,
        )

class KonusmaListesi(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ben = request.user

        son_mesajlar = list(
            Mesaj.objects.filter(Q(gonderen=ben) | Q(alici=ben))
            .annotate(
                aday_kullanici_id=Case(
                    When(gonderen=ben, then=F("alici_id")),
                    default=F("gonderen_id"),
                )
            )
            .order_by("aday_kullanici_id", "-gonderilme_tarihi", "-pk")
            .distinct("aday_kullanici_id")
        )

        adaylar = Profil.objects.filter(
            kullanici__is_active=True,
            kullanici_id__in=[mesaj.aday_kullanici_id for mesaj in son_mesajlar],
        ).in_bulk(field_name="kullanici_id")

        son_mesajlar.sort(
            key=lambda mesaj: (mesaj.gonderilme_tarihi, mesaj.pk),
            reverse=True,
        )

        konusmalar = []
        for mesaj in son_mesajlar:
            aday = adaylar.get(mesaj.aday_kullanici_id)
            if aday is None:
                continue

            konusmalar.append({
                "aday_profil_id": aday.pk,
                "ad": aday.ad,
                "soyad": aday.soyad,
                "son_mesaj": MesajSerializer(mesaj).data,
            })

        return Response(konusmalar)