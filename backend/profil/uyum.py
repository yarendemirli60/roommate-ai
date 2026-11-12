TEMIZLIK_ETIKETLERI = {
    1: "Relaxed",
    2: "Moderate",
    3: "Clean",
    4: "Very Clean",
    5: "Very Clean",
}

GURULTU_ETIKETLERI = {
    1: "Very Low",
    2: "Low",
    3: "Moderate",
    4: "High",
    5: "Very High",
}

EVCIL_HAYVAN_ETIKETLERI = {
    "evet": "Yes",
    "hayir": "No",
}


def profili_tahmin_girdisine_cevir(profil):
    if not profil.sigara_durumu:
        raise ValueError("Sigara durumu belirtilmeli.")

    if profil.temizlik not in TEMIZLIK_ETIKETLERI:
        raise ValueError("Temizlik düzeyi 1 ile 5 arasında olmalı.")

    if profil.maksimum_gurultu not in GURULTU_ETIKETLERI:
        raise ValueError("Gürültü toleransı 1 ile 5 arasında olmalı.")

    if profil.evcil_hayvan_kabulu not in EVCIL_HAYVAN_ETIKETLERI:
        raise ValueError(
            "Uyum hesabı için evcil hayvan tercihi Evet veya Hayır olmalı."
        )

    return {
        "yas": profil.yas,
        "sigara": profil.sigara_durumu,
        "temizlik": TEMIZLIK_ETIKETLERI[profil.temizlik],
        "gurultu_toleransi": GURULTU_ETIKETLERI[profil.maksimum_gurultu],
        "evcil_hayvan_kabulu": EVCIL_HAYVAN_ETIKETLERI[
            profil.evcil_hayvan_kabulu
        ],
    }