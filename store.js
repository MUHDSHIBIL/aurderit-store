
(() => {
  const grid = document.getElementById("products");
  const status = document.getElementById("status");
  const empty = document.getElementById("empty");
  const search = document.getElementById("search");

  const configReady =
    window.AURDERIT_SUPABASE_URL?.startsWith("https://") &&
    window.AURDERIT_SUPABASE_ANON_KEY &&
    !window.AURDERIT_SUPABASE_ANON_KEY.includes("PASTE_");

  let products = [];

  if (!grid || !status || !empty || !search) {
    console.error("Aurderit: Required store HTML elements are missing.");
    return;
  }

  if (!configReady || !window.supabase) {
    status.textContent =
      "Store setup is not finished yet. Configure Supabase by following README.txt.";
    return;
  }

  const db = window.supabase.createClient(
    window.AURDERIT_SUPABASE_URL,
    window.AURDERIT_SUPABASE_ANON_KEY
  );

  const safe = value =>
    String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));

  const rupees = value =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(Number(value) || 0);

  // Product gallery and shopping button styles
  const style = document.createElement("style");

  style.textContent = `
    .product-gallery {
      width: 100%;
      overflow: hidden;
    }

    .product-image {
      width: 100%;
      aspect-ratio: 1 / 1;
      object-fit: cover;
      display: block;
      background: #f3f3f3;
    }

    .product-thumbnails {
      display: flex;
      gap: 8px;
      padding: 10px;
      overflow-x: auto;
    }

    .product-thumb {
      width: 58px;
      height: 58px;
      flex: 0 0 58px;
      padding: 0;
      border: 2px solid transparent;
      border-radius: 7px;
      overflow: hidden;
      cursor: pointer;
      background: #eee;
    }

    .product-thumb.selected {
      border-color: #111;
    }

    .product-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .aurderit-product-actions {
      display: flex;
      gap: 9px;
      padding: 14px;
    }

    .aurderit-add-cart,
    .aurderit-buy-now {
      flex: 1;
      min-width: 0;
      padding: 13px 8px;
      border: none;
      border-radius: 9px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: .2s ease;
    }

    .aurderit-add-cart {
      background: #171717;
      color: white;
    }

    .aurderit-buy-now {
      background: #e5e5e5;
      color: #111;
    }

    .aurderit-add-cart:hover {
      background: #333;
    }

    .aurderit-buy-now:hover {
      background: #ccc;
    }

    .aurderit-add-cart:disabled,
    .aurderit-buy-now:disabled {
      opacity: .5;
      cursor: not-allowed;
    }
  `;

  document.head.appendChild(style);

  function getImages(product) {
    const urls = Array.isArray(product.image_urls)
      ? product.image_urls
      : [];

    return [...new Set(
      [product.image_url, ...urls]
        .filter(url => typeof url === "string" && url.trim())
    )].slice(0, 5);
  }

  function render() {
    const q = search.value.trim().toLowerCase();

    const filtered = products.filter(p =>
      `${p.name} ${p.category} ${p.description || ""}`
        .toLowerCase().includes(q)
    );

    grid.innerHTML = filtered.map(p => {
      const images = getImages(p);
      const mainImage = images[0] || "";
      const stock = Math.max(0, Number(p.stock) || 0);
      const available = stock > 0;

      return `
        <article class="product-card">

          <div class="product-gallery">

            <img
              class="product-image"
              src="${safe(mainImage)}"
              alt="${safe(p.name)}"
              loading="lazy"
              onerror="this.style.display='none'"
            >

            ${
              images.length > 1
                ? `<div class="product-thumbnails">
                    ${images.map((url, index) => `
                      <button
                        type="button"
                        class="product-thumb ${index === 0 ? "selected" : ""}"
                        data-gallery-product="${safe(p.id)}"
                        data-gallery-index="${index}"
                        aria-label="View product image ${index + 1}"
                        aria-pressed="${index === 0}"
                      >
                        <img src="${safe(url)}" alt="" loading="lazy">
                      </button>
                    `).join("")}
                  </div>`
                : ""
            }

          </div>

          <div class="product-info">

            <div class="product-category">
              ${safe(p.category)}
            </div>

            <h3>${safe(p.name)}</h3>

            <p class="description">
              ${safe(p.description || "A useful find from Aurderit.")}
            </p>

            <div class="price-row">
              <span class="price">${rupees(p.price)}</span>

              <span class="stock">
                ${available ? "In stock" : "Out of stock"}
              </span>
            </div>

          </div>

          <div class="aurderit-product-actions">

            <button
              type="button"
              class="aurderit-add-cart"
              data-aurderit-add
              data-product-id="${safe(p.id)}"
              data-product-name="${safe(p.name)}"
              data-product-price="${Number(p.price) || 0}"
              data-product-image="${safe(mainImage)}"
              data-product-stock="${stock}"
              ${!available ? "disabled" : ""}
            >
              Add to Cart
            </button>

            <button
              type="button"
              class="aurderit-buy-now"
              data-aurderit-buy
              data-product-id="${safe(p.id)}"
              data-product-name="${safe(p.name)}"
              data-product-price="${Number(p.price) || 0}"
              data-product-image="${safe(mainImage)}"
              data-product-stock="${stock}"
              ${!available ? "disabled" : ""}
            >
              Buy Now
            </button>

          </div>

        </article>
      `;
    }).join("");

    empty.classList.toggle("hidden", filtered.length !== 0);
    status.classList.toggle("hidden", products.length > 0);

    if (!filtered.length && products.length > 0) {
      empty.classList.remove("hidden");
    }
  }

  // Product gallery thumbnail selection
  grid.addEventListener("click", event => {
    const button = event.target.closest("[data-gallery-product]");
    if (!button) return;

    const product = products.find(
      p => String(p.id) === button.dataset.galleryProduct
    );

    if (!product) return;

    const images = getImages(product);
    const index = Number(button.dataset.galleryIndex);
    const url = images[index];

    if (!url) return;

    const gallery = button.closest(".product-gallery");
    const main = gallery.querySelector(".product-image");

    main.src = url;
    main.style.display = "block";

    gallery.querySelectorAll(".product-thumb").forEach(thumb => {
      const selected = thumb === button;
      thumb.classList.toggle("selected", selected);
      thumb.setAttribute("aria-pressed", String(selected));
    });

    // Update the image used by Add to Cart and Buy Now.
    const actions = button.closest(".product-card")
      .querySelectorAll("[data-aurderit-add], [data-aurderit-buy]");

    actions.forEach(action => {
      action.dataset.productImage = url;
    });
  });

  async function load() {
    status.classList.remove("hidden");
    status.textContent = "Loading products…";

    const { data, error } = await db
      .from("products")
      .select(
        "id,name,category,sku,image_url,image_urls,description,price,stock,is_active,created_at"
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      status.textContent =
        "Could not load products. Check Supabase setup and database policies.";
      console.error("Aurderit Supabase error:", error);
      return;
    }

    products = data || [];
    render();

    if (!products.length) {
      status.textContent =
        "Your store is ready for products. Add the first product in Admin.";
      status.classList.remove("hidden");
    } else {
      status.classList.add("hidden");
    }
  }

  search.addEventListener("input", render);

  load();
})();
