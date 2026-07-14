-- =====================================================================
-- CloudVault - Step 4: Shares Enhancement
-- =====================================================================

-- 1. Enhance existing shared_files table
ALTER TABLE shared_files ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE shared_files ADD COLUMN IF NOT EXISTS allow_download BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE shared_files ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0;

-- 2. Create shared_folders table
CREATE TABLE IF NOT EXISTS shared_folders (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folder_id      UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
    shared_by      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_with    UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL = public link
    permission     VARCHAR(10) NOT NULL DEFAULT 'read' CHECK (permission IN ('read', 'edit')),
    public_token   VARCHAR(64) UNIQUE,
    password_hash  VARCHAR(255),
    allow_download BOOLEAN NOT NULL DEFAULT TRUE,
    views          INTEGER NOT NULL DEFAULT 0,
    expires_at     TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_folders_token ON shared_folders(public_token);
