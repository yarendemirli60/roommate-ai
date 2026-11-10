import pandas as pd
from pathlib import Path

KLASOR = Path(__file__).resolve().parent

def aday_bul(aday_verisi, kullanici):
    # Konum adlarını karşılaştırmaya uygun hâle getir.
    aday_konumlari = (
        aday_verisi["location"]
        .astype("string")
        .str.strip()
        .str.casefold()
    )

    kullanici_konumu = kullanici["konum"].strip().casefold()

    # Bütçe sütunlarını sayıya çevir.
    aday_min = pd.to_numeric(
        aday_verisi["budget_min"], errors="coerce"
    )

    aday_max = pd.to_numeric(
        aday_verisi["budget_max"], errors="coerce"
    )

    kullanici_min = kullanici["butce_min"]
    kullanici_max = kullanici["butce_max"]

    if kullanici_min < 0 or kullanici_max < kullanici_min:
        raise ValueError("Kullanıcının bütçe aralığı geçersiz.")

    ayni_konum = aday_konumlari == kullanici_konumu

    gecerli_butce = (
        aday_min.notna()
        & aday_max.notna()
        & (aday_min >= 0)
        & (aday_max >= aday_min)
    )

    # İki kişinin bütçe aralıklarında ortak bir tutar var mı?
    butce_ortak = (
        (aday_min <= kullanici_max)
        & (aday_max >= kullanici_min)
    )

    # Kullanıcının kendisini aday olarak gösterme.
    kendisi_degil = (
        aday_verisi["user_id"] != kullanici["id"]
    )

    uygun_adaylar = aday_verisi.loc[
        ayni_konum
        & gecerli_butce
        & butce_ortak
        & kendisi_degil
    ].copy()

    return uygun_adaylar


if __name__ == "__main__":
    aday_verisi = pd.read_csv(KLASOR / "roommate_dataset.csv")

    # İlk kaydı örnek kullanıcı olarak kullanıyoruz.
    ornek_kisi = aday_verisi.iloc[0]

    kullanici = {
        "id": ornek_kisi["user_id"],
        "konum": ornek_kisi["location"],
        "butce_min": float(ornek_kisi["budget_min"]),
        "butce_max": float(ornek_kisi["budget_max"])
    }

    uygun_adaylar = aday_bul(aday_verisi, kullanici)

    print("Kullanıcının konumu:", kullanici["konum"])
    print(
        "Kullanıcının bütçesi:",
        kullanici["butce_min"],
        "-",
        kullanici["butce_max"]
    )

    print("\nUygun aday sayısı:", len(uygun_adaylar))

    print("\nİlk 5 uygun aday:")
    print(
        uygun_adaylar[
            ["user_id", "location", "budget_min", "budget_max"]
        ].head()
    )