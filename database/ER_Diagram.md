# RoomMate AI — ER Diyagramı

Bu diyagram, mevcut backend migration'ı (`profil.0001_initial`) ve etkin Django uygulamaları üzerinden hazırlanmıştır. `accounts` uygulamasında model veya migration olmadığından `accounts_*` tablosu oluşmaz. Tüm gösterilen tablolar Django migration'larıyla oluşturulur; elle `CREATE TABLE` çalıştırılmamalıdır.

```mermaid
erDiagram
    AUTH_USER ||--o| PROFIL_PROFIL : "1 — 0..1, CASCADE"
    AUTH_USER ||--o{ DJANGO_ADMIN_LOG : "işlemi yapan"
    DJANGO_CONTENT_TYPE ||--o{ AUTH_PERMISSION : "model türü"
    DJANGO_CONTENT_TYPE o|--o{ DJANGO_ADMIN_LOG : "hedef türü"
    AUTH_USER ||--o{ AUTH_USER_GROUPS : "üyelik"
    AUTH_GROUP ||--o{ AUTH_USER_GROUPS : "üyelik"
    AUTH_USER ||--o{ AUTH_USER_USER_PERMISSIONS : "doğrudan yetki"
    AUTH_PERMISSION ||--o{ AUTH_USER_USER_PERMISSIONS : "atanan yetki"
    AUTH_GROUP ||--o{ AUTH_GROUP_PERMISSIONS : "grup yetkisi"
    AUTH_PERMISSION ||--o{ AUTH_GROUP_PERMISSIONS : "yetki"

    AUTH_USER {
        integer id PK
        varchar_150 username UK
        varchar_254 email
        varchar_128 password
        boolean is_staff
        boolean is_active
        boolean is_superuser
        timestamptz date_joined
    }
    PROFIL_PROFIL {
        bigint id PK
        integer kullanici_id FK_UK
        varchar_50 ad
        varchar_50 soyad
        smallint yas
        varchar_50 sehir
        varchar_50 ilce
        varchar_100 meslek
        varchar_20 kullanim_amaci
        jsonb aranan_ilceler
        numeric_10_2 kira_butcesi
        date tasinma_tarihi
        boolean sigara
        boolean evcil_hayvan
        smallint temizlik
        smallint gurultu
        varchar_12 sigara_kabulu
        varchar_12 evcil_hayvan_kabulu
        smallint minimum_temizlik
        smallint maksimum_gurultu
        timestamptz olusturulma_tarihi
        timestamptz guncellenme_tarihi
    }
    DJANGO_CONTENT_TYPE {
        integer id PK
        varchar_100 app_label
        varchar_100 model
    }
    AUTH_PERMISSION {
        integer id PK
        integer content_type_id FK
        varchar_100 codename
        varchar_255 name
    }
    AUTH_GROUP {
        integer id PK
        varchar_150 name UK
    }
    AUTH_USER_GROUPS {
        bigint id PK
        integer user_id FK
        integer group_id FK
    }
    AUTH_USER_USER_PERMISSIONS {
        bigint id PK
        integer user_id FK
        integer permission_id FK
    }
    AUTH_GROUP_PERMISSIONS {
        bigint id PK
        integer group_id FK
        integer permission_id FK
    }
    DJANGO_ADMIN_LOG {
        integer id PK
        timestamptz action_time
        integer user_id FK
        integer content_type_id FK
        text object_id
        varchar_200 object_repr
        smallint action_flag
        text change_message
    }
    DJANGO_SESSION {
        varchar_40 session_key PK
        text session_data
        timestamptz expire_date
    }
    DJANGO_MIGRATIONS {
        bigint id PK
        varchar_255 app
        varchar_255 name
        timestamptz applied
    }
```

## İlişki kuralları

| İlişki | Tür | Kural |
|---|---|---|
| `auth_user` → `profil_profil` | Bire-bir | `kullanici_id` hem FK hem `UNIQUE`; kullanıcı silinirse profil `CASCADE` ile silinir. |
| Kullanıcı ↔ grup | Çoka-çok | `auth_user_groups`; kullanıcı-grup çifti benzersizdir. |
| Kullanıcı ↔ izin | Çoka-çok | `auth_user_user_permissions`; kullanıcı-izin çifti benzersizdir. |
| Grup ↔ izin | Çoka-çok | `auth_group_permissions`; grup-izin çifti benzersizdir. |
| İçerik türü → izin | Bire-çok | `auth_permission.content_type_id` zorunlu FK'dir. |
| Kullanıcı → admin günlüğü | Bire-çok | Admin işlem kaydı; kullanıcı silinince kayıtlar da silinir. |

AI CSV'leri ve `uyum_modeli.joblib` birer dosya varlığıdır; bu aşamada yeni PostgreSQL tablosu değildir. Eşleşme sonucu yalnız istek anında hesaplanacaksa ayrıca sonuç tablosu gerekli değildir.
