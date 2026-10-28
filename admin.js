(() => {
  const $ = id => document.getElementById(id);
  const configReady = window.AURDERIT_SUPABASE_URL?.startsWith("https://") &&
    window.AURDERIT_SUPABASE_ANON_KEY && !window.AURDERIT_SUPABASE_ANON_KEY.includes("PASTE_");
  if (!configReady || !window.supabase) {
    $("setup-warning").classList.remove("hidden");
    $("login-panel").classList.add("hidden");
    return;
  }
  const db = window.supabase.createClient(window.AURDERIT_SUPABASE_URL, window.AURDERIT_SUPABASE_ANON_KEY);
  let currentUser = null;
  let products = [];
  const safe = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const rupees = (value) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(value)||0);
  function message(id,text,error=false){$(id).textContent=text;$(id).classList.toggle("error",error);}
  function resetForm(){
    $("product-form").reset(); $("product-id").value=""; $("stock").value="0"; $("active").checked=true;
    $("form-title").textContent="Add a product"; $("save-button").textContent="Save product"; message("form-message","");
  }
  function fillForm(p){
    $("product-id").value=p.id; $("name").value=p.name; $("category").value=p.category; $("sku").value=p.sku||"";
    $("image-url").value=p.image_url; $("description").value=p.description||""; $("price").value=p.price;
    $("cost").value=p.cost??""; $("stock").value=p.stock??0; $("active").checked=!!p.is_active;
    $("form-title").textContent="Edit product"; $("save-button").textContent="Update product"; message("form-message","");
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function renderInventory(){
    $("inventory-count").textContent=`${products.length} product${products.length===1?"":"s"}`;
    if(!products.length){$("inventory").innerHTML='<p class="muted">No products yet. Use the form to add your first item.</p>';return;}
    $("inventory").innerHTML=products.map(p=>`<article class="inventory-item">
      <img src="${safe(p.image_url)}" alt="" loading="lazy" onerror="this.style.display='none'">
      <div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><h3>${safe(p.name)}</h3><span class="status-pill ${p.is_active?"":"off"}">${p.is_active?"Visible":"Hidden"}</span></div>
      <p class="inventory-meta">${safe(p.category)} · ${rupees(p.price)} · Stock: ${Number(p.stock)||0}${p.sku?" · SKU: "+safe(p.sku):""}</p>
      <div class="inventory-actions"><button class="small-btn" data-edit="${safe(p.id)}">Edit</button><button class="small-btn" data-toggle="${safe(p.id)}">${p.is_active?"Hide":"Publish"}</button><button class="small-btn delete" data-delete="${safe(p.id)}">Delete</button></div></div></article>`).join("");
  }
  async function loadProducts(){
    $("inventory").innerHTML='<p class="muted">Loading inventory…</p>';
    const {data,error}=await db.from("products").select("*").order("created_at",{ascending:false});
    if(error){$("inventory").innerHTML='<p class="form-message error">Could not load products. Confirm the admin email in the SQL policies matches your sign-in email.</p>';console.error(error);return;}
    products=data||[];renderInventory();
  }
  async function showSession(){
    const {data:{session}}=await db.auth.getSession();
    currentUser=session?.user||null;
    $("login-panel").classList.toggle("hidden",!!currentUser);
    $("dashboard").classList.toggle("hidden",!currentUser);
    if(currentUser) await loadProducts();
  }
  $("login-form").addEventListener("submit",async e=>{
    e.preventDefault(); message("login-message","Signing in…");
    const {error}=await db.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});
    if(error){message("login-message",error.message,true);return;}
    message("login-message","Signed in."); await showSession();
  });
  $("signout").addEventListener("click",async()=>{await db.auth.signOut();resetForm();await showSession();});
  $("refresh").addEventListener("click",loadProducts);
  $("cancel-edit").addEventListener("click",resetForm);
  $("product-form").addEventListener("submit",async e=>{
    e.preventDefault(); if(!currentUser){message("form-message","Please sign in again.",true);return;}
    const payload={
      name:$("name").value.trim(),category:$("category").value,sku:$("sku").value.trim()||null,
      image_url:$("image-url").value.trim(),description:$("description").value.trim(),
      price:Number($("price").value),cost:$("cost").value===""?null:Number($("cost").value),
      stock:Number($("stock").value),is_active:$("active").checked,updated_at:new Date().toISOString()
    };
    if(!payload.name||!payload.image_url||!Number.isFinite(payload.price)||payload.price<0||payload.stock<0){message("form-message","Check the required fields and numeric values.",true);return;}
    $("save-button").disabled=true;message("form-message","Saving…");
    const id=$("product-id").value;
    const result=id?await db.from("products").update(payload).eq("id",id):await db.from("products").insert(payload);
    $("save-button").disabled=false;
    if(result.error){message("form-message",result.error.message,true);return;}
    message("form-message",id?"Product updated.":"Product added.");
    resetForm();await loadProducts();
  });
  $("inventory").addEventListener("click",async e=>{
    const edit=e.target.closest("[data-edit]"); const toggle=e.target.closest("[data-toggle]"); const del=e.target.closest("[data-delete]");
    if(edit){const p=products.find(x=>x.id===edit.dataset.edit);if(p)fillForm(p);return;}
    if(toggle){const p=products.find(x=>x.id===toggle.dataset.toggle);if(!p)return;
      const {error}=await db.from("products").update({is_active:!p.is_active,updated_at:new Date().toISOString()}).eq("id",p.id);
      if(error){alert("Could not update product: "+error.message);return;}await loadProducts();return;}
    if(del){const p=products.find(x=>x.id===del.dataset.delete);if(!p)return;
      if(!confirm(`Delete "${p.name}" permanently?`))return;
      const {error}=await db.from("products").delete().eq("id",p.id);
      if(error){alert("Could not delete product: "+error.message);return;}await loadProducts();}
  });
  // Bulk CSV / Excel importer. Runs with the signed-in user and existing Supabase RLS policies.
  let bulkRows = [];
  const norm = v => String(v ?? '').trim().toLowerCase().replace(/[\s_-]+/g,' ');
  const aliases = {name:['name','product name','product'],category:['category'],sku:['sku','product sku','code'],image_url:['image url','image_url','image','image link','photo url'],description:['description','short description'],price:['price','selling price','selling_price'],cost:['cost','supplier cost','supplier_cost','purchase price'],stock:['stock','stock quantity','quantity','qty'],is_active:['is active','is_active','active','show in store']};
  function cell(row,key){const ks=Object.keys(row);const found=ks.find(k=>(aliases[key]||[key]).includes(norm(k)));return found===undefined?'':row[found];}
  function truth(v, fallback){if(v===undefined||v===null||String(v).trim()==='')return fallback;const x=norm(v);if(['true','yes','y','1','show','active'].includes(x))return true;if(['false','no','n','0','hide','hidden','inactive'].includes(x))return false;return null;}
  function identity(p){return p.sku?'sku:'+norm(p.sku):'name:'+norm(p.name)+'|category:'+norm(p.category);}
  function parseRow(r,i){const errors=[];const name=String(cell(r,'name')??'').trim(),category=String(cell(r,'category')??'').trim()||'Other',sku=String(cell(r,'sku')??'').trim()||null,image_url=String(cell(r,'image_url')??'').trim(),description=String(cell(r,'description')??'').trim();const rp=String(cell(r,'price')??'').trim(),rc=String(cell(r,'cost')??'').trim(),rs=String(cell(r,'stock')??'').trim();const price=Number(rp),cost=rc===''?null:Number(rc),stock=rs===''?0:Number(rs);const is_active=truth(cell(r,'is_active'),$('bulk-active').value==='true');
    if(!name)errors.push('Product name required');if(name.length>120)errors.push('Name exceeds 120 characters');if(category.length>80)errors.push('Category exceeds 80 characters');if(!/^https:\/\/\S+/i.test(image_url))errors.push('Image URL must start with https://');if(rp===''||!Number.isFinite(price)||price<0)errors.push('Price must be a number ≥ 0');if(rc!==''&&(!Number.isFinite(cost)||cost<0))errors.push('Cost must be blank or ≥ 0');if(rs!==''&&(!Number.isInteger(stock)||stock<0))errors.push('Stock must be a whole number ≥ 0');if(description.length>700)errors.push('Description exceeds 700 characters');if(sku&&sku.length>60)errors.push('SKU exceeds 60 characters');if(is_active===null)errors.push('is_active must be true/false, yes/no, 1/0, show/hide');
    return {rowNumber:i+2,product:{name,category,sku,image_url,description,price,cost,stock,is_active:is_active??true},errors,duplicateInFile:false,duplicateExisting:false};}
  function drawBulkPreview(){const bad=bulkRows.filter(r=>r.errors.length),dups=bulkRows.filter(r=>r.duplicateInFile||r.duplicateExisting),ready=bulkRows.filter(r=>!r.errors.length&&!r.duplicateInFile&&(!r.duplicateExisting||$('duplicate-mode').value==='update'));$('bulk-summary').classList.remove('hidden');$('bulk-summary').innerHTML=`<span class="summary-chip">${bulkRows.length} rows</span><span class="summary-chip good">${ready.length} ready</span><span class="summary-chip bad">${bad.length} errors</span><span class="summary-chip warn">${dups.length} duplicates</span>`;
    const issues=bulkRows.filter(r=>r.errors.length||r.duplicateInFile||r.duplicateExisting);$('bulk-errors').classList.toggle('hidden',!issues.length);$('bulk-errors').innerHTML=issues.length?'<h3>Rows to review</h3><ul>'+issues.slice(0,100).map(r=>`<li><b>Row ${r.rowNumber}</b>: ${[...r.errors,...(r.duplicateInFile?['Duplicate within file']:[]),...(r.duplicateExisting?['Matches existing: '+(r.existingName||'product')]:[])].map(escapeHtml).join('; ')}</li>`).join('')+'</ul>':'';
    $('bulk-preview').classList.remove('hidden');$('bulk-preview').innerHTML='<table class="preview-table"><thead><tr><th>Row</th><th>Name</th><th>SKU</th><th>Price</th><th>Status</th><th>Issues</th></tr></thead><tbody>'+bulkRows.slice(0,200).map(r=>{const status=r.errors.length?'Error':r.duplicateInFile?'Duplicate in file':r.duplicateExisting?($('duplicate-mode').value==='update'?'Will update':'Will skip'):'Ready';const issue=[...r.errors,...(r.duplicateInFile?['Repeated row']:[]),...(r.duplicateExisting?['Existing match']:[])].join('; ');return `<tr><td>${r.rowNumber}</td><td>${escapeHtml(r.product.name)}</td><td>${escapeHtml(r.product.sku||'—')}</td><td>${escapeHtml(r.product.price)}</td><td>${escapeHtml(status)}</td><td>${escapeHtml(issue||'—')}</td></tr>`}).join('')+'</tbody></table>'+(bulkRows.length>200?'<p class="muted">Preview shows first 200 rows; validation checks all rows.</p>':'');$('import-button').disabled=!ready.length;}
  function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  async function previewBulk(){const file=$('bulk-file').files[0];if(!file){setMsg('bulk-message','Choose a file first.',true);return;}if(file.size>10*1024*1024){setMsg('bulk-message','Maximum file size is 10 MB.',true);return;}if(!window.XLSX){setMsg('bulk-message','Spreadsheet reader did not load. Check internet and reload.',true);return;}setMsg('bulk-message','Reading and validating…');$('preview-button').disabled=true;$('import-button').disabled=true;
    try{const wb=XLSX.read(await file.arrayBuffer(),{type:'array'});const sheet=wb.Sheets[wb.SheetNames[0]];const raw=XLSX.utils.sheet_to_json(sheet,{defval:'',raw:false});if(!raw.length)throw Error('First worksheet is empty or has no header row.');if(raw.length>2000)throw Error('Maximum 2,000 product rows per file.');bulkRows=raw.map(parseRow).filter(r=>Object.values(r.product).some(v=>v!==''&&v!==null));if(!bulkRows.length)throw Error('No product rows found.');const seen=new Set();bulkRows.forEach(r=>{const k=identity(r.product);if(seen.has(k))r.duplicateInFile=true;else seen.add(k);});const {data:existing,error}=await db.from('products').select('id,name,category,sku');if(error)throw Error('Could not check existing products: '+error.message);const skuMap=new Map(),nameMap=new Map();(existing||[]).forEach(p=>{if(p.sku)skuMap.set(norm(p.sku),p);nameMap.set('name:'+norm(p.name)+'|category:'+norm(p.category),p);});bulkRows.forEach(r=>{const p=r.product,m=p.sku?skuMap.get(norm(p.sku)):nameMap.get('name:'+norm(p.name)+'|category:'+norm(p.category));if(m){r.duplicateExisting=true;r.existingId=m.id;r.existingName=m.name;}});drawBulkPreview();setMsg('bulk-message',`Preview ready: ${bulkRows.length} rows checked.`);
    }catch(e){bulkRows=[];$('bulk-summary').classList.add('hidden');$('bulk-preview').classList.add('hidden');$('bulk-errors').classList.add('hidden');setMsg('bulk-message',e.message||'Could not read file.',true);}finally{$('preview-button').disabled=false;}}
  async function importBulk(){const mode=$('duplicate-mode').value;const candidates=bulkRows.filter(r=>!r.errors.length&&!r.duplicateInFile&&(!r.duplicateExisting||mode==='update'));if(!candidates.length){setMsg('bulk-message','No valid rows to import.',true);return;}if(!confirm(`Process ${candidates.length} rows? ${mode==='skip'?'Existing matches will be skipped.':'Existing matches will be updated.'} Rows with errors and repeated rows in this file are skipped.`))return;$('import-button').disabled=true;$('preview-button').disabled=true;let added=0,updated=0,skipped=bulkRows.length-candidates.length,failed=[];
    try{for(let i=0;i<candidates.length;i++){const r=candidates[i],payload={...r.product,updated_at:new Date().toISOString()};const result=r.duplicateExisting?await db.from('products').update(payload).eq('id',r.existingId):await db.from('products').insert(payload);if(result.error)failed.push({row:r.rowNumber,error:result.error.message});else if(r.duplicateExisting)updated++;else added++;if((i+1)%10===0||i===candidates.length-1)setMsg('bulk-message',`Processing ${i+1}/${candidates.length}…`);}
      setMsg('bulk-message',`Finished — added: ${added}; updated: ${updated}; skipped: ${skipped}; failed: ${failed.length}.`,failed.length>0);if(failed.length){$('bulk-errors').classList.remove('hidden');$('bulk-errors').innerHTML='<h3>Database errors</h3><ul>'+failed.slice(0,100).map(f=>`<li><b>Row ${f.row}</b>: ${escapeHtml(f.error)}</li>`).join('')+'</ul>';}await loadProducts();if(!failed.length){$('bulk-file').value='';bulkRows=[];$('bulk-summary').classList.add('hidden');$('bulk-preview').classList.add('hidden');$('bulk-errors').classList.add('hidden');}
    }finally{$('preview-button').disabled=false;$('import-button').disabled=!bulkRows.length;}}
  function setMsg(id,text,error=false){$(id).textContent=text;$(id).classList.toggle('error',error);}
  $('bulk-file').addEventListener('change',()=>{bulkRows=[];$('preview-button').disabled=!$('bulk-file').files.length;$('import-button').disabled=true;$('bulk-summary').classList.add('hidden');$('bulk-preview').classList.add('hidden');$('bulk-errors').classList.add('hidden');setMsg('bulk-message','File selected. Click Preview file before importing.');});
  $('preview-button').addEventListener('click',previewBulk);$('import-button').addEventListener('click',importBulk);$('duplicate-mode').addEventListener('change',()=>{if(bulkRows.length)drawBulkPreview();});

  db.auth.onAuthStateChange(()=>{setTimeout(showSession,0);});
  showSession();
})();
