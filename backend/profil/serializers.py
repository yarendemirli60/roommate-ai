from rest_framework import serializers

from .models import Profil


class ProfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profil
        exclude = ["kullanici"]
        read_only_fields = [
            "id",
            "olusturulma_tarihi",
            "guncellenme_tarihi",
        ]

    def validate_aranan_ilceler(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError(
                "İlçeler liste olarak gönderilmelidir."
            )

        if any(
            not isinstance(ilce, str) or not ilce.strip()
            for ilce in value
        ):
            raise serializers.ValidationError(
                "Her ilçe geçerli bir metin olmalıdır."
            )

        return [ilce.strip() for ilce in value]

    def validate(self, attrs):
        def deger(alan):
            if alan in attrs:
                return attrs[alan]
            return getattr(self.instance, alan, None)

        amac = deger("kullanim_amaci")

        if amac in (
            Profil.KullanimAmaci.EVIME_ARKADAS,
            Profil.KullanimAmaci.BIRLIKTE_EV,
        ):
            gerekli_alanlar = [
                "sigara",
                "evcil_hayvan",
                "temizlik",
                "gurultu",
                "sigara_kabulu",
                "evcil_hayvan_kabulu",
                "minimum_temizlik",
                "maksimum_gurultu",
            ]

            hatalar = {}

            for alan in gerekli_alanlar:
                if deger(alan) is None or deger(alan) == "":
                    hatalar[alan] = (
                        "Ev arkadaşı arayanlar için bu alan zorunludur."
                    )

            if hatalar:
                raise serializers.ValidationError(hatalar)

        return attrs