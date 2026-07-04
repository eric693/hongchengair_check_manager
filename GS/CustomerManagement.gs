// CustomerManagement.gs - 客戶檔案核心功能

const SHEET_CUSTOMERS = '客戶檔案';

const CUSTOMER_STATUS = {
  ACTIVE:  '啟用',
  DELETED: '已刪除'
};

// ==================== 工作表初始化 ====================

/**
 *  取得或建立客戶檔案工作表
 */
function getCustomerSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_CUSTOMERS);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_CUSTOMERS);

    const headers = [
      '客戶ID',        // A (0)
      '客戶名稱',      // B (1)
      '聯絡人',        // C (2)
      '電話',          // D (3)
      'Email',         // E (4)
      '地址',          // F (5)
      '服務項目',      // G (6)
      '合約起始日',    // H (7)
      '合約結束日',    // I (8)
      '服務地點',      // J (9)
      '備註',          // K (10)
      '狀態',          // L (11)
      '建立時間',      // M (12)
      '建立人',        // N (13)
      '最後更新時間',  // O (14)
      '最後更新人'     // P (15)
    ];

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#4285f4')
               .setFontColor('#ffffff')
               .setFontWeight('bold')
               .setHorizontalAlignment('center');

    sheet.setFrozenRows(1);

    Logger.log(' 客戶檔案工作表已建立');
  }

  return sheet;
}

// ==================== 新增客戶 ====================

/**
 *  新增客戶檔案
 */
function addCustomer(data, user) {
  try {
    Logger.log('═══════════════════════════════════════');
    Logger.log(' 開始新增客戶檔案');
    Logger.log('   客戶名稱: ' + data.customerName);
    Logger.log('═══════════════════════════════════════');

    if (!data.customerName || !String(data.customerName).trim()) {
      return { success: false, message: '缺少客戶名稱' };
    }

    const sheet = getCustomerSheet();
    const now = new Date();
    const customerId = 'CUST-' + Utilities.formatDate(now, 'Asia/Taipei', 'yyyyMMddHHmmss');

    const row = [
      customerId,
      String(data.customerName).trim(),
      data.contactPerson || '',
      data.phone || '',
      data.email || '',
      data.address || '',
      data.serviceItems || '',
      data.contractStart || '',
      data.contractEnd || '',
      data.serviceLocation || '',
      data.note || '',
      CUSTOMER_STATUS.ACTIVE,
      now,
      (user && user.name) || '',
      now,
      (user && user.name) || ''
    ];

    sheet.appendRow(row);

    Logger.log(' 客戶檔案新增成功: ' + customerId);

    return { success: true, customerId: customerId, message: '客戶檔案新增成功' };

  } catch (error) {
    Logger.log(' 新增客戶檔案失敗: ' + error);
    Logger.log(' 錯誤堆疊: ' + error.stack);
    return { success: false, message: error.toString() };
  }
}

// ==================== 更新客戶 ====================

/**
 *  更新客戶檔案
 */
function updateCustomer(customerId, data, user) {
  try {
    if (!customerId) {
      return { success: false, message: '缺少客戶ID' };
    }

    const sheet = getCustomerSheet();
    const values = sheet.getDataRange().getValues();

    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]).trim() === String(customerId).trim()) {
        const rowNumber = i + 1;

        if (data.customerName !== undefined) sheet.getRange(rowNumber, 2).setValue(data.customerName);
        if (data.contactPerson !== undefined) sheet.getRange(rowNumber, 3).setValue(data.contactPerson);
        if (data.phone !== undefined) sheet.getRange(rowNumber, 4).setValue(data.phone);
        if (data.email !== undefined) sheet.getRange(rowNumber, 5).setValue(data.email);
        if (data.address !== undefined) sheet.getRange(rowNumber, 6).setValue(data.address);
        if (data.serviceItems !== undefined) sheet.getRange(rowNumber, 7).setValue(data.serviceItems);
        if (data.contractStart !== undefined) sheet.getRange(rowNumber, 8).setValue(data.contractStart);
        if (data.contractEnd !== undefined) sheet.getRange(rowNumber, 9).setValue(data.contractEnd);
        if (data.serviceLocation !== undefined) sheet.getRange(rowNumber, 10).setValue(data.serviceLocation);
        if (data.note !== undefined) sheet.getRange(rowNumber, 11).setValue(data.note);

        sheet.getRange(rowNumber, 15).setValue(new Date());
        sheet.getRange(rowNumber, 16).setValue((user && user.name) || '');

        Logger.log(' 客戶檔案更新成功: ' + customerId);

        return { success: true, message: '客戶檔案更新成功' };
      }
    }

    return { success: false, message: '找不到該客戶檔案' };

  } catch (error) {
    Logger.log(' 更新客戶檔案失敗: ' + error);
    Logger.log(' 錯誤堆疊: ' + error.stack);
    return { success: false, message: error.toString() };
  }
}

// ==================== 刪除客戶（軟刪除）====================

/**
 *  刪除客戶檔案（軟刪除，保留歷史工作日誌關聯）
 */
function deleteCustomer(customerId, user) {
  try {
    if (!customerId) {
      return { success: false, message: '缺少客戶ID' };
    }

    const sheet = getCustomerSheet();
    const values = sheet.getDataRange().getValues();

    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]).trim() === String(customerId).trim()) {
        const rowNumber = i + 1;

        sheet.getRange(rowNumber, 12).setValue(CUSTOMER_STATUS.DELETED);
        sheet.getRange(rowNumber, 15).setValue(new Date());
        sheet.getRange(rowNumber, 16).setValue((user && user.name) || '');

        Logger.log(' 客戶檔案已刪除（軟刪除）: ' + customerId);

        return { success: true, message: '客戶檔案已刪除' };
      }
    }

    return { success: false, message: '找不到該客戶檔案' };

  } catch (error) {
    Logger.log(' 刪除客戶檔案失敗: ' + error);
    Logger.log(' 錯誤堆疊: ' + error.stack);
    return { success: false, message: error.toString() };
  }
}

// ==================== 查詢客戶 ====================

/**
 *  取得所有客戶檔案（預設排除已刪除）
 */
function getAllCustomers(includeDeleted) {
  try {
    const sheet = getCustomerSheet();
    const values = sheet.getDataRange().getValues();
    const customers = [];

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (!row[0]) continue;

      const status = row[11] || CUSTOMER_STATUS.ACTIVE;
      if (!includeDeleted && status === CUSTOMER_STATUS.DELETED) continue;

      customers.push({
        customerId: row[0],
        customerName: row[1],
        contactPerson: row[2],
        phone: row[3],
        email: row[4],
        address: row[5],
        serviceItems: row[6],
        contractStart: row[7] instanceof Date ? Utilities.formatDate(row[7], 'Asia/Taipei', 'yyyy-MM-dd') : row[7],
        contractEnd: row[8] instanceof Date ? Utilities.formatDate(row[8], 'Asia/Taipei', 'yyyy-MM-dd') : row[8],
        serviceLocation: row[9],
        note: row[10],
        status: status,
        createdAt: row[12],
        createdBy: row[13],
        updatedAt: row[14],
        updatedBy: row[15]
      });
    }

    customers.sort((a, b) => String(a.customerName).localeCompare(String(b.customerName), 'zh-Hant'));

    return { success: true, data: customers, count: customers.length };

  } catch (error) {
    Logger.log(' 取得客戶檔案清單失敗: ' + error);
    Logger.log(' 錯誤堆疊: ' + error.stack);
    return { success: false, message: error.toString(), data: [] };
  }
}

/**
 *  取得單一客戶檔案
 */
function getCustomerById(customerId) {
  try {
    if (!customerId) {
      return { success: false, message: '缺少客戶ID' };
    }

    const result = getAllCustomers(true);
    if (!result.success) return result;

    const customer = result.data.find(c => String(c.customerId).trim() === String(customerId).trim());

    if (!customer) {
      return { success: false, message: '找不到該客戶檔案' };
    }

    return { success: true, data: customer };

  } catch (error) {
    Logger.log(' 取得客戶檔案失敗: ' + error);
    return { success: false, message: error.toString() };
  }
}

// ==================== 客戶 ↔ 工作日誌 關聯查詢 ====================

/**
 *  取得指定客戶的服務日誌（工作日誌）紀錄
 */
function getWorklogsByCustomer(customerId, limit) {
  try {
    if (!customerId) {
      return { success: false, message: '缺少客戶ID', data: [] };
    }

    const sheet = getWorklogSheet();
    const values = sheet.getDataRange().getValues();
    const headers = values[0] || [];

    const customerIdCol = headers.indexOf('客戶ID');
    if (customerIdCol === -1) {
      // 工作日誌尚未關聯客戶欄位
      return { success: true, data: [], message: '工作日誌尚未支援客戶關聯' };
    }

    const customerNameCol = headers.indexOf('客戶名稱');
    const logs = [];

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (String(row[customerIdCol] || '').trim() !== String(customerId).trim()) continue;

      logs.push({
        worklogId: row[0],
        employeeId: row[1],
        employeeName: row[2],
        department: row[3],
        workDate: row[4] instanceof Date ? Utilities.formatDate(row[4], 'Asia/Taipei', 'yyyy-MM-dd') : row[4],
        workHours: row[5],
        content: row[6],
        status: row[7],
        customerId: row[customerIdCol],
        customerName: customerNameCol > -1 ? row[customerNameCol] : ''
      });
    }

    logs.sort((a, b) => String(b.workDate).localeCompare(String(a.workDate)));

    const limited = limit ? logs.slice(0, limit) : logs;

    return { success: true, data: limited, total: logs.length };

  } catch (error) {
    Logger.log(' 取得客戶服務日誌失敗: ' + error);
    Logger.log(' 錯誤堆疊: ' + error.stack);
    return { success: false, message: error.toString(), data: [] };
  }
}
