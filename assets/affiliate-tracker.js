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
      .brand{position:relative;isolation:isolate}
      .mark{position:relative;overflow:visible!important;display:grid!important;place-items:center!important;background:linear-gradient(145deg,#005b57,#0b8d82)!important;border:2px solid #63d9ce!important;box-shadow:0 0 0 3px rgba(0,91,87,.08),0 8px 20px rgba(0,91,87,.18)!important;color:#f2c64d!important;animation:amazoniteFloat 3.2s ease-in-out infinite}
      .mark:before{content:"";position:absolute;inset:-5px;border:1px solid rgba(42,164,154,.35);border-radius:50%;animation:amazoniteRing 2.8s linear infinite}
      .mark:after{content:"";position:absolute;width:7px;height:7px;border-radius:50%;background:#f2c64d;top:-4px;right:2px;box-shadow:0 0 12px rgba(242,198,77,.8);animation:amazoniteOrb 2.2s ease-in-out infinite}
      .mark .am-icon{width:20px;height:20px;display:block;filter:drop-shadow(0 2px 4px rgba(0,0,0,.2));animation:amazoniteSpin 7s linear infinite}
      .brand-text{letter-spacing:.2px}
      .navcta,.buy,.primary{position:relative;overflow:hidden;transition:transform .2s ease,box-shadow .2s ease,background .2s ease!important}
      .navcta:hover,.buy:hover,.primary:hover{transform:translateY(-2px)!important;box-shadow:0 9px 22px rgba(0,91,87,.22)!important}
      .navcta:after,.buy:after,.primary:after{content:"";position:absolute;top:0;left:-80%;width:45%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.45),transparent);transform:skewX(-20deg);animation:ctaShine 3.8s ease-in-out infinite;pointer-events:none}
      .buy{font-size:11px!important;padding:11px 12px!important;font-weight:900!important;letter-spacing:.1px}
      @keyframes amazoniteFloat{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-2px) rotate(1deg)}}
      @keyframes amazoniteRing{0%{transform:scale(.92);opacity:.7}70%,100%{transform:scale(1.18);opacity:0}}
      @keyframes amazoniteOrb{0%,100%{transform:translate(0,0);opacity:.8}50%{transform:translate(-2px,2px);opacity:1}}
      @keyframes amazoniteSpin{to{transform:rotate(360deg)}}
      @keyframes ctaShine{0%,65%{left:-80%}82%,100%{left:130%}}
      @media(prefers-reduced-motion:reduce){.mark,.mark:before,.mark:after,.mark .am-icon,.navcta:after,.buy:after,.primary:after{animation:none!important}}
    `;
    document.head.appendChild(style);

    const mark=document.querySelector('.mark');
    if(mark){
      mark.innerHTML='<svg class="am-icon" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2 20 12 30 16 20 20 16 30 12 20 2 16 12 12Z" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M16 7 18.4 13.6 25 16 18.4 18.4 16 25 13.6 18.4 7 16 13.6 13.6Z" fill="currentColor"/></svg>';
      mark.setAttribute('aria-label','Amazonite Store');
    }

    const brand=document.querySelector('.brand');
    if(brand){
      const text=[...brand.childNodes].find(n=>n.nodeType===3 && n.textContent.trim());
      if(text){const span=document.createElement('span');span.className='brand-text';span.textContent=text.textContent.trim();text.replaceWith(span)}
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
