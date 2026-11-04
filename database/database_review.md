# RoomMate AI — Veritabanı tasarım incelemesi

## Sonuç

Mevcut backend ile uyumlu ve ilk PostgreSQL geçişi için gerekli uygulama şeması, Django'nun standart `auth`/`admin`/`contenttypes`/`sessions` tabloları ile `profil_profil` tablosudur. `profil.0002_profil_ai_uyumluluk_alanlari`, bu mevcut Profile üç uyumluluk alanı ekler; yeni iş tablosu veya elle oluşturulmuş indeks eklemez.

Bu kararın nedeni, AI tarafındaki alan sözleşmesinin `Profil` ile henüz uyumlu olmamasıdır. Uyumsuzluğu veritabanında geçici/varsayımsal tablolarla kapatmak yerine, onaylı backend/AI sözleşmesinden sonra Django migration'ı ile ilerlemek gerekir.

## AI–Profil uyumsuzluk raporu

| Alan | `Profil` | AI | Risk / öneri |
|---|---|---|---|
| Konum | `sehir`, `ilce`, `aranan_sehir`, JSON `aranan_ilceler` | Tek metin `location`/`konum` | Aranan şehir ve ilçe kesişim kuralı netleşmeden doğrudan eşleme yapılamaz. |
| Bütçe | Tek, nullable `kira_butcesi` | Zorunlu `budget_min`/`budget_max` | Aralık kullanılacaksa yeni iki alan ve `min <= max` kuralı, onaylı Django migration'ıyla eklenmeli. |
| Yaş | 18–120 `smallint` | `age`/`yas` tam sayı | Yalnız alan adı dönüşümü gerekir. |
| Sigara | Nullable boolean + üç değerli kabul tercihi | Üç kategorili durum (`occasional` dahil) | Boolean üçüncü değeri taşımaz; ürün kararıyla kategorik alan/dönüşüm gerekir. |
| Temizlik | 1–5 sayı | Çıkarımda dört etiket; aday CSV'sinde 1–5 | Model 5'i eşleyemez. Modelin yeniden eğitimi veya ölçek daraltma kararı gerekir. |
| Gürültü | Davranış ve tercih için iki 1–5 sayı | Etiketli `noise_tolerance`; ham CSV'de `noise_level` | Davranış/tolerans ayrımı ve dönüşüm kuralı yoktur. |
| Evcil hayvan | Sahiplik boolean + `evet`/`hayir`/`fark_etmez` kabulü | `Yes`/`No` kabulü; ham CSV'de karışık `pets` | Sahiplik ve kabul ayrı kalmalı; `fark_etmez` model kararı gerektirir. |

## AI kodundan doğrulanan riskler

- `ev_arkadasi_onerisi.py` aday için `noise_tolerance` ve `pet_acceptance` okur; `roommate_dataset.csv` ise `noise_level` ve `pets` içerir. CSV doğrudan gönderilirse sütun hatası oluşur.
- `uyum_tahmini.py`, `yas_farki`, `sigara_ayni`, `temizlik_farki`, `gurultu_farki`, `evcil_hayvan_tercihi_ayni` özelliklerini üretir. Taşınma tarihi ve kullanım amacı kullanılmaz.
- Eğitim verisi Singapur öğrenci verisi, aday CSV'si ise Nepal konumları içerir. Hedef kullanıcı kitlesi, para birimi ve skor kalitesi ürün verisiyle doğrulanmalıdır.
- `joblib` pickle tabanlıdır; yalnız güvenilir kaynaklı artefakt yüklenmelidir. Eğitim veri sürümü, metrik, tarih ve bağımlılık sürümü kaydedilmelidir.

## Onaydan sonra önerilen işlemler

1. Bütçe aralığı, para birimi ve konum filtre semantiğini ürün sahibiyle kesinleştirmek.
2. Sigara, temizlik, gürültü ve evcil hayvan için kanonik değer sözleşmesini belirlemek.
3. Bu sözleşmeye göre Yaren'in yeni model/migration hazırlamasını sağlamak; veritabanı sorumlusu olarak migration SQL'ini incelemek.
4. Gerçek aday sorgusu oluşunca `EXPLAIN (ANALYZE, BUFFERS)` ile gerekli indeksleri belirlemek.
5. Eşleşme geçmişi/beğeni/skor denetimi istenirse iki yönlü Profil FK'si, skor, karar, model sürümü ve zaman damgası içeren ayrı etkileşim modeli tasarlamak.

## Bu teslimatta yapılmayanlar

- Backend, frontend, AI, CSV veya model artefaktı değiştirilmedi.
- PostgreSQL'e bağlanılmadı; SQL çalıştırılmadı; migration uygulanmadı.
- Mevcut dosya silinmedi, taşınmadı veya yeniden adlandırılmadı.
