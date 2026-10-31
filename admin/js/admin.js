function switchTab(id, btn) {
  document.querySelectorAll('.tab-content').forEach(function (t) { t.classList.remove('active'); });
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(function (b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
}

function openModal(html) {
  document.getElementById('admin-modal-body').innerHTML =
    '<button class="btn-outline btn-sm" style="float:right" onclick="closeModal()">✕</button>' + html;
  document.getElementById('admin-modal').style.display = 'flex';
}
function closeModal() {
  document.getElementById('admin-modal').style.display = 'none';
}

// Đăng nhập admin TẠM THỜI: Linh thay bằng bản chính thức.
// Giả định tài khoản admin có role === 'admin' hoặc username === 'admin'.
function handleAdminLogin() {
  var u = document.getElementById('admin-user-input').value.trim();
  var p = document.getElementById('admin-pass-input').value;
  var users = load('wishy_users', []);
  var acc = users.filter(function (x) {
    return x.username === u && x.password === p && (x.role === 'admin' || x.username === 'admin');
  })[0];
  if (!acc) { alert('Sai tài khoản hoặc mật khẩu quản trị.'); return; }
  try { sessionStorage.setItem('wishy_admin', u); } catch (e) {}
  admin_enter();
}
function admin_enter() {
  document.getElementById('admin-login-modal').style.display = 'none';
  renderAll();
}

// Gọi mọi hàm render của các tab. Mỗi người thêm hàm render của mình vào đây.
function renderAll() {
  if (typeof renderUsers === 'function') renderUsers();   // Linh
  tv4_refresh();                                          // Nam (TV4)
}

window.addEventListener('DOMContentLoaded', function () {
  var logged = false;
  try { logged = !!sessionStorage.getItem('wishy_admin'); } catch (e) {}
  if (logged) admin_enter();
});


/* TV4 (NAM): ĐƠN HÀNG, NHẬP HÀNG, TỒN KHO */

var LOW_STOCK = 5;   // cảnh báo khi tồn < 5

// Dữ liệu Phiếu nhập hàng mẫu
var stockIns = load('wishy_stockins', [
  { id: 'PN001', date: '2026-10-10', status: 'Hoàn tất', items: [
    { pid: 'SP001', qty: 20, cost: 90000 },
    { pid: 'SP002', qty: 50, cost: 200000 },
    { pid: 'SP003', qty: 30, cost: 45000 },
    { pid: 'SP004', qty: 20, cost: 54000 }
  ] }
]);

var editingStockId = null;

function tv4_refresh() {
  renderAdminOrders();
  renderStockIn();
  renderInventory();
}

function statusBadge(s) {
  var colors = {
    'Chờ xác nhận': '',
    'Chờ lấy hàng': 'mid',
    'Chờ giao hàng': 'mid',
    'Đã giao': 'ok',
    'Đã hủy': 'warn'
  };
  var cls = colors[s] || '';
  return '<span class="badge ' + cls + '">' + esc(s) + '</span>';
}

/* Quản lý đơn hàng của khách */

function showOrderDetail(id) {
  var o = orders.filter(function (x) { return x.id === id; })[0];
  if (!o) return;
  var rows = o.items.map(function (it) {
    var p = findProduct(it.pid);
    return '<tr><td>' + it.pid + '</td><td>' + esc(p ? p.name : '(đã xóa)') + '</td><td>' + it.qty + '</td><td>' + money(p ? p.price * it.qty : 0) + '</td></tr>';
  }).join('');
  openModal('<h3>Chi tiết đơn ' + o.id + '</h3><p>Ngày đặt: <b>' + fmtDate(o.date) + '</b> &nbsp; ' + statusBadge(o.status) + '</p>' +
    '<table><thead><tr><th>Mã SP</th><th>Tên</th><th>SL</th><th>Thành tiền</th></tr></thead><tbody>' + rows + '</tbody></table>' +
    '<div class="detail-total">Tổng: ' + money(orderTotal(o)) + '</div>');
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
  var tb = document.getElementById('tbody-orders');
  if (!list.length) { tb.innerHTML = '<tr class="empty-row"><td colspan="5">Không có đơn hàng phù hợp.</td></tr>'; return; }
  var opts = ['Chờ xác nhận', 'Chờ lấy hàng', 'Chờ giao hàng', 'Đã giao', 'Đã hủy'];
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
  tv4_refresh();
}

/* Quản lý nhập hàng: Tạm lưu -> Sửa -> Hoàn thành */

function renderStockIn() {
  var tb = document.getElementById('tbody-stock');
  var box = document.getElementById('stock-search');
  var kw = box ? box.value.trim().toLowerCase() : '';
  var list = stockIns.filter(function (s) {
    return !kw || s.id.toLowerCase().indexOf(kw) !== -1 || s.date.indexOf(kw) !== -1 || s.status.toLowerCase().indexOf(kw) !== -1;
  });
  if (!list.length) { tb.innerHTML = '<tr class="empty-row"><td colspan="5">Không có phiếu nhập.</td></tr>'; return; }
  tb.innerHTML = list.map(function (s) {
    var total = s.items.reduce(function (sum, it) { return sum + it.qty * it.cost; }, 0);
    var done = s.status === 'Hoàn tất';
    return '<tr><td>' + s.id + '</td><td>' + fmtDate(s.date) + '</td><td>' + money(total) + '</td>' +
      '<td><span class="badge ' + (done ? 'ok' : 'mid') + '">' + esc(s.status) + '</span></td><td>' +
      '<button class="btn btn-sm" onclick="showStockDetail(\'' + s.id + '\')">Xem</button> ' +
      (done ? '' : '<button class="btn-outline btn-sm" onclick="showEditStockModal(\'' + s.id + '\')">Sửa</button> ' +
                   '<button class="btn btn-sm" onclick="stock_complete(\'' + s.id + '\')">Hoàn thành</button>') +
      '</td></tr>';
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
  openModal('<h3>Phiếu nhập ' + s.id + '</h3><p>Ngày nhập: <b>' + fmtDate(s.date) + '</b> &nbsp; <span class="badge ' + (s.status === 'Hoàn tất' ? 'ok' : 'mid') + '">' + esc(s.status) + '</span></p>' +
    '<table><thead><tr><th>Mã SP</th><th>Tên</th><th>SL</th><th>Giá nhập</th><th>Thành tiền</th></tr></thead><tbody>' + rows + '</tbody></table>' +
    '<div class="detail-total">Tổng: ' + money(total) + '</div>');
}

function productOptions(sel) {
  return products.map(function (p) {
    return '<option value="' + p.id + '"' + (p.id === sel ? ' selected' : '') + '>' + p.id + ' - ' + esc(p.name) + '</option>';
  }).join('');
}

function lineRowHtml(it) {
  it = it || {};
  return '<div class="line-row"><select class="ln-pid">' + productOptions(it.pid) + '</select>' +
    '<input class="ln-qty" type="number" min="1" placeholder="SL" value="' + (it.qty || '') + '">' +
    '<input class="ln-cost" type="number" min="0" placeholder="Giá nhập" value="' + (it.cost !== undefined ? it.cost : '') + '">' +
    '<button class="btn-outline btn-sm" onclick="this.parentNode.remove()">✕</button></div>';
}

function stock_openForm(title, linesHtml) {
  openModal('<h3>' + title + '</h3><div id="stock-lines">' + linesHtml + '</div>' +
    '<button class="btn-outline btn-sm" onclick="addStockLine()">+ Thêm dòng</button>' +
    '<div class="form-error" id="stock-error" style="margin-top:12px"></div>' +
    '<button class="btn" style="width:100%" onclick="saveStock()">Lưu tạm</button>');
}

function showAddStockModal() {
  editingStockId = null;
  stock_openForm('Tạo phiếu nhập mới', lineRowHtml());
}

function showEditStockModal(id) {
  var s = stockIns.filter(function (x) { return x.id === id; })[0];
  if (!s || s.status === 'Hoàn tất') return;   // phiếu đã hoàn tất thì không được sửa
  editingStockId = id;
  stock_openForm('Sửa phiếu nhập ' + id, s.items.map(lineRowHtml).join(''));
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

  if (editingStockId) {
    stockIns.filter(function (x) { return x.id === editingStockId; })[0].items = items;
  } else {
    var num = stockIns.length + 1;
    stockIns.push({ id: 'PN' + String(num).padStart(3, '0'), date: today(), status: 'Tạm lưu', items: items });
  }
  save('wishy_stockins', stockIns);   // chưa cộng tồn kho
  closeModal();
  tv4_refresh();
}

function stock_complete(id) {
  var s = stockIns.filter(function (x) { return x.id === id; })[0];
  if (!s || s.status === 'Hoàn tất') return;
  if (!confirm('Hoàn thành phiếu ' + id + '? Sau đó sẽ không sửa được nữa.')) return;
  s.items.forEach(function (it) { findProduct(it.pid).stock += it.qty; });
  s.status = 'Hoàn tất';
  save('wishy_stockins', stockIns);
  save('wishy_products', products);
  tv4_refresh();
}

/* Tồn kho: cảnh báo + lọc theo loại */

function renderInventory() {
  var sel = document.getElementById('inv-type-filter');
  var type = 'all';
  if (sel) {
    var cur = sel.value || 'all';
    var types = [];
    products.forEach(function (p) { if (types.indexOf(p.type) === -1) types.push(p.type); });
    sel.innerHTML = '<option value="all">Tất cả loại</option>' +
      types.map(function (t) { return '<option value="' + esc(t) + '">' + esc(t) + '</option>'; }).join('');
    sel.value = types.indexOf(cur) !== -1 ? cur : 'all';
    type = sel.value;
  }
  var list = products.filter(function (p) { return type === 'all' || p.type === type; });

  var out = list.filter(function (p) { return p.stock === 0; });
  var low = list.filter(function (p) { return p.stock > 0 && p.stock < LOW_STOCK; });
  var html = '';
  if (out.length) html += '<div class="alert warn">Hết hàng: ' + out.map(function (p) { return esc(p.name); }).join(', ') + '</div>';
  if (low.length) html += '<div class="alert warn">Sắp hết (còn &lt; ' + LOW_STOCK + '): ' + low.map(function (p) { return esc(p.name) + ' (' + p.stock + ')'; }).join(', ') + '</div>';
  if (!out.length && !low.length) html = '<div class="alert ok">Tồn kho đang ổn định, không có cảnh báo.</div>';
  document.getElementById('alert-box').innerHTML = html;

  var tb = document.getElementById('tbody-inventory');
  if (!list.length) { tb.innerHTML = '<tr class="empty-row"><td colspan="5">Không có sản phẩm.</td></tr>'; }
  else {
    tb.innerHTML = list.map(function (p) {
      var badge = p.stock === 0 ? '<span class="badge warn">Hết hàng</span>'
        : p.stock < LOW_STOCK ? '<span class="badge mid">Sắp hết</span>'
        : '<span class="badge ok">Ổn định</span>';
      return '<tr><td>' + p.id + '</td><td>' + esc(p.name) + '</td><td>' + esc(p.type) + '</td><td><b>' + p.stock + '</b></td><td>' + badge + '</td></tr>';
    }).join('');
  }
  rpt_fillProducts();
}

/* Báo cáo Nhập - Xuất - Tồn */

function rpt_fillProducts() {
  var sel = document.getElementById('rpt-pid');
  if (!sel) return;
  var cur = sel.value;
  sel.innerHTML = productOptions(cur);
}

// Đơn được tính là đã xuất kho
function rpt_exported(o) {
  return o.status !== 'Chờ xác nhận' && o.status !== 'Đã hủy';
}

function rpt_sum(pid, from, to) {
  var nhap = 0, xuat = 0;
  stockIns.forEach(function (s) {
    if (s.status !== 'Hoàn tất') return;
    if ((!from || s.date >= from) && (!to || s.date <= to)) {
      s.items.forEach(function (it) { if (it.pid === pid) nhap += it.qty; });
    }
  });
  orders.forEach(function (o) {
    if (!rpt_exported(o)) return;
    if ((!from || o.date >= from) && (!to || o.date <= to)) {
      o.items.forEach(function (it) { if (it.pid === pid) xuat += it.qty; });
    }
  });
  return { nhap: nhap, xuat: xuat };
}

function rpt_nextDay(d) {
  var t = new Date(d);
  t.setDate(t.getDate() + 1);
  return t.toISOString().slice(0, 10);
}

function rpt_run() {
  var pid = document.getElementById('rpt-pid').value;
  var from = document.getElementById('rpt-from').value;
  var to = document.getElementById('rpt-to').value;
  var p = findProduct(pid);
  if (!p) return;
  if (from && to && from > to) {
    document.getElementById('rpt-result').innerHTML = '<div class="alert warn">"Từ ngày" phải trước hoặc bằng "Đến ngày".</div>';
    return;
  }
  var inRange = rpt_sum(pid, from, to);
  // Tồn cuối kỳ = tồn hiện tại, lùi lại các biến động sau ngày "đến"
  var after = to ? rpt_sum(pid, rpt_nextDay(to), '') : { nhap: 0, xuat: 0 };
  var cuoi = p.stock - after.nhap + after.xuat;
  var dau = cuoi - inRange.nhap + inRange.xuat;
  document.getElementById('rpt-result').innerHTML =
    '<div class="card"><table><thead><tr><th>Sản phẩm</th><th>Tồn đầu kỳ</th><th>Nhập</th><th>Xuất</th><th>Tồn cuối kỳ</th></tr></thead>' +
    '<tbody><tr><td>' + p.id + ' - ' + esc(p.name) + '</td><td>' + dau + '</td><td>' + inRange.nhap + '</td><td>' + inRange.xuat + '</td><td><b>' + cuoi + '</b></td></tr></tbody></table></div>';
}