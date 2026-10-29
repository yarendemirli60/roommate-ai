from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Profil
from .serializers import ProfilSerializer


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
