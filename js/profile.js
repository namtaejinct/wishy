document.addEventListener("DOMContentLoaded", () => {
    loadUserData();

    const logoutBtn = document.getElementById("btn-logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("currentUser");
            alert("Đã đăng xuất thành công!");
            window.location.href = "products.html"; 
        });
    }
});

function loadUserData() {
    let user = JSON.parse(localStorage.getItem("currentUser")) || {
        name: "Nguyễn Văn A",
        email: "nam@gmail.com",
        address: "231 Đường ABC, Quận 12, TP.HCM"
    };

    document.getElementById("header-username").innerText = user.name;
    document.getElementById("sidebar-username").innerText = user.name;
    document.getElementById("info-name").innerText = user.name;
    document.getElementById("info-email").innerText = user.email || "name@gmail.com";
    document.getElementById("info-address").innerText = user.address || "Chưa cập nhật địa chỉ";
}

function switchProfileTab(tabName) {
    const tabInfo = document.getElementById("profile-tab-info");
    const tabOrders = document.getElementById("profile-tab-orders");
    
    const buttons = document.querySelectorAll(".card-box .btn-outline");

    if (tabName === 'info') {
        tabInfo.style.display = "block";
        tabOrders.style.display = "none";
        buttons[0].style.background = "#EBF3FA";
        buttons[1].style.background = "transparent";
    } else if (tabName === 'orders') {
        tabInfo.style.display = "none";
        tabOrders.style.display = "block";
        buttons[0].style.background = "transparent";
        buttons[1].style.background = "#EBF3FA";
        loadUserOrders();
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

    alert("Đổi mật khẩu thành công!");
    document.getElementById("old-password").value = "";
    document.getElementById("new-password").value = "";
    toggleForm('pass');
}

function submitChangeAddress() {
    const newAddress = document.getElementById("updated-address").value;

    if (!newAddress) {
        alert("Vui lòng nhập địa chỉ mới!");
        return;
    }

    document.getElementById("info-address").innerText = newAddress;
    let user = JSON.parse(localStorage.getItem("currentUser")) || {};
    user.address = newAddress;
    localStorage.setItem("currentUser", JSON.stringify(user));

    alert("Cập nhật địa chỉ thành công!");
    document.getElementById("updated-address").value = "";
    toggleForm('address');
}

function loadUserOrders() {
    const tbody = document.getElementById("profile-orders-list");
    let orders = JSON.parse(localStorage.getItem("userOrders")) || [];

    if (orders.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="5">Chưa có đơn hàng nào.</td></tr>`;
        return;
    }

    tbody.innerHTML = "";
    orders.forEach(order => {
        tbody.innerHTML += `
            <tr>
                <td>#${order.id}</td>
                <td>${order.date}</td>
                <td style="font-weight: 700; color: var(--accent-color);">${order.total}đ</td>
                <td><span class="badge ok">${order.status || 'Đang xử lý'}</span></td>
                <td><button class="btn btn-sm" onclick="viewOrderDetail('${order.id}')">Xem</button></td>
            </tr>
        `;
    });
}