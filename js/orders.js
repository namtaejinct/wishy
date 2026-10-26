// Dữ liệu đơn hàng mẫu
if (!localStorage.getItem('orders')) {
    const sampleOrders = [
        { id: 'HD01', customer: 'khach1', date: '2026-10-05', total: 350000, status: 'Đã giao', items: ['Móc khóa voi', 'Tượng Bác'] },
        { id: 'HD02', customer: 'khach2', date: '2026-10-08', total: 120000, status: 'Mới đặt', items: ['Túi thổ cẩm'] }
    ];
    localStorage.setItem('orders', JSON.stringify(sampleOrders));
}

// Dữ liệu Phiếu nhập hàng mẫu
if (!localStorage.getItem('stockImports')) {
    const sampleImports = [
        { id: 'PN01', date: '2026-09-20', totalCost: 5000000, isCompleted: true, items: [] },
        { id: 'PN02', date: '2026-10-10', totalCost: 2000000, isCompleted: false, items: [] }
    ];
    localStorage.setItem('stockImports', JSON.stringify(sampleImports));
}

// Màn hình 1: Lịch sử đơn hàng đã mua
function renderMyOrders() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const tbody = document.getElementById('tbody-my-orders');
    tbody.innerHTML = '';

    if (!currentUser) {
        tbody.innerHTML = '<tr><td colspan="5">Vui lòng đăng nhập để xem lịch sử mua hàng!</td></tr>';
        return;
    }

    // Lọc đơn hàng của khách hàng hiện tại
    const myOrders = orders.filter(o => o.customer === currentUser.username);

    if (myOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">Bạn chưa có đơn hàng nào.</td></tr>';
        return;
    }

    myOrders.forEach((order, index) => {
        tbody.innerHTML += `
            <tr>
                <td><b>${order.id}</b></td>
                <td>${order.date}</td>
                <td>${order.total.toLocaleString('vi-VN')} đ</td>
                <td><span class="badge">${order.status}</span></td>
                <td><button onclick="showOrderDetail('${order.id}')">Xem</button></td>
            </tr>
        `;
    });
}

// Xem chi tiết đơn (tránh lỗi dấu nháy trong onclick)
function showOrderDetail(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(o => o.id === orderId);
    if (order) {
        alert('Chi tiết: ' + order.items.join(', '));
    }
}

// Màn hình 2: Quản lý nhập hàng
function renderStockImports() {
    const imports = JSON.parse(localStorage.getItem('stockImports')) || [];
    const tbody = document.getElementById('tbody-stock-in');
    tbody.innerHTML = '';

    if (imports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">Chưa có phiếu nhập nào.</td></tr>';
        return;
    }

    let html = '';
    imports.forEach(imp => {
        // Phiếu đã hoàn thành thì khóa các nút thao tác
        const actionBtns = imp.isCompleted
            ? '<button disabled style="opacity:0.5">Đã khóa</button>'
            : `<button onclick="editImport('${imp.id}')">Sửa</button>
               <button onclick="completeImport('${imp.id}')">Hoàn thành</button>`;

        html += `
            <tr>
                <td><b>${imp.id}</b></td>
                <td>${imp.date}</td>
                <td>${imp.totalCost.toLocaleString('vi-VN')} đ</td>
                <td><b>${imp.isCompleted ? 'Đã hoàn thành' : 'Chưa hoàn thành'}</b></td>
                <td>${actionBtns}</td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}/* ============ TIỆN ÍCH ============ */
function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function money(n) { return Number(n).toLocaleString('vi-VN') + 'đ'; }
function fmtDate(iso) { var p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
function today() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function load(key, seed) {
  try {
    var raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  save(key, seed);
  return seed;
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}

/* ============ DỮ LIỆU ============ */
var LOW_STOCK = 10;

var users = load('wishy_users', [
  { username: 'admin', password: 'admin123', fullname: 'Quản trị viên', role: 'admin' },
  { username: 'nam', password: '123456', fullname: 'Đặng Phương Nam', role: 'customer' },
  { username: 'lan', password: '123456', fullname: 'Nguyễn Thị Lan', role: 'customer' }
]);
var products = load('wishy_products', [
  { id: 'SP001', name: 'Áo thun basic', type: 'Thời trang', price: 150000, stock: 3 },
  { id: 'SP002', name: 'Balo laptop', type: 'Phụ kiện', price: 350000, stock: 40 },
  { id: 'SP003', name: 'Giày thể thao', type: 'Giày dép', price: 890000, stock: 12 },
  { id: 'SP004', name: 'Mũ lưỡi trai', type: 'Phụ kiện', price: 90000, stock: 0 }
]);
var orders = load('wishy_orders', [
  { id: 'DH001', user: 'nam', date: '2026-10-15', status: 'Đã giao', items: [{ pid: 'SP002', qty: 1 }] },
  { id: 'DH002', user: 'nam', date: '2026-10-19', status: 'Mới đặt', items: [{ pid: 'SP001', qty: 2 }] },
  { id: 'DH003', user: 'lan', date: '2026-10-20', status: 'Đã xử lý', items: [{ pid: 'SP003', qty: 1 }, { pid: 'SP004', qty: 2 }] }
]);
var stockIns = load('wishy_stockins', [
  { id: 'PN001', date: '2026-10-10', status: 'Hoàn tất', items: [{ pid: 'SP002', qty: 50, cost: 200000 }] }
]);
var currentUser = load('wishy_current', null);

function findProduct(id) { return products.filter(function (p) { return p.id === id; })[0]; }
function findUser(u) { return users.filter(function (x) { return x.username === u; })[0]; }
function orderTotal(o) {
  return o.items.reduce(function (s, it) { var p = findProduct(it.pid); return s + (p ? p.price * it.qty : 0); }, 0);
}
function isAdmin() { return currentUser && currentUser.role === 'admin'; }

/* ============ HEADER / ĐĂNG NHẬP ============ */
/* Mega menu: gom sản phẩm theo loại, thêm loại/sản phẩm mới thì menu tự cập nhật */
function renderMegaMenu() {
  var groups = {};
  products.forEach(function (p) {
    if (!groups[p.type]) groups[p.type] = [];
    groups[p.type].push(p);
  });
  var html = Object.keys(groups).map(function (type) {
    return '<div class="mega-col"><h4>' + esc(type) + '</h4><ul>' +
      groups[type].map(function (p) { return '<li><a href="#">' + esc(p.name) + '</a></li>'; }).join('') +
      '</ul></div>';
  }).join('');
  document.getElementById('mega-menu').innerHTML = html || '<p>Chưa có sản phẩm.</p>';
}

// Các link chưa có trang đích (href="#") không được nhảy lên đầu trang
document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('a[href="#"]');
  if (a) e.preventDefault();
});

function renderHeader() {
  renderMegaMenu();
  renderOrdersMenu();
  var box = document.getElementById('user-header-box');
  if (currentUser) {
    box.innerHTML =
      '<span>Xin chào, <span class="user-name">' + esc(currentUser.fullname) + '</span></span>' +
      '<span class="role-tag ' + (isAdmin() ? 'admin' : '') + '">' + (isAdmin() ? 'Admin' : 'Khách hàng') + '</span>' +
      '<button class="btn-outline btn-sm" onclick="logout()">Đăng xuất</button>';
  } else {
    box.innerHTML =
      '<button class="btn-outline btn-sm" onclick="openAuth(\'login\')">Đăng nhập</button>' +
      '<button class="btn btn-sm" onclick="openAuth(\'register\')">Đăng ký</button>';
  }
}

function openAuth(mode) {
  var m = document.getElementById('modal');
  m.className = 'modal' + (mode === 'register' ? ' wide' : '');
  m.innerHTML =
    '<button class="modal-close" onclick="closeModal()">&times;</button>' +
    '<div class="auth-tabs">' +
      '<button id="auth-tab-login" onclick="openAuth(\'login\')">Đăng nhập</button>' +
      '<button id="auth-tab-register" onclick="openAuth(\'register\')">Đăng ký</button>' +
    '</div>' +
    (mode === 'login' ? loginForm() : registerForm());
  document.getElementById('auth-tab-' + mode).classList.add('active');
  document.getElementById('overlay').classList.add('show');
}
function loginForm() {
  return '<div class="form-row"><label>Tên đăng nhập</label><input id="lg-user" autocomplete="username"></div>' +
         '<div class="form-row"><label>Mật khẩu</label><input id="lg-pass" type="password" autocomplete="current-password"></div>' +
         '<div class="form-error" id="auth-error"></div>' +
         '<button class="btn" style="width:100%" onclick="doLogin()">Đăng nhập</button>' +
         '<p class="hint">Chưa có tài khoản? <a href="#" onclick="openAuth(\'register\');return false;">Đăng ký ngay</a></p>';
}
function registerForm() {
  return [
    '<form id="register-form" onsubmit="return handleRegister(event)" novalidate>',
    '  <div class="form-row">',
    '    <div class="form-col">',
    '      <label for="fullname">Họ và tên</label>',
    '      <input type="text" id="fullname" placeholder="Nguyễn Văn A">',
    '      <div class="error" id="err-fullname"></div>',
    '      <label for="address">Địa chỉ</label>',
    '      <input type="text" id="address" placeholder="Số nhà, đường, phường/xã, tỉnh/thành">',
    '      <div class="error" id="err-address"></div>',
    '      <label for="phone">Số điện thoại</label>',
    '      <input type="tel" id="phone" placeholder="0901234567">',
    '      <div class="error" id="err-phone"></div>',
    '    </div>',
    '    <div class="form-col">',
    '      <label for="username">Tên đăng nhập</label>',
    '      <input type="text" id="username" placeholder="4-20 ký tự: chữ, số, dấu _" autocomplete="username">',
    '      <div class="error" id="err-username"></div>',
    '      <label for="password">Mật khẩu</label>',
    '      <input type="password" id="password" placeholder="Tối thiểu 6 ký tự" autocomplete="new-password">',
    '      <div class="error" id="err-password"></div>',
    '      <label for="confirm">Nhập lại mật khẩu</label>',
    '      <input type="password" id="confirm" autocomplete="new-password">',
    '      <div class="error" id="err-confirm"></div>',
    '    </div>',
    '  </div>',
    '  <div class="form-actions">',
    '    <button type="submit">Đăng ký</button>',
    '  </div>',
    '</form>'
  ].join('');
}
function authError(msg) { document.getElementById('auth-error').textContent = msg; }

function doLogin() {
  var u = document.getElementById('lg-user').value.trim();
  var p = document.getElementById('lg-pass').value;
  if (!u || !p) return authError('Vui lòng nhập đủ tên đăng nhập và mật khẩu.');
  var user = findUser(u);
  if (!user || user.password !== p) return authError('Sai tên đăng nhập hoặc mật khẩu.');
  currentUser = { username: user.username, fullname: user.fullname, role: user.role };
  save('wishy_current', currentUser);
  closeModal();
  renderAll();
}
function handleRegister(e) {
  if (e) e.preventDefault();
  var fields = ['fullname', 'address', 'phone', 'username', 'password', 'confirm'];
  var v = {};
  fields.forEach(function (f) {
    v[f] = document.getElementById(f).value;
    document.getElementById('err-' + f).textContent = '';
  });
  v.fullname = v.fullname.trim();
  v.address = v.address.trim();
  v.phone = v.phone.trim();
  v.username = v.username.trim();

  var errors = {};
  if (v.fullname.length < 2) errors.fullname = 'Vui lòng nhập họ và tên.';
  if (v.address.length < 5) errors.address = 'Vui lòng nhập địa chỉ đầy đủ.';
  if (!/^(0|\+84)\d{9}$/.test(v.phone)) errors.phone = 'Số điện thoại không hợp lệ (VD: 0901234567).';
  if (!/^[A-Za-z0-9_]{4,20}$/.test(v.username)) errors.username = 'Tên đăng nhập 4-20 ký tự: chữ không dấu, số, dấu _.';
  else if (findUser(v.username)) errors.username = 'Tên đăng nhập đã tồn tại.';
  if (v.password.length < 6) errors.password = 'Mật khẩu phải từ 6 ký tự trở lên.';
  if (v.confirm !== v.password) errors.confirm = 'Mật khẩu nhập lại không khớp.';

  var keys = Object.keys(errors);
  if (keys.length) {
    keys.forEach(function (k) { document.getElementById('err-' + k).textContent = errors[k]; });
    document.getElementById(keys[0]).focus();
    return false;
  }

  users.push({ username: v.username, password: v.password, fullname: v.fullname, address: v.address, phone: v.phone, role: 'customer' });
  save('wishy_users', users);
  currentUser = { username: v.username, fullname: v.fullname, role: 'customer' };
  save('wishy_current', currentUser);
  closeModal();
  renderAll();
  return false;
}
function logout() {
  currentUser = null;
  save('wishy_current', null);
  renderAll();
}

/* ============ MODAL ============ */
function closeModal() { document.getElementById('overlay').classList.remove('show'); }
function openModal(html, wide) {
  var m = document.getElementById('modal');
  m.className = 'modal' + (wide ? ' wide' : '');
  m.innerHTML = '<button class="modal-close" onclick="closeModal()">&times;</button>' + html;
  document.getElementById('overlay').classList.add('show');
}

/* ============ TAB ============ */
var ADMIN_TABS = ['tab-admin-stock-in', 'tab-admin-orders', 'tab-admin-inventory'];
var currentTab = '';

// Khách chỉ vào được "Đơn hàng của tôi", admin chỉ vào được 3 tab quản lý
function switchTab(id) {
  if (isAdmin()) {
    if (ADMIN_TABS.indexOf(id) === -1) id = 'tab-admin-orders';
  } else {
    id = 'tab-my-orders';
  }
  currentTab = id;
  document.querySelectorAll('.tab-content').forEach(function (t) { t.classList.toggle('active', t.id === id); });
  document.querySelectorAll('#orders-menu a').forEach(function (a) { a.classList.toggle('current', a.getAttribute('data-tab') === id); });
}

// Bấm chữ "Đơn hàng" trên menu
function goOrders() {
  if (!currentUser) { openAuth('login'); return; }
  switchTab(currentTab);
}

// Admin: "Đơn hàng" xổ ra 3 mục. Khách / chưa đăng nhập: link thường.
function renderOrdersMenu() {
  var wrap = document.getElementById('nav-orders');
  var menu = document.getElementById('orders-menu');
  if (isAdmin()) {
    wrap.classList.add('has-drop');
    menu.innerHTML = [
      ['tab-admin-stock-in', 'Quản lý Nhập hàng'],
      ['tab-admin-orders', 'Quản lý Đơn hàng'],
      ['tab-admin-inventory', 'Quản lý Tồn kho']
    ].map(function (m) {
      return '<a href="#" data-tab="' + m[0] + '" onclick="switchTab(\'' + m[0] + '\')">' + m[1] + '</a>';
    }).join('');
  } else {
    wrap.classList.remove('has-drop');
    menu.innerHTML = '';
  }
}

/* ============ KHÁCH HÀNG: ĐƠN CỦA TÔI ============ */
function statusBadge(s) {
  var cls = s === 'Đã giao' ? 'ok' : s === 'Đã hủy' ? 'warn' : s === 'Đã xử lý' ? 'mid' : '';
  return '<span class="badge ' + cls + '">' + esc(s) + '</span>';
}
function renderMyOrders() {
  var tb = document.getElementById('tbody-my-orders');
  var mine = orders.filter(function (o) { return currentUser && o.user === currentUser.username; });
  if (!mine.length) { tb.innerHTML = '<tr class="empty-row"><td colspan="5">Bạn chưa có đơn hàng nào.</td></tr>'; return; }
  tb.innerHTML = mine.map(function (o) {
    return '<tr><td>' + o.id + '</td><td>' + fmtDate(o.date) + '</td><td>' + money(orderTotal(o)) + '</td><td>' +
      statusBadge(o.status) + '</td><td><button class="btn btn-sm" onclick="showOrderDetail(\'' + o.id + '\')">Xem</button></td></tr>';
  }).join('');
}
function showOrderDetail(id) {
  var o = orders.filter(function (x) { return x.id === id; })[0];
  if (!o) return;
  var rows = o.items.map(function (it) {
    var p = findProduct(it.pid);
    return '<tr><td>' + it.pid + '</td><td>' + esc(p ? p.name : '(đã xóa)') + '</td><td>' + it.qty + '</td><td>' + money(p ? p.price * it.qty : 0) + '</td></tr>';
  }).join('');
  openModal('<h3>Chi tiết đơn ' + o.id + '</h3><p>Ngày đặt: <b>' + fmtDate(o.date) + '</b> &nbsp; ' + statusBadge(o.status) + '</p>' +
    '<table><thead><tr><th>Mã SP</th><th>Tên</th><th>SL</th><th>Thành tiền</th></tr></thead><tbody>' + rows + '</tbody></table>' +
    '<div class="detail-total">Tổng: ' + money(orderTotal(o)) + '</div>', true);
}

/* ============ ADMIN: ĐƠN HÀNG ============ */
function renderAdminOrders() {
  var from = document.getElementById('filter-from-date').value;
  var to = document.getElementById('filter-to-date').value;
  var st = document.getElementById('filter-status').value;
  var list = orders.filter(function (o) {
    if (from && o.date < from) return false;
    if (to && o.date > to) return false;
    if (st !== 'all' && o.status !== st) return false;
    return true;
  });
  var tb = document.getElementById('tbody-admin-orders');
  if (!list.length) { tb.innerHTML = '<tr class="empty-row"><td colspan="5">Không có đơn hàng phù hợp.</td></tr>'; return; }
  var opts = ['Mới đặt', 'Đã xử lý', 'Đã giao', 'Đã hủy'];
  tb.innerHTML = list.map(function (o) {
    var u = findUser(o.user);
    var select = '<select id="st-' + o.id + '">' + opts.map(function (s) {
      return '<option value="' + s + '"' + (s === o.status ? ' selected' : '') + '>' + s + '</option>';
    }).join('') + '</select> ';
    return '<tr><td>' + o.id + '</td><td>' + esc(u ? u.fullname : o.user) + '</td><td>' + money(orderTotal(o)) + '</td><td>' +
      statusBadge(o.status) + '</td><td>' + select +
      '<button class="btn btn-sm" onclick="updateOrderStatus(\'' + o.id + '\')">Lưu</button> ' +
      '<button class="btn-outline btn-sm" onclick="showOrderDetail(\'' + o.id + '\')">Xem</button></td></tr>';
  }).join('');
}
function updateOrderStatus(id) {
  var o = orders.filter(function (x) { return x.id === id; })[0];
  if (!o) return;
  o.status = document.getElementById('st-' + id).value;
  save('wishy_orders', orders);
  renderAll();
}

/* ============ ADMIN: NHẬP HÀNG ============ */
function renderStockIn() {
  var tb = document.getElementById('tbody-stock-in');
  if (!stockIns.length) { tb.innerHTML = '<tr class="empty-row"><td colspan="5">Chưa có phiếu nhập.</td></tr>'; return; }
  tb.innerHTML = stockIns.map(function (s) {
    var total = s.items.reduce(function (sum, it) { return sum + it.qty * it.cost; }, 0);
    return '<tr><td>' + s.id + '</td><td>' + fmtDate(s.date) + '</td><td>' + money(total) + '</td><td><span class="badge ok">' + esc(s.status) +
      '</span></td><td><button class="btn btn-sm" onclick="showStockDetail(\'' + s.id + '\')">Xem</button></td></tr>';
  }).join('');
}
function showStockDetail(id) {
  var s = stockIns.filter(function (x) { return x.id === id; })[0];
  if (!s) return;
  var total = 0;
  var rows = s.items.map(function (it) {
    var p = findProduct(it.pid); total += it.qty * it.cost;
    return '<tr><td>' + it.pid + '</td><td>' + esc(p ? p.name : '(đã xóa)') + '</td><td>' + it.qty + '</td><td>' + money(it.cost) + '</td><td>' + money(it.qty * it.cost) + '</td></tr>';
  }).join('');
  openModal('<h3>Phiếu nhập ' + s.id + '</h3><p>Ngày nhập: <b>' + fmtDate(s.date) + '</b></p>' +
    '<table><thead><tr><th>Mã SP</th><th>Tên</th><th>SL</th><th>Giá nhập</th><th>Thành tiền</th></tr></thead><tbody>' + rows + '</tbody></table>' +
    '<div class="detail-total">Tổng: ' + money(total) + '</div>', true);
}
function productOptions() {
  return products.map(function (p) { return '<option value="' + p.id + '">' + p.id + ' - ' + esc(p.name) + '</option>'; }).join('');
}
function lineRowHtml() {
  return '<div class="line-row"><select class="ln-pid">' + productOptions() + '</select>' +
    '<input class="ln-qty" type="number" min="1" placeholder="SL">' +
    '<input class="ln-cost" type="number" min="0" placeholder="Giá nhập">' +
    '<button class="btn-outline btn-sm" onclick="this.parentNode.remove()">✕</button></div>';
}
function showAddStockModal() {
  openModal('<h3>Tạo phiếu nhập mới</h3><div id="stock-lines">' + lineRowHtml() + '</div>' +
    '<button class="btn-outline btn-sm" onclick="addStockLine()">+ Thêm dòng</button>' +
    '<div class="form-error" id="stock-error" style="margin-top:12px"></div>' +
    '<button class="btn" style="width:100%" onclick="saveStock()">Lưu phiếu nhập</button>', true);
}
function addStockLine() {
  document.getElementById('stock-lines').insertAdjacentHTML('beforeend', lineRowHtml());
}
function saveStock() {
  var items = [];
  var rows = document.querySelectorAll('#stock-lines .line-row');
  for (var i = 0; i < rows.length; i++) {
    var pid = rows[i].querySelector('.ln-pid').value;
    var qty = parseInt(rows[i].querySelector('.ln-qty').value, 10);
    var cost = parseInt(rows[i].querySelector('.ln-cost').value, 10);
    if (!(qty > 0) || !(cost >= 0)) {
      document.getElementById('stock-error').textContent = 'Dòng ' + (i + 1) + ': số lượng phải lớn hơn 0 và giá nhập không được để trống.';
      return;
    }
    items.push({ pid: pid, qty: qty, cost: cost });
  }
  if (!items.length) { document.getElementById('stock-error').textContent = 'Phiếu nhập cần ít nhất 1 dòng.'; return; }
  items.forEach(function (it) { findProduct(it.pid).stock += it.qty; });
  var num = stockIns.length + 1;
  stockIns.push({ id: 'PN' + String(num).padStart(3, '0'), date: today(), status: 'Hoàn tất', items: items });
  save('wishy_stockins', stockIns);
  save('wishy_products', products);
  closeModal();
  renderAll();
}

/* ============ ADMIN: TỒN KHO ============ */
function renderInventory() {
  var out = products.filter(function (p) { return p.stock === 0; });
  var low = products.filter(function (p) { return p.stock > 0 && p.stock <= LOW_STOCK; });
  var html = '';
  if (out.length) html += '<div class="alert warn">Hết hàng: ' + out.map(function (p) { return esc(p.name); }).join(', ') + '</div>';
  if (low.length) html += '<div class="alert warn">Sắp hết (còn ≤ ' + LOW_STOCK + '): ' + low.map(function (p) { return esc(p.name) + ' (' + p.stock + ')'; }).join(', ') + '</div>';
  if (!out.length && !low.length) html = '<div class="alert ok">Tồn kho đang ổn định, không có cảnh báo.</div>';
  document.getElementById('alert-box').innerHTML = html;

  document.getElementById('tbody-inventory').innerHTML = products.map(function (p) {
    var badge = p.stock === 0 ? '<span class="badge warn">Hết hàng</span>'
      : p.stock <= LOW_STOCK ? '<span class="badge mid">Sắp hết</span>'
      : '<span class="badge ok">Ổn định</span>';
    return '<tr><td>' + p.id + '</td><td>' + esc(p.name) + '</td><td>' + esc(p.type) + '</td><td><b>' + p.stock + '</b></td><td>' + badge + '</td></tr>';
  }).join('');
}

/* ============ ĐIỀU PHỐI ============ */
function renderAll() {
  renderHeader();
  var logged = !!currentUser;
  document.getElementById('welcome-screen').style.display = logged ? 'none' : '';
  document.getElementById('app-screen').style.display = logged ? '' : 'none';
  if (!logged) return;

  switchTab(currentTab);

  renderMyOrders();
  if (isAdmin()) { renderStockIn(); renderAdminOrders(); renderInventory(); }
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Enter' && document.getElementById('overlay').classList.contains('show')) {
    if (document.getElementById('lg-user')) doLogin();
  }
});

renderAll();