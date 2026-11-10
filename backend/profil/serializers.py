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
        minimum = deger("kira_butcesi_min")
        maksimum = deger("kira_butcesi_max")

        if minimum is not None and maksimum is not None:
            if minimum > maksimum:
                raise serializers.ValidationError({
                    "kira_butcesi_max":
                        "En yüksek bütçe, en düşük bütçeden küçük olamaz."
                })

        if "sigara_durumu" in attrs and attrs["sigara_durumu"]:
            beklenen = attrs["sigara_durumu"] != "non_smoker"

            if "sigara" in attrs and attrs["sigara"] != beklenen:
                raise serializers.ValidationError({
                    "sigara": "Sigara durumuyla tutarlı olmalıdır."
                })

            attrs["sigara"] = beklenen

        elif "sigara" in attrs:
            attrs["sigara_durumu"] = (
                "" if attrs["sigara"] is None
                else "smoker" if attrs["sigara"]
                else "non_smoker"
            )
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

class AdaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Profil
        fields = [
            "id",
            "ad",
            "yas",
            "sehir",
            "ilce",
            "meslek",
            "hakkimda",
            "kullanim_amaci",
            "aranan_sehir",
            "kira_butcesi_min",
            "kira_butcesi_max",
        ]