import pandas as pd

from aday_onerisi import aday_bul
from uyum_tahmini import uyum_hesapla


def ev_arkadasi_oner(kullanici, aday_verisi, limit=5):
    # 1. Konum ve bütçeye uygun adayları bul.
    uygun_adaylar = aday_bul(aday_verisi, kullanici)

    sonuclar = []

    # 2. Her uygun adayın uyum skorunu hesapla.
    for _, aday in uygun_adaylar.iterrows():
        aday_bilgileri = {
            "yas": int(aday["age"]),
            "sigara": aday["smoking"],
            "temizlik": aday["cleanliness"],
            "gurultu_toleransi": aday["noise_tolerance"],
            "evcil_hayvan_kabulu": aday["pet_acceptance"]
        }

        uyum = uyum_hesapla(kullanici, aday_bilgileri)

        sonuclar.append({
            "aday_id": int(aday["user_id"]),
            "ad": aday["name"],
            "skor": uyum["skor"],
            "aciklamalar": uyum["aciklamalar"]
        })

    # 3. Yüksek skorlu adayları önce göster.
    sonuclar.sort(
        key=lambda sonuc: sonuc["skor"],
        reverse=True
    )

    return sonuclar[:limit]


if __name__ == "__main__":
    # Örnek kullanıcı.
    # Bütçe: aylık, kişi başı, TL.
    kullanici = {
        "id": 1,
        "konum": "İstanbul / Kadıköy",
        "butce_min": 10000,
        "butce_max": 15000,
        "yas": 21,
        "sigara": "non_smoker",
        "temizlik": "Very Clean",
        "gurultu_toleransi": "Low",
        "evcil_hayvan_kabulu": "Yes"
    }

    # Sistemi denemek için hazırlanmış örnek adaylar.
    aday_verisi = pd.DataFrame([
        {
            "user_id": 2,
            "name": "Aday A",
            "location": "İstanbul / Kadıköy",
            "budget_min": 12000,
            "budget_max": 16000,
            "age": 23,
            "smoking": "non_smoker",
            "cleanliness": "Very Clean",
            "noise_tolerance": "Moderate",
            "pet_acceptance": "Yes"
        },
        {
            "user_id": 3,
            "name": "Aday B",
            "location": "İstanbul / Kadıköy",
            "budget_min": 11000,
            "budget_max": 14000,
            "age": 25,
            "smoking": "smoker",
            "cleanliness": "Relaxed",
            "noise_tolerance": "High",
            "pet_acceptance": "No"
        },
        {
            "user_id": 4,
            "name": "Aday C",
            "location": "İstanbul / Beşiktaş",
            "budget_min": 10000,
            "budget_max": 15000,
            "age": 21,
            "smoking": "non_smoker",
            "cleanliness": "Very Clean",
            "noise_tolerance": "Low",
            "pet_acceptance": "Yes"
        },
        {
            "user_id": 5,
            "name": "Aday D",
            "location": "İstanbul / Kadıköy",
            "budget_min": 20000,
            "budget_max": 25000,
            "age": 22,
            "smoking": "non_smoker",
            "cleanliness": "Clean",
            "noise_tolerance": "Low",
            "pet_acceptance": "Yes"
        }
    ])

    oneriler = ev_arkadasi_oner(kullanici, aday_verisi)

    print("Önerilen aday sayısı:", len(oneriler))

    if not oneriler:
        print("Konum ve bütçeye uygun aday bulunamadı.")

    for sira, oneri in enumerate(oneriler, start=1):
        print(f"\n{sira}. {oneri['ad']}")
        print("Tahmini uyum skoru:", oneri["skor"])

        for aciklama in oneri["aciklamalar"]:
            print("-", aciklama)