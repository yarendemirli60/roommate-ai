from decimal import Decimal

from django.db import transaction
from rest_framework import serializers
from rest_framework.reverse import reverse

from .models import Ilan, IlanFotografi, konum_kodu

FOTOGRAF_TURLERI = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}


class IlanFiltreSerializer(serializers.Serializer):
    sehir = serializers.CharField(required=False, max_length=16, validators=[konum_kodu])
    ilce = serializers.ListField(
        required=False,
        max_length=50,
        child=serializers.CharField(max_length=32, validators=[konum_kodu]),
    )
    min_kira = serializers.DecimalField(
        required=False, max_digits=10, decimal_places=2, min_value=Decimal("0")
    )
    max_kira = serializers.DecimalField(
        required=False, max_digits=10, decimal_places=2, min_value=Decimal("0")
    )
    ilan_turu = serializers.ChoiceField(required=False, choices=Ilan.Tur.choices)
    oda_turu = serializers.ChoiceField(required=False, choices=Ilan.OdaTuru.choices)
    harita = serializers.BooleanField(required=False, default=False)

    def validate(self, attrs):
        minimum = attrs.get("min_kira")
        maksimum = attrs.get("max_kira")
        if minimum is not None and maksimum is not None and minimum > maksimum:
            raise serializers.ValidationError({"max_kira": "Üst sınır alt sınırdan küçük olamaz."})
        return attrs


class IlanResimAlani(serializers.ImageField):
    def to_internal_value(self, data):
        if getattr(data, "size", 0) > 5 * 1024 * 1024:
            raise serializers.ValidationError("Her fotoğraf en fazla 5 MB olabilir.")
        dosya = super().to_internal_value(data)
        if dosya.image.format not in FOTOGRAF_TURLERI:
            raise serializers.ValidationError("JPEG, PNG veya WebP fotoğrafı yükleyin.")
        if dosya.image.width * dosya.image.height > 25_000_000:
            raise serializers.ValidationError("Fotoğraf en fazla 25 megapiksel olabilir.")
        return dosya


class IlanSerializer(serializers.ModelSerializer):
    enlem = serializers.DecimalField(
        max_digits=9, decimal_places=6, required=False, allow_null=True,
        min_value=Decimal("-90"), max_value=Decimal("90"), coerce_to_string=False,
    )
    boylam = serializers.DecimalField(
        max_digits=9, decimal_places=6, required=False, allow_null=True,
        min_value=Decimal("-180"), max_value=Decimal("180"), coerce_to_string=False,
    )
    fotograf_dosyalari = serializers.ListField(
        child=IlanResimAlani(), min_length=1, max_length=5, write_only=True,
    )
    fotograflar = serializers.SerializerMethodField()
    sahip_profil_id = serializers.SerializerMethodField()

    class Meta:
        model = Ilan
        fields = (
            "id", "baslik", "aciklama", "ilan_turu", "oda_turu", "sehir_kodu", "ilce_kodu",
            "aylik_kira", "esyali", "alan_m2", "enlem", "boylam", "fotograflar",
            "fotograf_dosyalari", "olusturulma_tarihi", "sahip_profil_id",
        )

    def get_fotograflar(self, ilan):
        return [
            reverse("ilan-fotografi", kwargs={"ilan_id": ilan.pk, "sira": foto.sira})
            for foto in ilan.fotograflar.all()
        ]

    def get_sahip_profil_id(self, ilan):
        if ilan.sahip_id == self.context["request"].user.pk:
            return None
        profil = getattr(ilan.sahip, "profil", None)
        return profil.pk if profil else None

    def validate(self, attrs):
        uygun_odalar = Ilan.EV_ODALARI if attrs["ilan_turu"] == Ilan.Tur.EV else Ilan.PAYLASIM_ODALARI
        if attrs["oda_turu"] not in uygun_odalar:
            raise serializers.ValidationError({"oda_turu": "İlan türüne uygun bir oda türü seçin."})
        if (attrs.get("enlem") is None) != (attrs.get("boylam") is None):
            raise serializers.ValidationError({"enlem": "Enlem ve boylam birlikte girilmelidir."})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        fotograflar = validated_data.pop("fotograf_dosyalari")
        ilan = super().create(validated_data)
        IlanFotografi.objects.bulk_create([
            IlanFotografi(ilan=ilan, sira=sira, mime_turu=FOTOGRAF_TURLERI[dosya.image.format], icerik=dosya.read())
            for sira, dosya in enumerate(fotograflar, start=1)
        ])
        return ilan
