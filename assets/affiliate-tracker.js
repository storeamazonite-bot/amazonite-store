(function(){
  const K='amazonite_events_v1';
  function t(type,data){
    try{
      const a=JSON.parse(localStorage.getItem(K)||'[]');
      a.push(Object.assign({type,timestamp:new Date().toISOString(),page:location.pathname},data||{}));
      localStorage.setItem(K,JSON.stringify(a.slice(-5000)));
    }catch(_){}
  }
  window.AmazoniteTracker={
    track:t,
    affiliateClick:function(p,o,u){
      let d=null;
      try{d=u?new URL(u,location.href).hostname:null}catch(_){}
      t('affiliate_click',{product_id:p||null,offer_id:o||null,destination_domain:d});
    }
  };
  document.addEventListener('DOMContentLoaded',function(){
    document.querySelectorAll('[data-product-view]').forEach(function(x){
      t('product_view',{product_id:x.dataset.productView});
    });
    document.querySelectorAll('[data-affiliate-url]').forEach(function(x){
      x.addEventListener('click',function(){
        window.AmazoniteTracker.affiliateClick(x.dataset.productId,x.dataset.offerId,x.dataset.affiliateUrl);
      });
    });
  });
})();
