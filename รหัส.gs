// โปรแกรมหลัก (Backend): จัดการระบบ Routing, เชื่อมต่อ Google Sheets/Drive และจัดการ LINE Webhook
// ==========================================
// ส่วนที่ 1: การตั้งค่าระบบ (Configuration)
// ==========================================
var TOKENS = {
  1: "+SOkXTD9qsbvIJrWt3gVRW5B5P2BihHkCsEKSozdX6vICcv9TvhlUMkIC4yHLP4IxO0GgYxyUGdemZvPvontyVg3hMBpdOqdU0UvcvlNBUUSXrdKy2xeLC5QvK8+0qdr/RvHU5HBzG1qqEO+v/PhvAdB04t89/1O/w1cDnyilFU=", // EM
  2: "KSuklGyVc8C5n3v37wv4ItyG23HQNts0I66rYWThjEWeeq5BTA/tNvWxnYrJbLvbz1d0BcJe8PheUjoX4kFR14TTVT+MWFwjvfca9i5C+M+BD8Y024PwlsFLYyzRXnQytrty08XJQNxx4wiPr4EE5AdB04t89/1O/w1cDnyilFU=", // SUP
  3: "pOCDKqyGf5y2Uve6gwjKHzxqRjb2MYTxc0CoObnJNLxzrWBxP57x580P8i7glkmdYoEfD4B27uEtcK0aZar9VRCsaH2AE5p4fRBwX9HkpjdW4eVv+hmqfeEUSV5jzoX1C4UJvXV9LZKVk+nc3aNOvAdB04t89/1O/w1cDnyilFU=", // EN
  4: "oVrrXazREY7uppRjfdnzGVHJxBazL/Jc+7y7AIPN7CGXSMHxNAkhtVqbU942ffoXAxoARHUsw72FnsWygVpxLBbfZvxaw7n5xbcPu3Mij5S1k7rhY9MRQp1eUIgUCUmx9/lAYPlS//ofFKBTr3Gi5wdB04t89/1O/w1cDnyilFU=", // AM.ENG
  5: "JaTfvzn8spgDV26VOTF5ZRqXb3+2iBUZWy06IRLixx0Pv+iO7//LJeNWsMhMOfgGAamJMRoHCAejX4ObBWN9irMqhkmDvEOHRdogxh3VAu0GBbR0zOS36YQgqT1Ka25MrwRwXexFSCr7znpzEa3+wAdB04t89/1O/w1cDnyilFU="  // QC
};
var SHEET_ID = '1LzHVC6oTYk2E0KYFtEvkCYPbeDC9c6oobUtSeJOjGYQ';
var DRIVE_FOLDER_ID = '1xmhQdcYZVrZ0VHI2m4mY7ypGHxRQDXOy';
var TEMPLATE_DOC_ID = '1tMPP-LcVzsOTn4cwRqj8kMNDMxKCry9u0i0jM_RKucE'; // ใส่ ID ของไฟล์ Google Doc ที่นี่เพื่อเป็นตัวต้นแบบ PDF

// ✅ กำหนด Web App URL ตัวจริง (แก้ที่นี่ที่เดียวเมื่อ Deploy ใหม่)
// สาเหตุที่ต้องกำหนดตรงนี้: ScriptApp.getService().getUrl() เมื่อรันผ่าน Trigger
// จะคืนค่า Deployment ID ของ Trigger ไม่ใช่ Web App ที่ Publish ไว้
var WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzS1tnU_Z2-ojpW3MI2GQA3eqrJKg3i6K9ngsLv1TFNRxLhhbkX8XFeCpW_9kb1q1U/exec';

// ✅ กำหนด URL ของ Frontend (เช่น GitHub Pages, Vercel, Netlify)
// เพื่อให้ปุ่มใน LINE Bot Flex Message ลิงก์ไปยัง Frontend ภายนอกได้ถูกต้อง
var FRONTEND_URL = 'https://EngineeringDepSethachon.github.io/cmms-frontend';

// ------------------------------------------
// 1. ฟังก์ชันเปิดหน้าเว็บ และจัดการคำขอ GET (Routing & API)
// ------------------------------------------
function doGet(e) {
  // รองรับการเรียก API ผ่าน GET (เช่น Health Check หรือทดสอบเชื่อมต่อ)
  if (e && e.parameter && e.parameter.action) {
    var action = e.parameter.action;
    if (action === 'ping') {
      return ContentService.createTextOutput(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  var rawPage = (e && e.parameter && e.parameter.page) ? e.parameter.page : 'home';
  var page = rawPage.toString().toLowerCase().replace('.html', '').trim();
  var template;
  var webAppUrl = ScriptApp.getService().getUrl(); 
  
  try {
    if (page === 'dashboard') template = HtmlService.createTemplateFromFile('Dashboard');
    else if (page === 'monitor') template = HtmlService.createTemplateFromFile('Monitor');
    else if (page === 'approve') template = HtmlService.createTemplateFromFile('Approve');
    else if (page === 'verify') template = HtmlService.createTemplateFromFile('Verify');
    else if (page === 'handover') template = HtmlService.createTemplateFromFile('Handover');
    else if (page === 'pm' || page === 'pm_plan' || page === 'pm_actual') {
      template = HtmlService.createTemplateFromFile('PM');
    }
    else if (page === 'index') {
      template = HtmlService.createTemplateFromFile('Index');
      template.uid = (e && e.parameter.uid) ? e.parameter.uid : ''; 
    }
    else if (page === 'role_config' || page === 'roleconfig' || page === 'permissions') {
        template = HtmlService.createTemplateFromFile('RoleConfig');
      }
      else if (page === 'signatures') {
      template = HtmlService.createTemplateFromFile('Signatures');
    }
    else if (page === 'inventory') {
      template = HtmlService.createTemplateFromFile('Inventory');
    }
    else if (page === 'login') {
      template = HtmlService.createTemplateFromFile('Login');
      template.target = (e && e.parameter && e.parameter.target) ? e.parameter.target : 'home'; 
    }
    else if (page === 'engine_room' || page === 'engineroom' || page === 'engine') {
      template = HtmlService.createTemplateFromFile('EngineRoom');
      template.uid = (e && e.parameter.uid) ? e.parameter.uid : '';
    }
    else if (page === 'maintenance' || page === 'maintenance_tech' || page === 'maintenancetech' || page === 'maint') {
      template = HtmlService.createTemplateFromFile('MaintenanceTech');
      template.uid = (e && e.parameter.uid) ? e.parameter.uid : '';
    }
    else if (page === 'general_tech' || page === 'generaltech' || page === 'tech') {
      template = HtmlService.createTemplateFromFile('GeneralTech');
      template.uid = (e && e.parameter.uid) ? e.parameter.uid : '';
    }
    else {
      // บังคับหน้า Home เป็นหน้าเริ่มต้นเสมอหากไม่มีพารามิเตอร์ที่เจาะจง
      template = HtmlService.createTemplateFromFile('Home');
    }
    
    template.appUrl = webAppUrl;
    template.pageTitle = 'CMMS System';
    
    return template.evaluate()
        .setTitle(template.pageTitle)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
        
  } catch (error) {
    return HtmlService.createHtmlOutput('<h2>❌ Error เข้าสู่หน้าเว็บล้มเหลว</h2><p><b>หน้าเว็บที่เรียก:</b> ' + rawPage + '</p><p><b>รายละเอียดข้อผิดพลาด:</b> ' + error.toString() + '</p>');
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: "No post data received" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Invalid JSON format: " + parseErr.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ----------------------------------------------------
    // กรณีที่ 1: คำขอ API จาก Frontend ภายนอก (GitHub Pages / Vercel / Netlify / Custom Host)
    // ----------------------------------------------------
    if (data && data.action) {
      var action = data.action;
      var args = Array.isArray(data.args) ? data.args : [];

      // ตารางรวมฟังก์ชัน API ทั้งหมดของระบบ
      var apiHandlers = {
        verifyUserLogin: verifyUserLogin,
        logAction: logAction,
        getRolePermissions: getRolePermissions,
        getMasterData: getMasterData,
        processForm: processForm,
        getDashboardData: getDashboardData,
        updateTicketStatus_Full: updateTicketStatus_Full,
        getPDFProgress: getPDFProgress,
        generatePDF: generatePDF,
        getTechnicianJobs: getTechnicianJobs,
        completeTechnicianWork: completeTechnicianWork,
        bulkHandoverTickets: bulkHandoverTickets,
        rejectAndCloneTicket: rejectAndCloneTicket,
        bulkVerifyTickets: bulkVerifyTickets,
        getInventoryItems: getInventoryItems,
        processInventoryAction: processInventoryAction,
        getStockCard: getStockCard,
        saveInventoryItem: saveInventoryItem,
        getPMData: getPMData,
        updatePMPlanBulk: updatePMPlanBulk,
        cancelPMPlan: cancelPMPlan,
        updatePMActual_Full: updatePMActual_Full,
        registerPMDevice: registerPMDevice,
        saveRolePermissions: saveRolePermissions,
        getSignatureUsers: getSignatureUsers,
        uploadSignature: uploadSignature,
        getUserPosition: getUserPosition,
        getUserJobs: getUserJobs,
        resubmitJob: resubmitJob
      };

      try {
        var result;
        if (typeof apiHandlers[action] === 'function') {
          result = apiHandlers[action].apply(this, args);
        } else if (typeof this[action] === 'function') {
          result = this[action].apply(this, args);
        } else {
          return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Action not found: " + action }))
            .setMimeType(ContentService.MimeType.JSON);
        }

        return ContentService.createTextOutput(JSON.stringify(result !== undefined ? result : { success: true }))
          .setMimeType(ContentService.MimeType.JSON);
      } catch (handlerErr) {
        Logger.log("API Error [" + action + "]: " + handlerErr.toString());
        return ContentService.createTextOutput(JSON.stringify({ success: false, message: handlerErr.toString(), error: handlerErr.stack || handlerErr.toString() }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // ----------------------------------------------------
    // กรณีที่ 2: ข้อความ Webhook จาก LINE Messaging API
    // ----------------------------------------------------
    if (data && data.events && data.events.length > 0) {
      var event = data.events[0];
      var replyToken = event.replyToken;
      var userId = (event.source && event.source.userId) ? event.source.userId : "UNKNOWN";

      if (event.type === 'message' && event.message.type === 'text' && replyToken !== "00000000000000000000000000000000") {
        
        var botId = (e.parameter && e.parameter.bot) ? e.parameter.bot : 1;
        var botToken = TOKENS[botId] || TOKENS[1];
        
        // ตรวจสอบ Base URL สำหรับสร้างลิงก์ (ถ้ามี FRONTEND_URL ให้ใช้ FRONTEND_URL)
        var baseUrl = (typeof FRONTEND_URL !== 'undefined' && FRONTEND_URL && FRONTEND_URL.trim() !== '') 
          ? FRONTEND_URL.trim().replace(/\/+$/, '') 
          : (typeof WEB_APP_URL !== 'undefined' && WEB_APP_URL ? WEB_APP_URL : ScriptApp.getService().getUrl());
      
        var isExternalHost = baseUrl.indexOf('github.io') > -1 || baseUrl.indexOf('vercel.app') > -1 || baseUrl.indexOf('netlify.app') > -1 || baseUrl.indexOf('http') === 0 && baseUrl.indexOf('script.google.com') === -1;

        var userMessage = event.message.text.trim();
        if (userMessage === "ขอ UID" || userMessage === "ขอ uid") {
          replyText(replyToken, "รหัสประจำตัว (UID) ของคุณคือ:\n\n" + userId, botToken);
        } 
        else if (userMessage === "แจ้งซ่อม") {
          var targetUrl = isExternalHost 
            ? baseUrl + "/Index.html?uid=" + userId + "&openExternalBrowser=1"
            : baseUrl + "?uid=" + userId + "&page=index&openExternalBrowser=1";
            
          var flex = {
            "type": "bubble",
            "header": { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "🛠️ ระบบแจ้งซ่อม", "weight": "bold", "color": "#ffffff", "size": "xl" }], "backgroundColor": "#0056b3" },
            "body": { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "Engineering Maintenance", "weight": "bold", "size": "md" }, { "type": "text", "text": "กดปุ่มด้านล่างเพื่อเปิดแบบฟอร์มใน Browser หลักครับ", "wrap": true, "size": "sm", "margin": "md" }] },
            "footer": { "type": "box", "layout": "vertical", "contents": [{ "type": "button", "action": { "type": "uri", "label": "📝 เปิดแบบฟอร์มแจ้งซ่อม", "uri": targetUrl }, "style": "primary", "color": "#00b900" }] }
          };
          replyFlexMessage(replyToken, "ฟอร์มแจ้งซ่อม", flex, botToken);
        }
        else if (userMessage === "รายการงาน") {
          var targetUrl = isExternalHost 
            ? baseUrl + "/Monitor.html?openExternalBrowser=1"
            : baseUrl + "?page=monitor&openExternalBrowser=1";
            
          var flex = {
            "type": "bubble",
            "header": { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "📊 กระดานติดตามงาน", "weight": "bold", "color": "#ffffff", "size": "xl" }], "backgroundColor": "#191A23" },
            "body": { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "Tracking Board", "weight": "bold", "size": "md" }, { "type": "text", "text": "กดปุ่มด้านล่างเพื่อดูสถานะงานซ่อมทั้งหมดแบบ Real-time ครับ", "wrap": true, "size": "sm", "margin": "md" }] },
            "footer": { "type": "box", "layout": "vertical", "contents": [{ "type": "button", "action": { "type": "uri", "label": "🔍 เปิดหน้าติดตามงาน", "uri": targetUrl }, "style": "primary", "color": "#191A23" }] }
          };
          replyFlexMessage(replyToken, "กระดานติดตามงาน", flex, botToken);
        }
        else if (userMessage === "home") {
          var targetUrl = isExternalHost 
            ? baseUrl + "/Login.html?openExternalBrowser=1"
            : baseUrl + "?page=login&openExternalBrowser=1";
            
          var flex = {
            "type": "bubble",
            "header": { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "เข้าสู่ระบบ", "weight": "bold", "color": "#ffffff", "size": "xl" }], "backgroundColor": "#191A23" },
            "body": { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "Home login", "weight": "bold", "size": "md" }, { "type": "text", "text": "กดปุ่มด้านล่างเพื่อเข้าสู่ระบบ บำรุงรักษ์ ครับ", "wrap": true, "size": "sm", "margin": "md" }] },
            "footer": { "type": "box", "layout": "vertical", "contents": [{ "type": "button", "action": { "type": "uri", "label": "🔍 เข้าสู่ระบบ", "uri": targetUrl }, "style": "primary", "color": "#191A23" }] }
          };
          replyFlexMessage(replyToken, "เข้าสู่ระบบ", flex, botToken);
        }
        else if (userMessage === "งานห้องเครื่อง" || userMessage === "ช่างห้องเครื่อง") {
          var targetUrl = isExternalHost 
            ? baseUrl + "/EngineRoom.html?uid=" + userId + "&openExternalBrowser=1"
            : baseUrl + "?uid=" + userId + "&page=engine_room&openExternalBrowser=1";
            
          var flex = {
            "type": "bubble",
            "header": { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "⚡ งานช่างห้องเครื่อง", "weight": "bold", "color": "#ffffff", "size": "xl" }], "backgroundColor": "#191A23" },
            "body": { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "Engine Room Operations", "weight": "bold", "size": "md" }, { "type": "text", "text": "รายการงานซ่อมที่อยู่ระหว่างดำเนินการสำหรับช่างห้องเครื่อง", "wrap": true, "size": "sm", "margin": "md" }] },
            "footer": { "type": "box", "layout": "vertical", "contents": [{ "type": "button", "action": { "type": "uri", "label": "🛠️ เปิดดูงานห้องเครื่อง", "uri": targetUrl }, "style": "primary", "color": "#B9FF66" }] }
          };
          replyFlexMessage(replyToken, "งานช่างห้องเครื่อง", flex, botToken);
        }
        else if (userMessage === "งานซ่อมบำรุง" || userMessage === "ช่างซ่อมบำรุง") {
          var targetUrl = isExternalHost 
            ? baseUrl + "/MaintenanceTech.html?uid=" + userId + "&openExternalBrowser=1"
            : baseUrl + "?uid=" + userId + "&page=maintenance&openExternalBrowser=1";
            
          var flex = {
            "type": "bubble",
            "header": { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "🛠️ งานช่างซ่อมบำรุง", "weight": "bold", "color": "#ffffff", "size": "xl" }], "backgroundColor": "#191A23" },
            "body": { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "Maintenance Operations", "weight": "bold", "size": "md" }, { "type": "text", "text": "รายการงานซ่อมที่อยู่ระหว่างดำเนินการสำหรับช่างซ่อมบำรุง", "wrap": true, "size": "sm", "margin": "md" }] },
            "footer": { "type": "box", "layout": "vertical", "contents": [{ "type": "button", "action": { "type": "uri", "label": "🔧 เปิดดูงานซ่อมบำรุง", "uri": targetUrl }, "style": "primary", "color": "#FF9900" }] }
          };
          replyFlexMessage(replyToken, "งานช่างซ่อมบำรุง", flex, botToken);
        }
      }
    }
  } catch (err) { 
    Logger.log("doPost Error: " + err.toString()); 
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput("OK");
}

// ------------------------------------------
// 2. ฟังก์ชันจัดการข้อมูล (Data Handling)
// ------------------------------------------
function getMasterData() {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Master_Data');
  var data = sheet.getDataRange().getValues();
  var users = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][2]) { 
      users.push({
        uid: data[i][0].toString().trim(),        
        name: data[i][2].toString().trim(),       
        department: data[i][3].toString().trim(), 
        role: data[i][4].toString().trim(),       
        level: Number(data[i][6]) || 1,
        username: data[i][7] ? data[i][7].toString().trim() : "",
        password: data[i][8] ? data[i][8].toString().trim() : ""
      });
    }
  }
  return users;
}

function getSignatureUsers() {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Master_Data');
  var data = sheet.getDataRange().getValues();
  var users = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][2]) { 
      users.push({
        uid: data[i][0] ? data[i][0].toString().trim() : "",
        empId: data[i][1] ? data[i][1].toString().trim() : "",
        name: data[i][2] ? data[i][2].toString().trim() : "",
        department: data[i][3] ? data[i][3].toString().trim() : "",
        position: data[i][4] ? data[i][4].toString().trim() : "",
        signatureUrl: data[i][9] ? data[i][9].toString().trim() : "" // Column J
      });
    }
  }
  return users;
}

function uploadSignature(uid, base64Data, filename) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName('Master_Data');
    var data = sheet.getDataRange().getValues();
    var rowIndex = -1;
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString().trim() === uid) {
        rowIndex = i + 1; // +1 because array is 0-indexed and rows are 1-indexed
        break;
      }
    }
    
    if (rowIndex === -1) {
      return { success: false, message: 'ไม่พบผู้ใช้งาน UID นี้ในระบบ' };
    }
    
    // แปลง base64 กลับเป็นไฟล์ (ตัดส่วน header data:image/png;base64, ออก)
    var base64 = base64Data.split(',')[1];
    var blob = Utilities.newBlob(Utilities.base64Decode(base64), 'image/png', filename);
    
    // อัปโหลดไฟล์ขึ้น Google Drive โฟลเดอร์ที่กำหนด
    var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    var file = folder.createFile(blob);
    
    // ตั้งค่าแชร์ไฟล์เป็นสาธารณะ (Anyone with the link) เพื่อให้สามารถนำมาแสดงใน PDF ได้
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    var fileUrl = file.getUrl();
    
    // บันทึกลิงก์ลง Master_Data คอลัมน์ J (คอลัมน์ที่ 10)
    sheet.getRange(rowIndex, 10).setValue(fileUrl);
    
    return { success: true, message: 'อัปโหลดลายเซ็นสำเร็จ!', url: fileUrl };
  } catch (e) {
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + e.toString() };
  }
}

function getDashboardData() {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName('Repair_Master');
    var data = sheet.getDataRange().getValues();
    var summary = { total: 0, pending: 0, processing: 0, completed: 0, rejected: 0, allTickets: [] };
    
    // จำกัดการประมวลผลเฉพาะ 200 รายการล่าสุดเพื่อความเร็ว
    var startRow = Math.max(1, data.length - 200);
    
    for (var i = data.length - 1; i >= 1; i--) { 
      if (!data[i][1]) continue; 
      
      var status = data[i][2] ? data[i][2].toString() : "";
      summary.total++;
      if (status === "Pending" || status === "รอดำเนินการ") summary.pending++;
      else if (status.includes("ระหว่าง") || status.includes("อนุมัติ")) summary.processing++;
      else if (status.includes("ตีกลับ") || status.includes("ยกเลิก") || status.includes("ปฏิเสธ")) summary.rejected++;
      else summary.completed++;

      // ประมวลผลรายละเอียดเฉพาะ 200 รายการล่าสุด
      if (i >= startRow) {
        var rawImageUrl = data[i][6] ? data[i][6].toString() : ""; 
        var imageUrl = rawImgToThumbnail(rawImageUrl);
        var rawCompUrl = data[i][25] ? data[i][25].toString() : ""; 
        var completionImageUrl = rawImgToThumbnail(rawCompUrl);

        summary.allTickets.push({
          ticket: data[i][1] ? data[i][1].toString() : "", 
          status: status ? status.toString() : "", 
          target: data[i][3] && data[i][3].toString() !== "-" ? data[i][3].toString() : (data[i][4] ? data[i][4].toString() : "-"),
          problem: data[i][5] ? data[i][5].toString() : "", 
          date: formatDate(data[i][8]), 
          progress: Number(data[i][7]) || 0,
          reqName: data[i][10] ? data[i][10].toString() : "", 
          reqPosition: data[i][11] ? data[i][11].toString() : "", 
          imageUrl: imageUrl, 
          completionImageUrl: completionImageUrl,
          note: data[i][13] ? data[i][13].toString() : "", 
          expectedDate: data[i][14] ? data[i][14].toString() : "", 
          assignDept: data[i][15] ? data[i][15].toString() : "", 
          receivedDate: formatDate(data[i][16]),
          repairMethod: data[i][17] ? data[i][17].toString() : "", 
          repairDetails: data[i][18] ? data[i][18].toString() : "", 
          approvalStatus: data[i][19] ? data[i][19].toString() : "",
          cause: data[i][22] ? data[i][22].toString() : "", 
          receiver: data[i][23] ? data[i][23].toString() : "", 
          verifier: data[i][24] ? data[i][24].toString() : "",
          verifyTimestamp: formatDate(data[i][9]), // (Column J: Verify_Timestamp)
          submitHandoverTimestamp: data[i][32] ? formatDate(data[i][32]) : "", // [AG] เวลาปิดงานส่งมอบ
          handoverName: data[i][33] ? data[i][33].toString() : "", // [AH] ผู้รับมอบงาน
          approverName: data[i][27] ? data[i][27].toString() : "", 
          approverPosition: data[i][28] ? data[i][28].toString() : "", 
          approvalTimestamp: formatDate(data[i][29]), 
          approvalNote: data[i][30] ? data[i][30].toString() : ""
        });
      }
    }
    return { error: false, total: summary.total, pending: summary.pending, processing: summary.processing, completed: summary.completed, rejected: summary.rejected, allTickets: summary.allTickets };
  } catch (error) { 
    return { error: true, message: "Dashboard Error: " + error.toString() }; 
  }
}

function updateTicketStatus_Full(ticketId, newStatus, note, expectedDate, assignDept, receivedDate, repairMethod, repairDetails, refTicketId, correctionDetails, authUser, progress, cause, receiver, verifier, completionFile, approverInfo, handoverName) {
  try {
    // กำหนดระดับสิทธิ์ที่ต้องการตามสถานะใหม่
    var requiredLevel = 1; 
    var isManagerOnly = false;
    var isQCLevel = false;

    if (newStatus.includes("รออนุมัติ") || newStatus.includes("ทวนสอบ")) {
      requiredLevel = 3; 
    } 
    
    // ปรับลอจิกการเช็คสิทธิ์ให้ยืดหยุ่นขึ้นตามคนส่ง
    if (newStatus === "รอการทวนสอบ (QC)") {
      requiredLevel = 2; // Level 2 ส่งมอบงานไป QC
    } else if (newStatus.includes("รออนุมัติ") || newStatus === "รอรับมอบงาน") {
      requiredLevel = 3; // วิศวกร (Level 3+) รับแจ้ง หรือ ปิดงานส่งไป Handover
    } else if (newStatus.includes("ดำเนินการ") || newStatus.includes("ปฏิเสธ")) {
      requiredLevel = 5; // Manager (Level 5 Only)
      isManagerOnly = true;
    } else if (newStatus.includes("สมบูรณ์")) {
      requiredLevel = 4; // QC (Level 4+)
      isQCLevel = true;
    }

    var permission = validateUserAction(authUser, requiredLevel); 
    if (!permission.allowed) return { success: false, message: permission.message };

    // เช็คสิทธิ์พิเศษเพิ่มเติม
    if (isManagerOnly && permission.user.level < 5) return { success: false, message: "❌ เฉพาะผู้บริหาร (Level 5) เท่านั้นที่สามารถอนุมัติได้" };
    if (isQCLevel && permission.user.level !== 4 && permission.user.level < 5) return { success: false, message: "❌ เฉพาะแผนก QC (Level 4) เท่านั้นที่สามารถทวนสอบงานได้" };

    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName('Repair_Master');
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] === ticketId) {
        var now = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
        sheet.getRange(i + 1, 3).setValue(newStatus);         
        sheet.getRange(i + 1, 8).setValue(progress);          
        if (note) {
          if (newStatus === "รอการทวนสอบ (QC)") {
            sheet.getRange(i + 1, 35).setValue(note); // Column AI (35): Handover_Note
          } else if (newStatus === "ซ่อมเสร็จสมบูรณ์ (Completed)") {
            sheet.getRange(i + 1, 36).setValue(note); // Column AJ (36): QC_Note
          } else {
            sheet.getRange(i + 1, 14).setValue(note); // Column N (14): General/Technician Note
          }
        }
        if (expectedDate) sheet.getRange(i + 1, 15).setValue(expectedDate);     
        if (assignDept) sheet.getRange(i + 1, 16).setValue(assignDept);       
        if (repairMethod) sheet.getRange(i + 1, 18).setValue(repairMethod);     
        if (repairDetails) sheet.getRange(i + 1, 19).setValue(repairDetails);    
        if (cause) sheet.getRange(i + 1, 23).setValue(cause);        
        
        // บันทึกเวลาตามเหตุการณ์ต่างๆ
        if (receiver) { sheet.getRange(i + 1, 24).setValue(receiver); sheet.getRange(i + 1, 17).setValue(now); } // [Q] Plan_Timestamp
        if (handoverName) { 
          sheet.getRange(i + 1, 27).setValue(now); // [AA] Handover_Timestamp (เมื่อมีคนมากดรับมอบงาน)
          sheet.getRange(i + 1, 34).setValue(handoverName); // [AH] Handover_Name (ผู้รับมอบงาน)
        }
        if (verifier) { sheet.getRange(i + 1, 25).setValue(verifier); sheet.getRange(i + 1, 10).setValue(now); } // [J] Verify_Timestamp
        
        // ✅ บันทึกเวลาที่ช่าง/วิศวกรกดปิดงานและส่งรับมอบ ลงในคอลัมน์ AG (คอลัมน์ที่ 33)
        if (newStatus === "รอรับมอบงาน") {
          sheet.getRange(i + 1, 33).setValue(now); // [AG] Submit_Handover_Timestamp
        }
        
        if (approverInfo) {
          sheet.getRange(i + 1, 28).setValue(approverInfo.name);      
          sheet.getRange(i + 1, 29).setValue(approverInfo.position);  
          sheet.getRange(i + 1, 30).setValue(now);                    // [AD] Approve_Timestamp
          sheet.getRange(i + 1, 31).setValue(approverInfo.note);      
        }
        
        if (completionFile) {
          var blob = Utilities.newBlob(Utilities.base64Decode(completionFile.base64), completionFile.mimeType, completionFile.fileName);
          var file = DriveApp.getFolderById(DRIVE_FOLDER_ID).createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          sheet.getRange(i + 1, 26).setValue(file.getUrl()); 
        }
        logAction({ 
          name: permission.user.name, 
          dept: permission.user.department,
          pos: permission.user.role,
          action: "Update to: " + newStatus, 
          targetTicket: ticketId,
          page: "Backend", 
          uid: permission.user.uid, 
          level: permission.user.level 
        });
        return { success: true, message: "บันทึกข้อมูลสำเร็จ!" };
      }
    }
    return { success: false, message: "ไม่พบรหัสงาน" };
  } catch (error) { return { success: false, message: error.toString() }; }
}

// ------------------------------------------
// 🔥 ฟังก์ชันเพิ่มเติมสำหรับระบบช่าง (Technicians)
// ------------------------------------------
function getTechnicianJobs(deptFilter) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName('Repair_Master');
    var data = sheet.getDataRange().getValues();
    var jobs = [];

    var targetDeptClean = (deptFilter || "").toString().trim().toLowerCase();

    for (var i = data.length - 1; i >= 1; i--) {
      if (!data[i][1]) continue;

      var status = data[i][2] ? data[i][2].toString().trim() : "";
      var assignDept = data[i][15] ? data[i][15].toString().trim() : "";
      var deptGroup = data[i][31] ? data[i][31].toString().trim() : "";
      var problem = data[i][5] ? data[i][5].toString().trim() : "";

      // ตรวจสอบสถานะ: ต้องเป็นงานที่ "อยู่ระหว่างการดำเนินการ" หรือ "กำลังดำเนินการ"
      var isInProgress = status.includes("ระหว่าง") || status.includes("ดำเนินการ") || status === "In Progress";
      var isCompletedOrSubmitted = status.includes("สมบูรณ์") || status.includes("รอรับมอบ") || status.includes("ทวนสอบ") || status.includes("สำเร็จ");

      if (!isInProgress || isCompletedOrSubmitted) continue;

      // กรองตามแผนก
      var isDeptMatch = true;
      if (targetDeptClean && targetDeptClean !== "all") {
        var assignClean = assignDept.toLowerCase();
        var groupClean = deptGroup.toLowerCase();
        
        if (targetDeptClean.includes("ห้องเครื่อง") || targetDeptClean.includes("engine")) {
          isDeptMatch = assignClean.includes("ห้องเครื่อง") || assignClean.includes("engine") || groupClean.includes("eng") || problem.includes("ห้องเครื่อง");
        } 
        else if (targetDeptClean.includes("ซ่อมบำรุง") || targetDeptClean.includes("maintenance") || targetDeptClean.includes("maint")) {
          isDeptMatch = assignClean.includes("ซ่อมบำรุง") || assignClean.includes("maint") || groupClean.includes("maint") || (!assignClean.includes("ห้องเครื่อง") && !groupClean.includes("eng"));
        }
        else {
          isDeptMatch = assignClean.includes(targetDeptClean) || groupClean.includes(targetDeptClean);
        }
      }

      if (isDeptMatch) {
        var rawImageUrl = data[i][6] ? data[i][6].toString() : "";
        var imageUrl = rawImgToThumbnail(rawImageUrl);

        jobs.push({
          rowId: i + 1,
          ticketId: data[i][1] ? data[i][1].toString() : "",
          engTicketId: data[i][0] ? data[i][0].toString() : "",
          status: status,
          target: data[i][3] && data[i][3].toString() !== "-" ? data[i][3].toString() : (data[i][4] ? data[i][4].toString() : "-"),
          problem: problem,
          imageUrl: imageUrl,
          reqDate: formatDate(data[i][8]),
          reqName: data[i][10] ? data[i][10].toString() : "-",
          reqPosition: data[i][11] ? data[i][11].toString() : "-",
          expectedDate: data[i][14] ? formatDate(data[i][14]) : "-",
          assignDept: assignDept || (targetDeptClean.includes("ห้องเครื่อง") ? "ห้องเครื่อง" : "ซ่อมบำรุง"),
          receiver: data[i][23] ? data[i][23].toString() : "-",
          note: data[i][13] ? data[i][13].toString() : ""
        });
      }
    }

    return { success: true, count: jobs.length, jobs: jobs };
  } catch (error) {
    return { success: false, message: "Error fetching tech jobs: " + error.toString(), jobs: [] };
  }
}

function completeTechnicianWork(data) {
  try {
    if (!data || !data.ticketId) {
      return { success: false, message: "❌ ไม่พบรหัสงานซ่อม" };
    }

    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName('Repair_Master');
    var sheetData = sheet.getDataRange().getValues();
    var rowIndex = -1;

    for (var i = 1; i < sheetData.length; i++) {
      if (sheetData[i][1] === data.ticketId || sheetData[i][0] === data.ticketId) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, message: "❌ ไม่พบรายการงานรหัส " + data.ticketId + " ในฐานข้อมูล" };
    }

    var completionImageUrl = "";
    if (data.file && data.file.base64) {
      var blob = Utilities.newBlob(Utilities.base64Decode(data.file.base64), data.file.mimeType, data.file.fileName || ("complete_" + data.ticketId + ".jpg"));
      var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      completionImageUrl = file.getUrl();
    }

    var now = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");

    // อัปเดตข้อมูลในคอลัมน์ต่างๆ
    sheet.getRange(rowIndex, 3).setValue("รอรับมอบงาน"); // Column C: Status -> รอรับมอบงาน
    sheet.getRange(rowIndex, 8).setValue(100);            // Column H: Progress -> 100%

    if (data.repairDetails) {
      sheet.getRange(rowIndex, 19).setValue(data.repairDetails); // Column S (19): Repair Details
    }
    if (data.cause) {
      sheet.getRange(rowIndex, 23).setValue(data.cause);         // Column W (23): Cause
    }
    if (completionImageUrl) {
      sheet.getRange(rowIndex, 26).setValue(completionImageUrl); // Column Z (26): Completion Image URL
    }

    sheet.getRange(rowIndex, 33).setValue(now); // Column AG (33): Submit_Handover_Timestamp
    if (data.userName || data.techName) {
      sheet.getRange(rowIndex, 34).setValue(data.userName || data.techName); // Column AH (34): Handover_Name
    }

    logAction({
      name: data.userName || "ช่างซ่อมบำรุง",
      dept: data.department || "MAINTENANCE",
      pos: "Technician",
      action: "Work Completed & Submitted (รอรับมอบงาน)",
      targetTicket: data.ticketId,
      page: "Technician_Page",
      uid: data.authUser || "-"
    });

    return { 
      success: true, 
      message: "✅ บันทึกส่งมอบงานสำเร็จ! รหัสตั๋ว " + data.ticketId,
      ticketId: data.ticketId
    };

  } catch (error) {
    return { success: false, message: "❌ เกิดข้อผิดพลาด: " + error.toString() };
  }
}

function rejectAndCloneTicket(oldTicketId, cancelStatus, rejectNote, authUser, rejectorName) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName('Repair_Master');
    var data = sheet.getDataRange().getValues();
    
    var permission = validateUserAction(authUser, 1); 
    var dept = permission.allowed ? permission.user.department : "-";
    var pos = permission.allowed ? permission.user.role : "-";
    
    var oldRowIndex = -1;
    var oldData = null;
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] === oldTicketId) {
        oldRowIndex = i;
        oldData = data[i];
        break;
      }
    }
    
    if (oldRowIndex === -1) return { success: false, message: "ไม่พบรหัสงานเดิม" };
    
    // 1. อัปเดตงานเดิมให้เป็นยกเลิก
    sheet.getRange(oldRowIndex + 1, 3).setValue(cancelStatus);
    sheet.getRange(oldRowIndex + 1, 8).setValue(0); // Progress 0
    sheet.getRange(oldRowIndex + 1, 14).setValue(rejectNote); // เอาหมายเหตุการตีกลับไปใส่ในช่อง Note งานเก่า
    
    // 2. สร้างใบใหม่ (Clone)
    // ดึก Prefix (MAC หรือ BLD) มาจากรหัสงานใบเก่าที่กำลังจะถูกโคลน
    var oldPrefix = "REP"; 
    if (oldTicketId && oldTicketId.indexOf("-") !== -1) {
        oldPrefix = oldTicketId.split("-")[0];
    }
    var engId = oldPrefix + "-" + Utilities.formatDate(new Date(), "GMT+7", "yyMM") + "-" + Math.floor(1000+Math.random()*9000);
    
    var oldDeptGroup = oldData[31] || oldData[1].split(" ")[0]; // ดึงตัวย่อแผนกจากคอลัมน์ AF หรือชื่อตั๋ว
    var newDeptId = getRunningNumber(oldDeptGroup);
    
    var rowData = new Array(34).fill(""); // ขยายเป็น 34 คอลัมน์ (A ถึง AH)
    rowData[0] = engId;                             // A: Ticket_ID
    rowData[1] = newDeptId;                         // B: Dept_Ticket_ID
    rowData[2] = "รอดำเนินการ";                       // C: Status (Pending)
    rowData[3] = oldData[3];                        // D: Machine
    rowData[4] = oldData[4];                        // E: Building
    rowData[5] = oldData[5];                        // F: Problem
    rowData[6] = oldData[6];                        // G: Image URL
    rowData[7] = 0;                                 // H: Progress
    rowData[8] = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss"); // I: Req_Timestamp (เวลาใบใหม่)
    rowData[10] = oldData[10];                      // K: Req_Name
    rowData[11] = oldData[11];                      // L: Req_Position
    rowData[12] = oldData[12];                      // M: Image_ID
    
    rowData[20] = oldTicketId;                      // U: Ref_Ticket_ID (ชี้ไปที่งานเก่า)
    rowData[21] = "ตีกลับจาก: " + rejectorName + " เหตุผล: " + rejectNote; // V: Correction_Details
    rowData[31] = oldDeptGroup;                     // AF: Dept_Group

    sheet.appendRow(rowData);
    logAction({ 
      name: rejectorName, 
      dept: dept,
      pos: pos,
      action: "Reject & Clone: " + oldTicketId + " -> " + newDeptId, 
      targetTicket: oldTicketId,
      page: "Backend", 
      uid: authUser, 
      level: permission.allowed ? permission.user.level : 0 
    });
    
    return { success: true, message: "ตีกลับสำเร็จ! สร้างใบงานใหม่รหัส: " + newDeptId };
    
  } catch (error) { return { success: false, message: error.toString() }; }
}

function processForm(data) {
  try {
    var blob = Utilities.newBlob(Utilities.base64Decode(data.file.base64), data.file.mimeType, data.file.fileName);
    var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // ตั้งคำนำหน้าให้ถูกต้อง (MAC, BLD, EQP) โดยดึงจากหมวดหมู่ที่เลือกในฟอร์ม
    var prefix = "REP";
    if (data.category === "Machine") {
      prefix = "MAC";
    } else if (data.category === "Building") {
      prefix = "BLD";
    } else if (data.category === "Equipment") {
      prefix = "EQP";
    }
    
    var engId = prefix + "-" + Utilities.formatDate(new Date(), "GMT+7", "yyMM") + "-" + Math.floor(1000+Math.random()*9000);
    
    var deptId = getRunningNumber(data.department);
    var deptGroup = deptId.split(" ")[0] || data.department; // ดึงตัวย่อแผนก เช่น "PD" จาก "PD 001/69"
    
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Repair_Master');
    
    // สร้าง Array ความยาว 34 คอลัมน์ (A ถึง AH)
    var rowData = new Array(34).fill("");
    rowData[0] = engId;                             // A: Ticket_ID
    rowData[1] = deptId;                            // B: Dept_Ticket_ID
    rowData[2] = "Pending";                         // C: Status
    rowData[3] = (data.category === "Machine" || data.category === "Equipment") ? data.targetId : "-"; // D: Machine
    rowData[4] = data.category === "Building" ? data.targetId : "-"; // E: Building
    rowData[5] = data.problem;                      // F: Problem
    rowData[6] = file.getUrl();                     // G: Image URL
    rowData[7] = 0;                                 // H: Progress
    rowData[8] = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss"); // I: Req_Timestamp
    rowData[10] = data.reqName;                     // K: Req_Name
    rowData[11] = data.reqPosition;                 // L: Req_Position
    rowData[12] = file.getId();                     // M: Image_ID
    rowData[20] = data.refTicketId || "";           // U: Ref_Ticket_ID
    rowData[21] = data.correctionDetails || "";     // V: Correction_Details
    rowData[31] = deptGroup;                        // AF: Dept_Group (คอลัมน์ใหม่สำหรับจัดกลุ่ม)
    // rowData[32] = ""                             // AG: Submit_Handover_Timestamp (ว่างไว้ก่อน บันทึกเมื่อปิดงาน)

    sheet.appendRow(rowData);
    return "✅ แจ้งซ่อมสำเร็จ! รหัส: " + deptId;
  } catch (e) { return "❌ Error: " + e.toString(); }
}

function getPMData() {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName('PM_Schedule');
    var data = sheet.getDataRange().getValues();
    var summary = { pendingPlan: 0, pendingActual: 0, completed: 0, allPMs: [] };
    
    for (var i = 1; i < data.length; i++) { 
      if (!data[i][0]) continue; 
      
      var status = data[i][9] || "";
      if (status === "รอจัดแผน" || status === "") summary.pendingPlan++;
      else if (status === "รอทำ PM") summary.pendingActual++;
      else summary.completed++;

      summary.allPMs.push({
        id: data[i][0] ? data[i][0].toString() : "",
        machineId: data[i][1] ? data[i][1].toString() : "",
        machineName: data[i][2] ? data[i][2].toString() : "",
        task: data[i][3] ? data[i][3].toString() : "",
        freq: data[i][4] ? data[i][4].toString() : "",
        planDate: data[i][5] ? data[i][5].toString() : "",
        planBy: data[i][6] ? data[i][6].toString() : "",
        actualDate: data[i][7] ? data[i][7].toString() : "",
        actualBy: data[i][8] ? data[i][8].toString() : "",
        status: status,
        ref: data[i][10] ? data[i][10].toString() : "",
        notes: data[i][11] ? data[i][11].toString() : "",
        imageUrl: data[i][12] ? data[i][12].toString() : "" // [M] Image_URL
      });
    }
    return { error: false, summary: summary };
  } catch (error) { 
    return { error: true, message: "PM Data Error: " + error.toString() }; 
  }
}

function updatePMActual_Full(id, notes, fileData, authUser, userName) {
  try {
    var permission = validateUserAction(authUser, 1); 
    if (!permission.allowed || (permission.user.level !== 3 && permission.user.level !== 5 && permission.user.level !== 7 && permission.user.level !== 8)) return { success: false, message: "❌ เฉพาะฝ่ายวิศวกรรม ช่างซ่อมบำรุง และช่างห้องเครื่องเท่านั้นที่สามารถบันทึกผล PM ได้" };

    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName('PM_Schedule');
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim() === id.toString().trim()) {
        var status = data[i][9] ? data[i][9].toString().trim() : "";
        if (status !== "รอทำ PM") return { success: false, message: "ไม่สามารถบันทึกได้ (แผนงานยังไม่ถูกอนุมัติโดย L5)" };
        
        var now = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm");
        sheet.getRange(i + 1, 8).setValue(now); // [H] Actual_Date
        sheet.getRange(i + 1, 9).setValue(userName); // [I] Actual_By_L3
        sheet.getRange(i + 1, 10).setValue("เสร็จสิ้น"); // [J] Status
        if (notes) sheet.getRange(i + 1, 12).setValue(notes); // [L] Notes
        
        if (fileData) {
          var blob = Utilities.newBlob(Utilities.base64Decode(fileData.base64), fileData.mimeType, fileData.fileName);
          var file = DriveApp.getFolderById(DRIVE_FOLDER_ID).createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          sheet.getRange(i + 1, 13).setValue(file.getUrl()); // [M] Image_URL
        }
        
        logAction({ name: permission.user.name, dept: permission.user.department, pos: permission.user.role, action: "Record PM Actual w/ Image", targetTicket: id, page: "Backend", uid: permission.user.uid, level: permission.user.level });
        return { success: true, message: "บันทึกผลการทำ PM และรูปภาพเรียบร้อย!" };
      }
    }
    return { success: false, message: "ไม่พบรหัสแผนงาน" };
  } catch (error) { return { success: false, message: error.toString() }; }
}

function updatePMPlan(id, planDate, authUser, userName) { try { var permission = validateUserAction(authUser, 1); if (permission.allowed && permission.user.level !== 5) permission.allowed = false; 
    if (!permission.allowed) return { success: false, message: "❌ เฉพาะผู้บริหาร (Level 5) เท่านั้นที่สามารถจัดแผนได้" };

    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName('PM_Schedule');
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim() === id.toString().trim()) {
        sheet.getRange(i + 1, 6).setValue(planDate); // [F] Plan_Date
        sheet.getRange(i + 1, 7).setValue(userName); // [G] Plan_By_L5
        sheet.getRange(i + 1, 10).setValue("รอทำ PM"); // [J] Status
        
        logAction({ name: permission.user.name, dept: permission.user.department, pos: permission.user.role, action: "Set PM Plan Date", targetTicket: id, page: "Backend", uid: permission.user.uid, level: permission.user.level });
        return { success: true, message: "บันทึกแผนงานเรียบร้อย!" };
      }
    }
    return { success: false, message: "ไม่พบรหัสแผนงาน" };
  } catch (error) { return { success: false, message: error.toString() }; }
}

function updatePMPlanBulk(plans, authUser, userName) { try { var permission = validateUserAction(authUser, 1); if (permission.allowed && permission.user.level !== 5) permission.allowed = false; 
    if (!permission.allowed) return { success: false, message: "❌ เฉพาะผู้บริหาร (Level 5) เท่านั้นที่สามารถจัดแผนได้" };

    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName('PM_Schedule');
    var data = sheet.getDataRange().getValues();
    
    var currentYear = new Date().getFullYear();
    var thYear = currentYear + 543;
    var monthNames = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    
    var rowsToAppend = [];
    var updates = [];

    // สร้างระบบตรวจสอบความซ้ำซ้อน (Duplicate Check)
    var existingPlans = new Set();
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] && data[i][3] && data[i][5]) {
        // Key = MachineID + Task + PlanDate (เช่น MAC-01|ตรวจน้ำมัน|ม.ค. 2569)
        existingPlans.add(data[i][1].toString() + "|" + data[i][3].toString() + "|" + data[i][5].toString());
      }
    }

    var addedCount = 0;

    for (var p = 0; p < plans.length; p++) {
        var plan = plans[p];
        if (!plan.months || plan.months.length === 0) continue;
        
        var oldRowIdx = -1;
        var oldData = null;
        for (var i=1; i<data.length; i++) {
            if (data[i][0] && data[i][0].toString().trim() === plan.id.toString().trim()) {
                oldRowIdx = i;
                oldData = data[i];
                break;
            }
        }
        
        if (oldRowIdx !== -1) {
            var machineId = oldData[1].toString();
            var taskName = oldData[3].toString();
            var isFirstUpdateDone = false;

            for (var m = 0; m < plan.months.length; m++) {
                var monthNum = plan.months[m];
                var monthStr = monthNames[monthNum] + " " + thYear;
                var checkKey = machineId + "|" + taskName + "|" + monthStr;
                
                // ข้ามถ้ามีการวางแผนเดือนนี้ไปแล้วใน Database
                if (existingPlans.has(checkKey)) continue;
                
                // เอาแถวตั้งต้น (รอจัดแผน) มาใส่วันที่ก่อนเป็นอันดับแรก
                if (!isFirstUpdateDone && (oldData[9] === "รอจัดแผน" || oldData[9] === "")) {
                    updates.push({ idx: oldRowIdx + 1, dateStr: monthStr });
                    isFirstUpdateDone = true;
                    existingPlans.add(checkKey); // กันการใส่ซ้ำในรอบเดียวกัน
                    addedCount++;
                } else {
                    // ถ้าแถวตั้งต้นถูกใช้ไปแล้ว หรือเป็นการจัดแผนเพิ่ม ให้ Clone แถวใหม่
                    var newId = oldData[0].toString().split('-')[0] + "-PM-" + Math.floor(10000+Math.random()*90000); 
                    var newRow = [...oldData]; 
                    newRow[0] = newId;          // A: PM_Ticket_ID
                    newRow[5] = monthStr;       // F: Plan_Date
                    newRow[6] = userName;       // G: Plan_By_L5
                    newRow[7] = "";             // H: Actual_Date (เคลียร์ทิ้ง)
                    newRow[8] = "";             // I: Actual_By_L3 (เคลียร์ทิ้ง)
                    newRow[9] = "รอทำ PM";      // J: Status
                    newRow[11] = "";            // L: Notes (เคลียร์ทิ้ง)
                    newRow[12] = "";            // M: Image_URL (เคลียร์ทิ้ง)
                    rowsToAppend.push(newRow);
                    existingPlans.add(checkKey);
                    addedCount++;
                }
            }
        }
    }
    
    if (addedCount === 0) {
      return { success: false, message: "⚠️ ข้อมูลทั้งหมดที่คุณเลือก ถูกจัดแผนไปแล้ว (ไม่มีการเปลี่ยนแปลง)" };
    }

    for (var u=0; u<updates.length; u++) {
        var r = updates[u].idx;
        sheet.getRange(r, 6).setValue(updates[u].dateStr);
        sheet.getRange(r, 7).setValue(userName);
        sheet.getRange(r, 8).setValue(""); // เคลียร์ Actual_Date
        sheet.getRange(r, 9).setValue(""); // เคลียร์ Actual_By_L3
        sheet.getRange(r, 10).setValue("รอทำ PM");
    }
    
    if (rowsToAppend.length > 0) {
        sheet.getRange(data.length + 1, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
    }
    
    // จัดเรียงข้อมูลใน Google Sheets ให้ดูง่ายขึ้น (เรียงตามรหัสเครื่องจักร Column B)
    if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).sort(2);
    }
    
    logAction({ name: permission.user.name, dept: permission.user.department, pos: permission.user.role, action: "Bulk Plan PM (" + addedCount + " plans)", targetTicket: "Multiple", page: "Backend", uid: permission.user.uid, level: permission.user.level });
    return { success: true, message: "บันทึกแผนสำเร็จ " + addedCount + " รายการ!" };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function cancelPMPlan(id, authUser) { try { var permission = validateUserAction(authUser, 1); if (permission.allowed && permission.user.level !== 5) permission.allowed = false; 
    if (!permission.allowed) return { success: false, message: "❌ เฉพาะผู้บริหาร (Level 5) เท่านั้นที่สามารถยกเลิกแผนได้" };

    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName('PM_Schedule');
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim() === id.toString().trim()) {
        if (data[i][9] === "เสร็จสิ้น") return { success: false, message: "ไม่สามารถยกเลิกได้ เนื่องจากช่างทำ PM เสร็จไปแล้ว" };
        
        if (id.indexOf("-PM-") !== -1) {
            // ถ้ารหัสมีคำว่า -PM- แสดงว่าเป็นใบที่ Clone มา ให้ลบแถวทิ้งเลย
            sheet.deleteRow(i + 1);
        } else {
            // ถ้าเป็นใบตั้งต้น ให้เคลียร์ค่ากลับเป็นช่องว่าง "รอจัดแผน"
            sheet.getRange(i + 1, 6).setValue(""); // Plan_Date
            sheet.getRange(i + 1, 7).setValue(""); // Plan_By
            sheet.getRange(i + 1, 8).setValue(""); // Actual_Date
            sheet.getRange(i + 1, 9).setValue(""); // Actual_By
            sheet.getRange(i + 1, 10).setValue("รอจัดแผน"); // Status
            sheet.getRange(i + 1, 12).setValue(""); // Notes
            sheet.getRange(i + 1, 13).setValue(""); // Image
        }
        
        logAction({ name: permission.user.name, dept: permission.user.department, pos: permission.user.role, action: "Cancel PM Plan", targetTicket: id, page: "Backend", uid: permission.user.uid, level: permission.user.level });
        return { success: true, message: "ยกเลิกแผนงานเรียบร้อยแล้ว!" };
      }
    }
    return { success: false, message: "ไม่พบรหัสแผนงาน" };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function updatePMActual(id, actualDate, notes, authUser, userName) {
  try {
    var permission = validateUserAction(authUser, 1); 
    if (!permission.allowed || (permission.user.level !== 3 && permission.user.level !== 5 && permission.user.level !== 7 && permission.user.level !== 8)) return { success: false, message: "❌ เฉพาะฝ่ายวิศวกรรม ช่างซ่อมบำรุง และช่างห้องเครื่องเท่านั้นที่สามารถบันทึกผล PM ได้" };

    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName('PM_Schedule');
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim() === id.toString().trim()) {
        if (data[i][9] !== "รอทำ PM") return { success: false, message: "ไม่สามารถบันทึกได้ (แผนงานยังไม่ถูกอนุมัติโดย L5)" };
        
        sheet.getRange(i + 1, 8).setValue(actualDate); // [H] Actual_Date
        sheet.getRange(i + 1, 9).setValue(userName); // [I] Actual_By_L3
        sheet.getRange(i + 1, 10).setValue("เสร็จสิ้น"); // [J] Status
        if (notes) sheet.getRange(i + 1, 12).setValue(notes); // [L] Notes
        
        logAction({ name: permission.user.name, dept: permission.user.department, pos: permission.user.role, action: "Record PM Actual", targetTicket: id, page: "Backend", uid: permission.user.uid, level: permission.user.level });
        return { success: true, message: "บันทึกผลการทำ PM เรียบร้อย!" };
      }
    }
    return { success: false, message: "ไม่พบรหัสแผนงาน" };
  } catch (error) { return { success: false, message: error.toString() }; }
}

function getRunningNumber(dept) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Setting');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === dept) {
      var next = Number(data[i][1]) + 1;
      sheet.getRange(i + 1, 2).setValue(next);
      return dept + " " + ("000" + next).slice(-3) + "/" + (new Date().getFullYear() + 543).toString().slice(-2);
    }
  }
  return dept + " 001/??";
}

function validateUserAction(id, level) {
  var users = getMasterData();
  var user = users.find(u => 
    (u.username && u.username.toLowerCase() === (id||"").toLowerCase()) || 
    (u.uid && u.uid.toString() === (id||"").toString()) || 
    (u.name && u.name === id)
  );
  if (!user) return { allowed: false, message: "❌ ไม่พบผู้ใช้ (" + id + ")" };
  if (user.level < level) return { allowed: false, message: "❌ สิทธิ์ไม่พอ (ต้องการ Level " + level + " ขึ้นไป)" };
  return { allowed: true, user: user };
}

function verifyUserLogin(u, p) {
  var user = getMasterData().find(x => x.username.toLowerCase() === u.toLowerCase() && x.password === p);
  if (user) {
    var role = "staff";
      if (user.level === 5) role = "admin";
    else if (user.level === 4) role = "qc";
    else if (user.level === 3) role = "engineer";
      else if (user.level === 2) role = "supervisor";
      else if (user.level === 7) role = "maintenance_tech";
      else if (user.level === 8) role = "engine_tech";
      else if (user.level === 6) role = "stock";
    
    return { 
      success: true, 
      role: role, 
      name: user.name, 
      username: user.username, 
      department: user.department, 
      position: user.role, // ส่งค่าตำแหน่ง (Role) จาก Master_Data กลับไปด้วย
      level: user.level,
      uid: user.uid 
    };
  }
  return { success: false, message: "❌ ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
}

function logAction(d) {
  try { 
    var s = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Login_Log'); 
    // [1]เวลา, [2]ชื่อ, [3]แผนก, [4]ตำแหน่ง, [5]การกระทำ, [6]รหัสงานอ้างอิง, [7]หน้าที่ทำรายการ, [8]UID, [9]IP, [10]Device
    s.appendRow([
      Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss"), 
      d.name || "-", 
      d.dept || "-", 
      d.pos || "-", 
      d.action || "-", 
      d.targetTicket || "-", 
      d.page || "-", 
      d.uid || "-", 
      d.ip || "-", 
      d.device || "-"
    ]); 
  } catch (e) {}
}

function replyText(t, m, token) { UrlFetchApp.fetch('https://api.line.me/v2/bot/message/reply', { 'method': 'post', 'headers': { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (token || TOKENS[1]) }, 'payload': JSON.stringify({ 'replyToken': t, 'messages': [{ 'type': 'text', 'text': m }] }) }); }
function replyFlexMessage(t, a, f, token) { UrlFetchApp.fetch('https://api.line.me/v2/bot/message/reply', { 'method': 'post', 'headers': { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (token || TOKENS[1]) }, 'payload': JSON.stringify({ 'replyToken': t, 'messages': [{ 'type': 'flex', 'altText': a, 'contents': f }] }) }); }
function getUserJobs(uid) { return getDashboardData().allTickets.filter(t => t.status.includes("ยกเลิก") || t.status.includes("ถูกปฏิเสธ")); }
function resubmitJob(d) { return d.createNew ? (updateTicketStatus_Full(d.editTicketId, "ยกเลิก (ใบใหม่)", "เปลี่ยนใบใหม่", "", "", "", "", "", "", "", d.authUser, 0, "", "", ""), processForm(d)) : updateTicketStatus_Full(d.editTicketId, "รอดำเนินการ", "Resubmit: " + d.correctionDetails, "", "", "", "", "", "", d.correctionDetails, d.authUser, 0, "", "", ""); }
function rawImgToThumbnail(u) { if (!u) return ""; var m = u.match(/[-\w]{25,}/); return m ? "https://drive.google.com/thumbnail?id=" + m[0] + "&sz=w500" : u; }
function formatDate(v) {
  if (v instanceof Date) {
    var dd = String(v.getDate()).padStart(2, '0');
    var mm = String(v.getMonth() + 1).padStart(2, '0');
    var yyyy = v.getFullYear();
    var hh = String(v.getHours()).padStart(2, '0');
    var min = String(v.getMinutes()).padStart(2, '0');
    return dd + '/' + mm + '/' + yyyy + ' ' + hh + ':' + min;
  }
  return v || "-";
}

function registerPMDevice(machineId, machineName, task, remark, dept, authUser, userName) { try { var permission = validateUserAction(authUser, 1); if (permission.allowed && permission.user.level !== 5) permission.allowed = false; 
    if (!permission.allowed) return { success: false, message: "❌ เฉพาะผู้บริหาร (Level 5) เท่านั้นที่สามารถลงทะเบียนเครื่องจักรได้" };

    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName('PM_Schedule');
    var data = sheet.getDataRange().getValues();
    
    // สร้างรหัส PM_Ticket_ID ใหม่
    var newId = "PM-REG-" + Math.floor(10000 + Math.random() * 90000);
    
    // ตรวจสอบความซ้ำซ้อน
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] && data[i][1].toString().trim() === machineId.trim() &&
          data[i][3] && data[i][3].toString().trim() === task.trim()) {
        return { success: false, message: "⚠️ มีการลงทะเบียนเครื่องจักรและงาน PM นี้ในระบบอยู่แล้ว" };
      }
    }
    
    // คอลัมน์ A ถึง M (13 คอลัมน์)
    var newRow = new Array(13).fill("");
    newRow[0] = newId;                 // A: PM_Ticket_ID
    newRow[1] = machineId.trim();      // B: Machine_ID
    newRow[2] = machineName.trim();    // C: Machine_Name
    newRow[3] = task.trim();           // D: Task
    newRow[4] = "";                    // E: Freq (ยกเลิกฟิลด์นี้ ให้เป็นค่าว่าง)
    newRow[5] = "";                    // F: Plan_Date
    newRow[6] = "";                    // G: Plan_By
    newRow[7] = "";                    // H: Actual_Date
    newRow[8] = "";                    // I: Actual_By
    newRow[9] = "รอจัดแผน";             // J: Status
    newRow[10] = dept;                 // K: Department (แผนกที่ดูแล)
    newRow[11] = remark.trim();        // L: Notes (บันทึกเป็น Remark/หมายเหตุ แทน)
    newRow[12] = "";                   // M: Image_URL
    
    sheet.appendRow(newRow);
    
    logAction({ 
      name: permission.user.name, 
      dept: permission.user.department, 
      pos: permission.user.role, 
      action: "Register PM Device: " + machineId + " (" + dept + ")", 
      targetTicket: newId, 
      page: "Backend", 
      uid: permission.user.uid, 
      level: permission.user.level 
    });
    
    return { success: true, message: "ลงทะเบียนเครื่องจักร/ระบบ PM สำเร็จ!" };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

// ------------------------------------------
// 4. ฟังก์ชันส่งออกใบแจ้งซ่อมเป็น PDF ผ่าน Google Doc Template
// ------------------------------------------
function getPDFProgress(ticketId) {
  var cache = CacheService.getScriptCache();
  return cache.get(ticketId + "_pdf_progress") || "กำลังเริ่มจัดเตรียมข้อมูล... (5%)";
}

function generatePDF(ticketId, authUser) {
  var cache = CacheService.getScriptCache();
  try {
    cache.put(ticketId + "_pdf_progress", "กำลังตรวจสอบสิทธิ์การเข้าถึง (10%)...", 60);
    var permission = validateUserAction(authUser, 1); // ผู้ใช้ทุกคนที่ล็อกอินสามารถสั่งพิมพ์ได้
    if (!permission.allowed) {
      cache.put(ticketId + "_pdf_progress", "❌ สิทธิ์การเข้าถึงไม่ถูกต้อง", 60);
      return { success: false, message: "❌ สิทธิ์การเข้าถึงไม่ถูกต้อง" };
    }

    // 1. ตรวจสอบความถูกต้องและสิทธิ์การเข้าถึง TEMPLATE_DOC_ID และ DRIVE_FOLDER_ID ล่วงหน้า
    if (!TEMPLATE_DOC_ID || TEMPLATE_DOC_ID === 'YOUR_GOOGLE_DOC_TEMPLATE_ID' || TEMPLATE_DOC_ID.trim() === '') {
      cache.put(ticketId + "_pdf_progress", "❌ ยังไม่ได้กำหนดต้นแบบเอกสาร", 60);
      return { success: false, message: "❌ ยังไม่ได้กำหนดรหัสไฟล์ TEMPLATE_DOC_ID ใน รหัส.gs (บรรทัดที่ 14)" };
    }

    var templateFile = null;
    try {
      templateFile = DriveApp.getFileById(TEMPLATE_DOC_ID);
    } catch (e) {
      cache.put(ticketId + "_pdf_progress", "❌ ไม่สามารถเข้าถึงไฟล์ต้นแบบได้", 60);
      return { 
        success: false, 
        message: "❌ ไม่สามารถเข้าถึง Google Doc ต้นแบบได้ กรุณาตรวจสอบว่า TEMPLATE_DOC_ID ถูกต้อง และแชร์ไฟล์ให้ผู้ใช้ระบบสามารถเข้าถึงได้ (รายละเอียด: " + e.toString() + ")" 
      };
    }

    var folder = null;
    try {
      folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    } catch (e) {
      cache.put(ticketId + "_pdf_progress", "❌ ไม่สามารถเข้าถึงโฟลเดอร์เก็บไฟล์ได้", 60);
      return { 
        success: false, 
        message: "❌ ไม่สามารถเข้าถึงโฟลเดอร์เก็บไฟล์แจ้งซ่อมได้ กรุณาตรวจสอบว่า DRIVE_FOLDER_ID ใน รหัส.gs ถูกต้อง (รายละเอียด: " + e.toString() + ")" 
      };
    }

    // 2. ค้นหาข้อมูลใบงานจากฐานข้อมูล
    cache.put(ticketId + "_pdf_progress", "กำลังค้นหาข้อมูลใบงานจากฐานข้อมูล (20%)...", 60);
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName('Repair_Master');
    var data = sheet.getDataRange().getValues();
    
    var ticket = null;
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] && data[i][1].toString().trim() === ticketId.toString().trim()) {
        var rawImageUrl = data[i][6] ? data[i][6].toString() : ""; 
        var rawCompUrl = data[i][25] ? data[i][25].toString() : ""; 
        
        ticket = {
          ticket: data[i][1] ? data[i][1].toString() : "", 
          status: data[i][2] ? data[i][2].toString() : "", 
          target: data[i][3] && data[i][3].toString() !== "-" ? data[i][3].toString() : (data[i][4] ? data[i][4].toString() : "-"),
          problem: data[i][5] ? data[i][5].toString() : "", 
          date: formatDate(data[i][8]), 
          progress: Number(data[i][7]) || 0,
          reqName: data[i][10] ? data[i][10].toString() : "", 
          reqPosition: data[i][11] ? data[i][11].toString() : "", 
          imageUrl: rawImageUrl, 
          completionImageUrl: rawCompUrl,
          note: data[i][13] ? data[i][13].toString() : "", 
          handoverNote: data[i][34] ? data[i][34].toString() : "",
          qcNote: data[i][35] ? data[i][35].toString() : "",
          expectedDate: data[i][14] ? data[i][14].toString() : "", 
          assignDept: data[i][15] ? data[i][15].toString() : "", 
          receivedDate: formatDate(data[i][16]),
          repairMethod: data[i][17] ? data[i][17].toString() : "", 
          repairDetails: data[i][18] ? data[i][18].toString() : "", 
          approvalStatus: data[i][19] ? data[i][19].toString() : "",
          refTicketId: data[i][20] ? data[i][20].toString() : "", 
          correctionDetails: data[i][21] ? data[i][21].toString() : "", 
          cause: data[i][22] ? data[i][22].toString() : "", 
          receiver: data[i][23] ? data[i][23].toString() : "", 
          verifier: data[i][24] ? data[i][24].toString() : "",
          verifyTimestamp: formatDate(data[i][9]),  // ✅ Column J: Verify_Timestamp (แก้จาก approvalTimestamp)
          submitHandoverTimestamp: data[i][32] ? formatDate(data[i][32]) : "", 
          handoverName: data[i][33] ? data[i][33].toString() : "", 
          approverName: data[i][27] ? data[i][27].toString() : "", 
          approverPosition: data[i][28] ? data[i][28].toString() : "", 
          approvalTimestamp: formatDate(data[i][29]),  // Column AD: Approve_Timestamp
          approvalNote: data[i][30] ? data[i][30].toString() : ""
        };
        break;
      }
    }

    if (!ticket) {
      cache.put(ticketId + "_pdf_progress", "❌ ไม่พบรหัสใบงาน", 60);
      return { success: false, message: "❌ ไม่พบรหัสใบแจ้งซ่อม: " + ticketId };
    }

    // 3. ทำการคัดลอกไฟล์ต้นแบบ (Template) ไปไว้ในโฟลเดอร์ชั่วคราว
    cache.put(ticketId + "_pdf_progress", "กำลังคัดลอกเอกสารต้นแบบ Google Doc (35%)...", 60);
    var tempFile = templateFile.makeCopy("TEMP_DOC_" + ticket.ticket, folder);
    
    // เปิดไฟล์ Google Doc ชั่วคราวเพื่อเขียนค่าลงตัวแปร
    cache.put(ticketId + "_pdf_progress", "กำลังเปิดไฟล์และแทนที่ข้อความตัวแปร (50%)...", 60);
    var doc = DocumentApp.openById(tempFile.getId());
    var body = doc.getBody();
    
    // แทนที่ข้อความตัวแปรทั้งหมด
    body.replaceText("{{ticketId}}", ticket.ticket);
    body.replaceText("{{deptId}}", ticket.ticket.split(' ')[0] || "-");
    body.replaceText("{{reqDate}}", ticket.date);
    body.replaceText("{{reqName}}", ticket.reqName);
    body.replaceText("{{reqPosition}}", ticket.reqPosition);
    body.replaceText("{{reqDept}}", ticket.ticket.split(' ')[0] || "-");
    body.replaceText("{{target}}", ticket.target);
    body.replaceText("{{problem}}", ticket.problem);
    
    body.replaceText("{{approverName}}", ticket.approverName || "-");
    body.replaceText("{{approvalTimestamp}}", ticket.approvalTimestamp || "-");
    body.replaceText("{{assignDept}}", ticket.assignDept || "-");
    body.replaceText("{{expectedDate}}", ticket.expectedDate || "-");
    body.replaceText("{{approvalNote}}", ticket.approvalNote || "-");
    
    body.replaceText("{{receiver}}", ticket.receiver || "-");
    body.replaceText("{{receiverPosition}}", getUserPosition(ticket.receiver));
    body.replaceText("{{receivedDate}}", ticket.receivedDate || "-");
    body.replaceText("{{submitHandoverTimestamp}}", ticket.submitHandoverTimestamp || "-");
    body.replaceText("{{cause}}", ticket.cause || "-");
    body.replaceText("{{repairMethod}}", ticket.repairMethod || "-");
    body.replaceText("{{repairDetails}}", ticket.repairDetails || "-");
    
    body.replaceText("{{handoverName}}", ticket.handoverName || "-");
    body.replaceText("{{handoverPosition}}", getUserPosition(ticket.handoverName));
    body.replaceText("{{handoverDate}}", ticket.submitHandoverTimestamp || "-"); 
    body.replaceText("{{verifier}}", ticket.verifier || "-");
    body.replaceText("{{verifierPosition}}", getUserPosition(ticket.verifier));
    body.replaceText("{{verifyDate}}", ticket.verifyTimestamp || "-");  // ✅ ใช้ verifyTimestamp (Column J) แทน approvalTimestamp
    
    body.replaceText("{{note}}", ticket.note || "-");
    
    // ตัดเอาคำนำหน้าที่ระบบบันทึกอัตโนมัติออกเพื่อแสดงเฉพาะข้อความที่ผู้ใช้พิมพ์ใน PDF
    var cleanHandoverNote = (ticket.handoverNote || "-").replace("Supervisor Handover (รับมอบ): ", "").replace("Supervisor Handover (รับมอบแบบกลุ่ม)", "รับมอบงานแบบกลุ่ม");
    var cleanQcNote = (ticket.qcNote || "-").replace("QC Review: ผ่าน - ", "").replace("QC Review: ผ่าน (ทวนสอบแบบกลุ่ม)", "ผ่านการทวนสอบแบบกลุ่ม");
    body.replaceText("{{handoverNote}}", cleanHandoverNote);
    body.replaceText("{{verifyNote}}", cleanQcNote);
    
    // ตรวจสอบข้อมูลการตีกลับงาน (Rejection / Correction)
    var rejectorName = "-";
    var rejectNote = "-";
    if (ticket.correctionDetails) {
      var rejectMatch = ticket.correctionDetails.match(/ตีกลับจาก:\s*(.*?)\s*เหตุผล:\s*(.*)/);
      if (rejectMatch) {
        rejectorName = rejectMatch[1];
        rejectNote = rejectMatch[2];
      } else {
        rejectNote = ticket.correctionDetails;
      }
    }
    body.replaceText("{{refTicketId}}", ticket.refTicketId || "-");
    body.replaceText("{{rejectorName}}", rejectorName);
    body.replaceText("{{rejectNote}}", rejectNote);
    body.replaceText("{{correctionDetails}}", ticket.correctionDetails || "-");

    // แทนที่รูปภาพ Before / After
    cache.put(ticketId + "_pdf_progress", "กำลังโหลดและประมวลผลรูปภาพ Before / After (70%)...", 60);
    replaceTextWithImage(body, "{{imageBefore}}", ticket.imageUrl);
    replaceTextWithImage(body, "{{imageAfter}}", ticket.completionImageUrl);

    // ดึงและแทนที่รูปภาพลายเซ็น (Signatures) จาก Master_Data
    cache.put(ticketId + "_pdf_progress", "กำลังดึงและแทรกรูปภาพลายเซ็นผู้ลงนาม (75%)...", 60);
    var sigReq = getUserSignature(ticket.reqName);
    var sigApprover = getUserSignature(ticket.approverName);
    var sigTech = getUserSignature(ticket.receiver);
    var sigSup = getUserSignature(ticket.handoverName);
    var sigQc = getUserSignature(ticket.verifier);
    
    replaceTextWithSignatureImage(body, "{{sigRequester}}", sigReq);
    replaceTextWithSignatureImage(body, "{{sigApprover}}", sigApprover);
    replaceTextWithSignatureImage(body, "{{sigTechnician}}", sigTech);
    replaceTextWithSignatureImage(body, "{{sigSupervisor}}", sigSup);
    replaceTextWithSignatureImage(body, "{{sigQC}}", sigQc);

    // บันทึกและปิดเอกสารชั่วคราว
    doc.saveAndClose();
    
    // แปลงไฟล์ Doc ชั่วคราวเป็น PDF
    cache.put(ticketId + "_pdf_progress", "กำลังแปลงหน้าเอกสาร Doc เป็นไฟล์ PDF (85%)...", 60);
    var pdfBlob = tempFile.getAs('application/pdf');
    pdfBlob.setName("ใบงานแจ้งซ่อม_" + ticket.ticket + ".pdf");
    
    // สร้างไฟล์ PDF และตั้งค่าให้ทุกคนที่มีลิงก์เข้าชมได้
    var pdfFile = folder.createFile(pdfBlob);
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // ลบไฟล์ Doc ชั่วคราวทิ้ง เพื่อไม่ให้รกไดรฟ์
    cache.put(ticketId + "_pdf_progress", "กำลังจัดระเบียบและลบเอกสารชั่วคราว (95%)...", 60);
    tempFile.setTrashed(true);
    
    cache.put(ticketId + "_pdf_progress", "เสร็จสมบูรณ์ (100%)", 60);
    return { success: true, pdfUrl: pdfFile.getUrl(), message: "สร้างไฟล์ PDF เสร็จสิ้น!" };
  } catch (e) {
    cache.put(ticketId + "_pdf_progress", "❌ เกิดข้อผิดพลาด: " + e.toString(), 60);
    return { success: false, message: "เกิดข้อผิดพลาดในการสร้าง PDF: " + e.toString() };
  }
}

// ฟังก์ชันแทนที่ Placeholder ด้วยรูปภาพแบบสัดส่วนคงที่ (รองรับระบบป้องกันข้อผิดพลาดกรณีดึงผ่าน DriveApp ล้มเหลว)
function replaceTextWithImage(body, placeholder, imageUrl) {
  if (!imageUrl || imageUrl === "-") {
    body.replaceText(placeholder, "(ไม่มีรูปภาพแนบ)");
    return;
  }
  
  // ป้องกันการตรวจจับผิดพลาด: หา File ID เฉพาะในกรณีที่เป็นลิงก์ Google Drive เท่านั้น
  var fileId = (imageUrl.indexOf("drive.google.com") !== -1) ? getDriveFileId(imageUrl) : null;
  var imageBlob = null;
  
  try {
    if (fileId) {
      try {
        imageBlob = DriveApp.getFileById(fileId).getBlob();
      } catch (driveErr) {
        // กรณีดึงผ่านสิทธิ์ DriveApp ตรงๆ ล้มเหลว ให้แปลงเป็น Public Link และใช้ UrlFetchApp ดึงข้อมูล
        var downloadUrl = "https://docs.google.com/uc?export=download&id=" + fileId;
        imageBlob = UrlFetchApp.fetch(downloadUrl).getBlob();
      }
    } else {
      imageBlob = UrlFetchApp.fetch(imageUrl).getBlob();
    }
    
    var position = body.findText(placeholder);
    if (position) {
      var element = position.getElement();
      var text = element.asText();
      var offset = position.getStartOffset();
      
      var parent = element.getParent();
      var index = parent.getChildIndex(element);
      
      // แทรกรูปภาพและปรับขนาดให้กว้าง 230px (สูงปรับสัดส่วนตาม)
      var image = parent.insertInlineImage(index + 1, imageBlob);
      var width = image.getWidth();
      var height = image.getHeight();
      var newWidth = 230;
      var newHeight = (height / width) * newWidth;
      image.setWidth(newWidth);
      image.setHeight(newHeight);
      
      // ลบข้อความตัวแปร placeholder ทิ้ง
      text.deleteText(offset, offset + placeholder.length - 1);
    }
  } catch (e) {
    body.replaceText(placeholder, "(ไม่สามารถโหลดรูปภาพได้: " + e.toString() + ")");
  }
}

// ฟังก์ชันดึง File ID จาก URL ของ Google Drive
function getDriveFileId(url) {
  var match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

// ฟังก์ชันดึงลิงก์รูปภาพลายเซ็นของพนักงานจาก Master_Data (คอลัมน์ J)
function getUserSignature(name) {
  if (!name || name === "-" || name.trim() === "") return null;
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName('Master_Data');
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][2] && data[i][2].toString().trim() === name.trim()) {
        var sigUrl = data[i][9] ? data[i][9].toString().trim() : ""; // คอลัมน์ J (ดัชนี 9)
        return sigUrl !== "" ? sigUrl : null;
      }
    }
  } catch (e) {
    Logger.log("Error fetching signature for " + name + ": " + e.toString());
  }
  return null;
}

// ฟังก์ชันดึงตำแหน่งของพนักงานจาก Master_Data (คอลัมน์ E - ตำแหน่ง)
function getUserPosition(name) {
  if (!name || name === "-" || name.trim() === "") return "-";
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName('Master_Data');
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][2] && data[i][2].toString().trim() === name.trim()) {
        return data[i][4] ? data[i][4].toString().trim() : "-"; // คอลัมน์ E (ดัชนี 4)
      }
    }
  } catch (e) {
    Logger.log("Error fetching position for " + name + ": " + e.toString());
  }
  return "-";
}

// ฟังก์ชันแทรกลายเซ็นลงใน Google Doc แบบรักษาสัดส่วนภาพ (สูง 32px) (รองรับระบบป้องกันข้อผิดพลาดกรณีดึงผ่าน DriveApp ล้มเหลว)
function replaceTextWithSignatureImage(body, placeholder, imageUrl) {
  if (!imageUrl || imageUrl === "-" || imageUrl.trim() === "") {
    body.replaceText(placeholder, ""); // ถ้าไม่มีลายเซ็น ให้เคลียร์ข้อความ placeholder ออกเป็นช่องว่าง
    return;
  }
  
  var fileId = (imageUrl.indexOf("drive.google.com") !== -1) ? getDriveFileId(imageUrl) : null;
  var imageBlob = null;
  
  try {
    if (fileId) {
      try {
        imageBlob = DriveApp.getFileById(fileId).getBlob();
      } catch (driveErr) {
        var downloadUrl = "https://docs.google.com/uc?export=download&id=" + fileId;
        imageBlob = UrlFetchApp.fetch(downloadUrl).getBlob();
      }
    } else {
      imageBlob = UrlFetchApp.fetch(imageUrl).getBlob();
    }
    
    var position = body.findText(placeholder);
    if (position) {
      var element = position.getElement();
      var text = element.asText();
      var offset = position.getStartOffset();
      
      var parent = element.getParent();
      var index = parent.getChildIndex(element);
      
      // แทรกลายเซ็นและปรับความสูงเป็น 32px เพื่อไม่ให้ตารางขยายเกินจำเป็น
      var image = parent.insertInlineImage(index + 1, imageBlob);
      var width = image.getWidth();
      var height = image.getHeight();
      var newHeight = 70;
      var newWidth = (width / height) * newHeight;
      image.setWidth(newWidth);
      image.setHeight(newHeight);
      
      // ลบข้อความ placeholder
      text.deleteText(offset, offset + placeholder.length - 1);
    }
  } catch (e) {
    body.replaceText(placeholder, ""); // หากเกิดข้อผิดพลาด ให้เคลียร์ตัวแปรออกเป็นช่องว่าง
  }
}

// ------------------------------------------
// 5. ฟังก์ชันการทำงานแบบกลุ่ม (Bulk Processing)
// ------------------------------------------
function bulkHandoverTickets(ticketIds, authUser, userName) {
  try {
    var permission = validateUserAction(authUser, 2); // หัวหน้าแผนก (Level 2 ขึ้นไป)
    if (!permission.allowed) return { success: false, message: permission.message };

    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName('Repair_Master');
    var data = sheet.getDataRange().getValues();
    var now = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
    var count = 0;
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] && ticketIds.indexOf(data[i][1].toString().trim()) !== -1) {
        sheet.getRange(i + 1, 3).setValue("รอการทวนสอบ (QC)"); // Status
        sheet.getRange(i + 1, 8).setValue(90); // Progress
        sheet.getRange(i + 1, 35).setValue("Supervisor Handover (รับมอบแบบกลุ่ม)"); // Column AI (35): Handover_Note
        sheet.getRange(i + 1, 27).setValue(now); // Handover_Timestamp [AA]
        sheet.getRange(i + 1, 34).setValue(userName); // Handover_Name [AH]
        count++;
      }
    }
    
    logAction({ 
      name: permission.user.name, 
      dept: permission.user.department, 
      pos: permission.user.role, 
      action: "Bulk Handover (" + count + " tickets)", 
      targetTicket: "Multiple", 
      page: "Backend", 
      uid: permission.user.uid, 
      level: permission.user.level 
    });
    
    return { success: true, message: "รับมอบงานแบบกลุ่มสำเร็จ " + count + " รายการ!" };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function bulkVerifyTickets(ticketIds, authUser, userName) {
  try {
    var permission = validateUserAction(authUser, 4); // QC (Level 4 ขึ้นไป)
    if (!permission.allowed) return { success: false, message: permission.message };

    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName('Repair_Master');
    var data = sheet.getDataRange().getValues();
    var now = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
    var count = 0;
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] && ticketIds.indexOf(data[i][1].toString().trim()) !== -1) {
        sheet.getRange(i + 1, 3).setValue("ซ่อมเสร็จสมบูรณ์ (Completed)"); // Status
        sheet.getRange(i + 1, 8).setValue(100); // Progress
        sheet.getRange(i + 1, 36).setValue("QC Review: ผ่าน (ทวนสอบแบบกลุ่ม)"); // Column AJ (36): QC_Note
        sheet.getRange(i + 1, 25).setValue(userName); // Verifier [Y]
        sheet.getRange(i + 1, 10).setValue(now); // Verify_Timestamp [J]
        count++;
      }
    }
    
    logAction({ 
      name: permission.user.name, 
      dept: permission.user.department, 
      pos: permission.user.role, 
      action: "Bulk Verify (" + count + " tickets)", 
      targetTicket: "Multiple", 
      page: "Backend", 
      uid: permission.user.uid, 
      level: permission.user.level 
    });
    
    return { success: true, message: "ทวนสอบปิดงานแบบกลุ่มสำเร็จ " + count + " รายการ!" };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

// ------------------------------------------
// 6. ฟังก์ชันแจ้งเตือนงานรอรับมอบรายสัปดาห์ (รันผ่าน Trigger ทุกวันเสาร์)
// ------------------------------------------
function notifyPendingHandoverEverySaturday() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  
  // 1. ดึงข้อมูลใบแจ้งซ่อม
  var repairSheet = ss.getSheetByName('Repair_Master');
  var repairData = repairSheet.getDataRange().getValues();
  
  // จัดกลุ่มจำนวนใบงาน "รอรับมอบงาน" ตามแผนกเจ้าของงาน/ผู้แจ้งซ่อม (Dept_Group)
  var pendingByDept = {};
  for (var i = 1; i < repairData.length; i++) {
    var status = repairData[i][2] ? repairData[i][2].toString().trim() : "";
    var dept = repairData[i][31] ? repairData[i][31].toString().trim() : ""; // คอลัมน์ AF (Dept_Group)
    
    if (status === "รอรับมอบงาน" && dept !== "") {
      if (!pendingByDept[dept]) pendingByDept[dept] = 0;
      pendingByDept[dept]++;
    }
  }
  
  // หากไม่มีงานรอรับมอบในระบบเลย ก็หยุดการทำงาน
  if (Object.keys(pendingByDept).length === 0) return;
  
  // 2. ดึงรายชื่อผู้ใช้งานจาก Master_Data
  var masterSheet = ss.getSheetByName('Master_Data');
  var masterData = masterSheet.getDataRange().getValues();
  
  // Token สำหรับส่งแจ้งเตือน (ดึงจาก TOKENS[2])
  var notifyToken = TOKENS[2];
  
  // ✅ ใช้ FRONTEND_URL หรือ WEB_APP_URL สำหรับสร้างลิงก์แจ้งเตือน
  var targetExternalUrl = (typeof FRONTEND_URL !== 'undefined' && FRONTEND_URL && FRONTEND_URL.trim() !== '')
    ? FRONTEND_URL.trim().replace(/\/+$/, '') + "/Handover.html?openExternalBrowser=1"
    : WEB_APP_URL + "?page=handover&openExternalBrowser=1";
  
  // 3. วนลูปส่งข้อความแจ้งเตือนตาม UID เฉพาะผู้ที่อยู่ในแผนกที่มีงานค้าง
  for (var j = 1; j < masterData.length; j++) {
    var uid = masterData[j][0] ? masterData[j][0].toString().trim() : "";
    var name = masterData[j][2] ? masterData[j][2].toString().trim() : "";
    var userDept = masterData[j][3] ? masterData[j][3].toString().trim() : "";
    
    // ตรวจสอบว่าผู้ใช้นี้มี UID เชื่อมต่อ LINE ไว้ และแผนกของเขามีงานรอรับมอบหรือไม่
    if (uid !== "" && userDept !== "" && pendingByDept[userDept] && pendingByDept[userDept] > 0) {
      
      var pendingCount = pendingByDept[userDept];
      
      var flex = {
        "type": "bubble",
        "header": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "text",
              "text": "📌 แจ้งเตือนงานรอรับมอบ",
              "weight": "bold",
              "color": "#ffffff",
              "size": "lg"
            }
          ],
          "backgroundColor": "#FF9800"
        },
        "body": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "text",
              "text": "เรียนคุณ " + name,
              "weight": "bold",
              "size": "md",
              "wrap": true
            },
            {
              "type": "text",
              "text": "ขณะนี้แผนก " + userDept + " ของท่าน มีใบแจ้งซ่อมที่อยู่ในสถานะรอรับมอบงานจำนวน " + pendingCount + " งาน",
              "wrap": true,
              "size": "sm",
              "margin": "md"
            },
            {
              "type": "text",
              "text": "กรุณาเข้าสู่ระบบเพื่อตรวจสอบและดำเนินการรับมอบงานครับ",
              "wrap": true,
              "size": "sm",
              "color": "#666666",
              "margin": "md"
            }
          ]
        },
        "footer": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "button",
              "action": {
                "type": "uri",
                "label": "เข้าสู่ระบบ",
                "uri": targetExternalUrl
              },
              "style": "primary",
              "color": "#FF9800"
            }
          ]
        }
      };
      
      // ยิง Push Message ผ่าน LINE Messaging API
      try {
        UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
          'method': 'post',
          'headers': {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + notifyToken
          },
          'payload': JSON.stringify({
            'to': uid,
            'messages': [{ 'type': 'flex', 'altText': 'แจ้งเตือนงานรอรับมอบ ' + pendingCount + ' งาน (แผนก ' + userDept + ')', 'contents': flex }]
          })
        });
      } catch(e) {
        Logger.log("LINE Push Error for UID " + uid + ": " + e.toString());
      }
    }
  }
}


// ================= ROLE PERMISSIONS MANAGEMENT (Level 5 Only) ================= //

function getRolePermissions() {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName('Role_Permissions');
    
    // ถ้ายังไม่มี Sheet Role_Permissions ให้สร้างใหม่พร้อมใส่ค่าตั้งต้น
    if (!sheet) {
      sheet = ss.insertSheet('Role_Permissions');
      var headers = ['Level', 'Level_Name', 'index', 'monitor', 'inventory', 'pm', 'maintenance', 'engine_room', 'dashboard', 'handover', 'verify', 'approve', 'signatures', 'role_config'];
      sheet.appendRow(headers);
      
      var defaultRows = [
        [1, "Staff", true, true, true, false, false, false, false, false, false, false, false, false],
        [2, "Supervisor", true, true, false, false, false, false, false, true, false, false, false, false],
        [3, "Engineer", true, true, false, true, false, false, true, false, false, false, false, false],
        [4, "QC", true, true, false, true, false, false, false, false, true, false, false, false],
        [5, "Admin/Management", true, true, true, true, true, true, true, true, true, true, true, true],
        [6, "Stock Only", true, true, true, false, false, false, false, false, false, false, false, false],
        [7, "ช่างซ่อมบำรุง", true, true, true, true, true, false, false, false, false, false, false, false],
        [8, "ช่างห้องเครื่อง", true, true, true, true, false, true, false, false, false, false, false, false]
      ];
      
      for (var r = 0; r < defaultRows.length; r++) {
        sheet.appendRow(defaultRows[r]);
      }
    }
    
    var data = sheet.getDataRange().getValues();
    var permissions = {};
    
    for (var i = 1; i < data.length; i++) {
      var lvl = parseInt(data[i][0]);
      if (lvl) {
        permissions[lvl] = {
          index: data[i][2] === true || data[i][2] === "TRUE" || data[i][2] === 1,
          monitor: data[i][3] === true || data[i][3] === "TRUE" || data[i][3] === 1,
          inventory: data[i][4] === true || data[i][4] === "TRUE" || data[i][4] === 1,
          pm: data[i][5] === true || data[i][5] === "TRUE" || data[i][5] === 1,
          maintenance: data[i][6] === true || data[i][6] === "TRUE" || data[i][6] === 1,
          engine_room: data[i][7] === true || data[i][7] === "TRUE" || data[i][7] === 1,
          dashboard: data[i][8] === true || data[i][8] === "TRUE" || data[i][8] === 1,
          handover: data[i][9] === true || data[i][9] === "TRUE" || data[i][9] === 1,
          verify: data[i][10] === true || data[i][10] === "TRUE" || data[i][10] === 1,
          approve: data[i][11] === true || data[i][11] === "TRUE" || data[i][11] === 1,
          signatures: data[i][12] === true || data[i][12] === "TRUE" || data[i][12] === 1,
          role_config: data[i][13] === true || data[i][13] === "TRUE" || data[i][13] === 1
        };
      }
    }
    
    return { success: true, permissions: permissions };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function saveRolePermissions(permissionsObj, authUser) {
  try {
    var permission = validateUserAction(authUser, 1);
    if (!permission.allowed || permission.user.level !== 5) {
      return { success: false, message: "เฉพาะผู้จัดการและผู้บริหาร (Level 5) เท่านั้นที่สามารถบันทึกตั้งค่าสิทธิ์ได้" };
    }
    
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName('Role_Permissions');
    
    if (!sheet) {
      getRolePermissions(); // insert sheet
      sheet = ss.getSheetByName('Role_Permissions');
    }
    
    var data = sheet.getDataRange().getValues();
    var keys = ['index', 'monitor', 'inventory', 'pm', 'maintenance', 'engine_room', 'dashboard', 'handover', 'verify', 'approve', 'signatures', 'role_config'];
    
    for (var i = 1; i < data.length; i++) {
      var lvl = parseInt(data[i][0]);
      if (lvl && permissionsObj[lvl]) {
        var p = permissionsObj[lvl];
        for (var k = 0; k < keys.length; k++) {
          sheet.getRange(i + 1, k + 3).setValue(p[keys[k]] === true);
        }
      }
    }
    
    return { success: true, message: "บันทึกการตั้งค่าสิทธิ์เรียบร้อยแล้ว!" };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}
