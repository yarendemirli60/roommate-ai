from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Profil
from .serializers import ProfilSerializer, AdaySerializer

from django.shortcuts import get_object_or_404
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .uyum import profili_tahmin_girdisine_cevir

class ProfilOlustur(generics.CreateAPIView):
    serializer_class = ProfilSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError

        if Profil.objects.filter(kullanici=self.request.user).exists():
            raise ValidationError(
                {"mesaj": "Profilin zaten var. Güncelleyebilirsin."}
            )

        serializer.save(kullanici=self.request.user)


class ProfilDetay(generics.RetrieveUpdateAPIView):
    serializer_class = ProfilSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        from django.shortcuts import get_object_or_404

        return get_object_or_404(
            Profil,
            kullanici=self.request.user,
        )

class AdayListesi(generics.ListAPIView):
    serializer_class = AdaySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return (
            Profil.objects
            .filter(kullanici__is_active=True)
            .exclude(kullanici=self.request.user)
            .order_by("-olusturulma_tarihi")
        )

class UyumIstegiSerializer(serializers.Serializer):
    aday_profil_id = serializers.IntegerField(min_value=1)


class UyumAnalizi(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        istek = UyumIstegiSerializer(data=request.data)
        istek.is_valid(raise_exception=True)

        kendi_profilim = get_object_or_404(Profil, kullanici=request.user)

        gorunur_adaylar = Profil.objects.filter(
            kullanici__is_active=True
        ).exclude(kullanici=request.user)

        aday = get_object_or_404(
            gorunur_adaylar,
            pk=istek.validated_data["aday_profil_id"],
        )

        from ai.uyum_tahmini import uyum_hesapla

        try:
            sonuc = uyum_hesapla(
                profili_tahmin_girdisine_cevir(kendi_profilim),
                profili_tahmin_girdisine_cevir(aday),
            )
        except ValueError as hata:
            raise ValidationError({"mesaj": str(hata)}) from hata

        return Response(sonuc)