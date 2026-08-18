# คู่มือการติดตั้งและใช้งานระบบ CMMS (Standalone Frontend + Google Apps Script API)

ระบบนี้ได้รับการปรับปรุงสถาปัตยกรรมให้แยกส่วนการทำงานระหว่าง **Frontend (หน้าเว็บ HTML/JS/CSS)** และ **Backend (Google Apps Script API + Google Sheets Database)** ออกจากกันอย่างสมบูรณ์แบบ เพื่อแก้ไขปัญหาการล็อกอินไม่ได้บน Safari, iOS, LINE In-App Browser และมือถือบางรุ่นที่บล็อก 3rd-party Cookies / iframe sandbox

---

## 🏗️ โครงสร้างสถาปัตยกรรม (Architecture)

```text
+-------------------------------------------------------+
|                 Frontend (Static Web)                 |
|  (GitHub Pages / Vercel / Netlify / Cloudflare Pages) |
|                                                       |
|  - Login.html, Home.html, Index.html, Monitor.html   |
|  - Inventory.html, PM.html, Dashboard.html ...        |
|  - config.js (เก็บ URL Web App ของ Backend)           |
|  - api.js (Universal Bridge จำลอง google.script.run)  |
+---------------------------+---------------------------+
                            |
                     HTTP POST (JSON)
                            |
                            v
+-------------------------------------------------------+
|             Backend (Google Apps Script)              |
|                                                       |
|  - รหัส.gs (doPost API Router + LINE Webhook)         |
|  - ฟังก์ชันจัดการข้อมูล (processForm, getDashboard,    |
|    getPMData, verifyUserLogin, stockTransaction ฯลฯ)  |
|  - Google Sheets Database (Users, Jobs, Parts, etc.)  |
+-------------------------------------------------------+
```

---

## 🚀 ขั้นตอนที่ 1: Deploy Google Apps Script Web App (Backend)

1. เปิดโปรเจกต์ Google Apps Script ของท่าน
2. นำโค้ดจากไฟล์ `รหัส.gs` ในโฟลเดอร์นี้ไปอัปเดตแทนที่โค้ดเดิมใน Apps Script
3. กดปุ่ม **"การทำให้ใช้งานได้" (Deploy)** -> เลือก **"การทำให้ใช้งานได้รายการใหม่" (New deployment)**
4. เลือกประเภท: **เว็บแอป (Web App)**
   - **คำอธิบาย (Description):** `CMMS API v1`
   - **ดำเนินการในฐานะ (Execute as):** `ฉัน (Me / บัญชีของคุณ)`
   - **ผู้มีสิทธิ์เข้าถึง (Who has access):** `ทุกคน (Anyone)` *(สำคัญมาก! ต้องเลือก Anyone เพื่อให้ Frontend จากภายนอกสามารถส่ง Request เข้ามาได้)*
5. กด **Deploy** และทำการ Authorize ให้สิทธิ์การเข้าถึงข้อมูล
6. **คัดลอก Web App URL** ที่ได้มา (เช่น `https://script.google.com/macros/s/AKfycbx.../exec`)

---

## ⚙️ ขั้นตอนที่ 2: ตั้งค่า config.js

1. เปิดไฟล์ `config.js` ในโฟลเดอร์โปรเจกต์
2. นำ URL ที่ได้จากขั้นตอนที่ 1 มาใส่ในตัวแปร `GAS_API_URL`:

```javascript
const CONFIG = {
    // นำ Web App URL ของ Google Apps Script มาใส่ที่นี่
    GAS_API_URL: "https://script.google.com/macros/s/AKfycbx.../exec",
    
    // ชื่อและเวอร์ชันระบบ
    APP_NAME: "CMMS System",
    VERSION: "2.0.0"
};
```

---

## 🌐 ขั้นตอนที่ 3: นำ Frontend ขึ้น GitHub Pages (ฟรี 100%)

### วิธีที่ 1: อัปโหลดผ่าน GitHub Web Interface (ง่ายที่สุด)
1. ไปที่เว็บไซต์ [GitHub.com](https://github.com/) และล็อกอินเข้าสู่ระบบ
2. กดปุ่ม **"+"** ด้านบนขวา -> เลือก **"New repository"**
3. ตั้งชื่อ Repository เช่น `cmms-frontend`
4. เลือกเป็น **Public** แล้วกด **"Create repository"**
5. ในหน้า Repository กด **"uploading an existing file"**
6. ลากไฟล์และโฟลเดอร์ทั้งหมดในโปรเจกต์นี้ (`Login.html`, `Home.html`, `config.js`, `api.js`, ฯลฯ) เข้าไป แล้วกด **"Commit changes"**
7. ไปที่แถบเมนู **Settings** ของ Repository -> เมนูด้านซ้ายเลือก **Pages**
8. ในส่วน **Build and deployment**:
   - **Source:** เลือก `Deploy from a branch`
   - **Branch:** เลือก `main` หรือ `master` และเลือกโฟลเดอร์ `/(root)`
   - กดปุ่ม **Save**
9. รอประมาณ 1-2 นาที GitHub จะสร้างลิงก์เว็บไซต์ให้ เช่น:
   `https://<your-username>.github.io/cmms-frontend/Login.html`

---

## 🔗 ขั้นตอนที่ 4: อัปเดต FRONTEND_URL ใน Backend (สำหรับ LINE Notifications)

เพื่อให้ข้อความแจ้งเตือนทาง LINE แจ้งซ่อม ส่งลิงก์มายัง Frontend ใหม่บน GitHub Pages:
1. เปิดไฟล์ `รหัส.gs` ใน Apps Script
2. ค้นหาบรรทัดที่มีตัวแปร `FRONTEND_URL` (อยู่ด้านบนสุดของไฟล์)
3. แก้ไข URL ให้ตรงกับลิงก์ GitHub Pages ของท่าน เช่น:
   ```javascript
   var FRONTEND_URL = "https://<your-username>.github.io/cmms-frontend";
   ```
4. กด **Deploy** -> **จัดการการทำให้ใช้งานได้ (Manage deployments)** -> แก้ไขเป็น **เวอร์ชันใหม่ (New version)** แล้วกดบันทึก

---

## 📂 รายชื่อหน้าเว็บทั้งหมด (Module Pages)

| หน้าเว็บ | รายละเอียด | สิทธิ์การเข้าถึง |
| :--- | :--- | :--- |
| `Login.html` | หน้าเข้าสู่ระบบ (Universal Login) | ทุกคน |
| `Home.html` | หน้ารวมเมนูหลักตามสิทธิ์ (Portal Home) | Level 1-8 |
| `Index.html` | แบบฟอร์มแจ้งซ่อม (Maintenance Request) | ผู้แจ้ง / LINE UID |
| `Monitor.html` | ติดตามสถานะงานซ่อมแบบเรียลไทม์ | ทุกคน |
| `Dashboard.html`| สรุปสถิติ กราฟวิเคราะห์ และรายงาน KPI | Level 1-5 |
| `Inventory.html`| ระบบคลังอะไหล่และตัดสต็อก (Stock Card) | Level 1, 5, 6, 7, 8 |
| `PM.html` | แผนงานบำรุงรักษาเชิงป้องกัน (Plan vs Actual) | Level 3, 4, 5, 7, 8 |
| `MaintenanceTech.html` | รายการงานซ่อมของช่างแผนกซ่อมบำรุง | ช่างซ่อมบำรุง |
| `EngineRoom.html` | รายการงานซ่อมของช่างห้องเครื่อง | ช่างห้องเครื่อง |
| `GeneralTech.html`| ระบบปฏิบัติงานช่างทั่วไป | ช่างทั่วไป |
| `Handover.html` | การรับมอบงานซ่อมประจำแผนก | Level 2, 5 |
| `Verify.html` | การตรวจสอบคุณภาพและปิดงาน (QC) | Level 4, 5 |
| `Approve.html` | การอนุมัติเปิดงานซ่อมของผู้บริหาร | Level 5 |
| `Signatures.html` | จัดการลายเซ็นอิเล็กทรอนิกส์ | Level 5 |
| `RoleConfig.html` | กำหนดสิทธิ์การเข้าถึงเมนู (Matrix) | Level 5 |

---

## 💡 ประโยชน์ที่ได้รับหลังปรับปรุง
- **ไร้ปัญหาล็อกอินหลุด / เข้าไม่ได้:** หมดปัญหา Third-party Cookie และ iframe restriction บน iOS, Safari, LINE Browser
- **ย้าย Hosting อิสระ:** สามารถนำโฟลเดอร์นี้ไปรันบน GitHub Pages, Vercel, Netlify, Cloudflare Pages หรือ Private Server ได้ทันทีโดยไม่ต้องแก้โค้ดหน้าเว็บ
- **ความปลอดภัยสูง:** Backend ซ่อน Logic การจัดการฐานข้อมูลไว้ใน Apps Script และสื่อสารผ่าน JSON API
