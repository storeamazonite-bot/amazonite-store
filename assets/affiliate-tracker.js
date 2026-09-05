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
    const hero=document.querySelector('.hero');
    if(hero){
      const style=document.createElement('style');
      style.textContent='.amazonite-hero-image-wrap{width:100%;margin:0;padding:0;background:#020607;line-height:0}.amazonite-hero-image{display:block;width:100%;height:auto;max-height:none;object-fit:contain;margin:0}';
      document.head.appendChild(style);
      hero.innerHTML='<div class="amazonite-hero-image-wrap"><img src="assets/picun-f8-pro-hero.webp" alt="Picun F8 Pro ANC wireless headphones product showcase" class="amazonite-hero-image"></div>';
      hero.style.padding='0';
      hero.style.minHeight='0';
      hero.style.background='#020607';
    }
    document.querySelectorAll('[data-product-view]').forEach(function(el){track('product_view',{product_id:el.dataset.productView});});
    document.querySelectorAll('[data-affiliate-url]').forEach(function(el){
      el.addEventListener('click',function(){affiliateClick(el.dataset.productId,el.dataset.offerId,el.dataset.affiliateUrl);});
    });
  });
})();
