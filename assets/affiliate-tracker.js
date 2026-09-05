(function(){
  const KEY='amazonite_events_v1';
  const MAX_EVENTS=5000;
  function load(){try{const value=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(value)?value:[]}catch(_){return []}}
  function save(event){try{const list=load();list.push(event);localStorage.setItem(KEY,JSON.stringify(list.slice(-MAX_EVENTS)));}catch(_){} }
  function track(type,data){save(Object.assign({id:'EV-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,7),type,timestamp:new Date().toISOString(),page:location.pathname},data||{}));}
  function affiliateClick(productId,offerId,affiliateUrl){
    let destination=null;
    try{destination=affiliateUrl?new URL(affiliateUrl,location.href).hostname:null;}catch(_){}
    track('affiliate_click',{product_id:productId||null,offer_id:offerId||null,destination_domain:destination});
  }
  window.AmazoniteTracker={track:track,affiliateClick:affiliateClick};

  document.addEventListener('DOMContentLoaded',function(){
    const topBar=document.querySelector('.shipping-bar');
    if(topBar) topBar.remove();

    const style=document.createElement('style');
    style.textContent=`
      .brand{position:relative;isolation:isolate;gap:10px}
      .mark{position:relative;overflow:visible!important;display:grid!important;place-items:center!important;width:42px!important;height:42px!important;background:linear-gradient(145deg,#063f3b 0%,#08766f 48%,#13a99a 100%)!important;border:1.5px solid rgba(113,239,226,.9)!important;border-radius:13px!important;box-shadow:0 0 0 1px rgba(7,118,111,.2),0 0 18px rgba(19,169,154,.28),inset 0 1px 0 rgba(255,255,255,.25)!important;color:#fff!important;animation:logoFloat 4s ease-in-out infinite}
      .mark:before{content:"";position:absolute;inset:-7px;border:1px solid rgba(67,221,205,.34);border-radius:16px;animation:logoPulse 3s ease-out infinite;pointer-events:none}
      .mark:after{content:"";position:absolute;width:6px;height:6px;border-radius:50%;background:#f4d35e;top:-5px;right:4px;box-shadow:0 0 5px #fff,0 0 14px rgba(244,211,94,.95);animation:logoSpark 2.4s ease-in-out infinite;pointer-events:none}
      .mark .am-icon{width:29px;height:29px;display:block;filter:drop-shadow(0 0 5px rgba(110,245,229,.45));animation:logoShine 5s ease-in-out infinite}
      .brand-text{letter-spacing:.4px;font-weight:950!important;display:inline-flex;align-items:center;position:relative}
      .brand-text:after{content:"STORE";position:absolute;right:0;bottom:-10px;font-size:7px;letter-spacing:4px;color:#3aaea4;font-weight:900;opacity:.9}
      .navcta,.buy,.primary{position:relative;overflow:hidden;transition:transform .2s ease,box-shadow .2s ease,background .2s ease!important}
      .navcta:hover,.buy:hover,.primary:hover{transform:translateY(-2px)!important;box-shadow:0 9px 22px rgba(0,91,87,.22)!important}
      .navcta:after,.buy:after,.primary:after{content:"";position:absolute;top:0;left:-80%;width:45%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.45),transparent);transform:skewX(-20deg);animation:ctaShine 3.8s ease-in-out infinite;pointer-events:none}
      .buy{font-size:11px!important;padding:11px 12px!important;font-weight:900!important;letter-spacing:.1px}
      @keyframes logoFloat{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-2px) rotate(1deg)}}
      @keyframes logoPulse{0%{transform:scale(.92);opacity:.7}70%,100%{transform:scale(1.18);opacity:0}}
      @keyframes logoSpark{0%,100%{transform:translate(0,0) scale(.8);opacity:.65}50%{transform:translate(-2px,2px) scale(1.25);opacity:1}}
      @keyframes logoShine{0%,58%,100%{filter:drop-shadow(0 0 4px rgba(110,245,229,.35))}70%{filter:drop-shadow(0 0 10px rgba(110,245,229,.95))}}
      @keyframes ctaShine{0%,65%{left:-80%}82%,100%{left:130%}}
      @media(max-width:650px){.mark{width:36px!important;height:36px!important;border-radius:11px!important}.mark .am-icon{width:25px;height:25px}.brand-text:after{font-size:6px;letter-spacing:3px;bottom:-8px}}
      @media(prefers-reduced-motion:reduce){.mark,.mark:before,.mark:after,.mark .am-icon,.navcta:after,.buy:after,.primary:after{animation:none!important}}
    `;
    document.head.appendChild(style);

    const mark=document.querySelector('.mark');
    if(mark){
      mark.innerHTML='<svg class="am-icon" viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="amg" x1="8" y1="35" x2="32" y2="5" gradientUnits="userSpaceOnUse"><stop stop-color="#8ff8ea"/><stop offset=".45" stop-color="#35cfc0"/><stop offset="1" stop-color="#f4d35e"/></linearGradient></defs><path d="M20 3 36 35H28.8L25.4 28H14.6L11.2 35H4L20 3Z" fill="none" stroke="url(#amg)" stroke-width="2.4" stroke-linejoin="round"/><path d="M17.1 22h5.8L20 15.8 17.1 22Z" fill="#f4d35e"/><path d="M20 3v12.8M14.6 28 20 15.8 25.4 28" fill="none" stroke="rgba(255,255,255,.72)" stroke-width="1.2"/></svg>';
      mark.setAttribute('aria-label','Amazonite Store');
      mark.setAttribute('title','Amazonite Store');
    }

    const brand=document.querySelector('.brand');
    if(brand){
      const text=[...brand.childNodes].find(n=>n.nodeType===3 && n.textContent.trim());
      if(text){const span=document.createElement('span');span.className='brand-text';span.textContent='أمازونيت';text.replaceWith(span)}
    }

    document.querySelectorAll('.navcta,.primary,.buy').forEach(function(btn){
      if(btn.classList.contains('buy')){
        if(!btn.classList.contains('disabled')) btn.textContent='تسوق الآن ←';
      }else{
        btn.textContent='تسوق الآن ←';
      }
    });

    document.querySelectorAll('[data-product-view]').forEach(function(el){track('product_view',{product_id:el.dataset.productView});});
    document.querySelectorAll('[data-affiliate-url]').forEach(function(el){
      el.addEventListener('click',function(){affiliateClick(el.dataset.productId,el.dataset.offerId,el.dataset.affiliateUrl);});
    });
  });
})();
