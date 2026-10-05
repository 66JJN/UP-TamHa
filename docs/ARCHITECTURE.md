# UP TamHa — Cloud Architecture Overview

แผนภาพนี้แสดงตำแหน่งของ source code, กระบวนการ CI/CD และบริการ Azure ที่ระบบใช้งานจริง

```mermaid
flowchart LR
    DEV["Developer<br/>พัฒนาและแก้ไขโค้ด"]
    GH["GitHub Repository<br/>เก็บ Source Code"]
    USER["ผู้ใช้งาน<br/>Web Browser"]

    subgraph CICD["CI/CD — GitHub Actions"]
        WEBWF["web.yml<br/>Build React + Vite"]
        APIWF["api.yml<br/>Test Node.js API"]
    end

    subgraph AZURE["Microsoft Azure"]
        SWA["Azure Static Web Apps<br/>Frontend: React + Vite"]
        APP["Azure App Service<br/>Backend: Node.js + Express REST API"]
        SQL[("Azure SQL Database<br/>ข้อมูลผู้ใช้ ประกาศ คำขอ และข้อความ")]
        BLOB[("Azure Blob Storage<br/>รูปสิ่งของและรูปโปรไฟล์")]
    end

    DEV -->|"git push ไปยัง main"| GH
    GH -->|"เปลี่ยนไฟล์ web/"| WEBWF
    GH -->|"เปลี่ยนไฟล์ server/ หรือ db/"| APIWF
    WEBWF -->|"Deploy web/dist"| SWA
    APIWF -->|"Deploy server"| APP

    USER -->|"HTTPS"| SWA
    SWA -->|"REST API / JSON ผ่าน HTTPS"| APP
    APP -->|"SQL queries"| SQL
    APP -->|"Upload / Read image"| BLOB
    APP -->|"ส่งข้อมูลและรูปภาพกลับ"| USER

    DEV -.->|"npm run migrate"| SQL

    classDef source fill:#f3e8ff,stroke:#7e22ce,color:#3b0764;
    classDef pipeline fill:#fef3c7,stroke:#d97706,color:#78350f;
    classDef compute fill:#dbeafe,stroke:#2563eb,color:#172554;
    classDef data fill:#dcfce7,stroke:#16a34a,color:#14532d;
    classDef actor fill:#f3f4f6,stroke:#6b7280,color:#111827;

    class GH source;
    class WEBWF,APIWF pipeline;
    class SWA,APP compute;
    class SQL,BLOB data;
    class DEV,USER actor;
```

## หน้าที่ของแต่ละส่วน

| ส่วนประกอบ | เทคโนโลยี | หน้าที่ |
|---|---|---|
| Source control | GitHub Repository | เก็บและจัดการ source code ของ Frontend, Backend และ Database migration |
| CI/CD | GitHub Actions | ตรวจสอบโค้ดและ deploy อัตโนมัติเมื่อ push เข้า branch `main` |
| Frontend | React + Vite บน Azure Static Web Apps | แสดงหน้าเว็บและติดต่อ Backend ผ่าน REST API |
| Backend | Node.js + Express บน Azure App Service | จัดการ business logic, authentication, ประกาศ, คำขอรับของ และบทสนทนา |
| Database | Azure SQL Database | เก็บข้อมูลผู้ใช้ session ประกาศ คำขอรับของ และข้อความตอบกลับ |
| Image storage | Azure Blob Storage | เก็บไฟล์รูปสิ่งของและรูปโปรไฟล์แบบ private |

## CI/CD Flow

1. Developer push code ไปยัง branch `main` ใน GitHub
2. หากแก้ `web/` workflow `web.yml` จะ build และ deploy Frontend ไป Azure Static Web Apps
3. หากแก้ `server/` หรือ `db/` workflow `api.yml` จะรัน API tests ก่อน deploy Backend ไป Azure App Service
4. Database migration เป็นขั้นตอนที่รันแยกด้วย `npm run migrate --workspace server` และไม่ได้รันอัตโนมัติใน GitHub Actions

## Trust boundaries

- Browser ไม่ได้รับ database connection string หรือ storage key
- รหัสผ่านถูกเก็บเป็น scrypt hash และ session ใช้ HttpOnly cookie
- Backend เป็นส่วนเดียวที่เชื่อมต่อ Azure SQL Database และ Azure Blob Storage
- Blob container เป็น private และ Backend เป็นผู้ส่งรูปภาพกลับให้ผู้ใช้
- รายละเอียดพิสูจน์ความเป็นเจ้าของและข้อความตอบกลับเปิดให้เห็นเฉพาะคู่สนทนาที่เกี่ยวข้อง
