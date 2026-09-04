(function(window){
  'use strict';
  const ALLOWED_HOSTS=['aliexpress.com','aliexpress.us','s.click.aliexpress.com'];
  function normalize(url){try{return new URL(String(url||''))}catch(_){return null}}
  function isAllowedHost(host){const h=String(host||'').toLowerCase();return ALLOWED_HOSTS.some(x=>h===x||h.endsWith('.'+x))}
  function validate(url){
    const u=normalize(url);
    if(!u)return {status:'INVALID',reason:'Not a valid URL'};
    if(u.protocol!=='https:')return {status:'REVIEW',reason:'HTTPS is required'};
    if(!isAllowedHost(u.hostname))return {status:'REVIEW',reason:'Destination is outside the approved AliExpress domain set'};
    return {status:'READY',reason:'HTTPS AliExpress destination'};
  }
  window.AmazoniteLinkValidator={validate,isAllowedHost};
})(window);
