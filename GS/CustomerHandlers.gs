// CustomerHandlers.gs - 客戶檔案 API Handler 函數

/**
 *  處理新增客戶檔案（僅管理員）
 */
function handleAddCustomer(params) {
  try {
    if (!params.token) {
      return { ok: false, msg: '缺少認證 token' };
    }

    const session = checkSession_(params.token);
    if (!session.ok || !session.user) {
      return { ok: false, msg: '未授權或 session 已過期' };
    }

    if (session.user.dept !== '管理員') {
      return { ok: false, msg: '需要管理員權限' };
    }

    const result = addCustomer({
      customerName: params.customerName,
      contactPerson: params.contactPerson,
      phone: params.phone,
      email: params.email,
      address: params.address,
      serviceItems: params.serviceItems,
      contractStart: params.contractStart,
      contractEnd: params.contractEnd,
      serviceLocation: params.serviceLocation,
      note: params.note
    }, session.user);

    return {
      ok: result.success,
      msg: result.message,
      customerId: result.customerId
    };

  } catch (error) {
    Logger.log(' handleAddCustomer 錯誤: ' + error);
    return { ok: false, msg: error.message };
  }
}

/**
 *  處理更新客戶檔案（僅管理員）
 */
function handleUpdateCustomer(params) {
  try {
    if (!params.token) {
      return { ok: false, msg: '缺少認證 token' };
    }

    const session = checkSession_(params.token);
    if (!session.ok || !session.user) {
      return { ok: false, msg: '未授權或 session 已過期' };
    }

    if (session.user.dept !== '管理員') {
      return { ok: false, msg: '需要管理員權限' };
    }

    if (!params.customerId) {
      return { ok: false, msg: '缺少客戶ID' };
    }

    const result = updateCustomer(params.customerId, {
      customerName: params.customerName,
      contactPerson: params.contactPerson,
      phone: params.phone,
      email: params.email,
      address: params.address,
      serviceItems: params.serviceItems,
      contractStart: params.contractStart,
      contractEnd: params.contractEnd,
      serviceLocation: params.serviceLocation,
      note: params.note
    }, session.user);

    return { ok: result.success, msg: result.message };

  } catch (error) {
    Logger.log(' handleUpdateCustomer 錯誤: ' + error);
    return { ok: false, msg: error.message };
  }
}

/**
 *  處理刪除客戶檔案（僅管理員，軟刪除）
 */
function handleDeleteCustomer(params) {
  try {
    if (!params.token) {
      return { ok: false, msg: '缺少認證 token' };
    }

    const session = checkSession_(params.token);
    if (!session.ok || !session.user) {
      return { ok: false, msg: '未授權或 session 已過期' };
    }

    if (session.user.dept !== '管理員') {
      return { ok: false, msg: '需要管理員權限' };
    }

    if (!params.customerId) {
      return { ok: false, msg: '缺少客戶ID' };
    }

    const result = deleteCustomer(params.customerId, session.user);

    return { ok: result.success, msg: result.message };

  } catch (error) {
    Logger.log(' handleDeleteCustomer 錯誤: ' + error);
    return { ok: false, msg: error.message };
  }
}

/**
 *  處理取得所有客戶檔案（僅管理員）
 */
function handleGetAllCustomers(params) {
  try {
    if (!params.token) {
      return { ok: false, msg: '缺少認證 token' };
    }

    const session = checkSession_(params.token);
    if (!session.ok || !session.user) {
      return { ok: false, msg: '未授權或 session 已過期' };
    }

    if (session.user.dept !== '管理員') {
      return { ok: false, msg: '需要管理員權限' };
    }

    const includeDeleted = params.includeDeleted === 'true';
    const result = getAllCustomers(includeDeleted);

    return {
      ok: result.success,
      customers: result.data,
      count: result.count,
      msg: result.message || '查詢成功'
    };

  } catch (error) {
    Logger.log(' handleGetAllCustomers 錯誤: ' + error);
    return { ok: false, msg: error.message };
  }
}

/**
 *  處理取得單一客戶檔案（僅管理員）
 */
function handleGetCustomerById(params) {
  try {
    if (!params.token) {
      return { ok: false, msg: '缺少認證 token' };
    }

    const session = checkSession_(params.token);
    if (!session.ok || !session.user) {
      return { ok: false, msg: '未授權或 session 已過期' };
    }

    if (session.user.dept !== '管理員') {
      return { ok: false, msg: '需要管理員權限' };
    }

    if (!params.customerId) {
      return { ok: false, msg: '缺少客戶ID' };
    }

    const result = getCustomerById(params.customerId);

    return {
      ok: result.success,
      customer: result.data,
      msg: result.message || '查詢成功'
    };

  } catch (error) {
    Logger.log(' handleGetCustomerById 錯誤: ' + error);
    return { ok: false, msg: error.message };
  }
}

/**
 *  處理取得指定客戶的服務日誌（工作日誌關聯，僅管理員）
 */
function handleGetCustomerWorklogs(params) {
  try {
    if (!params.token) {
      return { ok: false, msg: '缺少認證 token' };
    }

    const session = checkSession_(params.token);
    if (!session.ok || !session.user) {
      return { ok: false, msg: '未授權或 session 已過期' };
    }

    if (session.user.dept !== '管理員') {
      return { ok: false, msg: '需要管理員權限' };
    }

    if (!params.customerId) {
      return { ok: false, msg: '缺少客戶ID' };
    }

    const limit = parseInt(params.limit) || 0;
    const result = getWorklogsByCustomer(params.customerId, limit);

    return {
      ok: result.success,
      worklogs: result.data,
      total: result.total,
      msg: result.message || '查詢成功'
    };

  } catch (error) {
    Logger.log(' handleGetCustomerWorklogs 錯誤: ' + error);
    return { ok: false, msg: error.message };
  }
}
