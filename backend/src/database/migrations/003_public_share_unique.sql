-- Ensure at most one active public share per file/folder
CREATE UNIQUE INDEX IF NOT EXISTS idx_shared_files_one_public_per_file
  ON shared_files (file_id)
  WHERE public_token IS NOT NULL AND shared_with IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_shared_folders_one_public_per_folder
  ON shared_folders (folder_id)
  WHERE public_token IS NOT NULL AND shared_with IS NULL;
