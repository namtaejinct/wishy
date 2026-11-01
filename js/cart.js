/* === DỮ LIỆU MẶC ĐỊNH & KHO CHUNG === */
products.forEach(function(p) {
  var salePrice = Number(p.price) || 0;
  p.cost = p.cost || Math.round(salePrice * 0.7);
  p.margin = p.margin || 30;
  p.price = salePrice;
});
save('wishy_products', products);

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

/* === ĐIỀU PHỐI CHUNG === */
function renderAll() {
  renderHeader();
  var logged = !!currentUser;
  var welcome = document.getElementById('welcome-screen');
  var app = document.getElementById('app-screen');
  if (welcome) welcome.style.display = logged ? 'none' : 'block';
  if (app) app.style.display = logged ? 'block' : 'none';
  
  if (!logged) return;

  switchTab(currentTab);
  if (typeof renderCart === 'function') {
    renderCart();
}}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeModal();
});
