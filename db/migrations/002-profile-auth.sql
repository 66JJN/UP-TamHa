-- Add recoverable accounts and opaque login sessions to an existing database.
-- Existing nickname-only profiles remain usable and can add credentials later.

IF COL_LENGTH('profiles', 'username') IS NULL
  EXEC('ALTER TABLE profiles ADD username NVARCHAR(40) NULL');

IF COL_LENGTH('profiles', 'password_hash') IS NULL
  EXEC('ALTER TABLE profiles ADD password_hash NVARCHAR(255) NULL');

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ux_profiles_username' AND object_id = OBJECT_ID('profiles'))
  EXEC('CREATE UNIQUE INDEX ux_profiles_username ON profiles (username) WHERE username IS NOT NULL');

IF OBJECT_ID('sessions', 'U') IS NULL
BEGIN
  CREATE TABLE sessions (
    token_hash CHAR(64) NOT NULL PRIMARY KEY,
    profile_id UNIQUEIDENTIFIER NOT NULL,
    expires_at DATETIME2 NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_sessions_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
  );
  CREATE INDEX ix_sessions_profile ON sessions (profile_id, expires_at);
  CREATE INDEX ix_sessions_expiry ON sessions (expires_at);
END;
