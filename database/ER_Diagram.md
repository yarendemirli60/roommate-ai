# RoomMate AI — mevcut ilişkiler

```mermaid
erDiagram
    AUTH_USER ||--o| PROFIL_PROFIL : owns
    AUTH_USER ||--o{ ROOMMATE_MATCH : source
    AUTH_USER ||--o{ ROOMMATE_MATCH : candidate
    AUTH_USER ||--o{ ROOMMATE_CONVERSATION : member_a
    AUTH_USER ||--o{ ROOMMATE_CONVERSATION : member_b
    ROOMMATE_CONVERSATION ||--o{ ROOMMATE_MESSAGE : contains
    AUTH_USER ||--o{ ROOMMATE_MESSAGE : sends
    AUTH_USER {
        integer id PK
        varchar username UK
        varchar password_hash
    }
    PROFIL_PROFIL {
        bigint id PK
        integer kullanici_id FK,UK
        varchar sehir
        varchar aranan_sehir
        jsonb aranan_ilceler
        numeric kira_butcesi_min
        numeric kira_butcesi_max
        varchar sigara_durumu
        smallint temizlik
    }
    ROOMMATE_MATCH {
        bigint id PK
        integer kullanici_id FK
        integer aday_id FK
        numeric skor
        jsonb aciklamalar
        varchar model_surumu
    }
    ROOMMATE_CONVERSATION {
        bigint id PK
        integer kullanici_a_id FK
        integer kullanici_b_id FK
    }
    ROOMMATE_MESSAGE {
        bigint id PK
        bigint konusma_id FK
        integer kullanici_a_id FK
        integer kullanici_b_id FK
        integer gonderen_id FK
        text icerik
        timestamptz okunma_tarihi
    }
```

Profil kullanıcı ilişkisi bire-birdir. Eşleşme yönlüdür; kaynak-aday çifti benzersizdir, kendi kendine eşleşme olamaz. Konuşmada küçük kullanıcı ID'si a, büyük ID b olur; çift benzersizdir. Mesajın (konusma_id, kullanici_a_id, kullanici_b_id) composite FK'si konuşmayı doğrular; gönderen bu iki kullanıcıdan biridir.

Auth/yetki/session/admin/migration tabloları Django tarafından yönetilir. roommate_* tabloları database/messaging_matches.sql ile eklendi; mevcut backend bunları henüz kullanmaz.
