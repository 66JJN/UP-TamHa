# Data model

```mermaid
erDiagram
    PROFILES ||--o{ ITEMS : reports
    PROFILES ||--o{ CLAIMS : submits
    ITEMS ||--o{ CLAIMS : receives
    ITEMS ||--o{ ITEM_IMAGES : contains

    PROFILES {
      uuid id PK
      string nickname
      string avatar_kind
      string avatar_blob_name
    }
    ITEMS {
      uuid id PK
      uuid owner_profile_id FK
      string report_type
      string title
      string category
      string building_code
      string room
      datetime event_date
      string status
    }
    CLAIMS {
      uuid id PK
      uuid item_id FK
      uuid claimant_profile_id FK
      string proof_details
      string status
    }
    ITEM_IMAGES {
      uuid id PK
      uuid item_id FK
      string blob_name
      string content_type
    }
```

Statuses are `OPEN`, `CLAIM_PENDING`, `MATCHED`, `RETURNED`, and `CLOSED`. Claim statuses are `PENDING`, `APPROVED`, and `REJECTED`.

