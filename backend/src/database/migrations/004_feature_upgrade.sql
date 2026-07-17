-- =====================================================================
-- CloudVault - Feature upgrade migration
-- Adds favorites, last_accessed_at, and normalizes file trash columns.
-- =====================================================================

-- ---------------------------------------------------------------------
-- FAVORITES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS favorites (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_id    UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, file_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_file ON favorites(file_id);

-- ---------------------------------------------------------------------
-- FILES: normalize soft-delete columns to is_deleted / deleted_at
-- and add last_accessed_at for "Recent" tracking.
-- ---------------------------------------------------------------------
ALTER TABLE files ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE files ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE files ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ;

-- Migrate any existing trash state from the old is_trashed / trashed_at columns.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'files' AND column_name = 'is_trashed'
    ) THEN
        UPDATE files
        SET is_deleted = is_trashed,
            deleted_at = trashed_at
        WHERE is_trashed = TRUE;

        ALTER TABLE files DROP COLUMN is_trashed;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'files' AND column_name = 'trashed_at'
    ) THEN
        ALTER TABLE files DROP COLUMN trashed_at;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_files_deleted ON files(owner_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_files_last_accessed ON files(owner_id, last_accessed_at);
