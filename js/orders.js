var LOW_STOCK = 10;
// Dữ liệu Phiếu nhập hàng mẫu
var stockIns = load('wishy_stockins', [
  { id: 'PN001', date: '2026-10-10', status: 'Hoàn tất', items: [
    { pid: 'SP001', qty: 20, cost: 90000 },
    { pid: 'SP002', qty: 50, cost: 200000 },
    { pid: 'SP003', qty: 30, cost: 45000 },
    { pid: 'SP004', qty: 20, cost: 54000 }
  ] }
]);

var ADMIN_TABS = ['tab-admin-stock-in', 'tab-admin-orders', 'tab-admin-inventory'];
var currentTab = '';

function switchTab(id) {
  if (isAdmin()) {
    if (ADMIN_TABS.indexOf(id) === -1) id = 'tab-admin-orders';
  } else {
    id = 'tab-my-orders';
  }
  currentTab = id;
  showTab(id);
}

window.addEventListener('hashchange', function () {
  if (currentUser) switchTab(tabFromHash());
});

function statusBadge(s) {
  var cls = s === 'Đã giao' ? 'ok' : s === 'Đã hủy' ? 'warn' : s === 'Đã xử lý' ? 'mid' : '';
  return '<span class="badge ' + cls + '">' + esc(s) + '</span>';
}
// Màn hình 1: Lịch sử đơn hàng đã mua
function renderMyOrders() {
  var tb = document.getElementById('tbody-my-orders');
  // Lọc đơn hàng của khách hàng hiện tại
  var mine = orders.filter(function (o) { return currentUser && o.user === currentUser.username; });
  if (!mine.length) { tb.innerHTML = '<tr class="empty-row"><td colspan="5">Bạn chưa có đơn hàng nào.</td></tr>'; return; }
  tb.innerHTML = mine.map(function (o) {
    return '<tr><td>' + o.id + '</td><td>' + fmtDate(o.date) + '</td><td>' + money(orderTotal(o)) + '</td><td>' +
      statusBadge(o.status) + '</td><td><button class="btn btn-sm" onclick="showOrderDetail(\'' + o.id + '\')">Xem</button></td></tr>';
  }).join('');
}
// Xem chi tiết đơn (tránh lỗi dấu nháy trong onclick)
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
  refreshPage();
}

// Màn hình 2: Quản lý nhập hàng
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
  refreshPage();
}

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

function renderPage() {
  var logged = !!currentUser;
  document.getElementById('welcome-screen').style.display = logged ? 'none' : '';
  document.getElementById('app-screen').style.display = logged ? '' : 'none';
  if (!logged) return;

  switchTab(currentTab || tabFromHash());

  renderMyOrders();
  if (isAdmin()) { renderStockIn(); renderAdminOrders(); renderInventory(); }
}

initSite('orders');