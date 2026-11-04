from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Profil
from .serializers import ProfilSerializer, AdaySerializer


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