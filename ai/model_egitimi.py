import joblib
import pandas as pd 
from sklearn.model_selection import train_test_split
from sklearn.model_selection import GroupShuffleSplit
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import GroupKFold, cross_val_score 
from pathlib import Path

KLASOR = Path(__file__).resolve().parent

veri= pd.read_csv(KLASOR / "roommate_dataset.csv")
print(veri.head())

kaggle_verisi = pd.read_csv(KLASOR / "training_data.csv")
print(kaggle_verisi.head())

print(kaggle_verisi["student1_smoking"].unique())
print(kaggle_verisi["student2_smoking"].unique())

print(veri["smoking"].unique())

sigara_eslestirme = {
    "no": "non_smoker",
    "yes": "smoker",
    "occasionally": "occasional"
}

for sutun in ["student1_smoking", "student2_smoking"]:
    kaggle_verisi[sutun] = (
        kaggle_verisi[sutun]
        .str.strip()
        .str.lower()
        .replace(sigara_eslestirme)
    )

print(kaggle_verisi["student1_smoking"].unique())
print(kaggle_verisi["student2_smoking"].unique())

print(kaggle_verisi["student1_cleanliness"].unique())
print(kaggle_verisi["student2_cleanliness"].unique())

print(veri["cleanliness"].unique())

print(kaggle_verisi["student1_petFriendly"].unique())
print(kaggle_verisi["student2_petFriendly"].unique())
print(veri["pets"].unique())

veri["pet_acceptance"] = veri["pets"].map({
    "not_okay_with_pets": "No",
    "okay_with_pets": "Yes"
})

print(veri[["pets", "pet_acceptance"]].head(10))

print(kaggle_verisi["student1_noiseTolerance"].unique())
print(kaggle_verisi["student2_noiseTolerance"].unique())
print(veri["noise_level"].unique())


gurultu_eslestirme = {
    "Very Low": 1,
    "Low": 2,
    "Moderate": 3,
    "High": 4,
    "Very High": 5
}

for sutun in ["student1_noiseTolerance", "student2_noiseTolerance"]:
    kaggle_verisi[sutun + "_puan"] = (
        kaggle_verisi[sutun].map(gurultu_eslestirme)
    )

print(kaggle_verisi[
    ["student1_noiseTolerance", "student1_noiseTolerance_puan"]
].head())

temizlik_eslestirme = {
    "Relaxed": 1,
    "Moderate": 2,
    "Clean": 3,
    "Very Clean": 4
}

for sutun in ["student1_cleanliness", "student2_cleanliness"]:
    kaggle_verisi[sutun + "_puan"] = (
        kaggle_verisi[sutun].map(temizlik_eslestirme)
    )

print(kaggle_verisi[
    ["student1_cleanliness", "student1_cleanliness_puan"]
].head())

kaggle_verisi["yas_farki"] = (
    kaggle_verisi["student1_age"]
    - kaggle_verisi["student2_age"]
).abs()

print(kaggle_verisi[
    ["student1_age", "student2_age", "yas_farki"]
].head())

kaggle_verisi["sigara_ayni"] = (
    kaggle_verisi["student1_smoking"]
    == kaggle_verisi["student2_smoking"]
).astype(int)

print(kaggle_verisi[
    ["student1_smoking", "student2_smoking", "sigara_ayni"]
].head())

kaggle_verisi["temizlik_farki"] = (
    kaggle_verisi["student1_cleanliness_puan"]
    - kaggle_verisi["student2_cleanliness_puan"]
).abs()

print(kaggle_verisi[
    ["student1_cleanliness_puan",
     "student2_cleanliness_puan",
     "temizlik_farki"]
].head())

kaggle_verisi["gurultu_farki"] = (
    kaggle_verisi["student1_noiseTolerance_puan"]
    - kaggle_verisi["student2_noiseTolerance_puan"]
).abs()

print(kaggle_verisi[
    ["student1_noiseTolerance_puan",
     "student2_noiseTolerance_puan",
     "gurultu_farki"]
].head())

kaggle_verisi["evcil_hayvan_tercihi_ayni"] = (
    kaggle_verisi["student1_petFriendly"]
    == kaggle_verisi["student2_petFriendly"]
).astype(int)

print(kaggle_verisi[
    ["student1_petFriendly",
     "student2_petFriendly",
     "evcil_hayvan_tercihi_ayni"]
].head())

ozellikler = kaggle_verisi[
    [
        "yas_farki",
        "sigara_ayni",
        "temizlik_farki",
        "gurultu_farki",
        "evcil_hayvan_tercihi_ayni"
    ]
].copy()

uyum_skorlari = kaggle_verisi["compatibility_score"].copy()

print(ozellikler.head())
print(uyum_skorlari.head())

print(ozellikler.isna().sum())
print(uyum_skorlari.isna().sum())

X_train, X_test, y_train, y_test = train_test_split(
    ozellikler,
    uyum_skorlari,
    test_size=0.20,
    random_state=42
)

print("Eğitimdeki çift sayısı:", len(X_train))
print("Testteki çift sayısı:", len(X_test))

egitim_kisileri = set(
    kaggle_verisi.loc[X_train.index, "student1_id"]
) | set(
    kaggle_verisi.loc[X_train.index, "student2_id"]
)

test_kisileri = set(
    kaggle_verisi.loc[X_test.index, "student1_id"]
) | set(
    kaggle_verisi.loc[X_test.index, "student2_id"]
)

print("İki grupta da bulunan kişi sayısı:",
      len(egitim_kisileri & test_kisileri))

kisi_gruplari = {}

def grup_bul(kisi):
    kisi_gruplari.setdefault(kisi, kisi)

    if kisi_gruplari[kisi] != kisi:
        kisi_gruplari[kisi] = grup_bul(kisi_gruplari[kisi])

    return kisi_gruplari[kisi]

for kisi1, kisi2 in zip(
    kaggle_verisi["student1_id"],
    kaggle_verisi["student2_id"]
):
    grup1 = grup_bul(kisi1)
    grup2 = grup_bul(kisi2)

    kisi_gruplari[grup1] = grup2

gruplar = kaggle_verisi["student1_id"].map(grup_bul)

print("Bağımsız grup sayısı:", gruplar.nunique())

ayirici = GroupShuffleSplit(
    n_splits=1,
    test_size=0.20,
    random_state=42
)

egitim_indeksleri, test_indeksleri = next(
    ayirici.split(ozellikler, uyum_skorlari, groups=gruplar)
)

X_train = ozellikler.iloc[egitim_indeksleri]
X_test = ozellikler.iloc[test_indeksleri]

y_train = uyum_skorlari.iloc[egitim_indeksleri]
y_test = uyum_skorlari.iloc[test_indeksleri]

print("Yeni eğitim çifti sayısı:", len(X_train))
print("Yeni test çifti sayısı:", len(X_test))

egitim_kisileri = set(
    kaggle_verisi.loc[X_train.index, "student1_id"]
) | set(
    kaggle_verisi.loc[X_train.index, "student2_id"]
)

test_kisileri = set(
    kaggle_verisi.loc[X_test.index, "student1_id"]
) | set(
    kaggle_verisi.loc[X_test.index, "student2_id"]
)

ortak_kisiler = egitim_kisileri & test_kisileri

print("Ortak kişi sayısı:", len(ortak_kisiler))

model = LinearRegression()

model.fit(X_train, y_train)

print("Model eğitimi tamamlandı.")

# Eğittiğimiz modelin test tahminleri
tahminler = model.predict(X_test)

# Tahmin ile mevcut skor arasındaki ortalama fark
model_hatasi = mean_absolute_error(y_test, tahminler)

# Karşılaştırma: Her çifte eğitim skorlarının ortalamasını veren model
basit_model = DummyRegressor(strategy="mean")
basit_model.fit(X_train, y_train)

basit_tahminler = basit_model.predict(X_test)
basit_hata = mean_absolute_error(y_test, basit_tahminler)

print("Modelin ortalama hatası:", model_hatasi)
print("Sadece ortalamayı veren modelin hatası:", basit_hata)

# İlk 10 tahmini yan yana göster
karsilastirma = pd.DataFrame({
    "Verideki skor": y_test,
    "Tahmin edilen skor": tahminler
})

print(karsilastirma.head(10))

orman_modeli = RandomForestRegressor(
    n_estimators=100,
    min_samples_leaf=5,
    random_state=42
)

orman_modeli.fit(X_train, y_train)

orman_tahminleri = orman_modeli.predict(X_test)

orman_hatasi = mean_absolute_error(y_test, orman_tahminleri)

print("Linear Regression hatası:", model_hatasi)
print("Random Forest hatası:", orman_hatasi)

egitim_gruplari = gruplar.loc[X_train.index]

dogrulama = GroupKFold(n_splits=5)

for ad, aday_model in [
    ("Linear Regression", LinearRegression()),
    ("Random Forest", RandomForestRegressor(
        n_estimators=100,
        min_samples_leaf=5,
        random_state=42
    ))
]:
    hatalar = -cross_val_score(
        aday_model,
        X_train,
        y_train,
        groups=egitim_gruplari,
        cv=dogrulama,
        scoring="neg_mean_absolute_error"
    )

    print(ad)
    print("5 bölünmenin hataları:", hatalar)
    print("Ortalama hata:", hatalar.mean())

    model_paketi = {
    "model": model,
    "ozellik_sirasi": ozellikler.columns.tolist(),
    "temizlik_eslestirme": temizlik_eslestirme,
    "gurultu_eslestirme": gurultu_eslestirme,
    "sigara_eslestirme": sigara_eslestirme
}

joblib.dump(model_paketi, KLASOR / "uyum_modeli.joblib")

print("Model uyum_modeli.joblib dosyasına kaydedildi.")