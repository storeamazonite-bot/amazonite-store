(function(){
  const KEY='amazonite_events_v1';
  function save(event){let list=[];try{list=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(_){};list.push(event);localStorage.setItem(KEY,JSON.stringify(list));}
  window.AmazoniteTracker={
    track:function(type,data){save(Object.assign({id:'EV-'+Date.now().toString(36).toUpperCase(),type,timestamp:new Date().toISOString(),page:location.pathname},data||{}));},
    affiliateClick:function(productId,offerId,affiliateUrl){
      this.track('affiliate_click',{product_id:productId||null,offer_id:offerId||null});
      if(affiliateUrl) window.location.href=affiliateUrl;
    }
  };
  document.addEventListener('DOMContentLoaded',function(){
    document.querySelectorAll('[data-product-view]').forEach(function(el){AmazoniteTracker.track('product_view',{product_id:el.dataset.productView});});
    document.querySelectorAll('[data-affiliate-url]').forEach(function(el){el.addEventListener('click',function(){AmazoniteTracker.affiliateClick(el.dataset.productId,el.dataset.offerId,el.dataset.affiliateUrl);});});
  });
})();
