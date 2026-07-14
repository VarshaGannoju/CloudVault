-- =====================================================================
-- CloudVault - Initial schema migration
-- Run with: npm run db:migrate  (see package.json / README)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- enables fast fuzzy filename search

-- ---------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(120) NOT NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    role                VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    avatar_url          TEXT,
    storage_limit_bytes BIGINT NOT NULL DEFAULT 5368709120, -- 5 GB default
    storage_used_bytes  BIGINT NOT NULL DEFAULT 0,
    is_email_verified   BOOLEAN NOT NULL DEFAULT FALSE,
    refresh_token_hash  VARCHAR(255),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- FOLDERS (self-referencing for nested folder support)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS folders (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id   UUID REFERENCES folders(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    is_trashed  BOOLEAN NOT NULL DEFAULT FALSE,
    trashed_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- FILES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS files (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    folder_id           UUID REFERENCES folders(id) ON DELETE SET NULL,
    original_name       VARCHAR(255) NOT NULL,
    extension           VARCHAR(20),
    mime_type           VARCHAR(150),
    size_bytes          BIGINT NOT NULL DEFAULT 0,
    cloudinary_public_id VARCHAR(255),
    cloudinary_url       TEXT,
    is_encrypted        BOOLEAN NOT NULL DEFAULT TRUE,
    encryption_iv        VARCHAR(64),
    is_starred          BOOLEAN NOT NULL DEFAULT FALSE,
    is_trashed          BOOLEAN NOT NULL DEFAULT FALSE,
    trashed_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_files_owner ON files(owner_id);
CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_name_trgm ON files USING gin (original_name gin_trgm_ops);

-- ---------------------------------------------------------------------
-- FILE VERSIONS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS file_versions (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id              UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    version_number       INTEGER NOT NULL,
    uploaded_by          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cloudinary_public_id VARCHAR(255),
    cloudinary_url       TEXT,
    size_bytes           BIGINT NOT NULL DEFAULT 0,
    encryption_iv         VARCHAR(64),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (file_id, version_number)
);

-- ---------------------------------------------------------------------
-- SHARED FILES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shared_files (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id        UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    shared_by      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_with    UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL = public link
    permission     VARCHAR(10) NOT NULL DEFAULT 'read' CHECK (permission IN ('read', 'edit')),
    public_token   VARCHAR(64) UNIQUE,
    expires_at     TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_files_token ON shared_files(public_token);

-- ---------------------------------------------------------------------
-- ACTIVITY LOGS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(50) NOT NULL, -- e.g. 'file.upload', 'file.delete', 'folder.create'
    target_type VARCHAR(30),          -- 'file' | 'folder' | 'user'
    target_id   UUID,
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);

-- ---------------------------------------------------------------------
-- PASSWORD RESET TOKENS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- EMAIL VERIFICATION TOKENS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- Trigger to auto-update `updated_at` columns
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_folders_updated_at ON folders;
CREATE TRIGGER trg_folders_updated_at BEFORE UPDATE ON folders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_files_updated_at ON files;
CREATE TRIGGER trg_files_updated_at BEFORE UPDATE ON files
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
