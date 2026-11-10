# RoomMate AI — PostgreSQL veri sözlüğü

> Aşağıdaki test sonuçları çalışan yerel sunum sistemine aittir. Uzak backend ile fark ve temiz kurulum önkoşulu için [uyum notunu](BACKEND_UYUM_NOTU.md) okuyun. Kurulum komutları [README](../README.md) içindedir.

4 Kasım 2026 tarihinde mevcut veritabanına bağlanıldı; başlangıçta 11 tablo, 0 kullanıcı ve 0 profil vardı. PostgreSQL 18.6 localhost:5433 üzerinde çalışıyor. Veritabanı roommate_ai, uygulama rolü roommate_app. Veritabanı yeniden oluşturulmadı veya sıfırlanmadı.

## Uygulanan işlemler

- Değişiklikten önce Git dışında tutulan yerel bir PostgreSQL dump yedeği alındı; pg_restore liste kontrolü geçti.
- Mevcut `profil.0002_profil_ai_uyumluluk_alanlari` migration'ı uygulandı. Backend/migration kaynakları değiştirilmedi.
- `messaging_matches.sql` ile 3 ek tablo oluşturuldu. Toplam 14 uygulama/altyapı tablosu var.
- `makemigrations --check --dry-run` yeni model değişikliği bulmadı.

## Django tarafından yönetilen tablolar

`auth_user`, `auth_group`, `auth_permission`, `auth_user_groups`, `auth_user_user_permissions`, `auth_group_permissions`, `django_content_type`, `django_admin_log`, `django_session`, `django_migrations`, `profil_profil`.

Hesap kaydı `auth_user` tablosuna Django'nun parola hash mekanizmasıyla yazılır. `accounts` ayrı bir tablo tanımlamaz. `profil_profil.kullanici_id` benzersiz FK ile `auth_user.id` alanına bağlıdır. Kullanıcı silmede profil temizliği Django modelindeki on_delete=CASCADE davranışına aittir; fiziksel PostgreSQL FK'si doğrudan ON DELETE CASCADE tanımlamaz.

## Profil alanları

| Grup | Alanlar / türler |
|---|---|
| Kimlik | id bigint PK; kullanici_id integer UNIQUE FK |
| Kişisel | ad/soyad varchar(50), yas smallint, sehir/ilce varchar(50), meslek varchar(100), hakkimda text |
| Arayış | kullanim_amaci varchar(20), aranan_sehir varchar(50), aranan_ilceler jsonb, tasinma_tarihi date NULL |
| Bütçe | kira_butcesi, kira_butcesi_min, kira_butcesi_max numeric(10,2) NULL |
| Alışkanlık | sigara boolean NULL, sigara_durumu varchar(12), evcil_hayvan boolean NULL, temizlik/gurultu smallint NULL |
| Tercihler | sigara_kabulu/evcil_hayvan_kabulu varchar(12), minimum_temizlik/maksimum_gurultu smallint NULL |
| Tarihler | olusturulma_tarihi/guncellenme_tarihi timestamptz |

Bütçe minimum/maksimum negatif olamaz; ikisi de doluysa minimum <= maksimum PostgreSQL CHECK ile korunur. Yaş 18–120, alışkanlık puanları 1–5 ve seçim değerleri mevcut API validator'larıyla doğrulanır; bunları kapsayan yeni backend migration'ı yazılmadı. Aranan ilçeler API'de boş olmayan metinlerden oluşan bir listedir. Bütçe aylık, kişi başı TL olarak gösterilir.

## Veritabanı sorumluluğunda eklenen tablolar

| Tablo | Alanlar ve kurallar |
|---|---|
| roommate_match | bigint id PK; kullanici_id ve aday_id auth_user FK; aynı kişi olamaz; kullanıcı-aday çifti UNIQUE; nullable numeric(8,2) skor; array türünde jsonb aciklamalar; model_surumu; oluşturma zamanı |
| roommate_conversation | bigint id PK; kullanici_a_id/kullanici_b_id auth_user FK; a < b; çift UNIQUE; oluşturma zamanı |
| roommate_message | bigint id PK; konusma_id ve a/b kullanıcı kimlikleri birlikte konuşmaya composite FK; gonderen_id auth_user FK ve konuşmanın iki üyesinden biri olmak zorunda; 1–4000 karakter içerik; oluşturma/okunma zamanı |

Ek tablolardaki auth_user FK'leri ON DELETE CASCADE kullanır. Mesajın composite FK'si konuşmadaki üyelerle birebir eşleşir; başka konuşmanın üyesi mesaj gönderemez. Konuşma/tarih indeksi mesaj sıralamasını destekler. Skorun ölçeği mevcut model/API sözleşmesinde doğrulanmadığı için varsayımsal yüzde CHECK'i eklenmedi. Gerçek/sahte AI sonucu veritabanına yazılmadı.

**Bu üç tablo için backend modeli veya HTTP endpoint'i yoktur.** Tablo oluşturmak mesajlaşmayı/AI'yi uygulamada çalışır hale getirmez. UI bunu açıkça belirtir. Yaren ileride model/migration eklerken mevcut tabloları ve sahipliğini dikkate almalıdır; aynı tabloları körlemesine yeniden CREATE etmemelidir.

## Doğrulama

`database/verify.ps1` API ve bağımsız psycopg bağlantısı üzerinden 14 kontrol yapar. Ayrı doğrulama hesabının profilini oluşturur/günceller. Mevcut kullanıcıları silmez. Mesaj/eşleşme kısıt testleri transaction içinde geri alınır; gerçek kullanıcı verisi silinmez. Rapor `.local/verification-report.json` dosyasındadır.
