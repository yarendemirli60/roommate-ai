-- PostgreSQL extensions owned by the database workstream.
-- Existing Django/AI files and Django migration history are not modified.
-- These tables do not add an HTTP API. The UI explicitly marks those features unavailable.
BEGIN;
DO $$
BEGIN
    IF current_database() <> 'roommate_ai' THEN
        RAISE EXCEPTION 'Expected roommate_ai database';
    END IF;
    IF to_regclass('public.auth_user') IS NULL THEN
        RAISE EXCEPTION 'Run the existing Django migrations first';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.roommate_match (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kullanici_id integer NOT NULL REFERENCES public.auth_user(id) ON DELETE CASCADE,
    aday_id integer NOT NULL REFERENCES public.auth_user(id) ON DELETE CASCADE,
    skor numeric(8,2),
    aciklamalar jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(aciklamalar) = 'array'),
    model_surumu varchar(100),
    olusturulma_tarihi timestamptz NOT NULL DEFAULT current_timestamp,
    CONSTRAINT roommate_match_different_users CHECK (kullanici_id <> aday_id),
    CONSTRAINT roommate_match_user_candidate UNIQUE (kullanici_id, aday_id)
);
CREATE INDEX IF NOT EXISTS roommate_match_candidate_idx ON public.roommate_match(aday_id);

CREATE TABLE IF NOT EXISTS public.roommate_conversation (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kullanici_a_id integer NOT NULL REFERENCES public.auth_user(id) ON DELETE CASCADE,
    kullanici_b_id integer NOT NULL REFERENCES public.auth_user(id) ON DELETE CASCADE,
    olusturulma_tarihi timestamptz NOT NULL DEFAULT current_timestamp,
    CONSTRAINT roommate_conversation_sorted_users CHECK (kullanici_a_id < kullanici_b_id),
    CONSTRAINT roommate_conversation_pair UNIQUE (kullanici_a_id, kullanici_b_id),
    -- Supports a composite FK that verifies message sender membership without application code.
    CONSTRAINT roommate_conversation_members UNIQUE (id, kullanici_a_id, kullanici_b_id)
);
CREATE INDEX IF NOT EXISTS roommate_conversation_user_b_idx ON public.roommate_conversation(kullanici_b_id);

CREATE TABLE IF NOT EXISTS public.roommate_message (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    konusma_id bigint NOT NULL,
    kullanici_a_id integer NOT NULL,
    kullanici_b_id integer NOT NULL,
    gonderen_id integer NOT NULL REFERENCES public.auth_user(id) ON DELETE CASCADE,
    icerik text NOT NULL CHECK (char_length(btrim(icerik)) BETWEEN 1 AND 4000),
    olusturulma_tarihi timestamptz NOT NULL DEFAULT current_timestamp,
    okunma_tarihi timestamptz,
    CONSTRAINT roommate_message_conversation_members FOREIGN KEY (konusma_id, kullanici_a_id, kullanici_b_id)
        REFERENCES public.roommate_conversation(id, kullanici_a_id, kullanici_b_id) ON DELETE CASCADE,
    CONSTRAINT roommate_message_sender_is_member CHECK (gonderen_id IN (kullanici_a_id, kullanici_b_id)),
    CONSTRAINT roommate_message_read_after_created CHECK (okunma_tarihi IS NULL OR okunma_tarihi >= olusturulma_tarihi)
);
CREATE INDEX IF NOT EXISTS roommate_message_conversation_time_idx ON public.roommate_message(konusma_id, olusturulma_tarihi, id);
CREATE INDEX IF NOT EXISTS roommate_message_sender_idx ON public.roommate_message(gonderen_id);

COMMENT ON TABLE public.roommate_match IS 'Database extension; awaiting backend API and real AI integration. No synthetic scores are inserted.';
COMMENT ON TABLE public.roommate_conversation IS 'Database extension; one conversation per ordered pair of existing auth users.';
COMMENT ON TABLE public.roommate_message IS 'Database extension; membership protected by composite FK and CHECK. No messaging API exists yet.';
COMMIT;
