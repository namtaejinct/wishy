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

function renderAll() {
  syncData();
  stockIns = load('wishy_stockins', stockIns);
  renderUsers();
  renderCategories();
  renderAdminProducts();
  renderPricing();
  renderAdminOrders();
  renderStockIn();
  renderInventory();
}

  function renderOrdersAndStock() {
  renderAdminOrders();
  renderStockIn();
  renderInventory();
}

function onDataChanged() {
  var logged = false;
  try { logged = !!sessionStorage.getItem('wishy_admin'); } catch (e) {}
  if (logged) renderAll();
}

window.addEventListener('DOMContentLoaded', function () {
  var logged = false;
  try { logged = !!sessionStorage.getItem('wishy_admin'); } catch (e) {}
  if (logged) admin_enter();
});

/* QUẢN LÝ NGƯỜI DÙNG */
function renderUsers() {
  var box = document.getElementById('search-user');
  var kw = box ? box.value.trim().toLowerCase() : '';
  var customers = users.filter(function (u) { return u.role !== 'admin'; });
  var list = customers.filter(function (u) {
    return !kw || u.username.toLowerCase().indexOf(kw) !== -1 ||
           String(u.fullname || '').toLowerCase().indexOf(kw) !== -1;
  });
  var tb = document.getElementById('tbody-users');
  if (!list.length) { tb.innerHTML = '<tr class="empty-row"><td colspan="6">Không có người dùng phù hợp.</td></tr>'; return; }
  tb.innerHTML = list.map(function (u) {
    var locked = u.status === 'locked';
    return '<tr><td>KH' + String(customers.indexOf(u) + 1).padStart(3, '0') + '</td>' +
      '<td>' + esc(u.username) + '</td><td>' + esc(u.fullname || '') + '</td><td>' + esc(u.email || '') + '</td>' +
      '<td><span class="badge ' + (locked ? 'warn' : 'ok') + '">' + (locked ? 'Đã khóa' : 'Hoạt động') + '</span></td>' +
      '<td><button class="btn-outline btn-sm" onclick="toggleUserLock(\'' + esc(u.username) + '\')">' +
      (locked ? 'Mở khóa' : 'Khóa') + '</button></td></tr>';
  }).join('');
}

function toggleUserLock(username) {
  var u = findUser(username);
  if (!u || u.role === 'admin') return;
  var lock = u.status !== 'locked';
  if (!confirm((lock ? 'Khóa' : 'Mở khóa') + ' tài khoản "' + username + '"?')) return;
  u.status = lock ? 'locked' : 'active';
  save('wishy_users', users);
  renderUsers();
}

/* QUẢN LÝ LOẠI SẢN PHẨM */
function countByType(name) {
  return products.filter(function (p) { return p.type === name; }).length;
}

function categoryExists(name, exceptIndex) {
  var low = name.toLowerCase();
  return categories.some(function (c, i) { return i !== exceptIndex && c.toLowerCase() === low; });
}

function fillProductTypeSelect(selected) {
  var sel = document.getElementById('prod-type');
  if (!sel) return;
  var cur = selected || sel.value;
  sel.innerHTML = categories.map(function (c) {
    return '<option value="' + esc(c) + '">' + esc(c) + '</option>';
  }).join('');
  if (categories.indexOf(cur) !== -1) sel.value = cur;
}

function renderCategories() {
  var tb = document.getElementById('tbody-categories');
  if (tb) {
    tb.innerHTML = categories.length ? categories.map(function (c, i) {
      return '<tr><td>' + (i + 1) + '</td><td><b>' + esc(c) + '</b></td><td>' + countByType(c) + '</td><td>' +
        '<button class="btn-outline btn-sm" style="margin-right:6px" onclick="editCategory(' + i + ')">Sửa</button>' +
        '<button class="btn btn-sm" onclick="deleteCategory(' + i + ')">Xóa</button></td></tr>';
    }).join('') : '<tr class="empty-row"><td colspan="4">Chưa có loại sản phẩm.</td></tr>';
  }
  fillProductTypeSelect();
}

function addCategory() {
  var input = document.getElementById('new-cat-name');
  var name = input.value.trim().replace(/\s+/g, ' ');
  if (!name) { alert('Vui lòng nhập tên loại sản phẩm!'); input.focus(); return; }
  if (categoryExists(name)) { alert('Loại sản phẩm này đã tồn tại!'); input.focus(); return; }
  categories.push(name);
  save('wishy_categories', categories);
  input.value = '';
  renderCategories();
}

function editCategory(index) {
  var oldName = categories[index];
  var newName = prompt('Sửa tên loại sản phẩm:', oldName);
  if (newName === null) return;                       // bấm Hủy
  newName = newName.trim().replace(/\s+/g, ' ');
  if (!newName) { alert('Tên loại không được để trống!'); return; }
  if (newName === oldName) return;
  if (categoryExists(newName, index)) { alert('Loại sản phẩm này đã tồn tại!'); return; }
  categories[index] = newName;
  // Đổi tên loại thì các sản phẩm thuộc loại đó đổi theo, tránh bị mồ côi
  products.forEach(function (p) { if (p.type === oldName) p.type = newName; });
  save('wishy_categories', categories);
  save('wishy_products', products);
  refreshCatalogViews();
}

function deleteCategory(index) {
  var name = categories[index];
  var n = countByType(name);
  if (n > 0) {
    alert('Không thể xóa loại "' + name + '" vì còn ' + n + ' sản phẩm thuộc loại này.\nHãy chuyển các sản phẩm sang loại khác trước.');
    return;
  }
  if (!confirm('Xóa loại sản phẩm "' + name + '"?')) return;
  categories.splice(index, 1);
  save('wishy_categories', categories);
  renderCategories();
}

/* QUẢN LÝ SẢN PHẨM */
function calcMargin(price, cost) {
  return cost > 0 ? Math.round((price / cost - 1) * 100) : 0;
}

function refreshCatalogViews() {
  renderCategories();
  renderAdminProducts();
  renderPricing();
  renderInventory();
}

function renderAdminProducts() {
  var tb = document.getElementById('tbody-products');
  if (!tb) return;
  if (!products.length) { tb.innerHTML = '<tr class="empty-row"><td colspan="6">Chưa có sản phẩm.</td></tr>'; return; }
  tb.innerHTML = products.map(function (p) {
    var hidden = p.status === 'hidden';
    return '<tr' + (hidden ? ' style="opacity:.6"' : '') + '>' +
      '<td>' + esc(p.id) + '</td>' +
      '<td><b>' + esc(p.name) + '</b>' + (hidden ? ' <span class="badge warn">Đang ẩn</span>' : '') + '</td>' +
      '<td>' + esc(p.type || 'Khác') + '</td>' +
      '<td>' + money(p.price) + '</td>' +
      '<td>' + p.stock + '</td>' +
      '<td>' +
        '<button class="btn-outline btn-sm" style="margin-right:6px" onclick="editProduct(\'' + esc(p.id) + '\')">Sửa</button>' +
        '<button class="btn-outline btn-sm" style="margin-right:6px" onclick="toggleHideProduct(\'' + esc(p.id) + '\')">' + (hidden ? 'Hiện' : 'Ẩn') + '</button>' +
        '<button class="btn btn-sm" onclick="deleteProduct(\'' + esc(p.id) + '\')">Xóa</button>' +
      '</td></tr>';
  }).join('');
}

function saveProduct() {
  var editId = document.getElementById('edit-prod-id').value;
  var id = document.getElementById('prod-id').value.trim().toUpperCase();
  var name = document.getElementById('prod-name').value.trim();
  var type = document.getElementById('prod-type').value;
  var price = parseInt(document.getElementById('prod-price').value, 10);
  var stock = parseInt(document.getElementById('prod-stock').value, 10);

  if (!id || !name) { alert('Vui lòng nhập mã và tên sản phẩm!'); return; }
  if (!/^[A-Z0-9_-]{2,20}$/.test(id)) { alert('Mã sản phẩm chỉ gồm chữ, số, dấu - hoặc _ (VD: SP021).'); return; }
  if (!type) { alert('Chưa có loại sản phẩm. Hãy thêm loại ở tab "Quản lí Loại Sản phẩm" trước.'); return; }
  if (isNaN(price) || price <= 0) { alert('Giá bán phải lớn hơn 0!'); document.getElementById('prod-price').focus(); return; }
  if (isNaN(stock) || stock < 0) { alert('Số lượng tồn kho không được nhỏ hơn 0!'); document.getElementById('prod-stock').focus(); return; }

  if (editId) {
    var p = findProduct(editId);
    if (!p) return;
    p.name = name;
    p.type = type;
    p.price = price;
    p.stock = stock;
    p.margin = calcMargin(price, p.cost);   // giữ giá vốn, lợi nhuận tính lại theo giá mới
  } else {
    if (findProduct(id)) { alert('Mã sản phẩm đã tồn tại!'); return; }
    var cost = Math.round(price * 0.7);     // giá vốn tạm tính, chỉnh ở phiếu nhập / tab Lợi nhuận
    products.push({ id: id, name: name, type: type, price: price, stock: stock,
      cost: cost, margin: calcMargin(price, cost), desc: '' });
  }

  save('wishy_products', products);
  cancelEditProduct();
  refreshCatalogViews();
  alert('Lưu sản phẩm thành công!');
}

function editProduct(id) {
  var p = findProduct(id);
  if (!p) return;
  fillProductTypeSelect(p.type);
  document.getElementById('edit-prod-id').value = p.id;
  document.getElementById('prod-id').value = p.id;
  document.getElementById('prod-id').disabled = true;
  document.getElementById('prod-name').value = p.name;
  document.getElementById('prod-type').value = p.type;
  document.getElementById('prod-price').value = p.price;
  document.getElementById('prod-stock').value = p.stock;
  document.getElementById('form-product-title').textContent = 'Sửa sản phẩm: ' + p.id;
  document.getElementById('btn-save-prod').textContent = 'Cập nhật sản phẩm';
  document.getElementById('btn-cancel-prod').style.display = 'inline-block';
  document.getElementById('form-product-title').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cancelEditProduct() {
  document.getElementById('edit-prod-id').value = '';
  document.getElementById('prod-id').value = '';
  document.getElementById('prod-id').disabled = false;
  document.getElementById('prod-name').value = '';
  document.getElementById('prod-price').value = '';
  document.getElementById('prod-stock').value = '';
  document.getElementById('form-product-title').textContent = 'Thêm sản phẩm mới';
  document.getElementById('btn-save-prod').textContent = 'Lưu sản phẩm';
  document.getElementById('btn-cancel-prod').style.display = 'none';
}

function toggleHideProduct(id) {
  var p = findProduct(id);
  if (!p) return;
  p.status = p.status === 'hidden' ? 'visible' : 'hidden';
  save('wishy_products', products);
  renderAdminProducts();
}

// Sản phẩm đã xuất hiện trong đơn hàng hoặc phiếu nhập thì không được xóa
function productInUse(id) {
  function has(list) { return list.some(function (x) { return x.items.some(function (it) { return it.pid === id; }); }); }
  return has(orders) || has(stockIns);
}

function deleteProduct(id) {
  if (productInUse(id)) {
    alert('Sản phẩm ' + id + ' đã có trong đơn hàng hoặc phiếu nhập nên không thể xóa (sẽ làm sai lịch sử).\nHãy dùng nút "Ẩn" để ngừng bán.');
    return;
  }
  if (!confirm('Bạn có chắc muốn xóa sản phẩm ' + id + '?')) return;
  products = products.filter(function (p) { return p.id !== id; });
  save('wishy_products', products);
  // Gỡ khỏi giỏ hàng để không còn món "ma"
  users.forEach(function (u) {
  var key = 'wishy_cart_' + u.username;
  save(key, load(key, []).filter(function (it) { return it.pid !== id; }));
});
  if (document.getElementById('edit-prod-id').value === id) cancelEditProduct();
  refreshCatalogViews();
}

/* QUẢN LÝ LỢI NHUẬN */
function renderPricing() {
  products = load('wishy_products', defaultProducts);
  //Select sản phẩm lẻ
  var select = document.getElementById('pricing-prod-select');
  if (select) {
    select.innerHTML = products.map(function (p) {
      return '<option value="' + p.id + '">' + p.id + ' - ' + esc(p.name) + ' [' + esc(p.type || 'Khác') + ']</option>';
    }).join('');
  }
  //Select loại
  var catSelect = document.getElementById('pricing-category-select');
  if (catSelect) {
    catSelect.innerHTML = categories.map(function (c) {
      return '<option value="' + esc(c) + '">' + esc(c) + '</option>';
    }).join('');
  }
  filterPricingTable();
}
function saveCategoryMargin() {
  var selectedCat = document.getElementById('pricing-category-select').value;
  var marginVal = parseFloat(document.getElementById('pricing-cat-margin-input').value);
  if (isNaN(marginVal) || marginVal < 0) { 
    alert('Vui lòng nhập % hợp lệ (Lưu ý không được âm)'); 
    return; 
  }
  var count = 0;
  // Duyệt sản phẩm cùng loại
  products.forEach(function (p) {
    if (p.type === selectedCat) {
      p.margin = marginVal;
      p.price = Math.round(((p.cost || 0) * (1 + marginVal / 100)) / 1000) * 1000;
      count++;
    }
  });

  if (count === 0) {
    alert('Không có sản phẩm nào thuộc loại "' + selectedCat + '" để cập nhật!');
    return;
  }
  save('wishy_products', products); 
  renderPricing();
  alert('Đã cập nhật % lợi nhuận cho ' + count + ' sản phẩm thuộc loại "' + selectedCat + '" thành công!');
}

function saveProductMargin() {
  var pid = document.getElementById('pricing-prod-select').value;
  var marginVal = parseFloat(document.getElementById('pricing-margin-input').value);
  if (isNaN(marginVal) || marginVal < 0) { alert('Vui lòng nhập % hợp lệ (Lưu ý không được âm)'); return; }

  var p = findProduct(pid);
  if (!p) return;
  p.margin = marginVal;
  p.price = Math.round(((p.cost || 0) * (1 + marginVal / 100)) / 1000) * 1000;

  save('wishy_products', products); 
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



/* ĐƠN HÀNG, NHẬP HÀNG, TỒN KHO */
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
    return '<tr><td>' + it.pid + '</td><td>' + esc(p ? p.name : '(đã xóa)') + (it.variant ? ' <small>(' + esc(it.variant) + ')</small>' : '') + '</td><td>' + it.qty + '</td><td>' + money(linePrice(it) * it.qty) + '</td></tr>';
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
  if (!list.length) { tb.innerHTML = '<tr class="empty-row"><td colspan="6">Không có đơn hàng phù hợp.</td></tr>'; return; }
  var opts = ['Chờ xác nhận', 'Chờ lấy hàng', 'Chờ giao hàng', 'Đã giao', 'Đã hủy'];
  tb.innerHTML = list.map(function (o) {
    var u = findUser(o.user);
    var select = '<select id="st-' + o.id + '">' + opts.map(function (s) {
      return '<option value="' + s + '"' + (s === o.status ? ' selected' : '') + '>' + s + '</option>';
    }).join('') + '</select> ';
  return '<tr><td>' + o.id + '</td><td>' + esc(u ? u.fullname : o.user) + '</td><td>' + money(orderTotal(o)) + '</td><td>' +
    statusBadge(o.status) + '</td><td>' + select +
    '<button class="btn" onclick="updateOrderStatus(\'' + o.id + '\')">Lưu</button></td><td>' +
    '<button class="btn-outline btn-sm" onclick="showOrderDetail(\'' + o.id + '\')">Xem</button></td></tr>';
  }).join('');
}

function updateOrderStatus(id) {
  var o = orders.filter(function (x) { return x.id === id; })[0];
  if (!o) return;
  var newSt = document.getElementById('st-' + id).value;

  if (o.status === 'Đã hủy' && newSt !== 'Đã hủy') {
    alert('Đơn đã hủy không thể mở lại.');
    renderOrdersAndStock();
    return;
  }
  if (o.status === 'Đã giao' && newSt !== 'Đã giao') { 
    alert('Đơn hàng đã giao thành công, không thể thay đổi trạng thái nữa!'); 
    renderOrdersAndStock();
    return;
  }
  if (newSt === 'Đã hủy' && o.status !== 'Đã hủy') {
    o.items.forEach(function (it) {
      var p = findProduct(it.pid);
      if (p) p.stock += it.qty;
    });
    save('wishy_products', products);
  }
  o.status = newSt;
  save('wishy_orders', orders);
  renderOrdersAndStock();
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
    '<button class="btn-outline btn-sm" style="margin: 8px 0px 20px 8px" onclick="addStockLine()">+ Thêm dòng</button>' +
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
  renderOrdersAndStock();
}

function stock_complete(id) {
  var s = stockIns.filter(function (x) { return x.id === id; })[0];
  if (!s || s.status === 'Hoàn tất') return;
  if (!confirm('Hoàn thành phiếu ' + id + '? Sau đó sẽ không sửa được nữa.')) return;
  s.items.forEach(function (it) { findProduct(it.pid).stock += it.qty; });
  s.status = 'Hoàn tất';
  save('wishy_stockins', stockIns);
  save('wishy_products', products);
  renderOrdersAndStock();
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
  return o.status !== 'Đã hủy';
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

