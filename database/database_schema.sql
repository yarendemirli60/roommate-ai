-- RoomMate AI — güvenli PostgreSQL hazırlık/doğrulama betiği
--
-- Bu dosya yalnız pgAdmin Query Tool'da, roommate_ai veritabanına bağlı ve
-- gerekli GRANT yetkisi olan bir rol ile MANUEL çalıştırılmak üzere hazırlanmıştır.
-- Bu çalışma dosyayı çalıştırmamış, PostgreSQL'e bağlanmamıştır.
--
-- ÖNEMLİ: Django tablolarını burada oluşturmayın. auth_*, django_* ve
-- profil_profil tabloları yalnızca `python manage.py migrate` ile oluşmalıdır.

BEGIN;

DO $$
BEGIN
    IF current_database() <> 'roommate_ai' THEN
        RAISE EXCEPTION
            'Bu betik roommate_ai üzerinde çalıştırılmalıdır; mevcut: %',
            current_database();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'roommate_app') THEN
        RAISE EXCEPTION 'roommate_app rolü bulunamadı.';
    END IF;
END
$$;

-- Django migration'ını çalıştıracak uygulama rolü için asgari haklar.
-- Tabloları bu rol oluşturursa kendi tablolarının sahibi olur; bu nedenle
-- burada tablo bazlı veya varsayılan yetki GRANT'ı gerekmez.
GRANT CONNECT ON DATABASE roommate_ai TO roommate_app;
GRANT USAGE, CREATE ON SCHEMA public TO roommate_app;

COMMIT;

-- Aşağıdaki sorgular salt-okunurdur.
SELECT
    current_database() AS veritabani,
    current_user AS betigi_calistiran_rol,
    has_database_privilege('roommate_app', 'roommate_ai', 'CONNECT') AS baglanti_hakki,
    has_schema_privilege('roommate_app', 'public', 'USAGE') AS schema_kullanim_hakki,
    has_schema_privilege('roommate_app', 'public', 'CREATE') AS migration_olusturma_hakki;

-- `migrate` öncesi bu iki sonuç NULL olabilir; sonrasında tablo adları görünür.
SELECT to_regclass('public.django_migrations') AS migration_gecmisi;
SELECT to_regclass('public.profil_profil') AS profil_tablosu;

-- Migration sonrasında fiziksel profil şemasını doğrulamak için.
SELECT column_name, data_type, is_nullable, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profil_profil'
ORDER BY ordinal_position;
