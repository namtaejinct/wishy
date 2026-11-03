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
  { username: 'admin', email: 'admin@wishy.vn', password: 'admin123', fullname: 'Quản trị viên', role: 'admin' },
  { username: 'nam', email: 'nam@gmail.com', password: '123456', fullname: 'Đặng Phương Nam', role: 'customer' },
  { username: 'lan', email: 'lan@gmail.com', password: '123456', fullname: 'Nguyễn Thị Lan', role: 'customer' }
]);

function initAdminAccount() {
  var admin = users.filter(function (u) { return u.username === 'admin'; })[0];
  if (!admin) {
    users.push({ username: 'admin', email: 'admin@wishy.vn', password: 'admin123', fullname: 'Quản trị viên', role: 'admin' });
  } else {
    admin.email = 'admin@wishy.vn';
    admin.password = 'admin123';
    admin.fullname = 'Quản trị viên';
    admin.role = 'admin';
  }
  save('wishy_users', users);
}
initAdminAccount();

(function () {
  var seedEmails = { admin: 'admin@wishy.vn', nam: 'nam@gmail.com', lan: 'lan@gmail.com' };
  var changed = false;
  users.forEach(function (u) {
    if (!u.email) {
      u.email = seedEmails[u.username] || (u.username + '@wishy.vn');
      changed = true;
    }
  });
  if (changed) save('wishy_users', users);
})();

// Dữ liệu đơn hàng mẫu
var orders = load('wishy_orders', [
  { id: 'DH001', user: 'nam', date: '2026-10-15', status: 'Đã giao', items: [{ pid: 'SP002', qty: 1 }] },
  { id: 'DH002', user: 'nam', date: '2026-10-19', status: 'Chờ xác nhận', items: [{ pid: 'SP001', qty: 2 }] },
  { id: 'DH003', user: 'lan', date: '2026-10-20', status: 'Chờ lấy hàng', items: [{ pid: 'SP003', qty: 1 }, { pid: 'SP004', qty: 2 }] }
]);

orders.forEach(function (o) {
  if (o.status === 'Mới đặt') o.status = 'Chờ xác nhận';
  if (o.status === 'Đã xử lý') o.status = 'Chờ lấy hàng';
});
save('wishy_orders', orders);

// Trang khách (client) KHÔNG được có phiên admin.
// Nếu localStorage còn phiên admin cũ thì xóa đi.
var currentUser = load('wishy_current', null);
if (currentUser && currentUser.role === 'admin') {
  currentUser = null;
  save('wishy_current', null);
}

function findProduct(id) { return products.filter(function (p) { return p.id === id; })[0]; }
function findUser(u) { return users.filter(function (x) { return x.username === u; })[0]; }
function findUserByEmail(e) {
  e = String(e).trim().toLowerCase();
  return users.filter(function (x) { return String(x.email || '').toLowerCase() === e; })[0];
}

function linePrice(it) {
  if (it.price !== undefined) return it.price;   // giá đã lưu lúc mua
  var p = findProduct(it.pid);
  return p ? p.price : 0;                        // đơn cũ chưa có giá thì dùng giá hiện tại
}
function orderTotal(o) {
  return o.items.reduce(function (s, it) { return s + linePrice(it) * it.qty; }, 0);
}
function isAdmin() { return !!currentUser && currentUser.role === 'admin'; }

function cartCount() {
  if (!currentUser || !currentUser.username) return 0; 
  var cart = load('wishy_cart_' + currentUser.username, []);
  return cart.reduce(function (s, i) { return s + (i.qty || 0); }, 0);
}

var ICON_USER =
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
    '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>' +
    '<circle cx="12" cy="7" r="4"></circle>' +
  '</svg>';
var ICON_CART =
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
    '<circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>' +
    '<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>' +
  '</svg>';

function siteHeaderHtml(activePage) {
  return '<header class="site-header">' +
    '<div class="header-top">' +
      '<div class="header-left-space"></div>' +
      '<div class="logo"><a href="index.html" style="text-decoration:none; color:inherit;">WISHY</a></div>' +
      '<div id="user-header-box" class="header-right-icons"></div>' +
    '</div>' +
    '<nav class="main-nav-equal" id="category-nav-list">' +
      '<a class="cat-tab ' + (activePage === 'home' ? 'active' : '') + '" href="index.html">Trang chủ</a>' +
      '<a class="cat-tab ' + (activePage === 'all' ? 'active' : '') + '" href="index.html#products">Tất cả sản phẩm</a>' +
      '<a class="cat-tab" href="index.html#products">Túi vải</a>' +
      '<a class="cat-tab" href="index.html#products">Áo thun</a>' +
      '<a class="cat-tab" href="index.html#products">Phụ kiện</a>' +
      '<a class="cat-tab" href="index.html#products">Móc khóa</a>' +
      '<a class="cat-tab" href="index.html#products">Bưu thiếp</a>' +
    '</nav>' +
  '</header>';
}

function renderHeader() {
  var box = document.getElementById('user-header-box');
  if (!box) return;
  
  var cartBtn =
    '<a href="cart.html" class="icon-btn cart-icon-btn" title="Giỏ hàng" onclick="checkCartAccess(event)">' +
      '<img src="images/logo/cart.png" alt="Cart">' +
      '<span class="cart-badge" id="cart-count-badge">' + cartCount() + '</span>' +
    '</a>';

  if (currentUser) {
    box.innerHTML =
      '<div class="user-dropdown-wrapper">' +
        '<a href="profile.html" class="icon-btn" title="Tài khoản">' +
          '<img src="images/logo/user.png" alt="User">' +
        '</a>' +
        '<div class="user-dropdown-menu">' +
          '<a href="profile.html">Trang cá nhân</a>' +
          '<button onclick="logout()">Đăng xuất</button>' +
        '</div>' +
      '</div>' +
      cartBtn;
  } else {
    box.innerHTML =
      '<a href="#" class="icon-btn" title="Tài khoản" onclick="openAuth(\'login\'); return false;">' +
        '<img src="images/logo/user.png" alt="User">' +
      '</a>' +
      cartBtn;
  }
}

function refreshPage() {
  renderHeader();
  if (typeof renderPage === 'function') renderPage();
}

function ensureOverlay() {
  var ov = document.getElementById('overlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.className = 'overlay';
    ov.id = 'overlay';
    ov.innerHTML = '<div class="modal" id="modal"></div>';
    ov.addEventListener('click', function (e) { if (e.target === ov) closeModal(); });
    document.body.appendChild(ov);
  }
  return ov;
}

function initSite(activePage) {
  var holder = document.getElementById('site-header');
  if (holder) holder.innerHTML = siteHeaderHtml(activePage);
  var foot = document.getElementById('site-footer');
  if (foot) foot.innerHTML = '<footer class="site-footer">© ' + new Date().getFullYear() + ' wishy - Cửa hàng đồ lưu niệm</footer>';
  ensureOverlay();
  refreshPage();
}

document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('a[href="#"]');
  if (a) e.preventDefault();
});

// Chỉ một closeModal / openModal dùng chung cho mọi popup (kể cả đăng nhập)
function showOverlay() {
  var ov = ensureOverlay();
  ov.classList.add('show');
  ov.style.display = 'flex';
}
function closeModal() {
  var ov = document.getElementById('overlay');
  if (!ov) return;
  ov.classList.remove('show');
  ov.style.display = 'none';
}
function openModal(html, wide) {
  ensureOverlay();
  var m = document.getElementById('modal');
  m.className = 'modal' + (wide ? ' wide' : '');
  m.innerHTML = '<button class="modal-close" onclick="closeModal()">&times;</button>' + html;
  showOverlay();
}

function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(function (t) { t.classList.toggle('active', t.id === tabId); });
  document.querySelectorAll('[data-tab]').forEach(function (a) { a.classList.toggle('current', a.getAttribute('data-tab') === tabId); });
}
function tabFromHash() { return location.hash ? location.hash.slice(1) : ''; }

function openAuth(mode) {
  ensureOverlay();
  var m = document.getElementById('modal');
  m.className = 'modal' + (mode === 'register' ? ' wide' : '');
  m.innerHTML =
    '<button class="modal-close" onclick="closeModal()">&times;</button>' +
    '<div class="auth-tabs">' +
      '<button id="auth-tab-login" class="' + (mode === 'login' ? 'active' : '') + '" onclick="openAuth(\'login\')">Đăng nhập</button>' +
      '<button id="auth-tab-register" class="' + (mode === 'register' ? 'active' : '') + '" onclick="openAuth(\'register\')">Đăng ký</button>' +
    '</div>' +
    (mode === 'login' ? loginForm() : registerForm());
  showOverlay();
}

function loginForm() {
  return '<div class="form-row"><label>Email</label><input id="lg-email" type="email" placeholder="Nhập email..." autocomplete="email"></div>' +
         '<div class="form-row"><label>Mật khẩu</label><input id="lg-pass" type="password" placeholder="Nhập mật khẩu..." autocomplete="current-password"></div>' +
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
    '      <label for="email">Email</label>',
    '      <input type="email" id="email" placeholder="ten@gmail.com" autocomplete="email">',
    '      <div class="error" id="err-email"></div>',,
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
  var email = document.getElementById('lg-email').value.trim();
  var p = document.getElementById('lg-pass').value;
  if (!email || !p) return authError('Vui lòng nhập đầy đủ Email và Mật khẩu!');
  var user = findUserByEmail(email);
  if (!user || user.role === 'admin' || user.password !== p) return authError('Email hoặc mật khẩu không chính xác!');
  if (user.status === 'locked') return authError('Tài khoản của bạn đã bị khóa!');
  currentUser = { username: user.username, fullname: user.fullname, role: user.role };
  save('wishy_current', currentUser);
  closeModal();
  refreshPage();
  setTimeout(function () { alert('Đã đăng nhập thành công'); }, 100);
}
function handleRegister(e) {
  if (e) e.preventDefault();
  var fields = ['fullname', 'email', 'address', 'phone', 'username', 'password', 'confirm'];
  var v = {};
  fields.forEach(function (f) {
    v[f] = document.getElementById(f).value;
    document.getElementById('err-' + f).textContent = '';
  });
  v.fullname = v.fullname.trim();
  v.email = v.email.trim().toLowerCase();
  v.address = v.address.trim();
  v.phone = v.phone.trim();
  v.username = v.username.trim();

  var errors = {};
  if (v.fullname.length < 2) errors.fullname = 'Vui lòng nhập họ và tên.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) errors.email = 'Email không hợp lệ (VD: ten@gmail.com).';
  else if (findUserByEmail(v.email)) errors.email = 'Email này đã được đăng ký.';
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

  users.push({ username: v.username, email: v.email, password: v.password, fullname: v.fullname, address: v.address, phone: v.phone, role: 'customer' });
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
  if (window.location.pathname.indexOf('profile.html') !== -1 || window.location.pathname.indexOf('cart.html') !== -1) {
    window.location.href = 'index.html';
  }
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Enter') {
    var ov = document.getElementById('overlay');
    if (ov && ov.classList.contains('show') && document.getElementById('lg-email')) doLogin();
  }
});

// Chưa đăng nhập thì bấm giỏ hàng sẽ mở popup đăng nhập
function checkCartAccess(e) {
  if (!currentUser) {
    if (e) e.preventDefault();
    openAuth('login');
  }
}


//san pham

var defaultProducts = [
  //tui vai
  { 
    id: 'SP001', 
    name: 'Túi tote Dân Địa Phương', 
    type: 'Túi vải', 
    price: 150000, 
    stock: 12, 
    img: 'images/totebag-dandiaphuong1.png', 
    images: ['images/totebag-dandiaphuong1.png', 'images/totebag-dandiaphuong2.png'], 
    desc: 'Túi tote chất liệu vải canvas bền đẹp, in chữ "Dân Địa Phương" phong cách trẻ trung, tiện dụng.' 
  },
  { 
    id: 'SP002', 
    name: 'Túi tote Bình An Vô Sự', 
    type: 'Túi vải', 
    price: 150000, 
    stock: 16, 
    img: 'images/totebag-binhanvosu1.png', 
    images: ['images/totebag-binhanvosu1.png', 'images/totebag-binhanvosu2.png'], 
    desc: 'Túi tote chất liệu vải canvas bền đẹp, in chữ "Bình An Vô Sự" phong cách trẻ trung, tiện dụng.' 
  },
  { 
    id: 'SP003', 
    name: 'Túi tote Bạt', 
    type: 'Túi vải', 
    price: 150000, 
    stock: 4, 
    img: 'images/totebag-bat1.png', 
    images: ['images/totebag-bat1.png', 'images/totebag-bat2.png'], 
    variants: ['You can sit with us', 'Always Hungry'],
    desc: 'Túi tote chất liệu vải canvas bền đẹp, lấy cảm hứng từ vải bạt, phong cách trẻ trung, tiện dụng.' 
  },

  //postcard
  { 
    id: 'SP004', 
    name: 'Bưu thiếp "Địa điểm Việt Nam"', 
    type: 'Bưu thiếp', 
    price: 80000, 
    stock: 15, 
    img: 'images/postcard-vietnameseplaces1.png', 
    images: ['images/postcard-vietnameseplaces1.png', 'images/postcard-vietnameseplaces2.png'], 
    desc: 'Bộ thiệp minh họa các địa danh nổi tiếng của Việt Nam.' 
  },
  { 
    id: 'SP005', 
    name: 'Bưu thiếp "Hà Nội"', 
    type: 'Bưu thiếp', 
    price: 60000, 
    stock: 7, 
    img: 'images/postcard-hanoi1.png', 
    images: ['images/postcard-hanoi1.png', 'images/postcard-hanoi2.png'], 
    desc: 'Bộ thiệp minh họa các địa danh nổi tiếng của Việt Nam.' 
  },
  { 
    id: 'SP006', 
    name: 'Bưu thiếp "Vietnamese Street Life"', 
    type: 'Bưu thiếp', 
    price: 80000, 
    stock: 9, 
    img: 'images/postcard-phuongsongdep1.png', 
    images: ['images/postcard-phuongsongdep1.png', 'images/postcard-phuongsongdep2.png'], 
    desc: 'Bộ thiệp minh họa các địa danh nổi tiếng của Việt Nam.' 
  },
  { 
    id: 'SP007', 
    name: 'Bưu thiếp "Hồ Chí Minh"', 
    type: 'Bưu thiếp', 
    price: 60000, 
    stock: 13, 
    img: 'images/postcard-hochiminh1.png', 
    images: ['images/postcard-hochiminh1.png', 'images/postcard-hochiminh2.png'], 
    desc: 'Bộ thiệp minh họa các địa danh nổi tiếng của Việt Nam.' 
  },
  { 
    id: 'SP008', 
    name: 'Bưu thiếp "Đi Chợ"', 
    type: 'Bưu thiếp', 
    price: 60000, 
    stock: 19, 
    img: 'images/postcard-dicho1.png', 
    images: ['images/postcard-dicho1.png', 'images/postcard-dicho2.png'], 
    desc: 'Bộ thiệp minh họa các địa danh nổi tiếng của Việt Nam.' 
  },

  //moc khoa
  { 
    id: 'SP009', 
    name: 'Móc khoá Đĩa Than "Mountain Child"', 
    type: 'Móc khóa', 
    price: 40000, 
    stock: 15, 
    img: 'images/keychain-mountain1.png', 
    images: ['images/keychain-mountain1.png', 'images/keychain-mountain2.png'], 
    desc: 'Móc khóa acrylic hình đĩa than chủ đề "Mountain" thuộc bộ sưu tập Music of the city.' 
  },
  { 
    id: 'SP010', 
    name: 'Móc khoá Đĩa Than "Đà Lạt"', 
    type: 'Móc khóa', 
    price: 40000, 
    stock: 18, 
    img: 'images/keychain-dalat1.png', 
    images: ['images/keychain-dalat1.png', 'images/keychain-dalat2.png'], 
    desc: 'Móc khóa acrylic hình đĩa than chủ đề "City" thuộc bộ sưu tập Music of the city.' 
  },
  { 
    id: 'SP011', 
    name: 'Móc khoá Đĩa Than "Hà Nội"', 
    type: 'Móc khóa', 
    price: 40000, 
    stock: 5, 
    img: 'images/keychain-hanoi1.png', 
    images: ['images/keychain-hanoi1.png', 'images/keychain-hanoi2.png'], 
    desc: 'Móc khóa acrylic hình đĩa than chủ đề "City" thuộc bộ sưu tập Music of the city.' 
  },
  { 
    id: 'SP012', 
    name: 'Móc khoá Đĩa Than "Sài Gòn"', 
    type: 'Móc khóa', 
    price: 40000, 
    stock: 9, 
    img: 'images/keychain-saigon1.png', 
    images: ['images/keychain-saigon1.png', 'images/keychain-saigon2.png'], 
    desc: 'Móc khóa acrylic hình đĩa than chủ đề "City" thuộc bộ sưu tập Music of the city.' 
  },
  { 
    id: 'SP013', 
    name: 'Móc khoá Đĩa Than "Ocean"', 
    type: 'Móc khóa', 
    price: 40000, 
    stock: 13, 
    img: 'images/keychain-ocean1.png', 
    images: ['images/keychain-ocean1.png', 'images/keychain-ocean2.png'], 
    desc: 'Móc khóa acrylic hình đĩa than chủ đề "Ocean" thuộc bộ sưu tập Music of the city.' 
  },
  { 
    id: 'SP014', 
    name: 'Móc khoá Đĩa Than "Việt Nam"', 
    type: 'Móc khóa', 
    price: 40000, 
    stock: 6, 
    img: 'images/keychain-vietnam1.png', 
    images: ['images/keychain-vietnam1.png', 'images/keychain-vietnam2.png'], 
    desc: 'Móc khóa acrylic hình đĩa than chủ đề "Vietnam" thuộc bộ sưu tập Music of the city.' 
  },
  
  //jewelry
  { 
    id: 'SP015', 
    name: 'Dây chuyền "Vỏ sò 1"', 
    type: 'Phụ kiện', 
    price: 200000, 
    stock: 15, 
    img: 'images/jewelry-v11.png', 
    images: ['images/jewelry-v11.png', 'images/jewelry-v12.png'], 
    desc: 'Dây chuyền hạt cườm sáng màu kết hợp mặt vỏ sò lớn và charm sao biển phong cách mùa hè, biển cả.' 
  },{ 
    id: 'SP016', 
    name: 'Dây chuyền "Vỏ sò 2"', 
    type: 'Phụ kiện', 
    price: 200000, 
    stock: 20, 
    img: 'images/jewelry-v21.png', 
    images: ['images/jewelry-v21.png', 'images/jewelry-v22.png'], 
    desc: 'Dây chuyền hạt cườm sáng màu kết hợp mặt vỏ sò lớn và charm sao biển phong cách mùa hè, biển cả.' 
  },

  //aothun
  { 
    id: 'SP017', 
    name: 'Áo thun Wishy "Hà Nội"', 
    type: 'Áo thun', 
    price: 360000, 
    stock: 7, 
    img: 'images/aohanoi1.png', 
    images: ['images/aohanoi1.png', 'images/ao-matsau.png'],
    desc: 'Áo thun chất liệu cotton 100% thoáng mát.' 
  },
  { 
    id: 'SP018', 
    name: 'Áo thun Wishy "Phú Quốc"', 
    type: 'Áo thun', 
    price: 360000, 
    stock: 13, 
    img: 'images/aophuquoc1.png', 
    images: ['images/aophuquoc1.png', 'images/ao-matsau.png'],
    desc: 'Áo thun chất liệu cotton 100% thoáng mát.' 
  },
  { 
    id: 'SP019', 
    name: 'Áo thun Wishy "Đà Lạt"', 
    type: 'Áo thun', 
    price: 360000, 
    stock: 6, 
    img: 'images/aodalat1.png', 
    images: ['images/aodalat1.png', 'images/ao-matsau.png'],
    desc: 'Áo thun chất liệu cotton 100% thoáng mát.' 
  },
  { 
    id: 'SP020', 
    name: 'Áo thun Wishy "Sài Gòn"', 
    type: 'Áo thun', 
    price: 360000, 
    stock: 19, 
    img: 'images/aosaigon1.png', 
    images: ['images/aosaigon1.png', 'images/ao-matsau.png'],
    desc: 'Áo thun chất liệu cotton 100% thoáng mát.' 
  }
];

var products = load('wishy_products', defaultProducts);
products.forEach(function (p) {
  p.price = Number(p.price) || 0;
  if (p.cost === undefined) p.cost = Math.round(p.price * 0.7);
  if (p.margin === undefined) p.margin = Math.round((p.price / p.cost - 1) * 100);
});
save('wishy_products', products);

// Danh sách loại sản phẩm dùng chung cho trang khách và trang admin
var categories = load('wishy_categories', ['Túi vải', 'Áo thun', 'Phụ kiện', 'Móc khóa', 'Bưu thiếp']);
(function () {
  var changed = false;
  products.forEach(function (p) {
    if (p.type && categories.indexOf(p.type) === -1) { categories.push(p.type); changed = true; }
  });
  if (changed) save('wishy_categories', categories);
})();

// Ảnh tạm cho sản phẩm admin thêm mới chưa có ảnh
var NO_IMAGE = 'images/placeholder.jpg';

// Đồng bộ dữ liệu giữa các tab
function syncData() {
  users = load('wishy_users', users);
  products = load('wishy_products', products);
  orders = load('wishy_orders', orders);
  categories = load('wishy_categories', categories);
}
window.addEventListener('storage', function () {
  syncData();
  if (typeof onDataChanged === 'function') onDataChanged();
});
