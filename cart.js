
/* AURDERIT SHOPPING CART - COMPLETE VERSION */

(() => {
  "use strict";

  const CONFIG = {
    whatsappNumber: "917025848421",
    currency: "INR",
    storageKey: "aurderit_cart_v1",
    storeName: "AURDERIT"
  };

  const money = value =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: CONFIG.currency,
      maximumFractionDigits: 2
    }).format(Number(value) || 0);

  const escapeHTML = value =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

  function loadCart() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(CONFIG.storageKey) || "[]"
      );

      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  let cart = loadCart();

  function saveCart() {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(cart));
    renderCart();
  }

  const style = document.createElement("style");

  style.textContent = `
    #aurderit-cart-button {
      position:fixed;
      right:22px;
      bottom:22px;
      z-index:9998;
      width:62px;
      height:62px;
      border:0;
      border-radius:50%;
      background:#111;
      color:#fff;
      box-shadow:0 5px 22px #0004;
      font-size:25px;
      cursor:pointer;
    }

    #aurderit-cart-count {
      position:absolute;
      top:-5px;
      right:-5px;
      min-width:22px;
      height:22px;
      padding:0 5px;
      display:flex;
      align-items:center;
      justify-content:center;
      background:#e11d48;
      color:white;
      border-radius:20px;
      font-size:12px;
      font-weight:800;
    }

    #aurderit-cart-overlay {
      display:none;
      position:fixed;
      inset:0;
      z-index:9999;
      background:#0009;
      align-items:center;
      justify-content:center;
      padding:12px;
    }

    #aurderit-cart-overlay.open {
      display:flex;
    }

    #aurderit-cart-panel {
      width:100%;
      max-width:520px;
      max-height:92vh;
      overflow:auto;
      background:#fff;
      color:#171717;
      border-radius:18px;
      padding:20px;
      box-shadow:0 15px 50px #0004;
      font-family:Arial,sans-serif;
    }

    .ac-head {
      display:flex;
      justify-content:space-between;
      align-items:center;
    }

    .ac-head h2 {
      margin:0;
      font-size:22px;
    }

    .ac-close {
      border:0;
      background:#eee;
      border-radius:50%;
      width:36px;
      height:36px;
      cursor:pointer;
      font-size:20px;
    }

    .ac-item {
      display:flex;
      gap:12px;
      padding:14px 0;
      border-bottom:1px solid #eee;
    }

    .ac-item img {
      width:76px;
      height:76px;
      object-fit:cover;
      border-radius:10px;
      background:#f3f3f3;
    }

    .ac-item-info {
      flex:1;
      min-width:0;
    }

    .ac-item-info strong {
      display:block;
      margin-bottom:5px;
    }

    .ac-qty {
      display:flex;
      align-items:center;
      gap:10px;
      margin-top:8px;
    }

    .ac-qty button {
      width:29px;
      height:29px;
      border:0;
      border-radius:7px;
      background:#eee;
      cursor:pointer;
      font-size:18px;
    }

    .ac-remove {
      border:0;
      background:none !important;
      color:#c62828;
      cursor:pointer;
      font-size:12px !important;
      width:auto !important;
    }

    .ac-empty {
      text-align:center;
      padding:35px 10px;
      color:#666;
    }

    .ac-total {
      display:flex;
      justify-content:space-between;
      font-size:18px;
      font-weight:800;
      padding:17px 0;
    }

    .ac-form {
      display:grid;
      gap:10px;
      margin-top:12px;
    }

    .ac-form label {
      font-size:13px;
      font-weight:700;
    }

    .ac-form input,
    .ac-form textarea,
    .ac-form select {
      display:block;
      width:100%;
      box-sizing:border-box;
      margin-top:5px;
      padding:12px;
      border:1px solid #ddd;
      border-radius:9px;
      background:#fff;
      color:#111;
      font:inherit;
    }

    .ac-form textarea {
      min-height:75px;
    }

    .ac-checkout {
      width:100%;
      border:0;
      border-radius:10px;
      padding:15px;
      background:#16a34a;
      color:#fff;
      font-size:16px;
      font-weight:800;
      cursor:pointer;
      margin-top:12px;
    }

    .ac-note {
      font-size:12px;
      color:#666;
      line-height:1.5;
    }
  `;

  document.head.appendChild(style);

  function installUI() {
    if (document.getElementById("aurderit-cart-button")) return;

    document.body.insertAdjacentHTML("beforeend", `
      <button id="aurderit-cart-button" aria-label="Open cart">
        🛒
        <span id="aurderit-cart-count">0</span>
      </button>

      <div id="aurderit-cart-overlay">
        <section id="aurderit-cart-panel"
          role="dialog"
          aria-modal="true">

          <div class="ac-head">
            <h2>Your Shopping Cart</h2>
            <button class="ac-close" id="ac-close">×</button>
          </div>

          <div id="ac-cart-content"></div>

        </section>
      </div>
    `);

    document.getElementById("aurderit-cart-button")
      .addEventListener("click", openCart);

    document.getElementById("ac-close")
      .addEventListener("click", closeCart);

    document.getElementById("aurderit-cart-overlay")
      .addEventListener("click", event => {
        if (event.target.id === "aurderit-cart-overlay") {
          closeCart();
        }
      });

    document.getElementById("ac-cart-content")
      .addEventListener("click", handleCartClick);

    document.getElementById("ac-cart-content")
      .addEventListener("submit", handleCheckout);

    renderCart();
  }

  function openCart() {
    document.getElementById("aurderit-cart-overlay")
      .classList.add("open");

    renderCart();
  }

  function closeCart() {
    document.getElementById("aurderit-cart-overlay")
      .classList.remove("open");
  }

  function itemCount() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  function cartTotal() {
    return cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }

  function addToCart(product, quantity = 1, openAfter = false) {
    const id = String(product.id || "");
    const name = String(product.name || "").trim();
    const price = Number(product.price);
    const stock = Math.max(0, Number(product.stock) || 0);

    if (!id || !name || !Number.isFinite(price) || price < 0) {
      alert("Product information is missing. Please refresh.");
      return;
    }

    if (stock < 1) {
      alert("This product is out of stock.");
      return;
    }

    const existing = cart.find(item => item.id === id);
    const nextQuantity = (existing?.quantity || 0) + quantity;

    if (nextQuantity > stock) {
      alert(`Only ${stock} item(s) available.`);
      return;
    }

    if (existing) {
      existing.quantity = nextQuantity;
      existing.name = name;
      existing.price = price;
      existing.image = product.image || existing.image;
      existing.stock = stock;
    } else {
      cart.push({
        id,
        name,
        price,
        image: product.image || "",
        stock,
        quantity
      });
    }

    saveCart();

    if (openAfter) {
      openCart();
    }
  }

  function renderCart() {
    const count = document.getElementById("aurderit-cart-count");
    const content = document.getElementById("ac-cart-content");

    if (!count || !content) return;

    count.textContent = itemCount();
    count.style.display = itemCount() ? "flex" : "none";

    if (!cart.length) {
      content.innerHTML = `
        <div class="ac-empty">
          <div style="font-size:42px">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Add products to get started.</p>
        </div>
      `;
      return;
    }

    content.innerHTML = `
      ${cart.map(item => `
        <div class="ac-item">
          <img
            src="${escapeHTML(item.image)}"
            alt="${escapeHTML(item.name)}"
            onerror="this.style.visibility='hidden'"
          >

          <div class="ac-item-info">
            <strong>${escapeHTML(item.name)}</strong>
            <div>${money(item.price)}</div>

            <div class="ac-qty">
              <button type="button"
                data-action="minus"
                data-id="${escapeHTML(item.id)}">−</button>

              <span>${item.quantity}</span>

              <button type="button"
                data-action="plus"
                data-id="${escapeHTML(item.id)}">+</button>

              <button type="button"
                class="ac-remove"
                data-action="remove"
                data-id="${escapeHTML(item.id)}">
                Remove
              </button>
            </div>
          </div>
        </div>
      `).join("")}

      <div class="ac-total">
        <span>Subtotal</span>
        <span>${money(cartTotal())}</span>
      </div>

      <form class="ac-form" id="ac-checkout-form">

        <h3>Delivery details</h3>

        <label>Full name
          <input name="customerName"
            required maxlength="100"
            autocomplete="name"
            placeholder="Your full name">
        </label>

        <label>Mobile number
          <input name="phone"
            required type="tel"
            maxlength="25"
            autocomplete="tel"
            placeholder="Your mobile number">
        </label>

        <label>Delivery address
          <textarea name="address"
            required maxlength="500"
            autocomplete="street-address"
            placeholder="City, district, street, building"></textarea>
        </label>

        <label>Payment method
          <select name="payment" required>
            <option value="Cash on Delivery (COD)">
              Cash on Delivery (COD)
            </option>
            <option value="Online payment">
              Online payment
            </option>
          </select>
        </label>

        <label>Order notes (optional)
          <textarea name="notes"
            maxlength="300"
            placeholder="Delivery instructions"></textarea>
        </label>

        <button class="ac-checkout" type="submit">
          Place Order on WhatsApp
        </button>

        <p class="ac-note">
          Your order will open in WhatsApp. Send the prepared message
          to confirm it. Online payment will be arranged with the store.
        </p>
      </form>
    `;
  }

  function handleCartClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const item = cart.find(
      product => product.id === button.dataset.id
    );

    if (!item) return;

    switch (button.dataset.action) {
      case "plus":
        if (item.quantity < item.stock) {
          item.quantity++;
        } else {
          alert(`Only ${item.stock} item(s) available.`);
        }
        break;

      case "minus":
        item.quantity--;

        if (item.quantity <= 0) {
          cart = cart.filter(product => product.id !== item.id);
        }
        break;

      case "remove":
        cart = cart.filter(product => product.id !== item.id);
        break;
    }

    saveCart();
  }

  function handleCheckout(event) {
    if (event.target.id !== "ac-checkout-form") return;

    event.preventDefault();

    if (!cart.length) {
      alert("Your cart is empty.");
      return;
    }

    const form = new FormData(event.target);

    const customerName = String(
      form.get("customerName") || ""
    ).trim();

    const phone = String(form.get("phone") || "").trim();
    const address = String(form.get("address") || "").trim();
    const payment = String(form.get("payment") || "");
    const notes = String(form.get("notes") || "").trim();

    if (!customerName || !phone || !address) {
      alert("Please complete your delivery details.");
      return;
    }

    const lines = cart.map((item, index) =>
      `${index + 1}. ${item.name}\n` +
      `Qty: ${item.quantity} x ${money(item.price)} = ${money(item.price * item.quantity)}`
    );

    const message = [
      `*${CONFIG.storeName} - NEW ORDER*`,
      "",
      "*Customer details*",
      `Name: ${customerName}`,
      `Phone: ${phone}`,
      `Address: ${address}`,
      "",
      "*Products*",
      ...lines,
      "",
      `*Subtotal: ${money(cartTotal())}*`,
      "Delivery: To be confirmed",
      `Payment method: ${payment}`,
      notes ? `Notes: ${notes}` : "",
      "",
      "Please confirm this order."
    ].filter(Boolean).join("\n");

    const whatsappURL =
      "https://wa.me/" +
      CONFIG.whatsappNumber +
      "?text=" +
      encodeURIComponent(message);

    window.open(whatsappURL, "_blank", "noopener,noreferrer");
  }

  // Connect Add to Cart and Buy Now buttons.
  document.addEventListener("click", event => {
    const button = event.target.closest(
      "[data-aurderit-add], [data-aurderit-buy]"
    );

    if (!button) return;

    const product = {
      id: button.dataset.productId,
      name: button.dataset.productName,
      price: button.dataset.productPrice,
      image: button.dataset.productImage,
      stock: button.dataset.productStock
    };

    const buyNow = button.hasAttribute("data-aurderit-buy");

    addToCart(product, 1, buyNow);
  });

  window.AurderitCart = {
    add: addToCart,
    open: openCart,
    close: closeCart
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installUI);
  } else {
    installUI();
  }

})();
