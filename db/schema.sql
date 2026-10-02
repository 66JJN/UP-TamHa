-- UP TamHa Azure SQL schema for the nickname-only mini project.
-- Apply once to a new database. This script never drops tables.

IF OBJECT_ID('profiles', 'U') IS NULL
BEGIN
  CREATE TABLE profiles (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    nickname NVARCHAR(60) NOT NULL,
    avatar_kind NVARCHAR(10) NOT NULL DEFAULT 'CAT',
    avatar_blob_name NVARCHAR(500) NULL,
    avatar_content_type NVARCHAR(100) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT ck_profiles_avatar_kind CHECK (avatar_kind IN ('CAT', 'DOG', 'CUSTOM'))
  );
END;

IF OBJECT_ID('items', 'U') IS NULL
BEGIN
  CREATE TABLE items (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    owner_profile_id UNIQUEIDENTIFIER NOT NULL,
    report_type NVARCHAR(10) NOT NULL,
    title NVARCHAR(160) NOT NULL,
    description NVARCHAR(2000) NOT NULL,
    category NVARCHAR(60) NOT NULL,
    building_code NVARCHAR(10) NOT NULL,
    room NVARCHAR(100) NOT NULL,
    event_date DATETIME2 NOT NULL,
    contact_note NVARCHAR(500) NULL,
    status NVARCHAR(30) NOT NULL DEFAULT 'OPEN',
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_items_profile FOREIGN KEY (owner_profile_id) REFERENCES profiles(id),
    CONSTRAINT ck_items_report_type CHECK (report_type IN ('LOST', 'FOUND')),
    CONSTRAINT ck_items_status CHECK (status IN ('OPEN', 'CLAIM_PENDING', 'MATCHED', 'RETURNED', 'CLOSED'))
  );
  CREATE INDEX ix_items_filters ON items (building_code, category, status, event_date DESC);
  CREATE INDEX ix_items_profile ON items (owner_profile_id, created_at DESC);
END;

IF OBJECT_ID('claims', 'U') IS NULL
BEGIN
  CREATE TABLE claims (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    item_id UNIQUEIDENTIFIER NOT NULL,
    claimant_profile_id UNIQUEIDENTIFIER NOT NULL,
    proof_details NVARCHAR(1500) NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    reviewed_at DATETIME2 NULL,
    CONSTRAINT fk_claims_item FOREIGN KEY (item_id) REFERENCES items(id),
    CONSTRAINT fk_claims_profile FOREIGN KEY (claimant_profile_id) REFERENCES profiles(id),
    CONSTRAINT uq_claims_item_profile UNIQUE (item_id, claimant_profile_id),
    CONSTRAINT ck_claims_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
  );
  CREATE INDEX ix_claims_item ON claims (item_id, created_at DESC);
END;

IF OBJECT_ID('item_images', 'U') IS NULL
BEGIN
  CREATE TABLE item_images (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    item_id UNIQUEIDENTIFIER NOT NULL,
    blob_name NVARCHAR(500) NOT NULL,
    content_type NVARCHAR(100) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_item_images_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
  );
  CREATE INDEX ix_item_images_item ON item_images (item_id);
END;
