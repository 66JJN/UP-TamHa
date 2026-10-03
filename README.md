# UP TamHa (ยูพี ตามหา)

> ของหาย... เดี๋ยว UP ตามหาให้

เว็บศูนย์รวมของหายและส่งคืนเจ้าของสำหรับมหาวิทยาลัยพะเยา พัฒนาสำหรับวิชา Application Development with Cloud Platform โดยเลือกจุดที่ทำหายก่อน แล้วจึงระบุห้องหรือพื้นที่ส่วนกลาง

## จุดเด่น

- ค้นหาและกรองประกาศตามประเภท ตึก ห้อง หมวดหมู่ และสถานะ
- ลงประกาศของหายหรือของที่พบ พร้อมรูปภาพสูงสุด 3 รูป
- สมัครบัญชีด้วยชื่อเล่น ชื่อผู้ใช้ และรหัสผ่าน พร้อม session ที่ปลอดภัย
- Claim workflow ที่เก็บรายละเอียดพิสูจน์เป็นข้อมูลส่วนตัว
- Dashboard ติดตามประกาศและคำขอรับของ
- รัน local ได้ทันทีด้วย in-memory demo data
- สลับไปใช้ Azure SQL และ Blob Storage ผ่าน environment variables

## โครงสร้าง

```text
UP-TamHa/
├── web/       React + Vite frontend
├── server/    Express REST API
├── db/        Azure SQL schema
├── docs/      specification, architecture, data model
└── .github/   Azure deployment workflows
```

## เริ่มต้นใช้งาน

ต้องมี Node.js 22

```powershell
npm install
Copy-Item server/.env.example server/.env
```

เปิดสอง terminal:

```powershell
npm run dev:server
```

```powershell
npm run dev:web
```

เปิด <http://localhost:5173>

เมื่อกดลงประกาศหรือขอรับของครั้งแรก ระบบจะให้สร้างบัญชี 3 ช่อง จากนั้นผู้ใช้สามารถกลับเข้าสู่บัญชีเดิมได้แม้เปลี่ยนเครื่องหรือล้างข้อมูล browser ส่วนรูปโปรไฟล์แก้ไขภายหลังได้

จุดที่รองรับ: `ICT`, `CE` อาคารเรียนรวม, `PKY`, `UB` อาคาร ๙๙ ปี พระอุบาลีคุณูปมาจารย์, `UP Dome` อาคารสงวนเสริมศรี และหอประชุมพญางำเมือง

## ตรวจสอบคุณภาพ

```powershell
npm run check
```

คำสั่งนี้รัน API tests และ production frontend build

## Environment variables

สร้าง `server/.env` จาก `server/.env.example`

| ตัวแปร | หน้าที่ |
|---|---|
| `PORT` | API port ค่าเริ่มต้น 8080 |
| `WEB_ORIGIN` | origin ที่อนุญาตให้เรียก API; คั่นหลายค่าได้ด้วย comma |
| `AZURE_SQL_CONNECTION_STRING` | เมื่อเว้นว่าง ระบบใช้ memory mode |
| `AZURE_STORAGE_CONNECTION_STRING` | เมื่อเว้นว่าง รูปจะเก็บใน `server/uploads` |
| `AZURE_STORAGE_CONTAINER` | private Blob container |

Frontend production ใช้ `VITE_API_BASE` เช่น `https://your-api.azurewebsites.net/api`

## เชื่อม Azure SQL

1. สร้าง Azure SQL Database และเปิด Query editor
2. รัน [db/schema.sql](db/schema.sql)
3. ใส่ connection string ใน App Service setting `AZURE_SQL_CONNECTION_STRING`
4. กำหนด `WEB_ORIGIN`, `AZURE_STORAGE_CONNECTION_STRING` และ `AZURE_STORAGE_CONTAINER`
5. ตั้ง `SCM_DO_BUILD_DURING_DEPLOYMENT=true` ใน App Service

Schema ไม่ใช้ `DROP TABLE` เพื่อป้องกันการลบข้อมูลโดยไม่ตั้งใจ การเปลี่ยน schema ในอนาคตควรเพิ่ม numbered migration

สำหรับฐานข้อมูลเดิม ให้รัน migration ทั้งหมดจาก root ของโปรเจกต์ด้วย:

```bash
npm run migrate --workspace server
```

คำสั่งนี้อ่านค่าเชื่อมต่อจาก `server/.env` และ migration ทุกไฟล์ถูกออกแบบให้รันซ้ำได้อย่างปลอดภัย

บัญชีใหม่ใช้ opaque session ใน HttpOnly cookie และเก็บรหัสผ่านแบบ scrypt hash ส่วน `X-Profile-Id` คงไว้ชั่วคราวเฉพาะการย้ายโปรไฟล์รุ่นเดิมเข้าสู่ระบบบัญชีใหม่

## Deploy ไป Azure

### API — App Service F1

1. สร้าง Linux/Windows App Service สำหรับ Node.js 22
2. ตั้ง repository variables:
   - `AZURE_WEBAPP_NAME`
3. ตั้ง OIDC secrets:
   - `AZURE_CLIENT_ID`
   - `AZURE_TENANT_ID`
   - `AZURE_SUBSCRIPTION_ID`
4. Push `main`; workflow `api.yml` จะ test ก่อน deploy

### Frontend — Static Web Apps Free

1. สร้าง Static Web App ที่เชื่อม repository นี้
2. ตั้ง secret `AZURE_STATIC_WEB_APPS_API_TOKEN`
3. ตั้ง repository variable `VITE_API_BASE` เป็น URL API ที่ลงท้ายด้วย `/api`
4. Push `main`; workflow `web.yml` จะ build และ deploy เฉพาะ frontend

## การเพิ่มห้องจริง

แก้เฉพาะ `web/src/constants/appData.js` ใน `ROOMS_BY_BUILDING` หลังตรวจสอบหมายเลขห้องจริงแล้ว ระบบตั้งต้นมี “พื้นที่ส่วนกลาง” และ “ไม่ทราบห้อง” เพื่อไม่สร้างข้อมูลห้องขึ้นเอง

## เอกสาร

- [Project specification](docs/PROJECT_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Data model](docs/DATA_MODEL.md)

