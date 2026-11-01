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

var users = load('wishy_users', [
  { username: 'admin', password: 'admin123', fullname: 'Quản trị viên', role: 'admin' },
  { username: 'nam', password: '123456', fullname: 'Đặng Phương Nam', role: 'customer' },
  { username: 'lan', password: '123456', fullname: 'Nguyễn Thị Lan', role: 'customer' }
]);
var products = load('wishy_products', [
  { id: 'SP001', name: 'Áo thun biển Phú Quốc', type: 'Áo freesize', price: 150000, stock: 3 },
  { id: 'SP002', name: 'Ly sứ Mặt Trời',        type: 'Ly',          price: 350000, stock: 40 },
  { id: 'SP003', name: 'Móc khóa Cá heo',       type: 'Móc khóa',    price: 75000,  stock: 12 },
  { id: 'SP004', name: 'Miếng dán Đảo Lý Sơn',  type: 'Phụ kiện',    price: 90000,  stock: 0 }
]);
// Dữ liệu đơn hàng mẫu
var orders = load('wishy_orders', [
  { id: 'DH001', user: 'nam', date: '2026-10-15', status: 'Đã giao', items: [{ pid: 'SP002', qty: 1 }] },
  { id: 'DH002', user: 'nam', date: '2026-10-19', status: 'Mới đặt', items: [{ pid: 'SP001', qty: 2 }] },
  { id: 'DH003', user: 'lan', date: '2026-10-20', status: 'Đã xử lý', items: [{ pid: 'SP003', qty: 1 }, { pid: 'SP004', qty: 2 }] }
]);
var currentUser = load('wishy_current', null);

function findProduct(id) { return products.filter(function (p) { return p.id === id; })[0]; }
function findUser(u) { return users.filter(function (x) { return x.username === u; })[0]; }
function orderTotal(o) {
  return o.items.reduce(function (s, it) { var p = findProduct(it.pid); return s + (p ? p.price * it.qty : 0); }, 0);
}
function isAdmin() { return !!currentUser && currentUser.role === 'admin'; }

var PAGE_LINKS = {
  home: 'index.html',
  products: 'products.html',
  cart: 'cart.html',
  orders: 'orders.html'
};

function siteHeaderHtml(activePage) {
  var cart = load('wishy_cart', []);
  var cartCount = cart.reduce(function(s, i) { return s + (i.qty || 0); }, 0);

  return '<header class="site-header">' +
    '<div class="header-top">' +
      '<div class="header-left-space"></div>' +
      '<div class="logo"><a href="index.html" style="text-decoration:none; color:inherit;">WISHY</a></div>' +
      '<div id="user-header-box" class="header-right-icons">' +
        '<!-- Icon User: Bấm vào là bật ngay Overlay Đăng nhập -->' +
        '<a href="#" class="icon-btn" title="Tài khoản" onclick="openAuth(\'login\'); return false;">' +
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>' +
            '<circle cx="12" cy="7" r="4"></circle>' +
          '</svg>' +
        '</a>' +
        '<!-- Icon Giỏ hàng: Đã đăng nhập -> vào cart.html | Chưa đăng nhập -> Overlay Đăng nhập -->' +
        '<a href="cart.html" class="icon-btn cart-icon-btn" title="Giỏ hàng" onclick="checkCartAccess(event)">' +
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>' +
            '<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>' +
          '</svg>' +
          '<span class="cart-badge">' + cartCount + '</span>' +
        '</a>' +
      '</div>' +
    '</div>' +
    '<nav class="main-nav-equal" id="category-nav-list">' +
      '<a class="cat-tab ' + (activePage==='home'?'active':'') + '" href="index.html">Trang chủ</a>' +
      '<a class="cat-tab ' + (activePage==='all'?'active':'') + '" href="index.html#products">Tất cả sản phẩm</a>' +
      '<a class="cat-tab" href="index.html#products">Túi vải</a>' +
      '<a class="cat-tab" href="index.html#products">Áo freesize</a>' +
      '<a class="cat-tab" href="index.html#products">Phụ kiện</a>' +
      '<a class="cat-tab" href="index.html#products">Móc khóa</a>' +
      '<a class="cat-tab" href="index.html#products">Nam châm</a>' +
    '</nav>' +
  '</header>';
}

function renderMegaMenu() {
  var menu = document.getElementById('mega-menu');
  if (!menu) return;
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
  menu.innerHTML = html || '<p>Chưa có sản phẩm.</p>';
}

function renderOrdersMenu() {
  var wrap = document.getElementById('nav-orders');
  var menu = document.getElementById('orders-menu');
  if (!wrap || !menu) return;
  if (isAdmin()) {
    wrap.classList.add('has-drop');
    menu.innerHTML = [
      ['tab-admin-stock-in', 'Quản lý Nhập hàng'],
      ['tab-admin-orders', 'Quản lý Đơn hàng'],
      ['tab-admin-inventory', 'Quản lý Tồn kho']
    ].map(function (m) {
      return '<a href="' + PAGE_LINKS.orders + '#' + m[0] + '" data-tab="' + m[0] + '">' + m[1] + '</a>';
    }).join('');
  } else {
    wrap.classList.remove('has-drop');
    menu.innerHTML = '';
  }
}

function renderHeader() {
  renderMegaMenu();
  renderOrdersMenu();
  var box = document.getElementById('user-header-box');
  if (!box) return;
  
  if (currentUser) {
    box.innerHTML = 
      '<span style="font-size:13px; font-weight:700; color:var(--primary-color);">' + esc(currentUser.fullname) + '</span>' +
      '<a href="cart.html" class="icon-btn cart-icon-btn" title="Giỏ hàng">' +
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>' +
      '</a>' +
      '<button class="btn-outline btn-sm" onclick="logout()">Đăng xuất</button>';
  } else {
    // Khi chưa đăng nhập 
    var cart = load('wishy_cart', []);
    var cartCount = cart.reduce(function(s, i) { return s + (i.qty || 0); }, 0);
    box.innerHTML = 
      '<a href="#" class="icon-btn" title="Tài khoản" onclick="openAuth(\'login\'); return false;">' +
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
          '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>' +
          '<circle cx="12" cy="7" r="4"></circle>' +
        '</svg>' +
      '</a>' +
      '<a href="cart.html" class="icon-btn cart-icon-btn" title="Giỏ hàng" onclick="checkCartAccess(event)">' +
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
          '<circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>' +
          '<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>' +
        '</svg>' +
        '<span class="cart-badge">' + cartCount + '</span>' +
      '</a>';
  }
}

function refreshPage() {
  renderHeader();
  if (typeof renderPage === 'function') renderPage();
}

function initSite(activePage) {
  var holder = document.getElementById('site-header');
  if (holder) holder.innerHTML = siteHeaderHtml(activePage);
  var foot = document.getElementById('site-footer');
  if (foot) foot.innerHTML = '<footer class="site-footer">© ' + new Date().getFullYear() + ' wishy - Cửa hàng đồ lưu niệm</footer>';
  if (!document.getElementById('overlay')) {
    var ov = document.createElement('div');
    ov.className = 'overlay';
    ov.id = 'overlay';
    ov.innerHTML = '<div class="modal" id="modal"></div>';
    ov.addEventListener('click', function (e) { if (e.target === ov) closeModal(); });
    document.body.appendChild(ov);
  }
  refreshPage();
}

document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('a[href="#"]');
  if (a) e.preventDefault();
});

function closeModal() { document.getElementById('overlay').classList.remove('show'); }
function openModal(html, wide) {
  var m = document.getElementById('modal');
  m.className = 'modal' + (wide ? ' wide' : '');
  m.innerHTML = '<button class="modal-close" onclick="closeModal()">&times;</button>' + html;
  document.getElementById('overlay').classList.add('show');
}

function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(function (t) { t.classList.toggle('active', t.id === tabId); });
  document.querySelectorAll('[data-tab]').forEach(function (a) { a.classList.toggle('current', a.getAttribute('data-tab') === tabId); });
}
function tabFromHash() { return location.hash ? location.hash.slice(1) : ''; }

function openAuth(mode) {
  var ov = document.getElementById('overlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.className = 'overlay';
    ov.id = 'overlay';
    ov.innerHTML = '<div class="modal" id="modal"></div>';
    ov.onclick = function (e) { if (e.target === ov) closeModal(); };
    document.body.appendChild(ov);
  }
  
  var m = document.getElementById('modal');
  if (!m) return;
  m.className = 'modal' + (mode === 'register' ? ' wide' : '');
  m.innerHTML =
    '<button class="modal-close" onclick="closeModal()">&times;</button>' +
    '<div class="auth-tabs">' +
      '<button id="auth-tab-login" class="' + (mode === 'login' ? 'active' : '') + '" onclick="openAuth(\'login\')">Đăng nhập</button>' +
      '<button id="auth-tab-register" class="' + (mode === 'register' ? 'active' : '') + '" onclick="openAuth(\'register\')">Đăng ký</button>' +
    '</div>' +
    (mode === 'login' ? loginForm() : registerForm());

  ov.style.cssText = 'display: flex !important; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); z-index: 99999; align-items: center; justify-content: center;';
}

function closeModal() {
  var ov = document.getElementById('overlay');
  if (ov) {
    ov.style.display = 'none';
  }
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
  refreshPage();
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
  refreshPage();
  return false;
}
function logout() {
  currentUser = null;
  save('wishy_current', null);
  refreshPage();
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Enter' && document.getElementById('overlay').classList.contains('show')) {
    if (document.getElementById('lg-user')) doLogin();
  }
});

// Bật/tắt menu khi bấm Icon User
function toggleUserDropdown(e) {
  if (e) e.preventDefault();
  var menu = document.getElementById('user-drop-menu');
  if (menu) {
    menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
  }
}

// Click ra ngoài thì đóng menu
document.addEventListener('DOMContentLoaded', function() {
  var cart = load('wishy_cart', []);
  var cartCount = cart.reduce(function(s, i) { return s + (i.qty || 0); }, 0);
  var badge = document.getElementById('cart-count-badge');
  if (badge) badge.textContent = cartCount;
});

// Kiểm tra giỏ hàng khi chưa đăng nhập
function checkCartAccess(e) {
  var currentUser = JSON.parse(localStorage.getItem('wishy_current'));
  if (!currentUser) {
    if (e) e.preventDefault();
    openAuth('login');
  }
}
