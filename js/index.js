/* Phần của Linh - TV2 */
document.addEventListener("DOMContentLoaded", function () {
    
    const slideImages = document.querySelectorAll(".slide-img");
    const dots = document.querySelectorAll(".dot");
    let currentSlide = 0;
    let slideInterval;

    function showSlide(index) {
       
        slideImages.forEach(img => img.style.display = "none");
        dots.forEach(dot => dot.style.background = "#fff");

        if (slideImages[index]) {
            slideImages[index].style.display = "block";
        }
        if (dots[index]) {
            dots[index].style.background = "var(--primary-color)";
        }
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slideImages.length;
        showSlide(currentSlide);
    }

    dots.forEach((dot, index) => {
        dot.addEventListener("click", function () {
            currentSlide = index;
            showSlide(currentSlide);
            resetInterval();
        });
    });

    function startInterval() {
        slideInterval = setInterval(nextSlide, 4000);
    }

    function resetInterval() {
        clearInterval(slideInterval);
        startInterval();
    }

    if (slideImages.length > 0) {
        showSlide(currentSlide);
        startInterval();
    }

    const productPool = [
        { brand: "Brand 1", name: "Áo Da Lat", price: "120.000đ", img: "D:\\Download\\sp1.jpg" },
        { brand: "Brand 2", name: "Móc Khóa Sài Gòn", price: "45.000đ", img: "D:\\Download\\sp2.jpg" },
        { brand: "Brand 3", name: "Túi Bình An Vô Sự", price: "150.000đ", img: "D:\\Download\\sp3.jpg" },
        { brand: "Brand 4", name: "Nam Châm Lưu Niệm", price: "35.000đ", img: "D:\\Download\\sp1.jpg" },
        { brand: "Brand 5", name: "Huy Hiệu Wishy", price: "25.000đ", img: "D:\\Download\\sp2.jpg" },
        { brand: "Brand 6", name: "Sổ Tay Vintage", price: "80.000đ", img: "D:\\Download\\sp3.jpg" }
    ];

    const prevBtn = document.getElementById("prev-prod-btn");
    const nextBtn = document.getElementById("next-prod-btn");
    const container = document.getElementById("signature-products-container");

    function renderRandomProducts() {
        if (!container) return;

        let shuffled = [...productPool].sort(() => 0.5 - Math.random());
        let selectedProducts = shuffled.slice(0, 3);
       
        let htmlContent = "";
        selectedProducts.forEach(prod => {
            htmlContent += `
                <div class="card-box" style="margin: 0; padding: 15px; text-align: center; animation: fadeIn 0.4s ease;">
                    <img src="${prod.img}" alt="${prod.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;">
                    <p style="font-size: 13px; color: #7B8BA0; margin: 0 0 5px 0; font-weight: 600;">${prod.brand}</p>
                    <h4 style="font-size: 15px; margin: 0 0 8px 0; color: var(--text-color);">${prod.name}</h4>
<p style="font-size: 15px; font-weight: 700; color: var(--accent-color); margin: 0;">${prod.price}</p>
                </div>
            `;
        });

        container.innerHTML = htmlContent;
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", renderRandomProducts);
    }
    if (prevBtn) {
        prevBtn.addEventListener("click", renderRandomProducts);
    }

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
    var list = getStoredProducts();
    var p = list.find(function (item) { return item.id === id; });
    if (!p) return;

    currentModalProduct = p; // Lưu sản phẩm đang mở

    var overlay = document.getElementById('product-overlay');
    var content = document.getElementById('modal-detail-content');
    var priceFormatted = p.price.toLocaleString('vi-VN') + 'đ';
    var imgList = (p.images && p.images.length) ? p.images : [p.img];
    var mainImgSrc = imgList[0] || '';

    // 1. HTML cho 2 chấm tròn
    var dotsHtml = '';
    if (imgList.length > 1) {
        dotsHtml = 
            '<div class="modal-dots-list">' +
                '<span class="dot-btn active" onclick="changeModalImg(0, this)"></span>' +
                '<span class="dot-btn" onclick="changeModalImg(1, this)"></span>' +
            '</div>';
    }

    // 2. HTML cho Phân loại (Tối đa 2 loại, tự ẩn nếu không có)
    var variantsHtml = '';
    if (p.variants && p.variants.length > 0) {
        variantsHtml = '<div class="variant-row"><span class="variant-label">Phân loại:</span><div class="variant-list">';
        p.variants.forEach(function (v, idx) {
            variantsHtml += '<button type="button" class="variant-btn ' + (idx === 0 ? 'active' : '') + '" onclick="selectVariant(this)">' + v + '</button>';
        });
        variantsHtml += '</div></div>';
    }

    // 3. HTML cho Tăng / Giảm số lượng
    var qtyHtml = 
        '<div class="qty-row">' +
            '<span class="variant-label">Số lượng:</span>' +
            '<div class="qty-control">' +
                '<button type="button" class="qty-btn" onclick="changeModalQty(-1)">-</button>' +
                '<input type="number" id="modal-qty-input" value="1" min="1" max="' + p.stock + '" readonly>' +
                '<button type="button" class="qty-btn" onclick="changeModalQty(1)">+</button>' +
            '</div>' +
        '</div>';

    content.innerHTML =
        '<div class="modal-grid-2col">' +
            '<div class="modal-left-col">' +  /* <--- BỔ SUNG LẠI THẺ NÀY */
                '<div class="modal-left-img">' +
                    '<img id="modal-main-img" src="' + mainImgSrc + '" alt="' + p.name + '">' +
                '</div>' +
                dotsHtml +
            '</div>' +                       /* <--- ĐÓNG THẺ BÊN TRÁI */
            '<div class="modal-right-info">' +
                '<div class="modal-brand">WISHY CONCEPT</div>' +
                '<div class="modal-title">' + p.name + '</div>' +
                '<div class="modal-price">' + priceFormatted + '</div>' +
                '<div class="modal-desc">' + (p.desc || 'Sản phẩm lưu niệm độc quyền từ Wishy.') + '</div>' +
                '<div class="modal-stock">Mã SP: <b>' + p.id + '</b> &nbsp;|&nbsp; Tồn kho: <b>' + p.stock + '</b></div>' +
                variantsHtml +
                qtyHtml +
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