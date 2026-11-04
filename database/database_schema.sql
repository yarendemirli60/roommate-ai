-- RoomMate AI: read-only schema verification; does not create/reset Django tables.
-- Use database/manage.ps1 for existing Django migrations.
-- Additional tables are defined in database/messaging_matches.sql.
BEGIN READ ONLY;
SELECT current_database() AS database_name, current_user AS application_role;
SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
SELECT app,name,applied FROM django_migrations ORDER BY app,name;
SELECT column_name,data_type,is_nullable FROM information_schema.columns
 WHERE table_schema='public' AND table_name='profil_profil' ORDER BY ordinal_position;
SELECT conname,pg_get_constraintdef(oid) FROM pg_constraint
 WHERE conrelid IN ('public.profil_profil'::regclass,'public.roommate_match'::regclass,
 'public.roommate_conversation'::regclass,'public.roommate_message'::regclass)
 ORDER BY conrelid,conname;
COMMIT;
