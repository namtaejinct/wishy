/* === GIỎ HÀNG === */
var cart = load('wishy_cart', []);
function renderCart() {
  var container = document.getElementById('cart-items-container');
  if (!container) return;
  
  if (!cart || !cart.length) {
    container.innerHTML = '<div style="text-align:center; padding: 30px; color:#7B8BA0; font-style:italic;">Giỏ hàng của bạn đang trống. Hãy qua trang Sản phẩm để chọn hàng nhé!</div>';
    document.getElementById('cart-grand-total').textContent = 'Tổng tiền: 0đ';
    var chkAll = document.getElementById('select-all-chk');
    if(chkAll) chkAll.checked = false;
    if (typeof renderHeader === 'function') renderHeader();
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
  var isHidden = !p || p.status === 'hidden';
  var sub = isHidden ? 0 : p.price * item.qty;

  // Nếu sản phẩm đã bị ẩn, tự động bỏ chọn item đó
  if (isHidden) item.selected = false;
  if (item.selected) total += sub;
  else if (!isHidden) allChecked = false;

  return '<div class="cart-item-row ' + (isHidden ? 'item-hidden' : '') + '">' +
    '<div class="col-chk">' +
      '<input type="checkbox" ' + (isHidden ? 'disabled' : (item.selected ? 'checked' : '')) + ' onchange="toggleSelectItem(\'' + item.pid + '\', this.checked)">' +
    '</div>' +
    '<div class="col-img"><img src="' + esc(p ? p.img : NO_IMAGE) + '" alt="' + esc(p ? p.name : item.pid) + '" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;"></div>' +
    '<div class="col-name">' + 
      esc(p ? p.name : item.pid) + 
      (isHidden ? '<br><span style="color: var(--danger); font-size: 12px; font-weight: 600;">⚠️ Ngừng kinh doanh</span>' : '') + 
    '</div>' +
    '<div class="col-price">' + money(p ? p.price : 0) + '</div>' +
    '<div class="col-qty">' +
      '<button class="btn-outline btn-sm" ' + (isHidden ? 'disabled' : '') + ' onclick="updateQty(\'' + item.pid + '\', -1)">-</button>' +
      '<span>' + item.qty + '</span>' +
      '<button class="btn-outline btn-sm" ' + (isHidden ? 'disabled' : '') + ' onclick="updateQty(\'' + item.pid + '\', 1)">+</button>' +
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
  if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng không?')) {
    return; // Nếu bấm Hủy thì dừng lại, không xóa
  }
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

  // Chỉ giữ các món còn tồn tại trong danh sách sản phẩm, đồng thời kiểm tra tồn kho
  var orderItems = [];
  for (var i = 0; i < selectedItems.length; i++) {
    var it = selectedItems[i];
    var p = findProduct(it.pid);
    if (!p || p.status === 'hidden') {
    alert('Sản phẩm "' + (p ? p.name : it.pid) + '" hiện đã ngừng kinh doanh và không thể đặt hàng!');
    return;
  }
    if (it.qty > p.stock) {
      alert('Sản phẩm "' + p.name + '" vượt quá tồn kho (Còn lại: ' + p.stock + ')');
      return;
    }
    orderItems.push({ pid: it.pid, qty: it.qty, price: p.price });   // Bước 4: lưu giá lúc mua
  }
  if (!orderItems.length) { alert('Các sản phẩm đã chọn không còn tồn tại.'); return; }

  var payMethod = document.querySelector('input[name="pay-method"]:checked').value;
  var payText = payMethod === 'COD' ? 'Tiền mặt khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng';
  var isNewAddr = document.querySelectorAll('input[name="addr-choice"]')[1].checked;
  var shipInfo = '';

  if (isNewAddr) {
    var name = document.getElementById('ship-name').value.trim();
    var phone = document.getElementById('ship-phone').value.trim();
    var addr = document.getElementById('ship-addr').value.trim();
    if (!name || !phone || !addr) { alert('Vui lòng nhập đầy đủ thông tin giao hàng mới!'); return; }
    if (!/^(0|\+84)\d{9}$/.test(phone)) { alert('Số điện thoại không hợp lệ (VD: 0901234567).'); return; }
    shipInfo = name + ' - ' + phone + ' (' + addr + ')';
  } else {
    // Bước 5: lấy thông tin thật từ tài khoản
    var u = findUser(currentUser.username) || {};
    if (!u.address || !u.phone) {
      alert('Tài khoản chưa có địa chỉ hoặc SĐT, vui lòng chọn "Nhập địa chỉ giao hàng mới".');
      return;
    }
    shipInfo = u.fullname + ' - ' + u.phone + ' (' + u.address + ')';
  }

  var orderId = 'DH' + String(orders.length + 1).padStart(3, '0');
  var dateStr = today();   // hàm today() có sẵn trong common.js

  var total = orderItems.reduce(function (sum, item) { return sum + item.price * item.qty; }, 0);

  orderItems.forEach(function (it) {
    findProduct(it.pid).stock -= it.qty;
  });
  save('wishy_products', products);

  var newOrder = {
    id: orderId, user: currentUser.username, date: dateStr, status: 'Chờ xác nhận',
    payment: payText, shipInfo: shipInfo, items: orderItems, total: total
  };

  orders.push(newOrder);
  save('wishy_orders', orders);

  cart = cart.filter(function (i) { return !i.selected; });
  save('wishy_cart', cart);
  if (typeof renderHeader === 'function') renderHeader();   // Bước 9: cập nhật số trên icon giỏ

  var itemsHtml = newOrder.items.map(function (it) {
    var p = findProduct(it.pid);
    return '<tr><td style="padding: 10px;">' + esc(p ? p.name : '') + '</td><td style="padding: 10px; text-align:center;">' + it.qty + '</td><td style="padding: 10px; text-align:right;">' + money(linePrice(it) * it.qty) + '</td></tr>';
  }).join('');

  document.getElementById('invoice-content').innerHTML =
    '<p style="margin-bottom: 6px;"><b>Mã đơn hàng:</b> ' + newOrder.id + '</p>' +
    '<p style="margin-bottom: 6px;"><b>Ngày đặt:</b> ' + fmtDate(newOrder.date) + '</p>' +
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
  window.location.href = 'index.html';
}

/* === ĐIỀU PHỐI CHUNG === */
function refreshPage() {
  if (typeof renderHeader === 'function') {
    renderHeader();
  }
  
  var logged = !!currentUser;
  var welcome = document.getElementById('welcome-screen');
  var app = document.getElementById('app-screen');
  
  if (welcome) welcome.style.display = logged ? 'none' : '';
  if (app) app.style.display = logged ? '' : 'none';
  
  if (logged) {
    if (typeof load === 'function') {
      cart = load('wishy_cart', []);
    }
    renderCart();
  }
}

refreshPage();

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeModal();
});
