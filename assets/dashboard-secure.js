const grid=document.getElementById('grid');
const search=document.getElementById('search');
const panel=document.getElementById('adminPanel');
let active='all';
let products=[];
let authenticated=false;

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function escAttr(v){return esc(v);}
function normalizeProduct(p){return {id:p.id,name:p.name||'',cat:p.category||'',price:p.price==null?'':String(p.price),rating:p.rating==null?'':String(p.rating),badge:p.badge||'',image:p.image||'',link:p.affiliate_url||'',status:p.status||'active'};}
function showError(message){alert(message);}

async function api(path,options={}){
  const response=await fetch(path,{credentials:'include',headers:{'Content-Type':'application/json',...(options.headers||{})},...options});
  let data={};
  try{data=await response.json();}catch(_){ }
  if(!response.ok){const err=new Error(data.error||'حدث خطأ في الاتصال.');err.status=response.status;throw err;}
  return data;
}

async function loadPublicProducts(){
  try{
    const data=await api('/api/products');
    products=(data.products||[]).map(normalizeProduct);
    renderProducts();
  }catch(err){console.error(err);products=[];renderProducts();}
}

function renderProducts(){
  if(!grid)return;
  const q=(search?.value||'').toLowerCase().trim();
  const list=products.filter(p=>(active==='all'||p.cat===active)&&(!q||(p.name+' '+p.cat).toLowerCase().includes(q)));
  grid.innerHTML=list.length?list.map(p=>`<article class="card" data-name="${esc(p.name.toLowerCase())}" data-cat="${esc(p.cat)}">
    <div class="pic">${p.badge?`<span class="badge">${esc(p.badge)}</span>`:''}<div class="device">${p.image?`<img src="${escAttr(p.image)}" alt="${escAttr(p.name)}" loading="lazy" style="max-width:100%;max-height:150px;object-fit:contain;border-radius:12px">`:'🎧'}</div></div>
    <div class="body"><div class="cat">${esc(p.cat)}</div><div class="title">${esc(p.name)}</div><div class="meta"><span class="rating">★ ${esc(p.rating)}</span> · تقييمات المنتج</div><div class="price">${esc(p.price)} <span class="old">السعر السابق</span></div>${p.link?`<button class="buy" onclick="affiliateById('${escAttr(p.id)}')">تسوّق بالعمولة ←</button>`:`<span class="buy" style="text-align:center">رابط الإحالة قيد التفعيل</span>`}</div>
  </article>`).join(''):`<div class="note">لا توجد منتجات مطابقة للبحث.</div>`;
}

function affiliateById(id){
  const product=products.find(p=>p.id===id);
  if(product?.link)window.open(product.link,'_blank','noopener,noreferrer');
  else showError('رابط AliExpress Affiliate غير مضاف لهذا المنتج.');
}
function affiliate(name){const p=products.find(x=>x.name===name);if(p)affiliateById(p.id);else showError('المنتج غير موجود.');}
function filterProducts(){renderProducts();}

document.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');active=b.dataset.cat;renderProducts();
}));
search?.addEventListener('input',renderProducts);

async function ensureOwner(){
  try{await api('/api/auth/session');authenticated=true;return true;}catch(err){authenticated=false;if(err.status!==401&&err.status!==403)showError(err.message);return false;}
}

async function openAdmin(){
  if(!(await ensureOwner())){
    const email=prompt('Owner Dashboard — البريد الإلكتروني للمالك:');
    if(email===null)return;
    const password=prompt('Owner Dashboard — كلمة مرور المالك:');
    if(password===null)return;
    try{
      await api('/api/auth/login',{method:'POST',body:JSON.stringify({email,password})});
      authenticated=true;
    }catch(err){showError(err.message);return;}
  }
  panel.classList.add('open');panel.setAttribute('aria-hidden','false');
  await loadAdminProducts();
}

document.getElementById('adminLauncher')?.addEventListener('click',openAdmin);
document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==='a'){e.preventDefault();openAdmin();}if(e.key==='Escape')closeAdmin();});
function closeAdmin(){panel.classList.remove('open');panel.setAttribute('aria-hidden','true');}
document.getElementById('adminClose')?.addEventListener('click',closeAdmin);
function resetForm(){document.getElementById('productForm').reset();document.getElementById('editIndex').value='-1';document.getElementById('formTitle').textContent='إضافة منتج';}
document.getElementById('formCancel')?.addEventListener('click',resetForm);

async function loadAdminProducts(){
  try{
    const data=await api('/api/products?status=all');
    products=(data.products||[]).map(normalizeProduct);
    renderProducts();renderAdmin();
  }catch(err){if(err.status===401||err.status===403){authenticated=false;closeAdmin();showError('انتهت صلاحية جلسة المالك. يرجى تسجيل الدخول من جديد.');}else showError(err.message);}
}

function formPayload(){return {
  name:document.getElementById('pName').value.trim(),
  category:document.getElementById('pCat').value.trim(),
  price:document.getElementById('pPrice').value.trim(),
  rating:document.getElementById('pRating').value.trim(),
  badge:document.getElementById('pBadge').value.trim(),
  image:document.getElementById('pImage').value.trim(),
  affiliate_url:document.getElementById('pLink').value.trim(),
  status:'active'
};}

document.getElementById('productForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!authenticated||!(await ensureOwner()))return;
  const id=document.getElementById('editIndex').value;
  try{
    const data=await api(id&&id!=='-1'?`/api/products/${encodeURIComponent(id)}`:'/api/products',{method:id&&id!=='-1'?'PUT':'POST',body:JSON.stringify(formPayload())});
    const saved=normalizeProduct(data.product);
    if(id&&id!=='-1'){const i=products.findIndex(p=>p.id===id);if(i>=0)products[i]=saved;}
    else products.unshift(saved);
    resetForm();renderProducts();renderAdmin();
  }catch(err){if(err.status===401||err.status===403){authenticated=false;closeAdmin();}showError(err.message);}
});

function renderAdmin(){
  const list=document.getElementById('adminList');if(!list)return;
  document.getElementById('adminCount').textContent=products.length;
  list.innerHTML=products.map(p=>`<div class="admin-row"><div><strong>${esc(p.name)}</strong><small>${esc(p.price)} · ${esc(p.cat)} · ${p.link?'Affiliate ✓':'Affiliate غير مضاف'} · ${esc(p.status)}</small></div><div class="row-actions"><button onclick="editProduct('${escAttr(p.id)}')">تعديل</button> <button onclick="deleteProduct('${escAttr(p.id)}')">حذف</button></div></div>`).join('');
}
function editProduct(id){
  const p=products.find(x=>x.id===id);if(!p)return;
  document.getElementById('pName').value=p.name;document.getElementById('pCat').value=p.cat;document.getElementById('pPrice').value=p.price;document.getElementById('pRating').value=p.rating;document.getElementById('pBadge').value=p.badge;document.getElementById('pImage').value=p.image;document.getElementById('pLink').value=p.link;document.getElementById('editIndex').value=p.id;document.getElementById('formTitle').textContent='تعديل المنتج';
}
async function deleteProduct(id){
  if(!confirm('حذف هذا المنتج؟'))return;
  if(!authenticated||!(await ensureOwner()))return;
  try{await api(`/api/products/${encodeURIComponent(id)}`,{method:'DELETE'});products=products.filter(p=>p.id!==id);renderProducts();renderAdmin();}catch(err){showError(err.message);}
}

loadPublicProducts();
