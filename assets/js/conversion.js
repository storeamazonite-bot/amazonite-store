/* Amazonite Store — client-side conversion events. */
(function(){
  const KEY='amazonite_analytics_events';
  function emit(type,data={}){
    const event={type,product_id:data.product_id||null,path:location.pathname,ts:new Date().toISOString()};
    try{const list=JSON.parse(localStorage.getItem(KEY)||'[]');list.push(event);localStorage.setItem(KEY,JSON.stringify(list.slice(-500)));}catch(_){ }
    window.dispatchEvent(new CustomEvent('amazonite:analytics',{detail:event}));
  }
  window.AmazoniteConversion={emit};
  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('[data-product-id][data-product-view]').forEach(el=>emit('product_view',{product_id:el.dataset.productId}));
    document.querySelectorAll('[data-affiliate-link][data-product-id]').forEach(el=>el.addEventListener('click',()=>emit('affiliate_click',{product_id:el.dataset.productId})));
  });
})();
