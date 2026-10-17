// =========================
// DOMINGO KIDS WEAR SHOP
// SCRIPT.JS PART 1
// =========================


// =========================
// LOCAL STORAGE
// =========================

let cart =
    JSON.parse(
        localStorage.getItem(
            "dkw_cart"
        )
    ) || [];


let currentUser =
    JSON.parse(
        localStorage.getItem(
            "dkw_user"
        )
    ) || null;


let products = [];

const KIDS_SIZES = ["2-3 Years", "3-4 Years", "4-5 Years", "5-6 Years", "6-7 Years", "7-8 Years"];

function sizeOptionsHTML(selectedSize = "") {
    return `<option value="">Choose size</option>` + KIDS_SIZES.map(size =>
        `<option value="${size}" ${selectedSize === size ? "selected" : ""}>${size}</option>`
    ).join("");
}


let pendingOrder =
    JSON.parse(
        localStorage.getItem(
            "dkw_pendingOrder"
        )
    ) || null;


// =========================
// SHOW SECTION
// =========================

function showSection(sectionId) {

    const protectedSections = ["products", "productView", "cart", "orders", "receipt"];
    if (protectedSections.includes(sectionId) && !currentUser) {
        alert("Please login first to access the shop.");
        sectionId = "login";
    }

    const sections =
        document.querySelectorAll(
            ".section"
        );

    sections.forEach(
        section => {

            section.style.display =
                "none";

        }
    );


    const section =
        document.getElementById(
            sectionId
        );


    if (section) {
        section.style.display = "block";
    }

    document.querySelectorAll(".nav-links button[data-section]").forEach(button => {
        button.classList.toggle("active", button.dataset.section === sectionId);
    });


    if (
        sectionId ===
        "products"
    ) {

        loadProducts();

    }


    if (
        sectionId ===
        "cart"
    ) {

        renderCart();

    }


    if (sectionId === "orders") {
        loadOrders();
    }

    if (sectionId === "receipt") {
        loadReceipt();
    }

}


// =========================
// ACCOUNT UI
// =========================

function updateAccountUI() {
    const isLoggedIn = Boolean(currentUser);
    const loginBtn = document.getElementById("loginNavBtn");
    const registerBtn = document.getElementById("registerNavBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    // Login and Sign Up are only shown before authentication.
    if (loginBtn) loginBtn.style.display = isLoggedIn ? "none" : "inline-block";
    if (registerBtn) registerBtn.style.display = isLoggedIn ? "none" : "inline-block";

    // Shop tabs are only shown after a successful login.
    document.querySelectorAll('.nav-links button[data-auth="required"]').forEach(button => {
        button.style.display = isLoggedIn ? "inline-block" : "none";
    });

    if (logoutBtn) logoutBtn.style.display = isLoggedIn ? "inline-block" : "none";
}


// =========================
// CART COUNT
// =========================

function updateCartCount() {

    const cartCount =
        document.getElementById(
            "cartCount"
        );


    if (!cartCount) {
        return;
    }


    let count = 0;


    cart.forEach(
        item => {

            count +=
                Number(
                    item.quantity
                );

        }
    );


    cartCount.textContent =
        count;

}


// =========================
// LOAD PRODUCTS
// =========================

async function loadProducts() {

    try {

        const response =
            await fetch(
                "/api/products"
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            console.error(
                data.message
            );

            return;

        }


        products =
            data.products;


        renderProducts();


    } catch (error) {

        console.error(
            "Products error:",
            error
        );

    }

}
// =========================
// RENDER PRODUCTS
// =========================

function renderProducts() {
    const container = document.getElementById("productsContainer");
    if (!container) return;
    container.innerHTML = "";

    products.forEach(product => {
        const card = document.createElement("div");
        card.className = "product-card";
        const description = String(product.description || "Comfortable kids wear for everyday use.");
        const shortDescription = description.length > 105 ? description.slice(0, 102) + "..." : description;

        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}" onclick="viewProduct(${product.id})">
            <h3>${product.name}</h3>
            <p class="product-description">${shortDescription}</p>
            <p class="price">₱${Number(product.price).toFixed(2)}</p>
            <label class="size-label" for="productSize-${product.id}">Kids size</label>
            <select class="size-select" id="productSize-${product.id}">
                ${sizeOptionsHTML()}
            </select>
            <button onclick="addToCart(${product.id}, document.getElementById('productSize-${product.id}').value)">
                Add to Cart 🛒
            </button>
            <button onclick="viewProduct(${product.id})">Full Description</button>
        `;
        container.appendChild(card);
    });
}


// =========================
// VIEW PRODUCT
// =========================

function viewProduct(productId) {
    const product = products.find(item => Number(item.id) === Number(productId));
    if (!product) return;

    const container = document.getElementById("productViewContainer");
    if (!container) return;

    container.innerHTML = `
        <div class="product-details">
            <img src="${product.image}" alt="${product.name}">
            <div class="product-details-info">
                <p class="shop-tag">DOMINGO KIDS WEAR · KIDS FASHION</p>
                <h2>${product.name}</h2>
                <p class="product-full-description">${product.description || "Comfortable kids wear for everyday use."}</p>
                <h3>₱${Number(product.price).toFixed(2)}</h3>
                <label class="size-label" for="productViewSize">Select Size *</label>
                <select class="size-select" id="productViewSize" required>
                    ${sizeOptionsHTML()}
                </select>
                <p class="size-help">Size options: 2–3, 3–4, 4–5, 5–6, 6–7 and 7–8 years. Please check your child’s measurements before ordering.</p>
                <button onclick="addToCart(${product.id}, document.getElementById('productViewSize').value)">Add to Cart 🛒</button>
                <button onclick="showSection('products')">Back to Products</button>
            </div>
        </div>
    `;
    showSection("productView");
}


// =========================
// ADD TO CART
// =========================

function addToCart(productId, selectedSize = "") {
    const product = products.find(item => Number(item.id) === Number(productId));
    if (!product) return;

    const size = String(selectedSize || "").trim();
    if (!KIDS_SIZES.includes(size)) {
        alert("Please choose a kids size before adding this item to your cart.");
        return;
    }

    const existing = cart.find(item =>
        Number(item.id) === Number(productId) && item.size === size
    );

    if (existing) {
        existing.quantity = Number(existing.quantity) + 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            image: product.image,
            description: product.description || "",
            size,
            quantity: 1,
            selected: true
        });
    }

    localStorage.setItem("dkw_cart", JSON.stringify(cart));
    updateCartCount();
    renderCart();
    alert(`${product.name} (Size: ${size}) added to cart!`);
}


// =========================
// RENDER CART
// =========================

function renderCart() {

    const container =
        document.getElementById(
            "cartContainer"
        );

    const totalContainer =
        document.getElementById(
            "cartTotal"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";


    if (cart.length === 0) {

        container.innerHTML = `
            <p>
                Your cart is empty.
            </p>
        `;

        if (totalContainer) {
            totalContainer.textContent =
                "Total: ₱0.00";
        }

        return;
    }


    let total = 0;


    cart.forEach(
        (item, index) => {

            const subtotal =
                Number(item.price) *
                Number(item.quantity);


            if (item.selected) {
                total += subtotal;
            }


            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "cart-item";


            div.innerHTML = `

                <input
                    type="checkbox"
                    ${item.selected ? "checked" : ""}
                    onchange="toggleCartItem(
                        ${index},
                        this.checked
                    )"
                >

                <img
                    src="${item.image}"
                    alt="${item.name}"
                >

                <div class="cart-info">

                    <h3>
                        ${item.name}
                    </h3>

                    <p class="cart-size"><strong>Size:</strong> ${item.size || "Not selected"}</p>

                    <p>
                        ₱${Number(
                            item.price
                        ).toFixed(2)}
                    </p>

                    <div class="quantity-controls">

                        <button
                            onclick="changeQuantity(
                                ${index},
                                -1
                            )"
                        >
                            −
                        </button>

                        <span>
                            ${item.quantity}
                        </span>

                        <button
                            onclick="changeQuantity(
                                ${index},
                                1
                            )"
                        >
                            +
                        </button>

                    </div>

                    <p>
                        Subtotal:
                        ₱${subtotal.toFixed(2)}
                    </p>

                    <button
                        onclick="removeCartItem(
                            ${index}
                        )"
                    >
                        Remove
                    </button>

                </div>

            `;


            container.appendChild(
                div
            );

        }
    );


    if (totalContainer) {

        totalContainer.textContent =
            "Total: ₱" +
            total.toFixed(2);

    }

}


// =========================
// TOGGLE CART ITEM
// =========================

function toggleCartItem(
    index,
    checked
) {

    if (!cart[index]) {
        return;
    }


    cart[index].selected =
        checked;


    localStorage.setItem(
        "dkw_cart",
        JSON.stringify(cart)
    );


    renderCart();

}


// =========================
// CHANGE QUANTITY
// =========================

function changeQuantity(
    index,
    amount
) {

    if (!cart[index]) {
        return;
    }


    cart[index].quantity =
        Number(
            cart[index].quantity
        ) + amount;


    if (
        cart[index].quantity < 1
    ) {

        cart[index].quantity = 1;

    }


    localStorage.setItem(
        "dkw_cart",
        JSON.stringify(cart)
    );


    updateCartCount();

    renderCart();

}


// =========================
// REMOVE CART ITEM
// =========================

function removeCartItem(index) {

    if (!cart[index]) {
        return;
    }


    cart.splice(
        index,
        1
    );


    localStorage.setItem(
        "dkw_cart",
        JSON.stringify(cart)
    );


    updateCartCount();

    renderCart();

}


// =========================
// GET SELECTED ITEMS
// =========================

function getSelectedItems() {

    return cart.filter(
        item =>
            item.selected === true
    );

}
// =========================
// REGISTER
// =========================

async function register() {

    const name =
        document.getElementById(
            "registerName"
        ).value.trim();

    const email =
        document.getElementById(
            "registerEmail"
        ).value.trim();

    const password =
        document.getElementById(
            "registerPassword"
        ).value;


    if (
        !name ||
        !email ||
        !password
    ) {

        alert(
            "Please complete all fields."
        );

        return;
    }


    try {

        const response =
            await fetch(
                "/api/register",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        name,
                        email,
                        password
                    })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "Registration failed."
            );

            return;
        }


        alert(
            "Registration successful!"
        );


        document.getElementById(
            "registerName"
        ).value = "";

        document.getElementById(
            "registerEmail"
        ).value = "";

        document.getElementById(
            "registerPassword"
        ).value = "";


        showSection("login");


    } catch (error) {

        console.error(
            "Register error:",
            error
        );

        alert(
            "Unable to connect to server."
        );

    }

}


// =========================
// LOGIN
// =========================

async function login() {

    const email =
        document.getElementById(
            "loginEmail"
        ).value.trim();

    const password =
        document.getElementById(
            "loginPassword"
        ).value;


    if (
        !email ||
        !password
    ) {

        alert(
            "Please enter email and password."
        );

        return;
    }


    try {

        const response =
            await fetch(
                "/api/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "Login failed."
            );

            return;
        }


        currentUser =
            data.user;


        localStorage.setItem(
            "dkw_user",
            JSON.stringify(
                currentUser
            )
        );


        alert(
            "Login successful!"
        );


        updateAccountUI();

        showSection(
            "products"
        );

        loadOrders();


    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        alert(
            "Unable to connect to server."
        );

    }

}


// =========================
// LOGOUT
// =========================

function logout() {

    currentUser = null;


    localStorage.removeItem(
        "dkw_user"
    );


    updateAccountUI();

    showSection("login");

    alert(
        "You have been logged out."
    );

}


// =========================
// PAYMENT MODAL
// =========================

function openPaymentModal() {

    if (!currentUser) {

        alert(
            "Please Login or Sign Up first."
        );

        showSection("login");

        return;
    }


    const selectedItems =
        getSelectedItems();


    if (
        selectedItems.length === 0
    ) {

        alert(
            "Please select at least one item."
        );

        return;
    }


    const modal =
        document.getElementById(
            "paymentModal"
        );


    if (modal) {

        modal.style.display =
            "flex";

    }

}


// =========================
// CLOSE PAYMENT MODAL
// =========================

function closePaymentModal() {

    const modal =
        document.getElementById(
            "paymentModal"
        );


    if (modal) {

        modal.style.display =
            "none";

    }

}


// =========================
// COD PAYMENT
// =========================

async function payWithCOD() {

    if (!currentUser) {

        alert(
            "Please Login or Sign Up first."
        );

        closePaymentModal();

        showSection("login");

        return;
    }


    const selectedItems =
        getSelectedItems();


    if (
        selectedItems.length === 0
    ) {

        alert(
            "Please select at least one item."
        );

        closePaymentModal();

        return;
    }


    try {

        const response =
            await fetch(
                "/api/checkout-cod",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        cart:
                            selectedItems,

                        userId:
                            currentUser.id

                    })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "COD checkout failed."
            );

            return;
        }


        removeSelectedItems();

        closePaymentModal();


        alert(
            "COD order created. Payment is still pending until delivery.\n\n" +
            "Order Number: " +
            data.orderNumber
        );


        showSection("orders");
        loadOrders();
        loadReceipt();

    } catch (error) {

        console.error(
            "COD error:",
            error
        );

        alert(
            "Unable to place COD order."
        );

    }

}
// =========================
// PAY WITH MAYA
// =========================

async function payWithMaya() {

    if (!currentUser) {

        alert(
            "Please Login or Sign Up first."
        );

        closePaymentModal();

        showSection("login");

        return;
    }


    const selectedItems =
        getSelectedItems();


    if (
        selectedItems.length === 0
    ) {

        alert(
            "Please select at least one item."
        );

        closePaymentModal();

        return;
    }


    closePaymentModal();


    try {

        const response =
            await fetch(
                "/api/checkout",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        cart:
                            selectedItems,

                        userId:
                            currentUser.id

                    })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "Maya checkout failed."
            );

            return;
        }


        pendingOrder = {

            orderNumber:
                data.orderNumber,

            checkoutId:
                data.checkoutId,

            selectedItems:
                selectedItems

        };


        localStorage.setItem(
            "dkw_pendingOrder",
            JSON.stringify(
                pendingOrder
            )
        );


        window.location.href =
            data.redirectUrl;


    } catch (error) {

        console.error(
            "Maya checkout error:",
            error
        );

        alert(
            "Unable to connect to Maya."
        );

    }

}


// =========================
// REMOVE SELECTED ITEMS
// =========================

function removeSelectedItems() {

    cart =
        cart.filter(
            item =>
                item.selected !== true
        );


    localStorage.setItem(
        "dkw_cart",
        JSON.stringify(cart)
    );


    updateCartCount();

    renderCart();

}
// =========================
// CONFIRM PENDING MAYA PAYMENT
// =========================

async function confirmPendingPayment() {

    if (!currentUser) {
        return;
    }

    if (!pendingOrder) {
        return;
    }


    try {

        const response =
            await fetch(
                "/api/orders/confirm-payment",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        orderNumber:
                            pendingOrder.orderNumber,

                        checkoutId:
                            pendingOrder.checkoutId,

                        userId:
                            currentUser.id

                    })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "Unable to confirm Maya payment."
            );

            return;
        }


        removeSelectedItems();


        pendingOrder = null;


        localStorage.removeItem(
            "dkw_pendingOrder"
        );


        alert(
            "Maya payment successful!\n\n" +
            "Order Number: " +
            data.orderNumber
        );


        showSection("orders");
        loadOrders();
        loadReceipt();

    } catch (error) {

        console.error(
            "Payment confirmation error:",
            error
        );

        alert(
            "Unable to confirm payment."
        );

    }

}


// =========================
// LOAD ORDERS
// =========================

async function loadOrders() {

    if (!currentUser) {
        return;
    }


    const container =
        document.getElementById(
            "ordersContainer"
        );


    if (!container) {
        return;
    }


    try {

        const response =
            await fetch(
                "/api/orders/" +
                currentUser.id
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            container.innerHTML =
                "<p>Unable to load orders.</p>";

            return;
        }


        container.innerHTML = "";


        if (
            data.orders.length === 0
        ) {

            container.innerHTML = `
                <p>
                    No orders yet.
                </p>
            `;

            return;
        }


        const groupedOrders = {};


        data.orders.forEach(
            order => {

                if (
                    !groupedOrders[
                        order.order_number
                    ]
                ) {

                    groupedOrders[
                        order.order_number
                    ] = {

                        orderNumber:
                            order.order_number,

                        total:
                            order.total,

                        paymentMethod:
                            order.payment_method,

                        paymentStatus:
                            order.payment_status,

                        orderStatus:
                            order.order_status,

                        createdAt:
                            order.created_at,

                        items: []

                    };

                }


                if (
                    order.product_id
                ) {

                    groupedOrders[
                        order.order_number
                    ].items.push(order);

                }

            }
        );


        Object.values(
            groupedOrders
        ).forEach(
            order => {

                const div =
                    document.createElement(
                        "div"
                    );

                div.className =
                    "order-card";


                let itemsHTML = "";


                order.items.forEach(
                    item => {

                        itemsHTML += `

                            <div class="order-item">

                                <img
                                    src="${getProductImage(
                                        item.product_id
                                    )}"
                                    alt="${item.product_name}"
                                >

                                <div>

                                    <strong>
                                        ${item.product_name}
                                    </strong>

                                    <p><strong>Size:</strong> ${item.size || "Not selected"}</p>

                                    <p>
                                        ₱${Number(
                                            item.price
                                        ).toFixed(2)}
                                        ×
                                        ${item.quantity}
                                    </p>

                                    <p>
                                        Subtotal:
                                        ₱${Number(
                                            item.subtotal
                                        ).toFixed(2)}
                                    </p>

                                </div>

                            </div>

                        `;

                    }
                );


                div.innerHTML = `

                    <h3>
                        Order Number:
                        ${order.orderNumber}
                    </h3>

                    <p>
                        Payment:
                        ${order.paymentMethod}
                    </p>

                    <p>
                        Payment Status:
                        <strong>
                            ${order.paymentStatus}
                        </strong>
                    </p>

                    <p>
                        Order Status:
                        ${order.orderStatus}
                    </p>

                    <div>
                        ${itemsHTML}
                    </div>

                    <h3>
                        Total:
                        ₱${Number(
                            order.total
                        ).toFixed(2)}
                    </h3>

                `;


                container.appendChild(
                    div
                );

            }
        );


    } catch (error) {

        console.error(
            "Orders error:",
            error
        );

        container.innerHTML =
            "<p>Unable to load orders.</p>";

    }

}


// =========================
// RECEIPT - LATEST ORDER
// =========================
async function loadReceipt() {
    const container = document.getElementById("receiptContainer");
    if (!container) return;
    if (!currentUser) {
        container.innerHTML = '<p>Please login to view your receipt.</p>';
        return;
    }
    try {
        const response = await fetch("/api/orders/" + currentUser.id);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Unable to load receipt.");
        if (!data.orders || data.orders.length === 0) {
            container.innerHTML = '<p>No receipt yet. Place an order first.</p>';
            return;
        }
        const latestNumber = data.orders[0].order_number;
        const items = data.orders.filter(row => row.order_number === latestNumber);
        const order = items[0];
        const rows = items.filter(item => item.product_id).map(item => `
            <tr><td>${escapeReceiptText(item.product_name)}</td><td>${escapeReceiptText(item.size || "Not selected")}</td><td>${Number(item.quantity)}</td><td>₱${Number(item.price).toFixed(2)}</td><td>₱${Number(item.subtotal).toFixed(2)}</td></tr>
        `).join("");
        container.innerHTML = `
            <div class="receipt-paper" id="printReceipt">
                <div class="receipt-brand">Domingo Kids Wear 👕</div>
                <h3>ORDER RECEIPT</h3>
                <p><strong>Order No.:</strong> ${escapeReceiptText(order.order_number)}</p>
                <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                <p><strong>Payment:</strong> ${escapeReceiptText(order.payment_method)}</p>
                <p><strong>Payment status:</strong> ${escapeReceiptText(order.payment_status)}</p>
                <p><strong>Order status:</strong> ${escapeReceiptText(order.order_status)}</p>
                <table class="receipt-table"><thead><tr><th>Product</th><th>Size</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead><tbody>${rows}</tbody></table>
                <h3 class="receipt-total">TOTAL: ₱${Number(order.total).toFixed(2)}</h3>
                <p class="receipt-thanks">Thank you for shopping at Domingo Kids Wear!</p>
            </div>
            <button class="print-receipt-btn" onclick="window.print()">Print / Save Receipt</button>
        `;
    } catch (error) {
        console.error("Receipt error:", error);
        container.innerHTML = '<p>Unable to load receipt. Please try again.</p>';
    }
}

function escapeReceiptText(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}

// =========================
// PRODUCT IMAGE
// =========================

function getProductImage(
    productId
) {

    const product =
        products.find(
            item =>
                Number(item.id) ===
                Number(productId)
        );


    if (product) {

        return product.image;

    }


    return "images/image1.jpg";

}


// =========================
// PAGE LOAD
// =========================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateAccountUI();

        loadProducts();

        renderCart();

        updateCartCount();


        if (currentUser) {

            showSection(
                "products"
            );

            loadOrders();

        } else {

            showSection(
                "login"
            );

        }


        const params =
            new URLSearchParams(
                window.location.search
            );


        if (
            params.get("payment") ===
            "success"
        ) {

            if (currentUser) {

                confirmPendingPayment();

            } else {

                alert(
                    "Please login first."
                );

            }


            window.history.replaceState(
                {},
                document.title,
                "/"
            );

        }

    }
);

