# RoomMate AI — PostgreSQL tablo sözlüğü

## Oluşacak tablolar

`INSTALLED_APPS` içindeki Django uygulamaları ve mevcut migration'lar aşağıdaki tabloları oluşturur. `accounts` uygulaması için model/migration olmadığı için kendi tablosu yoktur.

| Tablo | Sahibi | Amaç |
|---|---|---|
| `django_migrations` | Django | Uygulanmış migration geçmişi. Elle değiştirilmez. |
| `django_content_type` | Django | Yüklü model türlerinin uygulama/model tanımı. |
| `auth_permission` | Django auth | Her model için izin tanımları. |
| `auth_group` | Django auth | Rol/grup tanımları. |
| `auth_group_permissions` | Django auth | Grup–izin çoka-çok ilişki tablosu. |
| `auth_user` | Django auth | Varsayılan kullanıcı hesabı. |
| `auth_user_groups` | Django auth | Kullanıcı–grup çoka-çok ilişki tablosu. |
| `auth_user_user_permissions` | Django auth | Kullanıcı–izin çoka-çok ilişki tablosu. |
| `django_admin_log` | Django admin | Admin arayüzündeki işlem günlüğü. |
| `django_session` | Django sessions | Giriş/çıkış akışındaki veritabanı oturumları. |
| `profil_profil` | RoomMate AI | Kullanıcı profili, arama bilgisi, alışkanlık ve tercihleri. |

## Uygulama tablosu: `profil_profil`

`kullanici_id`, `auth_user.id` alanına FK'dir ve benzersiz olduğundan bir kullanıcının en fazla bir profili olabilir. `NULL` sütunları, migration'daki gerçek `null=True` ayarına göre yazılmıştır.

| Alan | PostgreSQL tipi | PK/FK | NULL | UNIQUE | Açıklama |
|---|---|---|---|---|---|
| `id` | `bigint` | PK | Hayır | PK | Django `BigAutoField`. |
| `kullanici_id` | `integer` | FK → `auth_user.id` | Hayır | Evet | Profil sahibi; silinmesi profili de siler. |
| `ad`, `soyad` | `varchar(50)` | — | Hayır | Hayır | Kullanıcının adı ve soyadı. |
| `yas` | `smallint` | — | Hayır | Hayır | Modelde 18–120 doğrulaması var. |
| `sehir`, `ilce` | `varchar(50)` | — | Hayır | Hayır | Mevcut şehir ve ilçe. |
| `meslek` | `varchar(100)` | — | Hayır | Hayır | Meslek bilgisi. |
| `hakkimda` | `text` | — | Hayır | Hayır | En çok 1000 karakter; boş metin olabilir. |
| `kullanim_amaci` | `varchar(20)` | — | Hayır | Hayır | `ev_ariyorum`, `evime_arkadas`, `birlikte_ev`. |
| `aranan_sehir` | `varchar(50)` | — | Hayır | Hayır | Aranan şehir; boş metin olabilir. |
| `aranan_ilceler` | `jsonb` | — | Hayır | Hayır | Aranan ilçe metinleri; uygulama varsayılanı `[]`. |
| `kira_butcesi` | `numeric(10,2)` | — | Evet | Hayır | Mevcut tek bütçe alanı. |
| `kira_butcesi_min`, `kira_butcesi_max` | `numeric(10,2)` | — | Evet | Hayır | `0002` migration'ıyla eklenen AI aday filtresi bütçe aralığı. |
| `tasinma_tarihi` | `date` | — | Evet | Hayır | Planlanan taşınma tarihi. |
| `sigara`, `evcil_hayvan` | `boolean` | — | Evet | Hayır | Kullanıcının alışkanlık/sahiplik durumu. |
| `sigara_durumu` | `varchar(12)` | — | Hayır | Hayır | `non_smoker`, `smoker`, `occasional`; `0002` migration'ıyla eklenir. |
| `temizlik`, `gurultu` | `smallint` | — | Evet | Hayır | Kullanıcının 1–5 yaşam alışkanlığı puanı. |
| `sigara_kabulu`, `evcil_hayvan_kabulu` | `varchar(12)` | — | Hayır | Hayır | `evet`, `hayir`, `fark_etmez`; boş metin olabilir. |
| `minimum_temizlik`, `maksimum_gurultu` | `smallint` | — | Evet | Hayır | Karşı taraf için 1–5 tercih sınırları. |
| `olusturulma_tarihi`, `guncellenme_tarihi` | `timestamp with time zone` | — | Hayır | Hayır | Django `auto_now_add` / `auto_now` zaman damgaları. |

> Model validator'ları ve `choices` tanımları mevcut migration'da PostgreSQL `CHECK` kısıtına dönüşmez. Bu kasıtlı tasarımın sonucu olarak 18–120, 1–5 ve seçim değerleri Django doğrulamasıyla korunur. Veritabanı seviyesinde zorunlu kılınmaları istenirse Yaren'in onayıyla yeni Django migration'ı gerekir.

## Kimlik, yetki ve oturum tabloları

| Tablo | Alanlar ve kısıtlar |
|---|---|
| `auth_user` | `id integer PK`; `username varchar(150) NOT NULL UNIQUE`; `email varchar(254) NOT NULL` ancak benzersiz değil; `password varchar(128) NOT NULL`; `last_login timestamptz NULL`; `first_name`, `last_name varchar(150) NOT NULL`; `is_staff`, `is_active`, `is_superuser boolean NOT NULL`; `date_joined timestamptz NOT NULL`. |
| `auth_group` | `id integer PK`; `name varchar(150) NOT NULL UNIQUE`. |
| `django_content_type` | `id integer PK`; `app_label varchar(100) NOT NULL`; `model varchar(100) NOT NULL`; (`app_label`, `model`) benzersiz. |
| `auth_permission` | `id integer PK`; `name varchar(255) NOT NULL`; `content_type_id integer NOT NULL FK`; `codename varchar(100) NOT NULL`; (`content_type_id`, `codename`) benzersiz. |
| `auth_user_groups` | `id bigint PK`; `user_id integer NOT NULL FK`; `group_id integer NOT NULL FK`; (`user_id`, `group_id`) benzersiz. |
| `auth_user_user_permissions` | `id bigint PK`; `user_id integer NOT NULL FK`; `permission_id integer NOT NULL FK`; (`user_id`, `permission_id`) benzersiz. |
| `auth_group_permissions` | `id bigint PK`; `group_id integer NOT NULL FK`; `permission_id integer NOT NULL FK`; (`group_id`, `permission_id`) benzersiz. |
| `django_admin_log` | `id integer PK`; `action_time timestamptz NOT NULL`; `user_id integer NOT NULL FK`; `content_type_id integer NULL FK`; `object_id text NULL`; `object_repr varchar(200) NOT NULL`; `action_flag smallint NOT NULL`; `change_message text NOT NULL`. |
| `django_session` | `session_key varchar(40) PK`; `session_data text NOT NULL`; `expire_date timestamptz NOT NULL`, indeksli. |
| `django_migrations` | `id bigint PK`; `app varchar(255) NOT NULL`; `name varchar(255) NOT NULL`; `applied timestamptz NOT NULL`. |

## İndeksler ve kısıtlar

Django migration'larının oluşturacağı gerekli indeks/kısıtlar:

- Her tablonun PK indeksi.
- `auth_user.username`, `auth_group.name`, `profil_profil.kullanici_id` benzersiz indeksleri.
- İçerik türü, izin ve ara tablolardaki bileşik benzersiz kısıtlar.
- FK alanlarındaki Django indeksleri ve `django_session.expire_date` indeksi.
- `profil.0002_profil_ai_uyumluluk_alanlari` ile `kira_butcesi_min` ve `kira_butcesi_max` için negatif olmama; iki değer doluysa `min <= max` `CHECK` kısıtları.

Ek aday eşleştirme indeksi **şu an eklenmemelidir**. AI kodunun `location` ve bütçe aralığı alanları `Profil` ile aynı sözleşmeye sahip değildir. Sorgu ve alanlar onaylanınca, `EXPLAIN (ANALYZE, BUFFERS)` ile ölçülen gerçek endpoint için yalnız Django migration'ı üzerinden indeks eklenmelidir.
