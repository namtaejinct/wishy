document.addEventListener("DOMContentLoaded", () => {
    if (!currentUser) {
        window.location.href = "index.html";
        return;
    }

    renderHeader();
    loadUserData();
    renderMyOrders();

    const logoutBtn = document.getElementById("btn-logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            logout();
            alert("Đã đăng xuất thành công!");
            window.location.href = "products.html";
        });
    }
});

function loadUserData() {
    const user = findUser(currentUser.username) || currentUser;

    document.getElementById("sidebar-username").innerText = user.fullname;
    document.getElementById("info-name").innerText = user.fullname;
    document.getElementById("info-email").innerText = user.email || "Chưa cập nhật";
    document.getElementById("info-address").innerText = user.address || "Chưa cập nhật địa chỉ";
}

function switchProfileTab(tabName) {
    const tabInfo = document.getElementById("profile-tab-info");
    const tabOrders = document.getElementById("profile-tab-orders");
    const buttons = document.querySelectorAll(".profile-nav-btn");

    if (tabName === 'info') {
        tabInfo.style.display = "block";
        tabOrders.style.display = "none";
        buttons[0].classList.add("active");
        buttons[1].classList.remove("active");
    } 
    else if (tabName === 'orders') {
        tabInfo.style.display = "none";
        tabOrders.style.display = "block";
        buttons[0].classList.remove("active");
        buttons[1].classList.add("active");
        renderMyOrders();
    }
}

function toggleForm(type) {
    if (type === 'pass') {
        const form = document.getElementById("form-pass");
        form.style.display = form.style.display === "none" ? "block" : "none";
        document.getElementById("form-address").style.display = "none";
    } else if (type === 'address') {
        const form = document.getElementById("form-address");
        form.style.display = form.style.display === "none" ? "block" : "none";
        document.getElementById("form-pass").style.display = "none";
    }
}

function submitChangePassword() {
    const oldPass = document.getElementById("old-password").value;
    const newPass = document.getElementById("new-password").value;

    if (!oldPass || !newPass) {
        alert("Vui lòng nhập đầy đủ mật khẩu cũ và mới!");
        return;
    }

    const user = findUser(currentUser.username);
    if (!user || user.password !== oldPass) {
        alert("Mật khẩu hiện tại không đúng!");
        return;
    }
    if (newPass.length < 6) {
        alert("Mật khẩu mới phải từ 6 ký tự trở lên!");
        return;
    }

    user.password = newPass;
    save('wishy_users', users);

    alert("Đổi mật khẩu thành công!");
    document.getElementById("old-password").value = "";
    document.getElementById("new-password").value = "";
    toggleForm('pass');
}

function submitChangeAddress() {
    const newAddress = document.getElementById("updated-address").value.trim();

    if (!newAddress) {
        alert("Vui lòng nhập địa chỉ mới!");
        return;
    }

    const user = findUser(currentUser.username);
    if (user) {
        user.address = newAddress;
        save('wishy_users', users);
    }

    document.getElementById("info-address").innerText = newAddress;
    alert("Cập nhật địa chỉ thành công!");
    document.getElementById("updated-address").value = "";
    toggleForm('address');
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

function renderMyOrders() {
    var tb = document.getElementById('profile-orders-list');
    if (!tb) return;

    var mine = orders.filter(function (o) { return currentUser && o.user === currentUser.username; });
    if (!mine.length) {
        tb.innerHTML = '<tr class="empty-row"><td colspan="5">Bạn chưa có đơn hàng nào.</td></tr>';
        return;
    }

    tb.innerHTML = mine.map(function (o) {
        return '<tr><td>' + o.id + '</td><td>' + fmtDate(o.date) + '</td><td>' + money(orderTotal(o)) + '</td><td>' +
            statusBadge(o.status) + '</td><td><button class="btn btn-sm" onclick="showOrderDetail(\'' + o.id + '\')">Xem</button></td></tr>';
    }).join('');
}

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