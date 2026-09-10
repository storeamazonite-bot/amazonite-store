(function(){
  const KEY='amazonite_events_v1';
  function local(event){try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');a.push(event);localStorage.setItem(KEY,JSON.stringify(a.slice(-5000)))}catch(_) {}}
  function send(event){
    const payload=Object.assign({timestamp:new Date().toISOString(),page:location.pathname},event||{});
    try{
      const body=JSON.stringify(payload);
      if(navigator.sendBeacon){navigator.sendBeacon('/api/analytics/events',new Blob([body],{type:'application/json'}));}
      else{fetch('/api/analytics/events',{method:'POST',headers:{'content-type':'application/json'},body,keepalive:true}).catch(()=>{});}
    }catch(_){}
    local(payload);
  }
  function track(type,data){send(Object.assign({type},data||{}));}
  window.AmazoniteTracker={track:function(type,data){track(type,data)},affiliateClick:function(p,o,u){let d=null;try{d=u?new URL(u,location.href).hostname:null}catch(_){}track('affiliate_click',{product_id:p||null,offer_id:o||null,destination_domain:d})}};
  document.addEventListener('DOMContentLoaded',function(){
    document.querySelectorAll('[data-product-view]').forEach(function(x){track('product_view',{product_id:x.dataset.productView});});
    document.querySelectorAll('[data-affiliate-url]').forEach(function(x){x.addEventListener('click',function(){window.AmazoniteTracker.affiliateClick(x.dataset.productId,x.dataset.offerId,x.dataset.affiliateUrl);});});
  });
})();
