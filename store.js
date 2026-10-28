(() => {
  const grid = document.getElementById("products");
  const status = document.getElementById("status");
  const empty = document.getElementById("empty");
  const search = document.getElementById("search");
  const configReady = window.AURDERIT_SUPABASE_URL?.startsWith("https://") &&
    window.AURDERIT_SUPABASE_ANON_KEY && !window.AURDERIT_SUPABASE_ANON_KEY.includes("PASTE_");
  let products = [];
  if (!configReady || !window.supabase) {
    status.textContent = "Store setup is not finished yet. Configure Supabase by following README.txt.";
    return;
  }
  const db = window.supabase.createClient(window.AURDERIT_SUPABASE_URL, window.AURDERIT_SUPABASE_ANON_KEY);
  const safe = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const rupees = (value) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(value)||0);
  function render() {
    const q = search.value.trim().toLowerCase();
    const filtered = products.filter(p => `${p.name} ${p.category} ${p.description||""}`.toLowerCase().includes(q));
    grid.innerHTML = filtered.map(p => `<article class="product-card">
      <img class="product-image" src="${safe(p.image_url)}" alt="${safe(p.name)}" loading="lazy" onerror="this.style.display='none'">
      <div class="product-info"><div class="product-category">${safe(p.category)}</div><h3>${safe(p.name)}</h3>
      <p class="description">${safe(p.description || "A useful find from Aurderit.")}</p>
      <div class="price-row"><span class="price">${rupees(p.price)}</span><span class="stock">${Number(p.stock)>0?"In stock":"Check availability"}</span></div></div></article>`).join("");
    empty.classList.toggle("hidden", filtered.length !== 0);
    status.classList.toggle("hidden", products.length > 0);
  }
  async function load() {
    status.classList.remove("hidden"); status.textContent = "Loading products…";
    const {data,error} = await db.from("products").select("id,name,category,sku,image_url,description,price,stock,is_active,created_at").eq("is_active",true).order("created_at",{ascending:false});
    if(error){status.textContent="Could not load products. Check Supabase setup and database policies."; console.error(error);return;}
    products = data || []; render();
    if(!products.length){status.textContent="Your store is ready for products. Add the first product in Admin.";status.classList.remove("hidden");}
  }
  search.addEventListener("input", render);
  load();
})();
