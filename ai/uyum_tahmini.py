import joblib
import pandas as pd
from pathlib import Path

KLASOR = Path(__file__).resolve().parent
model_paketi = joblib.load(KLASOR / "uyum_modeli.joblib")

model = model_paketi["model"]
ozellik_sirasi = model_paketi["ozellik_sirasi"]


def kisi_kontrol(kisi):
    gerekli_alanlar = [
        "yas",
        "sigara",
        "temizlik",
        "gurultu_toleransi",
        "evcil_hayvan_kabulu"
    ]

    for alan in gerekli_alanlar:
        if alan not in kisi:
            raise ValueError(f"Eksik bilgi: {alan}")

    if type(kisi["yas"]) is not int or kisi["yas"] < 18:
        raise ValueError("Yaş, 18 veya üzeri bir tam sayı olmalı.")

    if kisi["sigara"] not in [
        "non_smoker", "smoker", "occasional"
    ]:
        raise ValueError("Geçersiz sigara seçeneği.")

    if kisi["temizlik"] not in model_paketi["temizlik_eslestirme"]:
        raise ValueError("Geçersiz temizlik seçeneği.")

    if kisi["gurultu_toleransi"] not in model_paketi["gurultu_eslestirme"]:
        raise ValueError("Geçersiz gürültü toleransı seçeneği.")

    if kisi["evcil_hayvan_kabulu"] not in ["Yes", "No"]:
        raise ValueError("Evcil hayvan kabulü Yes veya No olmalı.")

def uyum_hesapla(kisi1, kisi2):
    kisi_kontrol(kisi1)
    kisi_kontrol(kisi2)

    temizlik = model_paketi["temizlik_eslestirme"]
    gurultu = model_paketi["gurultu_eslestirme"]

    ozellikler = {
        "yas_farki": abs(kisi1["yas"] - kisi2["yas"]),

        "sigara_ayni": int(
            kisi1["sigara"] == kisi2["sigara"]
        ),

        "temizlik_farki": abs(
            temizlik[kisi1["temizlik"]]
            - temizlik[kisi2["temizlik"]]
        ),

        "gurultu_farki": abs(
            gurultu[kisi1["gurultu_toleransi"]]
            - gurultu[kisi2["gurultu_toleransi"]]
        ),

        "evcil_hayvan_tercihi_ayni": int(
            kisi1["evcil_hayvan_kabulu"]
            == kisi2["evcil_hayvan_kabulu"]
        )
    }

    tablo = pd.DataFrame([ozellikler])
    tablo = tablo[ozellik_sirasi]

    skor = model.predict(tablo)[0]

    aciklamalar = []

    if ozellikler["sigara_ayni"] == 1:
        aciklamalar.append("Sigara kullanım durumlarınız aynı.")
    else:
        aciklamalar.append("Sigara kullanım durumlarınız farklı.")

    if ozellikler["temizlik_farki"] == 0:
        aciklamalar.append("Temizlik düzeyleriniz aynı.")
    else:
        aciklamalar.append("Temizlik düzeyleriniz farklı.")

    if ozellikler["gurultu_farki"] == 0:
        aciklamalar.append("Gürültü toleranslarınız aynı.")
    else:
        aciklamalar.append("Gürültü toleranslarınız farklı.")

    if ozellikler["evcil_hayvan_tercihi_ayni"] == 1:
        aciklamalar.append("Evcil hayvan kabul tercihleriniz aynı.")
    else:
        aciklamalar.append("Evcil hayvan kabul tercihleriniz farklı.")

    aciklamalar.append(
        f"Aranızdaki yaş farkı {ozellikler['yas_farki']} yıl."
    )

    return {
        "skor": round(float(skor), 2),
        "aciklamalar": aciklamalar
    }


if __name__ == "__main__":
    kisi1 = {
        "yas": 21,
        "sigara": "non_smoker",
        "temizlik": "Very Clean",
        "gurultu_toleransi": "Low",
        "evcil_hayvan_kabulu": "Yes"
    }

    kisi2 = {
        "yas": 23,
        "sigara": "non_smoker",
        "temizlik": "Very Clean",
        "gurultu_toleransi": "Moderate",
        "evcil_hayvan_kabulu": "Yes"
    }

    sonuc = uyum_hesapla(kisi1, kisi2)

    print("Tahmini uyum skoru:", sonuc["skor"])

    for aciklama in sonuc["aciklamalar"]:
        print("-", aciklama)