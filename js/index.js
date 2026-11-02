/* Phần của Linh - TV2 */

















var currentPage = 1;
var ITEMS_PER_PAGE = 6;
var currentModalProduct = null;

function getStoredProducts() {
    return products;
}

// 1. Chuyển Tab danh mục & cuộn mượt
function selectCategory(catName, element) {
    document.querySelectorAll('.cat-tab').forEach(function (tab) {
        tab.classList.remove('active');
    });
    if (element) element.classList.add('active');

    var selectType = document.getElementById('filter-type');
    if (selectType) selectType.value = (catName === 'home') ? 'all' : catName;

    // Đổi tiêu đề danh mục tương ứng
    var titleElem = document.getElementById('current-category-title');
    if (titleElem) {
        titleElem.textContent = (catName === 'all' || catName === 'home') ? 'TẤT CẢ SẢN PHẨM' : catName.toUpperCase();
    }

    filterProducts();

    if (catName === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    var header = document.querySelector('.site-header');
    var section = document.getElementById('products');
    if (section) {
        var headerOffset = header ? header.offsetHeight : 0;
        var offsetPosition = section.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
}

// 2. Lọc sản phẩm 3 tiêu chí
function getFilteredProducts() {
    var nameVal = document.getElementById('filter-name') ? document.getElementById('filter-name').value.toLowerCase().trim() : '';
    var typeVal = document.getElementById('filter-type') ? document.getElementById('filter-type').value : 'all';
    var priceVal = document.getElementById('filter-price') ? document.getElementById('filter-price').value : 'all';

    return getStoredProducts().filter(function (p) {
        if (p.status === 'hidden') return false;
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

// 3. Render Lưới sản phẩm & Phân trang
function renderProductList() {
    var grid = document.getElementById('product-grid');
    var pagBox = document.getElementById('pagination-box');
    if (!grid) return;

    var list = getFilteredProducts();
    var start = (currentPage - 1) * ITEMS_PER_PAGE;
    var pageItems = list.slice(start, start + ITEMS_PER_PAGE);

    var htmlContent = '';
    pageItems.forEach(function (p) {
        htmlContent += `
            <div class="product-card" onclick="openProductModal('${p.id}')">
                <div class="product-img-box">
                    <img src="${p.img}" alt="${p.name}">
                </div>
                <div class="product-brand">WISHY CONCEPT</div>
                <div class="product-title">${p.name}</div>
                <div class="product-price">${p.price.toLocaleString('vi-VN')}đ</div>
            </div>
        `;
    });
    grid.innerHTML = htmlContent;

    var totalPages = Math.ceil(list.length / ITEMS_PER_PAGE);
    var pagHtml = '';
    for (var i = 1; i <= totalPages; i++) {
        pagHtml += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }
    if (pagBox) pagBox.innerHTML = pagHtml;
}

function changePage(page) {
    currentPage = page;
    renderProductList();
    var pSection = document.getElementById('products');
    if (pSection) pSection.scrollIntoView({ behavior: 'smooth' });
}

// 4. Modal Chi tiết sản phẩm
function openProductModal(id) {
    var p = getStoredProducts().find(function (item) { return item.id === id; });
    if (!p) return;

    currentModalProduct = p;
    var overlay = document.getElementById('product-overlay');
    var content = document.getElementById('modal-detail-content');
    var imgList = (p.images && p.images.length) ? p.images : [p.img];

    var dotsHtml = '';
    if (imgList.length > 1) {
        dotsHtml = 
            '<div class="modal-dots-list">' +
                '<span class="dot-btn active" onclick="changeModalImg(0, this)"></span>' +
                '<span class="dot-btn" onclick="changeModalImg(1, this)"></span>' +
            '</div>';
    }

    content.innerHTML =
        '<div class="modal-grid-2col">' +
            '<div class="modal-left-col">' +
                '<div class="modal-left-img">' +
                    '<img id="modal-main-img" src="' + imgList[0] + '" alt="' + p.name + '">' +
                '</div>' +
                dotsHtml +
            '</div>' +
            '<div class="modal-right-info">' +
                '<div class="modal-brand">WISHY CONCEPT</div>' +
                '<div class="modal-title">' + p.name + '</div>' +
                '<div class="modal-price">' + p.price.toLocaleString('vi-VN') + 'đ</div>' +
                '<div class="modal-desc">' + (p.desc || 'Sản phẩm lưu niệm độc quyền từ Wishy.') + '</div>' +
                '<div class="modal-stock">Mã SP: <b>' + p.id + '</b> &nbsp;|&nbsp; Tồn kho: <b>' + p.stock + '</b></div>' +
                '<button class="btn-add-cart" ' + (p.stock <= 0 ? 'disabled style="opacity:0.5"' : '') + ' onclick="addToCart(\'' + p.id + '\')">' +
                    (p.stock <= 0 ? 'HẾT HÀNG' : 'THÊM VÀO GIỎ HÀNG') +
                '</button>' +
            '</div>' +
        '</div>';

    if (overlay) overlay.classList.add('show');
}

function closeProductModal() {
    var overlay = document.getElementById('product-overlay');
    if (overlay) overlay.classList.remove('show');
}

function changeModalImg(index, btn) {
    var p = currentModalProduct;
    if (p && p.images && p.images[index]) {
        document.getElementById('modal-main-img').src = p.images[index];
    }
    document.querySelectorAll('.dot-btn').forEach(function (dot) { dot.classList.remove('active'); });
    btn.classList.add('active');
}

function addToCart(pid) {
    var currentUser = JSON.parse(localStorage.getItem('wishy_current'));
    if (!currentUser) {
        window.location.href = 'cart.html';
        return;
    }

    var cart = JSON.parse(localStorage.getItem('wishy_cart')) || [];
    var p = getStoredProducts().find(function (item) { return item.id === pid; });

    var existing = cart.find(function (item) { return item.pid === pid; });
    if (existing) {
        if (existing.qty + 1 > p.stock) {
            alert('Rất tiếc, số lượng chọn vượt quá tồn kho hiện có!');
            return;
        }
        existing.qty++;
    } else {
        cart.push({ pid: pid, qty: 1, selected: true });
    }

    localStorage.setItem('wishy_cart', JSON.stringify(cart));
    alert('Đã thêm "' + p.name + '" vào giỏ hàng thành công!');
    
    if (typeof renderHeader === 'function') renderHeader();
    closeProductModal();
}

function moveFeedback(direction) {
    var container = document.getElementById('feedback-wrapper');
    if (container) container.scrollBy({ left: direction * 280, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', function () {
    renderProductList();
});