-- Run this migration once on an existing UP TamHa database.
-- It is safe to run again because the table is only created when missing.

IF OBJECT_ID('claim_messages', 'U') IS NULL
BEGIN
  CREATE TABLE claim_messages (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    claim_id UNIQUEIDENTIFIER NOT NULL,
    sender_profile_id UNIQUEIDENTIFIER NOT NULL,
    message NVARCHAR(1500) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_claim_messages_claim FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
    CONSTRAINT fk_claim_messages_sender FOREIGN KEY (sender_profile_id) REFERENCES profiles(id)
  );
  CREATE INDEX ix_claim_messages_claim ON claim_messages (claim_id, created_at, id);
END;
