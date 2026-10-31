/*Phần của Linh*/



/*DỮ LIỆU & BIẾN KHỞI TẠO*/
var categories = load('wishy_categories', ['Áo freesize', 'Ly', 'Móc khóa', 'Phụ kiện']);
var currentPage = 1;
var ITEMS_PER_PAGE = 4;
var currentTab = 'tab-product-list';

/*CHUYỂN TAB*/
function switchTab(tabId) {
  currentTab = tabId;
  showTab(tabId);
  
  document.querySelectorAll('.sub-menu button').forEach(function(btn) {
    btn.classList.toggle('active', btn.id === 'btn-' + tabId);
  });

  if (tabId === 'tab-product-list') renderProductList();
}

/*LỌC & HIỂN THỊ SẢN PHẨM*/
function getFilteredProducts() {
    var nameVal = document.getElementById('filter-name') ? document.getElementById('filter-name').value.toLowerCase().trim() : '';
    var typeVal = document.getElementById('filter-type') ? document.getElementById('filter-type').value : 'all';
    var priceVal = document.getElementById('filter-price') ? document.getElementById('filter-price').value : 'all';

    return products.filter(function (p) {
        if (nameVal && p.name.toLowerCase().indexOf(nameVal) === -1) return false;
        if (typeVal !== 'all' && p.type !== typeVal) return false;
        if (priceVal === 'under100' && p.price >= 100000) return false;
        if (priceVal === '100to300' && (p.price < 100000 || p.price > 300000)) return false;
        if (priceVal === 'over300' && p.price <= 300000) return false;
        return true;
    });
}

function filterProducts() {
    currentPage = 1;
    renderProductList();
}

function renderProductList() {
    var grid = document.getElementById('product-grid');
    var pagBox = document.getElementById('pagination-box');
    if (!grid) return;

    var list = getFilteredProducts();

    if (!list.length) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:#7B8BA0; font-style:italic;">Không tìm thấy sản phẩm phù hợp.</div>';
        if (pagBox) pagBox.innerHTML = '';
        return;
    }

    var totalPages = Math.ceil(list.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;

    var start = (currentPage - 1) * ITEMS_PER_PAGE;
    var pageItems = list.slice(start, start + ITEMS_PER_PAGE);

    grid.innerHTML = pageItems.map(function (p) {
        return '<div class="card-box" style="margin:0; padding:16px; border-radius:12px; background:#fff; border:1px solid var(--border-color); text-align:center; display:flex; flex-direction:column; justify-content:space-between;">' +
            '<div>' +
            '<div style="height:140px; background:#EBF3FA; border-radius:8px; display:flex; align-items:center; justify-content:center; margin-bottom:12px; font-weight:700; color:var(--primary-color); font-size:14px; text-transform:uppercase;">' + esc(p.type || 'Sản phẩm') + '</div>' +
            '<p style="font-size:12px; color:#7B8BA0; margin-bottom:4px; text-transform:uppercase; font-weight:700;">OHQUAO CONCEPT</p>' +
            '<h4 style="margin:4px 0 8px; color:var(--primary-color); font-size:15px;">' + esc(p.name) + '</h4>' +
            '<p style="color:var(--accent-color); font-weight:700; font-size:16px; margin-bottom:10px;">' + money(p.price) + '</p>' +
            '</div>' +
            '<div>' +
            '<button class="btn-outline btn-sm" style="margin-right:4px;" onclick="showProductDetail(\'' + p.id + '\')">Chi tiết</button>' +
            '<button class="btn btn-sm" ' + (p.stock <= 0 ? 'disabled style="opacity:0.5"' : '') + ' onclick="addToCart(\'' + p.id + '\')">' + (p.stock <= 0 ? 'Hết hàng' : 'Thêm giỏ') + '</button>' +
            '</div>' +
            '</div>';
    }).join('');

    if (pagBox) {
        var pagHtml = '';
        for (var i = 1; i <= totalPages; i++) {
            pagHtml += '<button class="' + (i === currentPage ? 'btn' : 'btn-outline') + ' btn-sm" onclick="changePage(' + i + ')">' + i + '</button>';
        }
        pagBox.innerHTML = pagHtml;
    }
}

function changePage(page) {
    currentPage = page;
    renderProductList();
}

/*POPUP CHI TIẾT 2 CỘT & THÊM GIỎ*/
function showProductDetail(id) {
    if (!currentUser) {
        openAuth('login');
        return;
    }

    var p = findProduct(id);
    if (!p) return;

    var html = '<h3>Chi tiết sản phẩm</h3>' +
        '<div class="detail-grid-layout" style="margin-top: 15px;">' +
        '' +
        '<div class="detail-left-box">' +
        esc(p.type || 'Sản phẩm') +
        '</div>' +

        '' +
        '<div class="detail-right-box">' +
        '<p style="margin-bottom: 6px;"><b>Mã SP:</b> ' + p.id + '</p>' +
        '<p style="margin-bottom: 6px;"><b>Tên SP:</b> ' + esc(p.name) + '</p>' +
        '<p style="margin-bottom: 6px;"><b>Loại SP:</b> ' + esc(p.type || 'Khác') + '</p>' +
        '<p style="margin-bottom: 6px;"><b>Giá bán:</b> <span style="color:var(--accent-color); font-weight:700;">' + money(p.price) + '</span></p>' +
        '<p style="margin-bottom: 15px;"><b>Tồn kho:</b> ' + p.stock + '</p>' +
        '<button class="btn" style="width: 100%;" ' + (p.stock <= 0 ? 'disabled style="opacity:0.5"' : '') + ' onclick="addToCart(\'' + p.id + '\'); closeModal();">' +
        (p.stock <= 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng') +
        '</button>' +
        '</div>' +
        '</div>';

    openModal(html, true);
}

function addToCart(pid) {
    if (!currentUser) {
        openAuth('login');
        return;
    }

    var cart = load('wishy_cart', []);
    var item = cart.filter(function (i) { return i.pid === pid; })[0];
    var p = findProduct(pid);

    if (item) {
        if (item.qty + 1 > p.stock) { alert('Số lượng vượt quá tồn kho!'); return; }
        item.qty++;
    } else {
        cart.push({ pid: pid, qty: 1, selected: true });
    }

    save('wishy_cart', cart);
    alert('Đã thêm "' + p.name + '" vào giỏ hàng!');
}

/*HIỂN THỊ DANH MỤC TRONG BỘ LỌC*/
function renderCategories() {
  var selectFilter = document.getElementById('filter-type');

  if (selectFilter) {
    selectFilter.innerHTML = '<option value="all">Tất cả loại</option>' +
      categories.map(function(c) { return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('');
  }
}

/*KHỞI TẠO MÀN HÌNH*/
function renderPage() {
  renderCategories();
  renderProductList();
}

initSite('products');