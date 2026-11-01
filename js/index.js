/* Phần của Linh - TV2 */


















var currentPage = 1;
var ITEMS_PER_PAGE = 6;

function getStoredProducts() {
    return load('wishy_products', products);
}

// 1. Hàm chuyển Tab danh mục trên Header + Lọc sản phẩm + Cuộn mượt
// Hàm chuyển Tab danh mục trên Header + Cuộn xuống qua khỏi Header che thanh xanh
// Hàm chuyển Tab danh mục trên Header
function selectCategory(catName, element) {
    // 1. Đổi màu Active cho nút trên Header
    document.querySelectorAll('.cat-tab').forEach(function (tab) {
        tab.classList.remove('active');
    });
    if (element) {
        element.classList.add('active');
    }

    // 2. Nếu bấm vào TRANG CHỦ -> Cuộn lên đầu trang, đặt bộ lọc về tất cả
    if (catName === 'home') {
        var selectType = document.getElementById('filter-type');
        if (selectType) selectType.value = 'all';

        filterProducts();

        // Cuộn mượt về đầu trang
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        return;
    }

    // 3. Nếu bấm vào các danh mục sản phẩm (Tất cả SP, Túi vải, Áo freesize...)
    var selectType = document.getElementById('filter-type');
    if (selectType) {
        selectType.value = catName;
    }

    // Lọc sản phẩm
    if (typeof filterProducts === 'function') {
        filterProducts();
    }

    // Tính toán độ cao Header ghim để cuộn xuống vừa khít không che thanh xanh
    var header = document.querySelector('.site-header');
    var section = document.getElementById('products');

    if (section) {
        var headerOffset = header ? header.offsetHeight : 0;
        var elementPosition = section.getBoundingClientRect().top;
        var offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

// 2. Lọc sản phẩm 3 tiêu chí
function getFilteredProducts() {
    var nameVal = document.getElementById('filter-name') ? document.getElementById('filter-name').value.toLowerCase().trim() : '';
    var typeVal = document.getElementById('filter-type') ? document.getElementById('filter-type').value : 'all';
    var priceVal = document.getElementById('filter-price') ? document.getElementById('filter-price').value : 'all';

    var list = getStoredProducts();

    return list.filter(function (p) {
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

// 3. Render Lưới sản phẩm & Nút phân trang
function renderProductList() {
    var grid = document.getElementById('product-grid');
    var pagBox = document.getElementById('pagination-box');
    if (!grid) return;

    var list = getFilteredProducts();

    if (!list.length) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 60px 20px; color:#7B8BA0; font-weight:600;">Không tìm thấy sản phẩm phù hợp.</div>';
        if (pagBox) pagBox.innerHTML = '';
        return;
    }

    var totalPages = Math.ceil(list.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;

    var start = (currentPage - 1) * ITEMS_PER_PAGE;
    var pageItems = list.slice(start, start + ITEMS_PER_PAGE);

    grid.innerHTML = pageItems.map(function (p) {
        var priceFormatted = p.price.toLocaleString('vi-VN') + 'đ';
        var imgHtml = p.img ? '<img src="' + p.img + '" alt="' + p.name + '">' : '<span>' + (p.type || 'SẢN PHẨM') + '</span>';

        return '<div class="product-card" onclick="openProductModal(\'' + p.id + '\')">' +
            '<div class="product-img-box">' + imgHtml + '</div>' +
            '<div class="product-brand">OHQUAO CONCEPT</div>' +
            '<div class="product-title">' + p.name + '</div>' +
            '<div class="product-price">' + priceFormatted + '</div>' +
            '</div>';
    }).join('');

    if (pagBox) {
        var pagHtml = '';
        for (var i = 1; i <= totalPages; i++) {
            pagHtml += '<button class="page-btn ' + (i === currentPage ? 'active' : '') + '" onclick="changePage(' + i + ')">' + i + '</button>';
        }
        pagBox.innerHTML = pagHtml;
    }
}

function changePage(page) {
    currentPage = page;
    renderProductList();
    var pSection = document.getElementById('products');
    if (pSection) pSection.scrollIntoView({ behavior: 'smooth' });
}

// 4. Modal Overlay Chi tiết sản phẩm
function openProductModal(id) {
    var currentUser = JSON.parse(localStorage.getItem('wishy_current'));
    if (!currentUser) {
        if (typeof openAuth === 'function') {
            openAuth('login');
        } else {
            alert('Vui lòng đăng nhập để xem chi tiết sản phẩm!');
        }
        return;
    }
    var list = getStoredProducts();
    var p = list.find(function (item) { return item.id === id; });
    if (!p) return;
    var overlay = document.getElementById('product-overlay');
    var content = document.getElementById('modal-detail-content');
    var priceFormatted = p.price.toLocaleString('vi-VN') + 'đ';
    var imgHtml = p.img ? '<img src="' + p.img + '" alt="' + p.name + '">' : '<span>' + (p.type || 'SẢN PHẨM') + '</span>';
    var imgList = (p.images && p.images.length) ? p.images : [p.img];
    var mainImgSrc = imgList[0] || '';

    var thumbsHtml = '';
    if (imgList.length > 1) {
        thumbsHtml = '<div class="modal-thumbs-list" style="display:flex; gap:8px; margin-top:10px;">' +
            imgList.map(function (src) {
                return '<img src="' + src + '" style="width:45px; height:45px; object-fit:cover; border:1px solid #ccc; cursor:pointer; border-radius:4px;" onclick="document.getElementById(\'modal-main-img\').src=\'' + src + '\'">';
            }).join('') +
            '</div>';
    }
    content.innerHTML =
        '<div class="modal-grid-2col">' +
        '<div class="modal-left-img" style="flex-direction:column;">' +
        '<img id="modal-main-img" src="' + mainImgSrc + '" alt="' + esc(p.name) + '" style="width:100%; border-radius:8px;">' +
        thumbsHtml +
        '</div>' +
        '<div class="modal-right-info">' +
        '<div class="modal-brand">OHQUAO CONCEPT</div>' +
        '<div class="modal-title">' + p.name + '</div>' +
        '<div class="modal-price">' + priceFormatted + '</div>' +
        '<div class="modal-desc">' + (p.desc || 'Sản phẩm lưu niệm độc quyền từ Wishy, thiết kế tinh tế và chất liệu cao cấp.') + '</div>' +
        '<div class="modal-stock">Mã SP: <b>' + p.id + '</b> &nbsp;|&nbsp; Tồn kho: <b>' + p.stock + '</b></div>' +
        '<button class="btn-add-cart" ' + (p.stock <= 0 ? 'disabled style="opacity:0.5"' : '') + ' onclick="addToCart(\'' + p.id + '\')">' +
        (p.stock <= 0 ? 'HẾT HÀNG' : 'THÊM VÀO GIỎ HÀNG') +
        '</button>' +
        '</div>' +
        '</div>';
    if (overlay) overlay.classList.add('show');
}

function closeProductModal(event) {
    var overlay = document.getElementById('product-overlay');
    if (overlay) overlay.classList.remove('show');
}

function addToCart(pid) {
    var currentUser = JSON.parse(localStorage.getItem('wishy_current'));
    if (!currentUser) {
        alert('Vui lòng đăng nhập để thực hiện thêm sản phẩm vào giỏ hàng!');
        return;
    }

    var cart = JSON.parse(localStorage.getItem('wishy_cart')) || [];
    var products = getStoredProducts();
    var p = products.find(function (item) { return item.id === pid; });

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
    if (container) {
        container.scrollBy({ left: direction * 280, behavior: 'smooth' });
    }
}

// Chỉ khởi tạo render danh sách sản phẩm khi tải trang
document.addEventListener('DOMContentLoaded', function () {
    renderProductList();
});