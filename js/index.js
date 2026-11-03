/* Phần của Linh - TV2 */


var currentHeroIndex = 0;
var heroTimer = null;

function showHeroSlide(index) {
    var slides = document.querySelectorAll('.hero-slide-img');
    var dots = document.querySelectorAll('.hero-dot');
    if (!slides.length) return;

    if (index >= slides.length) currentHeroIndex = 0;
    else if (index < 0) currentHeroIndex = slides.length - 1;
    else currentHeroIndex = index;

    slides.forEach(function (img, i) {
        img.classList.toggle('active', i === currentHeroIndex);
    });
    dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === currentHeroIndex);
    });
}

function setHeroSlide(index) {
    showHeroSlide(index);
    resetHeroTimer();
}

function startHeroTimer() {
    if (!heroTimer) {
        heroTimer = setInterval(function () {
            showHeroSlide(currentHeroIndex + 1);
        }, 4000);
    }
}

function resetHeroTimer() {
    clearInterval(heroTimer);
    heroTimer = null;
    startHeroTimer();
}


function renderSignatureProducts() {
    var container = document.getElementById('signature-products-grid');
    if (!container) return;

    var list = typeof getStoredProducts === 'function' ? getStoredProducts() : defaultProducts;
    var signatureItems = [];

    var targetIds = ['SP020', 'SP015', 'SP010', 'SP001']; 
    
    targetIds.forEach(function(id) {
        var found = list.find(function(p) { return p.id === id; });
        if (found) signatureItems.push(found);
    });

    container.innerHTML = signatureItems.map(function (p) {
        var priceFormatted = p.price ? p.price.toLocaleString('vi-VN') + 'đ' : '0đ';
        var imgHtml = p.img ? '<img src="' + p.img + '" alt="' + p.name + '">' : '<span>' + (p.type || 'SẢN PHẨM') + '</span>';

        return '<div class="product-card" onclick="openProductModal(\'' + p.id + '\')">' +
            '<div class="product-img-box">' + imgHtml + '</div>' +
            '<div class="product-brand">WISHY CONCEPT</div>' +
            '<div class="product-title">' + p.name + '</div>' +
            '<div class="product-price">' + priceFormatted + '</div>' +
            '</div>';
    }).join('');
}


document.addEventListener('DOMContentLoaded', function () {
    showHeroSlide(0);
    startHeroTimer();
    renderSignatureProducts();
});




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
                    <img src="${p.img || NO_IMAGE}" alt="${esc(p.name)}">
                </div>
                <div class="product-brand">WISHY CONCEPT</div>
                <div class="product-title">${esc(p.name)}</div>
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
    var list = getStoredProducts();
    var p = list.find(function (item) { return item.id === id; });
    if (!p) return;

    currentModalProduct = p; 
    var mainImgSrc = (p.images && p.images.length) ? p.images[0] : (p.img || NO_IMAGE);
    // Bắn dữ liệu văn bản và hình ảnh vào các thẻ đã tạo sẵn bên HTML
    document.getElementById('modal-main-img').src = mainImgSrc;
    document.getElementById('modal-title-text').textContent = p.name;
    document.getElementById('modal-price-text').textContent = p.price.toLocaleString('vi-VN') + 'đ';
    document.getElementById('modal-desc-text').textContent = p.desc || 'Sản phẩm lưu niệm độc quyền từ Wishy.';
    document.getElementById('modal-stock-text').innerHTML = 'Mã SP: <b>' + p.id + '</b> &nbsp;|&nbsp; Tồn kho: <b>' + p.stock + '</b>';

    // Xử lý 2 chấm tròn đổi ảnh (chỉ hiển thị nếu có > 1 ảnh)
    var dotsContainer = document.getElementById('modal-dots-container');
    if (p.images && p.images.length > 1) {
        dotsContainer.innerHTML = '<div class="modal-dots-list">' +
            '<span class="dot-btn active" onclick="changeModalImg(0, this)"></span>' +
            '<span class="dot-btn" onclick="changeModalImg(1, this)"></span>' +
        '</div>';
    } else {
        dotsContainer.innerHTML = '';
    }

    // Xử lý nút phân loại
    var variantContainer = document.getElementById('modal-variants-container');
    if (p.variants && p.variants.length > 0) {
        var vHtml = '<div class="variant-row"><span class="variant-label">Phân loại:</span><div class="variant-list">';
        p.variants.forEach(function (v, idx) {
            vHtml += '<button type="button" class="variant-btn ' + (idx === 0 ? 'active' : '') + '" onclick="selectVariant(this)">' + esc(v) + '</button>';
        });
        variantContainer.innerHTML = vHtml + '</div></div>';
    } else {
        variantContainer.innerHTML = '';
    }

    // Xử lý số lượng tối đa và Nút Thêm giỏ hàng
    document.getElementById('modal-qty-input').value = 1;
    document.getElementById('modal-qty-input').max = p.stock;

    var addBtn = document.getElementById('modal-add-btn');
    if (p.stock <= 0) {
        addBtn.disabled = true;
        addBtn.style.opacity = '0.5';
        addBtn.textContent = 'HẾT HÀNG';
        addBtn.onclick = null;
    } else {
        addBtn.disabled = false;
        addBtn.style.opacity = '1';
        addBtn.textContent = 'THÊM VÀO GIỎ HÀNG';
        addBtn.onclick = function() { addToCart(p.id); };
    }

    var overlay = document.getElementById('product-overlay');
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
        var cartKey = 'wishy_cart_' + currentUser.username;
    var cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    var p = getStoredProducts().find(function (item) { return item.id === pid; });
    if (!p) return;

    // Lấy số lượng và phân loại khách đã chọn trong modal
    var qty = parseInt(document.getElementById('modal-qty-input').value, 10) || 1;
    var activeVariant = document.querySelector('#modal-variants-container .variant-btn.active');
    var variant = activeVariant ? activeVariant.textContent : '';

    // Tồn kho tính theo sản phẩm: cộng cả các dòng khác phân loại trong giỏ
    var inCart = cart.reduce(function (s, i) { return i.pid === pid ? s + i.qty : s; }, 0);
    if (inCart + qty > p.stock) {
        alert('Rất tiếc, số lượng chọn vượt quá tồn kho (còn ' + p.stock + ', trong giỏ đã có ' + inCart + ')!');
        return;
    }

    var existing = cart.find(function (i) { return i.pid === pid && (i.variant || '') === variant; });
    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({ pid: pid, qty: qty, selected: true, variant: variant });
    }

    localStorage.setItem(cartKey, JSON.stringify(cart));
    alert('Đã thêm "' + p.name + '" vào giỏ hàng thành công!');
    
    if (typeof renderHeader === 'function') renderHeader();
    closeProductModal();
}

function fillTypeFilter() {
    var sel = document.getElementById('filter-type');
    if (!sel) return;
    sel.innerHTML = '<option value="all">Tất cả loại</option>' +
        categories.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('');
}

document.addEventListener('DOMContentLoaded', function () {
    fillTypeFilter();
    renderProductList();
});

function selectVariant(btn) {
    var buttons = btn.parentElement.querySelectorAll('.variant-btn');
    buttons.forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
}

function changeModalQty(delta) {
    var input = document.getElementById('modal-qty-input');
    if (!input) return;
    var current = parseInt(input.value) || 1;
    var max = parseInt(input.max) || 99;
    var next = current + delta;
    if (next >= 1 && next <= max) {
        input.value = next;
    }
}
