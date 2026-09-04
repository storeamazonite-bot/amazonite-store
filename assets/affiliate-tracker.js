(function(){
  const KEY='amazonite_events_v1';
  const MAX_EVENTS=5000;
  function load(){try{const value=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(value)?value:[]}catch(_){return []}}
  function save(event){const list=load();list.push(event);localStorage.setItem(KEY,JSON.stringify(list.slice(-MAX_EVENTS)));}
  function track(type,data){save(Object.assign({id:'EV-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,7),type,timestamp:new Date().toISOString(),page:location.pathname},data||{}));}
  window.AmazoniteTracker={
    track:track,
    affiliateClick:function(productId,offerId,affiliateUrl){
      track('affiliate_click',{product_id:productId||null,offer_id:offerId||null});
      if(affiliateUrl) window.location.href=affiliateUrl;
    }
  };
  document.addEventListener('DOMContentLoaded',function(){
    document.querySelectorAll('[data-product-view]').forEach(function(el){track('product_view',{product_id:el.dataset.productView});});
    document.querySelectorAll('[data-affiliate-url]').forEach(function(el){el.addEventListener('click',function(){window.AmazoniteTracker.affiliateClick(el.dataset.productId,el.dataset.offerId,el.dataset.affiliateUrl);});});
  });
})();
