/**
 * 客戶檔案管理前端邏輯
 * 功能: 查看/新增/編輯/刪除客戶檔案、檢視客戶服務日誌紀錄
 */

let allCustomers = [];
let isAdmin = false;
let currentDetailCustomerId = null;

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', async function () {
    await loadUserPermissions();
    initializeTabs();
    loadCustomers();
    setupEventListeners();
});

// ========== 權限 ==========
async function loadUserPermissions() {
    try {
        const token = localStorage.getItem('sessionToken');
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        const response = await fetch(`${apiUrl}?action=checkSession&token=${token}`);
        const data = await response.json();

        if (data.ok && data.user) {
            isAdmin = (data.user.dept === '管理員');
        } else {
            window.location.href = 'index.html';
            return;
        }

        updateUIForPermissions();
    } catch (error) {
        console.error('權限載入失敗:', error);
        isAdmin = false;
        updateUIForPermissions();
    }
}

function updateUIForPermissions() {
    const addTabBtn = document.getElementById('add-tab-btn');
    const hint = document.getElementById('admin-only-hint');

    if (isAdmin) {
        if (addTabBtn) addTabBtn.style.display = 'inline-block';
        if (hint) hint.style.display = 'none';
    } else {
        if (addTabBtn) addTabBtn.style.display = 'none';
        if (hint) hint.style.display = 'block';
    }
}

// ========== 分頁管理 ==========
function initializeTabs() {
    document.querySelectorAll('.customer-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            const tabName = this.getAttribute('data-tab');
            if (tabName === 'add' && !isAdmin) {
                showMessage('權限不足：只有管理員可以新增客戶', 'error');
                return;
            }
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.customer-tab').forEach(tab => tab.classList.remove('active'));
    const targetTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (targetTab) targetTab.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    const targetContent = document.getElementById(`${tabName}-tab`);
    if (targetContent) targetContent.classList.add('active');
}

function setupEventListeners() {
    const form = document.getElementById('customer-form');
    if (form) form.addEventListener('submit', handleFormSubmit);

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            renderCustomerList(filterCustomers(this.value));
        });
    }
}

function filterCustomers(keyword) {
    if (!keyword || !keyword.trim()) return allCustomers;
    const kw = keyword.trim().toLowerCase();
    return allCustomers.filter(c =>
        String(c.customerName || '').toLowerCase().includes(kw) ||
        String(c.contactPerson || '').toLowerCase().includes(kw) ||
        String(c.phone || '').toLowerCase().includes(kw)
    );
}

// ========== 客戶清單 ==========
async function loadCustomers() {
    const container = document.getElementById('customer-list-container');
    container.innerHTML = '<div class="empty-state">載入中...</div>';

    try {
        const token = localStorage.getItem('sessionToken');
        const response = await fetch(`${apiUrl}?action=getAllCustomers&token=${token}`);
        const data = await response.json();

        if (!data.ok) {
            container.innerHTML = `<div class="empty-state">${data.msg || '載入失敗（僅管理員可查看客戶清單）'}</div>`;
            return;
        }

        allCustomers = data.customers || [];
        renderCustomerList(allCustomers);
    } catch (error) {
        console.error('載入客戶清單失敗:', error);
        container.innerHTML = '<div class="empty-state">載入失敗，請稍後再試</div>';
    }
}

function renderCustomerList(customers) {
    const container = document.getElementById('customer-list-container');

    if (!customers || customers.length === 0) {
        container.innerHTML = '<div class="empty-state">目前沒有客戶資料</div>';
        return;
    }

    const rows = customers.map(c => {
        const statusBadge = c.status === '已刪除'
            ? '<span class="badge badge-deleted">已刪除</span>'
            : '<span class="badge badge-active">啟用</span>';

        const contractRange = (c.contractStart || c.contractEnd)
            ? `${c.contractStart || '—'} ~ ${c.contractEnd || '—'}`
            : '—';

        const actions = isAdmin
            ? `
                <button class="btn btn-sm btn-secondary" onclick="viewCustomer('${c.customerId}')">檢視</button>
                <button class="btn btn-sm btn-primary" onclick="editCustomer('${c.customerId}')">編輯</button>
                <button class="btn btn-sm btn-danger" onclick="removeCustomer('${c.customerId}', '${escapeHtml(c.customerName)}')">刪除</button>
              `
            : `<button class="btn btn-sm btn-secondary" onclick="viewCustomer('${c.customerId}')">檢視</button>`;

        return `
            <tr>
                <td>${escapeHtml(c.customerName)}</td>
                <td>${escapeHtml(c.contactPerson || '—')}</td>
                <td>${escapeHtml(c.phone || '—')}</td>
                <td>${escapeHtml(c.serviceItems || '—')}</td>
                <td>${contractRange}</td>
                <td>${statusBadge}</td>
                <td><div class="action-btns">${actions}</div></td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>客戶名稱</th>
                    <th>聯絡人</th>
                    <th>電話</th>
                    <th>服務項目</th>
                    <th>合約期間</th>
                    <th>狀態</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

// ========== 新增/編輯 ==========
function resetForm() {
    document.getElementById('customer-form').reset();
    document.getElementById('edit-customer-id').value = '';
    document.getElementById('form-title').textContent = '新增客戶';
    document.getElementById('submit-btn').textContent = '儲存客戶';
}

function fillForm(customer) {
    document.getElementById('edit-customer-id').value = customer.customerId;
    document.getElementById('f-customerName').value = customer.customerName || '';
    document.getElementById('f-contactPerson').value = customer.contactPerson || '';
    document.getElementById('f-phone').value = customer.phone || '';
    document.getElementById('f-email').value = customer.email || '';
    document.getElementById('f-address').value = customer.address || '';
    document.getElementById('f-contractStart').value = customer.contractStart || '';
    document.getElementById('f-contractEnd').value = customer.contractEnd || '';
    document.getElementById('f-serviceLocation').value = customer.serviceLocation || '';
    document.getElementById('f-serviceItems').value = customer.serviceItems || '';
    document.getElementById('f-note').value = customer.note || '';
}

async function editCustomer(customerId) {
    if (!isAdmin) {
        showMessage('權限不足：只有管理員可以編輯客戶', 'error');
        return;
    }
    const customer = allCustomers.find(c => c.customerId === customerId);
    if (!customer) return;

    fillForm(customer);
    document.getElementById('form-title').textContent = '編輯客戶';
    document.getElementById('submit-btn').textContent = '更新客戶';
    switchTab('add');
}

async function handleFormSubmit(e) {
    e.preventDefault();

    if (!isAdmin) {
        showMessage('權限不足：只有管理員可以新增/編輯客戶', 'error');
        return;
    }

    const customerId = document.getElementById('edit-customer-id').value;
    const token = localStorage.getItem('sessionToken');

    const payload = {
        token,
        customerName: document.getElementById('f-customerName').value.trim(),
        contactPerson: document.getElementById('f-contactPerson').value.trim(),
        phone: document.getElementById('f-phone').value.trim(),
        email: document.getElementById('f-email').value.trim(),
        address: document.getElementById('f-address').value.trim(),
        contractStart: document.getElementById('f-contractStart').value,
        contractEnd: document.getElementById('f-contractEnd').value,
        serviceLocation: document.getElementById('f-serviceLocation').value.trim(),
        serviceItems: document.getElementById('f-serviceItems').value.trim(),
        note: document.getElementById('f-note').value.trim()
    };

    if (!payload.customerName) {
        showMessage('請填寫客戶名稱', 'error');
        return;
    }

    const action = customerId ? 'updateCustomer' : 'addCustomer';
    if (customerId) payload.customerId = customerId;

    const queryParams = new URLSearchParams({ action, ...payload }).toString();

    try {
        const response = await fetch(`${apiUrl}?${queryParams}`);
        const data = await response.json();

        if (data.ok) {
            showMessage(customerId ? '客戶資料已更新' : '客戶已新增', 'success');
            resetForm();
            await loadCustomers();
            switchTab('list');
        } else {
            showMessage(data.msg || '操作失敗', 'error');
        }
    } catch (error) {
        console.error('儲存客戶失敗:', error);
        showMessage('操作失敗，請稍後再試', 'error');
    }
}

// ========== 刪除 ==========
async function removeCustomer(customerId, customerName) {
    if (!isAdmin) {
        showMessage('權限不足：只有管理員可以刪除客戶', 'error');
        return;
    }

    if (!confirm(`確定要刪除客戶「${customerName}」嗎？（可保留歷史服務日誌關聯，僅標記為已刪除）`)) {
        return;
    }

    const token = localStorage.getItem('sessionToken');

    try {
        const response = await fetch(`${apiUrl}?action=deleteCustomer&token=${token}&customerId=${encodeURIComponent(customerId)}`);
        const data = await response.json();

        if (data.ok) {
            showMessage('客戶已刪除', 'success');
            await loadCustomers();
        } else {
            showMessage(data.msg || '刪除失敗', 'error');
        }
    } catch (error) {
        console.error('刪除客戶失敗:', error);
        showMessage('刪除失敗，請稍後再試', 'error');
    }
}

// ========== 客戶詳情 + 服務日誌 ==========
async function viewCustomer(customerId) {
    currentDetailCustomerId = customerId;

    const detailTabBtn = document.getElementById('detail-tab-btn');
    if (detailTabBtn) detailTabBtn.style.display = 'inline-block';

    switchTab('detail');

    const detailContainer = document.getElementById('detail-container');
    const worklogContainer = document.getElementById('detail-worklogs-container');
    detailContainer.innerHTML = '<div class="empty-state">載入中...</div>';
    worklogContainer.innerHTML = '<div class="empty-state">載入中...</div>';

    const token = localStorage.getItem('sessionToken');

    try {
        const response = await fetch(`${apiUrl}?action=getCustomerById&token=${token}&customerId=${encodeURIComponent(customerId)}`);
        const data = await response.json();

        if (!data.ok || !data.customer) {
            detailContainer.innerHTML = `<div class="empty-state">${data.msg || '找不到客戶資料'}</div>`;
        } else {
            renderCustomerDetail(data.customer);
        }
    } catch (error) {
        console.error('載入客戶詳情失敗:', error);
        detailContainer.innerHTML = '<div class="empty-state">載入失敗，請稍後再試</div>';
    }

    try {
        const wlResponse = await fetch(`${apiUrl}?action=getCustomerWorklogs&token=${token}&customerId=${encodeURIComponent(customerId)}&limit=50`);
        const wlData = await wlResponse.json();

        if (wlData.ok) {
            renderCustomerWorklogs(wlData.worklogs || []);
        } else {
            worklogContainer.innerHTML = `<div class="empty-state">${wlData.msg || '載入服務日誌失敗'}</div>`;
        }
    } catch (error) {
        console.error('載入服務日誌失敗:', error);
        worklogContainer.innerHTML = '<div class="empty-state">載入失敗，請稍後再試</div>';
    }
}

function renderCustomerDetail(c) {
    const container = document.getElementById('detail-container');
    const statusBadge = c.status === '已刪除'
        ? '<span class="badge badge-deleted">已刪除</span>'
        : '<span class="badge badge-active">啟用</span>';

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <h2 style="margin:0;">${escapeHtml(c.customerName)}</h2>
            ${statusBadge}
        </div>
        <div class="detail-section">
            <div class="detail-row"><div class="detail-label">聯絡人</div><div class="detail-value">${escapeHtml(c.contactPerson || '—')}</div></div>
            <div class="detail-row"><div class="detail-label">電話</div><div class="detail-value">${escapeHtml(c.phone || '—')}</div></div>
            <div class="detail-row"><div class="detail-label">Email</div><div class="detail-value">${escapeHtml(c.email || '—')}</div></div>
            <div class="detail-row"><div class="detail-label">地址</div><div class="detail-value">${escapeHtml(c.address || '—')}</div></div>
            <div class="detail-row"><div class="detail-label">服務地點</div><div class="detail-value">${escapeHtml(c.serviceLocation || '—')}</div></div>
            <div class="detail-row"><div class="detail-label">服務項目</div><div class="detail-value">${escapeHtml(c.serviceItems || '—')}</div></div>
            <div class="detail-row"><div class="detail-label">合約期間</div><div class="detail-value">${c.contractStart || '—'} ~ ${c.contractEnd || '—'}</div></div>
            <div class="detail-row"><div class="detail-label">備註</div><div class="detail-value">${escapeHtml(c.note || '—')}</div></div>
        </div>
    `;
}

function renderCustomerWorklogs(worklogs) {
    const container = document.getElementById('detail-worklogs-container');

    if (!worklogs || worklogs.length === 0) {
        container.innerHTML = '<div class="empty-state">目前沒有關聯的服務日誌紀錄</div>';
        return;
    }

    const rows = worklogs.map(w => `
        <tr>
            <td>${escapeHtml(w.workDate || '—')}</td>
            <td>${escapeHtml(w.employeeName || '—')}</td>
            <td>${escapeHtml(String(w.workHours || '—'))}</td>
            <td>${escapeHtml(w.content || '—')}</td>
            <td>${escapeHtml(w.status || '—')}</td>
        </tr>
    `).join('');

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>日期</th>
                    <th>員工</th>
                    <th>工作時數</th>
                    <th>工作內容</th>
                    <th>狀態</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

// ========== 工具函式 ==========
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function showMessage(message, type) {
    const existing = document.getElementById('toast-message');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'toast-message';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 9999;
        padding: 14px 20px; border-radius: 8px; color: white;
        font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        background: ${type === 'error' ? '#ea4335' : '#34a853'};
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
