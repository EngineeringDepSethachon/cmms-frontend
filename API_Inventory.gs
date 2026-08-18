/**
 * ---------------------------------------------------------------------------
 * ระบบจัดการคลังอะไหล่ (Stock Inventory System)
 * ---------------------------------------------------------------------------
 */

// กำหนดชื่อชีตที่ใช้งาน
const INVENTORY_SHEET = "Inventory";
const INVENTORY_LOGS_SHEET = "Inventory_Logs";

/**
 * ฟังก์ชันสร้างรหัสอะไหล่อัตโนมัติตามหมวดหมู่ พร้อมรันหมายเลข
 * ตัวอย่าง: เครื่องกล -> MEC-0001, ไฟฟ้า -> ELE-0001
 */
function generateNextItemCode(category) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(INVENTORY_SHEET);
    if (!sheet) return "OTH-0001";

    const catClean = (category || "").toString().trim().toLowerCase();
    let prefix = "OTH"; // ค่าเริ่มต้น (อื่นๆ)

    if (catClean.includes("น้ำ") || catClean.includes("water") || catClean.includes("wtr") || catClean.includes("ประปา")) {
      prefix = "WTR"; // ระบบน้ำ
    } else if (catClean.includes("ไฟ") || catClean.includes("elec") || catClean.includes("ele")) {
      prefix = "ELE"; // ระบบไฟ
    } else if (catClean.includes("เครื่องจักร") || catClean.includes("machine") || catClean.includes("mac") || catClean.includes("mech")) {
      prefix = "MAC"; // เครื่องจักร
    } else if (catClean.includes("สิ้นเปลือง") || catClean.includes("consum") || catClean.includes("con")) {
      prefix = "CON"; // อะไหล่สิ้นเปลือง
    } else {
      prefix = "OTH"; // อื่นๆ
    }

    const data = sheet.getDataRange().getValues();
    let maxNum = 0;
    const regex = new RegExp("^" + prefix + "-(\\d+)", "i");

    for (let i = 1; i < data.length; i++) {
      const code = data[i][0] ? data[i][0].toString().trim() : "";
      const match = code.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }

    const nextNum = maxNum + 1;
    const formattedNum = String(nextNum).padStart(4, '0'); // รูปแบบ 4 หลัก เช่น 0001
    return prefix + "-" + formattedNum;

  } catch (err) {
    Logger.log("Error generating item code: " + err.toString());
    return "OTH-" + Math.floor(1000 + Math.random() * 9000);
  }
}

/**
 * ดึงรายการอะไหล่ทั้งหมดในคลัง
 */
function getInventoryItems() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(INVENTORY_SHEET);
    if (!sheet) return { success: false, message: "ไม่พบชีต Inventory" };

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] }; // ไม่มีข้อมูล

    const items = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0] && !row[1]) continue; // ข้ามแถวที่ว่างทั้งรหัสและชื่อ
      
      items.push({
        id: row[0] ? row[0].toString() : "",             // รหัสอะไหล่ (ใช้ภายในระบบ)
        name: row[1] ? row[1].toString() : "-",           // ชื่ออะไหล่
        category: row[2] ? row[2].toString() : "-",       // หมวดหมู่
        qty: parseInt(row[3]) || 0,                       // จำนวนคงเหลือ
        unit: row[4] ? row[4].toString() : "",            // หน่วยนับ
        reorderPoint: parseInt(row[5]) || 0,              // จุดสั่งซื้อต่ำสุด
        location: row[6] ? row[6].toString() : "-",       // สถานที่จัดเก็บ
        lastUpdated: row[7] ? Utilities.formatDate(new Date(row[7]), "Asia/Bangkok", "dd/MM/yyyy HH:mm:ss") : "" // อัปเดตล่าสุด
      });
    }
    
    return { success: true, data: items };
  } catch (error) {
    return { success: false, message: "Error: " + error.toString() };
  }
}

/**
 * บันทึกการทำรายการ รับเข้า (IN) หรือ เบิกออก (OUT)
 */
function processInventoryAction(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // ป้องกันการตัดสต๊อกชนกัน
  
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const invSheet = ss.getSheetByName(INVENTORY_SHEET);
    const logSheet = ss.getSheetByName(INVENTORY_LOGS_SHEET);
    
    if (!invSheet || !logSheet) return { success: false, message: "ไม่พบชีต Inventory หรือ Inventory_Logs" };

    const action = payload.action; // "IN" หรือ "OUT"
    const itemId = payload.itemId;
    const itemName = payload.itemName;
    let qty = parseInt(payload.qty);
    const user = payload.user || "-";
    const refId = payload.refId || "-"; // ใบงานอ้างอิง
    const remarks = payload.remarks || "";

    if (!qty || qty <= 0) return { success: false, message: "จำนวนต้องมากกว่า 0" };

    // ค้นหาแถวของอะไหล่
    const data = invSheet.getDataRange().getValues();
    let rowIndex = -1;
    let currentQty = 0;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim() === itemId.toString().trim()) {
        rowIndex = i + 1;
        currentQty = parseInt(data[i][3]) || 0;
        break;
      }
    }

    if (rowIndex === -1) return { success: false, message: "ไม่พบรายการอะไหล่นี้ในฐานข้อมูล" };

    // ตรวจสอบกรณีเบิกออก
    if (action === "OUT") {
      if (currentQty < qty) {
        return { success: false, message: "จำนวนสต๊อกคงเหลือไม่เพียงพอ (คงเหลือ " + currentQty + ")" };
      }
      qty = -qty; // ปรับเป็นค่าลบสำหรับการคำนวณ
    }

    // คำนวณยอดคงเหลือใหม่
    const newQty = currentQty + qty;
    const timestamp = new Date();
    
    invSheet.getRange(rowIndex, 4).setValue(newQty); // อัปเดต Column D (คงเหลือ)
    invSheet.getRange(rowIndex, 8).setValue(timestamp); // อัปเดต Column H (อัปเดตล่าสุด)

    // บันทึกประวัติ (Log) ลงชีต Inventory_Logs
    // Columns: [Timestamp, ItemId, ItemName, Action, Qty, User, RefId, Remarks, BalanceAfter]
    logSheet.appendRow([
      Utilities.formatDate(timestamp, "Asia/Bangkok", "dd/MM/yyyy HH:mm:ss"),
      itemId,
      itemName,
      action,
      Math.abs(qty),
      user,
      refId,
      remarks,
      newQty
    ]);

    return { 
      success: true, 
      message: "ทำรายการสำเร็จ! ยอดคงเหลือล่าสุด: " + newQty,
      newQty: newQty
    };
  } catch (error) {
    return { success: false, message: "Error: " + error.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * ดึงประวัติ Stock Card ของอะไหล่ที่ระบุ
 */
function getStockCard(itemId) {
  try {
    if (!itemId) return { success: false, message: "ไม่ได้รับรหัสอะไหล่" };

    const ss = SpreadsheetApp.openById(SHEET_ID);
    const invSheet = ss.getSheetByName(INVENTORY_SHEET);
    const logSheet = ss.getSheetByName(INVENTORY_LOGS_SHEET);

    if (!invSheet || !logSheet) return { success: false, message: "ไม่พบชีตฐานข้อมูล" };

    // 1. ดึงข้อมูลอะไหล่
    const invData = invSheet.getDataRange().getValues();
    let itemInfo = null;

    for (let i = 1; i < invData.length; i++) {
      if (invData[i][0] && invData[i][0].toString().trim() === itemId.toString().trim()) {
        itemInfo = {
          id: invData[i][0].toString(),
          name: invData[i][1] ? invData[i][1].toString() : "-",
          category: invData[i][2] ? invData[i][2].toString() : "-",
          currentQty: parseInt(invData[i][3]) || 0,
          unit: invData[i][4] ? invData[i][4].toString() : "",
          reorderPoint: parseInt(invData[i][5]) || 0,
          location: invData[i][6] ? invData[i][6].toString() : "-"
        };
        break;
      }
    }

    if (!itemInfo) return { success: false, message: "ไม่พบข้อมูลอะไหล่รหัส: " + itemId };

    // 2. ดึงประวัติจาก Inventory_Logs
    const logData = logSheet.getDataRange().getValues();
    const logs = [];

    for (let j = 1; j < logData.length; j++) {
      const row = logData[j];
      const logItemId = row[1] ? row[1].toString().trim() : "";

      if (logItemId === itemId.toString().trim()) {
        let dateStr = row[0] ? row[0].toString() : "-";
        if (row[0] instanceof Date) {
          dateStr = Utilities.formatDate(row[0], "Asia/Bangkok", "dd/MM/yyyy HH:mm:ss");
        }

        logs.push({
          timestamp: dateStr,
          action: row[3] ? row[3].toString() : "-",      // IN / OUT
          qty: parseInt(row[4]) || 0,                     // จำนวน
          user: row[5] ? row[5].toString() : "-",         // ผู้ทำรายการ
          refId: row[6] ? row[6].toString() : "-",        // ใบงานอ้างอิง
          remarks: row[7] ? row[7].toString() : "-",      // หมายเหตุ
          balance: row[8] !== undefined && row[8] !== "" ? row[8] : "-" // ยอดคงเหลือ ณ ขณะนั้น
        });
      }
    }

    // เรียงประวัติจากล่าสุดไปเก่าสุด
    logs.reverse();

    return {
      success: true,
      item: itemInfo,
      logs: logs
    };

  } catch (error) {
    return { success: false, message: "Error fetching stock card: " + error.toString() };
  }
}

/**
 * เพิ่มรายการอะไหล่ใหม่ หรือ แก้ไขรายการอะไหล่เดิม
 */
function saveInventoryItem(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(INVENTORY_SHEET);
    if (!sheet) return { success: false, message: "ไม่พบชีต Inventory" };

    const timestamp = new Date();
    const isNew = payload.isNew;
    let itemId = (payload.id || "").toString().trim();
    
    if (isNew) {
      // ถ้าไม่ได้ระบุรหัสมา หรือต้องการให้ระบบสร้างรหัสให้อัตโนมัติ
      if (!itemId || itemId === "") {
        itemId = generateNextItemCode(payload.category);
      } else {
        // ตรวจสอบรหัสซ้ำ
        const data = sheet.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] && data[i][0].toString().trim() === itemId) {
            // ถ้ารหัสซ้ำ ให้รันรหัสใหม่ให้อัตโนมัติ
            itemId = generateNextItemCode(payload.category);
            break;
          }
        }
      }
      
      // บันทึกรายการใหม่
      sheet.appendRow([
        itemId,
        payload.name,
        payload.category,
        payload.qty || 0,
        payload.unit,
        payload.reorderPoint || 0,
        payload.location,
        timestamp
      ]);
      return { 
        success: true, 
        message: "เพิ่มรายการอะไหล่เรียบร้อยแล้ว! (รหัสระบบ: " + itemId + ")",
        itemId: itemId
      };
      
    } else {
      // แก้ไขรายการเดิม
      const data = sheet.getDataRange().getValues();
      let rowIndex = -1;
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] && data[i][0].toString().trim() === itemId) {
          rowIndex = i + 1;
          break;
        }
      }
      
      if (rowIndex === -1) return { success: false, message: "ไม่พบรายการอะไหล่ที่จะแก้ไข" };
      
      // อัปเดตข้อมูล (คงยอด Qty เดิมไว้ เพื่อให้กระทบผ่าน IN/OUT เท่านั้น)
      sheet.getRange(rowIndex, 2).setValue(payload.name);
      sheet.getRange(rowIndex, 3).setValue(payload.category);
      sheet.getRange(rowIndex, 5).setValue(payload.unit);
      sheet.getRange(rowIndex, 6).setValue(payload.reorderPoint);
      sheet.getRange(rowIndex, 7).setValue(payload.location);
      sheet.getRange(rowIndex, 8).setValue(timestamp);
      
      return { success: true, message: "บันทึกการแก้ไขเรียบร้อยแล้ว!" };
    }
    
  } catch (error) {
    return { success: false, message: "Error: " + error.toString() };
  } finally {
    lock.releaseLock();
  }
}
