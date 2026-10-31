/* === DÙNG CHUNG === */
function esc(s) { 
  return String(s).replace(/[&<>"']/g, function (c) { 
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; 
  }); 
}
function money(n) { return Number(n || 0).toLocaleString('vi-VN') + 'đ'; }

function load(key, seed) {
  try { var raw = localStorage.getItem(key); if (raw) return JSON.parse(raw); } catch (e) {}
  save(key, seed); return seed;
}
function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }

/* === DỮ LIỆU MẶC ĐỊNH & KHO CHUNG === */
var defaultProducts = [
  { id: 'SP001', name: 'Áo thun basic', type: 'Thời trang', cost: 100000, margin: 50, price: 150000, stock: 10 },
  { id: 'SP002', name: 'Balo laptop', type: 'Phụ kiện', cost: 250000, margin: 40, price: 350000, stock: 5 },
  { id: 'SP003', name: 'Giày thể thao', type: 'Giày dép', cost: 600000, margin: 48, price: 890000, stock: 12 }
];

var products = load('wishy_products', defaultProducts);
products.forEach(function(p) {
  var salePrice = Number(p.price) || 0;
  p.cost = p.cost || Math.round(salePrice * 0.7);
  p.margin = p.margin || 30;
  p.price = salePrice;
});
save('wishy_products', products);
var users = load('wishy_users', []);
var cart = load('wishy_cart', []);
var orders = load('wishy_orders', []);
var currentUser = load('wishy_current', null);

function findProduct(id) { return products.filter(function (p) { return p.id === id; })[0]; }
function isAdmin() { return currentUser && currentUser.role === 'admin'; }

/* === HEADER & ĐĂNG NHẬP === */
function renderHeader() {
  renderCartMenu();
  var box = document.getElementById('user-header-box');
  if (!box) return;
  if (currentUser) {
    box.innerHTML = '<span class="user-greeting">Xin chào, <span class="user-name">' + esc(currentUser.fullname) + '</span></span>' +
                    '<button class="btn-outline btn-sm" onclick="logout()">Đăng xuất</button>';
  } else {
    box.innerHTML = '<button class="btn-outline btn-sm" onclick="openAuth(\'login\')">Đăng nhập</button>' +
                    '<button class="btn btn-sm" style="margin-left: 6px;" onclick="openAuth(\'register\')">Đăng ký</button>';
  }
}
function renderCartMenu() {
  var wrap = document.getElementById('nav-cart');
  var menu = document.getElementById('cart-menu');
  if (!wrap || !menu) return;
  if (isAdmin()) {
    wrap.classList.add('has-drop');
    menu.innerHTML = '<a href="#" onclick="switchTab(\'tab-admin-pricing\')">Quản lý Giá &amp; Lợi nhuận</a>';
  } else {
    wrap.classList.remove('has-drop');
    menu.innerHTML = '';
  }
}

function openAuth(mode) {
  var m = document.getElementById('modal');
  if (!m) return;
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

function closeModal() { 
  var overlay = document.getElementById('overlay');
  if(overlay) overlay.classList.remove('show'); 
}

function loginForm() {
  return '<div class="form-row"><label>Tên đăng nhập</label><input id="lg-user" placeholder="Nhập tên đăng nhập..." autocomplete="username"></div>' +
         '<div class="form-row"><label>Mật khẩu</label><input id="lg-pass" type="password" placeholder="Nhập mật khẩu..." autocomplete="current-password"></div>' +
         '<div class="form-error" id="auth-error"></div>' +
         '<button class="btn" style="width:100%" onclick="doLogin()">Đăng nhập</button>' +
         '<p style="text-align:center; margin-top:14px; font-size:14px; color:#7B8BA0;">Chưa có tài khoản? <a href="#" onclick="openAuth(\'register\'); return false;" style="color:var(--accent-color); font-weight:700; text-decoration:none;">Đăng ký ngay</a></p>';
}

function registerForm() {
  return '<div id="register-form">' +
           '<div class="form-row">' +
             '<div class="form-col"><label>Họ và tên</label><input id="reg-name" placeholder="Nguyễn Văn A"></div>' +
             '<div class="form-col"><label>Tên đăng nhập</label><input id="reg-user" placeholder="4-20 ký tự: chữ, số, dấu _"></div>' +
           '</div>' +
           '<div class="form-row">' +
             '<div class="form-col"><label>Địa chỉ</label><input id="reg-address" placeholder="Số nhà, đường, phường/xã..."></div>' +
             '<div class="form-col"><label>Mật khẩu</label><input type="password" id="reg-pass" placeholder="Tối thiểu 6 ký tự"></div>' +
           '</div>' +
           '<div class="form-row">' +
             '<div class="form-col"><label>Số điện thoại</label><input id="reg-phone" placeholder="0901234567" maxlength="11" oninput="this.value = this.value.replace(/[^0-9]/g, \'\')"></div>' +
             '<div class="form-col"><label>Nhập lại mật khẩu</label><input type="password" id="reg-repass" placeholder="Nhập lại mật khẩu..."></div>' +
           '</div>' +
         '</div>' +
         '<div class="form-error" id="auth-error"></div>' +
         '<div class="form-actions"><button class="btn" onclick="doRegister()">Đăng ký</button></div>';
}
function authError(msg) { 
  var err = document.getElementById('auth-error');
  if(err) err.textContent = msg; 
}

function doLogin() {
  var u = document.getElementById('lg-user').value.trim();
  var p = document.getElementById('lg-pass').value;
  var user = users.filter(function (x) { return x.username === u && x.password === p; })[0];
  if (!user) { authError('Sai tên đăng nhập hoặc mật khẩu.'); return; }
  currentUser = { username: user.username, fullname: user.fullname, role: user.role, address: user.address, phone: user.phone };
  save('wishy_current', currentUser);
  closeModal();
  renderAll();
}

function logout() { currentUser = null; save('wishy_current', null); renderAll(); }

/* === PHÂN QUYỀN & CHUYỂN TAB === */
var currentTab = 'tab-cart-view';
function switchTab(id) {
  if (isAdmin()) id = 'tab-admin-pricing';
  currentTab = id;
  document.querySelectorAll('.tab-content').forEach(function (t) { t.classList.toggle('active', t.id === id); });
  if (id === 'tab-admin-pricing') renderPricing();
  else if (id === 'tab-cart-view') renderCart();
}
function goCart() { if (!currentUser) { openAuth('login'); return; } switchTab(currentTab); }

/* === GIỎ HÀNG === */
function renderCart() {
  var container = document.getElementById('cart-items-container');
  if (!container) return;
  
  if (!cart || !cart.length) {
    container.innerHTML = '<div style="text-align:center; padding: 30px; color:#7B8BA0; font-style:italic;">Giỏ hàng của bạn đang trống. Hãy qua trang Sản phẩm để chọn hàng nhé!</div>';
    document.getElementById('cart-grand-total').textContent = 'Tổng tiền: 0đ';
    var chkAll = document.getElementById('select-all-chk');
    if(chkAll) chkAll.checked = false;
    return;
  }

  var total = 0;
  var allChecked = true;

  // Khởi tạo thuộc tính selected cho các sp
  cart.forEach(function(item) {
    if (typeof item.selected === 'undefined') item.selected = true;
  });

  container.innerHTML = cart.map(function (item) {
    var p = findProduct(item.pid);
    if (!p) return '';
    var sub = p.price * item.qty;
    if (item.selected) total += sub;
    else allChecked = false;

    return '<div class="cart-item-row">' +
      '<div class="col-chk"><input type="checkbox" ' + (item.selected ? 'checked' : '') + ' onchange="toggleSelectItem(\'' + item.pid + '\', this.checked)"></div>' +
      '<div class="col-name">' + esc(p.name) + '</div>' +
      '<div class="col-price">' + money(p.price) + '</div>' +
      '<div class="col-qty">' +
        '<button class="btn-outline btn-sm" onclick="updateQty(\'' + item.pid + '\', -1)">-</button>' +
        '<span>' + item.qty + '</span>' +
        '<button class="btn-outline btn-sm" onclick="updateQty(\'' + item.pid + '\', 1)">+</button>' +
      '</div>' +
      '<div class="col-subtotal">' + money(sub) + '</div>' +
      '<div class="col-action"><button class="btn-danger btn-sm" onclick="removeCartItem(\'' + item.pid + '\')">Xóa</button></div>' +
    '</div>';
  }).join('');

  var masterChk = document.getElementById('select-all-chk');
  if (masterChk) masterChk.checked = cart.length > 0 && allChecked;

  document.getElementById('cart-grand-total').textContent = 'Tổng tiền: ' + money(total);
  document.getElementById('checkout-grand-total').textContent = 'Tổng thanh toán: ' + money(total);
}

function toggleSelectItem(pid, isChecked) {
  var item = cart.filter(function (i) { return i.pid === pid; })[0];
  if (item) { item.selected = isChecked; save('wishy_cart', cart); renderCart(); }
}

function toggleSelectAll(master) {
  var isChecked = master.checked;
  cart.forEach(function (i) { i.selected = isChecked; });
  save('wishy_cart', cart);
  renderCart();
}

function updateQty(pid, delta) {
  var item = cart.filter(function (i) { return i.pid === pid; })[0];
  if (!item) return;
  
  var p = findProduct(pid);
  if (p && delta > 0 && (item.qty + delta) > p.stock) {
    alert('Sản phẩm này chỉ còn ' + p.stock + ' món trong kho!');
    return;
  }

  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(function (i) { return i.pid !== pid; });
  save('wishy_cart', cart);
  renderCart();
}

function removeCartItem(pid) {
  cart = cart.filter(function (i) { return i.pid !== pid; });
  save('wishy_cart', cart);
  renderCart();
}

function removeSelectedItems() {
  cart = cart.filter(function (i) { return !i.selected; });
  save('wishy_cart', cart);
  renderCart();
}

/* === LUỒNG THANH TOÁN === */
function showCheckoutSection() {
  var selectedItems = cart.filter(function (i) { return i.selected; });
  if (!selectedItems.length) { alert('Vui lòng chọn ít nhất một sản phẩm để tiến hành đặt hàng!'); return; }

  document.querySelector('.cart-header-row').style.display = 'none';
  document.getElementById('cart-items-container').style.display = 'none';
  document.getElementById('cart-summary-box').style.display = 'none';
  document.querySelector('.cart-title-row').style.display = 'none';
  document.querySelector('.cart-actions-bar').style.display = 'none';

  document.getElementById('checkout-section').style.display = 'block';
}

function backToCart() {
  document.querySelector('.cart-header-row').style.display = 'flex';
  document.getElementById('cart-items-container').style.display = 'flex';
  document.getElementById('cart-summary-box').style.display = 'flex';
  document.querySelector('.cart-title-row').style.display = 'flex';
  document.querySelector('.cart-actions-bar').style.display = 'flex';

  document.getElementById('checkout-section').style.display = 'none';
}

function toggleNewAddress(show) {
  document.getElementById('new-address-box').style.display = show ? 'block' : 'none';
}

function checkoutOrder() {
  var selectedItems = cart.filter(function (i) { return i.selected; });
  if (!selectedItems.length) return;

  // Kiểm tra số lượng tồn kho trước khi chốt đơn
  for (var i = 0; i < selectedItems.length; i++) {
    var it = selectedItems[i];
    var p = findProduct(it.pid);
    if (p && it.qty > p.stock) {
      alert('Sản phẩm "' + p.name + '" vượt quá tồn kho (Còn lại: ' + p.stock + ')');
      return;
    }
  }

  var payMethod = document.querySelector('input[name="pay-method"]:checked').value;
  var payText = payMethod === 'COD' ? 'Tiền mặt khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng';
  var isNewAddr = document.querySelectorAll('input[name="addr-choice"]')[1].checked;
  var shipInfo = '';

  if (isNewAddr) {
    var name = document.getElementById('ship-name').value.trim();
    var phone = document.getElementById('ship-phone').value.trim();
    var addr = document.getElementById('ship-addr').value.trim();
    if (!name || !phone || !addr) { alert('Vui lòng nhập đầy đủ thông tin giao hàng mới!'); return; }
    shipInfo = name + ' - ' + phone + ' (' + addr + ')';
  } else {
    shipInfo = currentUser.fullname + ' - ' + (currentUser.phone || '0901234567') + ' (' + (currentUser.address || 'Địa chỉ mặc định') + ')';
  }

  var orderId = 'DH' + String(orders.length + 1).padStart(3, '0');
  var d = new Date();
  var dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

  var total = selectedItems.reduce(function (sum, item) {
    var p = findProduct(item.pid);
    return sum + (p ? p.price * item.qty : 0);
  }, 0);

  selectedItems.forEach(function(it) {
    var p = findProduct(it.pid);
    if (p) p.stock -= it.qty;
  });
  save('wishy_products', products);

  var newOrder = {
    id: orderId, user: currentUser.username, date: dateStr, status: 'Mới đặt',
    payment: payText, shipInfo: shipInfo, items: JSON.parse(JSON.stringify(selectedItems)), total: total
  };

  orders.push(newOrder);
  save('wishy_orders', orders);

  cart = cart.filter(function (i) { return !i.selected; });
  save('wishy_cart', cart);

  var itemsHtml = newOrder.items.map(function (it) {
    var p = findProduct(it.pid);
    return '<tr><td style="padding: 10px;">' + esc(p ? p.name : '') + '</td><td style="padding: 10px; text-align:center;">' + it.qty + '</td><td style="padding: 10px; text-align:right;">' + money(p ? p.price * it.qty : 0) + '</td></tr>';
  }).join('');

  document.getElementById('invoice-content').innerHTML =
    '<p style="margin-bottom: 6px;"><b>Mã đơn hàng:</b> ' + newOrder.id + '</p>' +
    '<p style="margin-bottom: 6px;"><b>Ngày đặt:</b> ' + newOrder.date + '</p>' +
    '<p style="margin-bottom: 6px;"><b>Người nhận & Địa chỉ:</b> ' + esc(newOrder.shipInfo) + '</p>' +
    '<p style="margin-bottom: 12px;"><b>Thanh toán:</b> ' + newOrder.payment + '</p>' +
    '<table style="width:100%; border-collapse:collapse; margin: 15px 0;">' +
      '<thead><tr style="background:#EBF3FA;"><th style="padding:10px; text-align:left;">Sản phẩm</th><th style="padding:10px; text-align:center;">SL</th><th style="padding:10px; text-align:right;">Thành tiền</th></tr></thead>' +
      '<tbody>' + itemsHtml + '</tbody>' +
    '</table>' +
    '<h3 style="text-align:right; color:var(--primary-color); margin-top: 15px;">Tổng thanh toán: ' + money(total) + '</h3>';

  document.getElementById('checkout-section').style.display = 'none';
  document.getElementById('invoice-box').style.display = 'block';
}

function continueShopping() {
  window.location.href = 'products.html';
}

/* === ADMIN QUẢN LÝ GIÁ === */
function renderPricing() {
  products.forEach(function(p) {
    var salePrice = Number(p.price) || 0;
    p.cost = p.cost || Math.round(salePrice * 0.7);
    p.margin = p.margin || 30;
    p.price = salePrice;
  });
  save('wishy_products', products);

  var select = document.getElementById('pricing-prod-select');
  if (select) {
    select.innerHTML = products.map(function (p) {
      return '<option value="' + p.id + '">' + p.id + ' - ' + esc(p.name) + ' [' + esc(p.type || 'Khác') + ']</option>';
    }).join('');
  }
  filterPricingTable();
}

function saveProductMargin() {
  var pid = document.getElementById('pricing-prod-select').value;
  var marginVal = parseFloat(document.getElementById('pricing-margin-input').value);
  if (isNaN(marginVal) || marginVal < 0) { alert('Vui lòng nhập % hợp lệ.'); return; }

  var p = findProduct(pid);
  if (!p) return;
  p.margin = marginVal;
  p.price = Math.round((p.cost || 0) * (1 + marginVal / 100));

  save('wishy_products', products); //Thành viên 2 cần viết kho tên giống vậy
  renderPricing();
  alert('Cập nhật lợi nhuận và tính lại giá bán thành công!');
}

function filterPricingTable() {
  var searchInput = document.getElementById('search-pricing-input');
  var keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';
  var container = document.getElementById('pricing-items-container');
  if (!container) return;

  var filtered = products.filter(function(p) {
    return p.id.toLowerCase().indexOf(keyword) !== -1 || 
           p.name.toLowerCase().indexOf(keyword) !== -1 || 
           (p.type && p.type.toLowerCase().indexOf(keyword) !== -1);
  });

  if (!filtered.length) {
    container.innerHTML = '<div style="text-align:center; padding: 20px; color:#7B8BA0; font-style:italic;">Không tìm thấy sản phẩm phù hợp.</div>';
    return;
  }

  container.innerHTML = filtered.map(function (p) {
    return '<div class="cart-item-row">' +
      '<div class="col-admin-id">' + p.id + '</div>' +
      '<div class="col-admin-name"><b>' + esc(p.name) + '</b><br><small style="color:#7B8BA0;">Loại: ' + esc(p.type || 'Khác') + '</small></div>' +
      '<div class="col-admin-cost">' + money(p.cost) + '</div>' +
      '<div class="col-admin-margin">' + (p.margin || 0) + '%</div>' +
      '<div class="col-admin-price">' + money(p.price) + '</div>' +
    '</div>';
  }).join('');
}

/* === ĐIỀU PHỐI CHUNG === */
function renderAll() {
  renderHeader();
  var logged = !!currentUser;
  var welcome = document.getElementById('welcome-screen');
  var app = document.getElementById('app-screen');
  if(welcome) welcome.style.display = logged ? 'none' : '';
  if(app) app.style.display = logged ? '' : 'none';
  if (!logged) return;

  switchTab(currentTab);
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeModal();
});

renderAll();
