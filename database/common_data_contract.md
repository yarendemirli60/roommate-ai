# RoomMate AI — Ortak Profil/AI veri sözleşmesi

Bu sözleşme mevcut kullanıcı kayıt/giriş akışını değiştirmez. `auth_user` ve `Profil.kullanici` ilişkisi aynen korunur. AI kodu bu çalışmada değiştirilmemiştir.

## Onaylı minimum şema değişikliği

`profil.0002_profil_ai_uyumluluk_alanlari` migration'ı aşağıdaki alanları ekler:

| Yeni alan | PostgreSQL tipi | Neden |
|---|---|---|
| `kira_butcesi_min` | `numeric(10,2) NULL` | AI aday filtresinin alt bütçe sınırı. |
| `kira_butcesi_max` | `numeric(10,2) NULL` | AI aday filtresinin üst bütçe sınırı. |
| `sigara_durumu` | `varchar(12) NOT NULL`, boş metin kabul edilir | AI'nin `non_smoker` / `smoker` / `occasional` değerleri. |

`kira_butcesi` kaldırılmamıştır; mevcut API ve veriyi bozmaz. Yeni minimum/maksimum alanlarının negatif olmaması ve her ikisi doluysa `min <= max` olması PostgreSQL `CHECK` kısıtlarıyla korunur. Yeni alanlar nullable olduğundan mevcut profil kayıtları migration sırasında geçerliliğini korur.

## Ortak alan eşlemesi

| Ortak anlam | Django Profil kaynağı | AI girdisi | Dönüştürme kuralı |
|---|---|---|---|
| Kimlik | `kullanici_id` | `id` / `user_id` | Daima Django kullanıcı PK'si kullanılır; `Profil.id` aday kimliği değildir. |
| Görünen ad | `ad`, `soyad` | `name` | API katmanında birleştirilir. |
| Yaş | `yas` | `yas` / `age` | Doğrudan tamsayı. |
| Konum | `aranan_sehir`, `aranan_ilceler` | `konum` / `location` | Aranan şehir ve ilçe birlikte kanonikleştirilir. AI tek konum istediğinden çoklu ilçeler ayrı aday sorgularına dönüştürülmelidir. |
| Bütçe | `kira_butcesi_min`, `kira_butcesi_max` | `butce_min`, `butce_max` | Doğrudan sayısal aralık. Tüm bütçeler aylık, kişi başı TRY olarak tanımlanmalıdır. |
| Sigara | `sigara_durumu`; eski `sigara` geri uyumluluk için kalır | `sigara` | Yeni alan doğrudan kullanılır. Eski boolean yalnız geçmiş kayıtlar için `False→non_smoker`, `True→smoker` dönüşümüyle kullanılabilir. |
| Temizlik | `temizlik` | `temizlik` | 1–4 değerleri `Relaxed`, `Moderate`, `Clean`, `Very Clean` olarak dönüştürülür. Mevcut AI modeli 5'i desteklemez. |
| Gürültü toleransı | `maksimum_gurultu` | `gurultu_toleransi` | 1–5, `Very Low`…`Very High` etiketine dönüştürülür. `gurultu`, kişinin kendi gürültü davranışıdır ve ayrı kalır. |
| Evcil hayvan kabulü | `evcil_hayvan_kabulu` | `evcil_hayvan_kabulu` | `evet→Yes`, `hayir→No`. `fark_etmez` mevcut AI modelinin ikili girdisine dönüştürülemez. |

## Bilinçli olarak yapılmayan değişiklikler

- `temizlik`, `gurultu`, `evcil_hayvan`, `evcil_hayvan_kabulu`, `sehir`, `ilce` veya `aranan_ilceler` silinmedi/değiştirilmedi.
- AI algoritması, CSV'ler ve `uyum_modeli.joblib` değiştirilmedi.
- Yeni eşleşme sonucu tablosu eklenmedi. Anlık sonuç için gerekli değildir; beğeni/geçmiş/model denetimi istenirse ayrı karar gerekir.
- Ek indeks eklenmedi. Gerçek aday sorgusu ve veri hacmi ölçülmeden aralık filtresi için indeks seçmek erken optimizasyondur.

## AI modeli için açık kısıtlar

Mevcut model yalnız dört temizlik etiketi tanır. Profildeki `temizlik=5` için güvenilir dönüşüm yoktur. Bu değerde AI skoru üretilmemeli ya da model, onay sonrası 1–5 ölçeğiyle yeniden eğitilmelidir. Benzer şekilde `evcil_hayvan_kabulu=fark_etmez` için AI modelinin yeniden eğitilmesi veya açık ürün kuralı gerekir.
