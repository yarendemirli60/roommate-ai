from rest_framework import serializers

from .models import Mesaj


class MesajSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mesaj
        fields = ("id", "gonderen", "alici", "icerik", "gonderilme_tarihi")
        read_only_fields = ("id", "gonderen", "alici", "gonderilme_tarihi")