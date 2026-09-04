(function(){
  const KEY='amazonite_store_settings_v1';
  const DEFAULTS={storeName:'Amazonite Store',markets:'USA · UK · Canada',visitorCta:'Check price on AliExpress ↗',catalogMode:'Verified offers only',sorting:'Best fit first',description:'Smart finds for better buying decisions.',launchLocked:true,referralButtonsRequireVerifiedUrl:true};
  function get(){try{return Object.assign({},DEFAULTS,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){return DEFAULTS;}}
  function save(patch){const next=Object.assign({},get(),patch);localStorage.setItem(KEY,JSON.stringify(next));return next;}
  window.AmazoniteStore={get:get,save:save,defaults:DEFAULTS};
  document.addEventListener('DOMContentLoaded',function(){
    const s=get();
    document.querySelectorAll('[data-store-name]').forEach(e=>e.textContent=s.storeName);
    document.querySelectorAll('[data-store-description]').forEach(e=>e.textContent=s.description);
    document.querySelectorAll('[data-visitor-cta]').forEach(e=>e.textContent=s.visitorCta);
  });
})();
