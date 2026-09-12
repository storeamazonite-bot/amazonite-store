(function(){
  const KEY='amazonite_recommendations_v1';
  function get(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(_){return{}}}
  function save(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch(_){} }
  function vote(id,value){
    const data=get();
    const previous=data[id]||null;
    data[id]=value;
    save(data);
    sync();
    if(window.AmazoniteTracker&&typeof window.AmazoniteTracker.track==='function'){
      window.AmazoniteTracker.track('recommendation_vote',{product_id:id,vote:value,previous_vote:previous});
    }
    return value;
  }
  function sync(){
    const data=get();
    document.querySelectorAll('[data-recommendation-id]').forEach(box=>{
      const id=box.dataset.recommendationId, value=data[id];
      box.querySelectorAll('button[data-vote]').forEach(b=>{
        const active=value===b.dataset.vote;
        b.setAttribute('aria-pressed',active?'true':'false');
      });
      const status=box.querySelector('[data-recommendation-status]');
      if(status) status.textContent=value?('Your vote: '+(value==='yes'?'Yes 👍':'No 👎')):'Vote to help us improve our product picks.';
    });
  }
  function addStyles(){
    if(document.getElementById('amazonite-recommendation-style'))return;
    const s=document.createElement('style');s.id='amazonite-recommendation-style';
    s.textContent='.recommendation-box{margin-top:12px;padding:10px 11px;border:1px solid rgba(255,255,255,.08);border-radius:9px;background:rgba(4,12,20,.45)}.recommendation-question{display:block;color:#b7c7d6;font-size:9px;font-weight:800;margin-bottom:8px}.recommendation-actions{display:flex;gap:6px}.recommendation-actions button{border:1px solid #29445d;background:#0c2032;color:#dbe7f0;border-radius:7px;padding:6px 9px;font-size:9px;font-weight:900;cursor:pointer}.recommendation-actions button:hover,.recommendation-actions button[aria-pressed="true"]{border-color:#ff8c1a;background:#ff8c1a;color:#07111d}.recommendation-status{display:block;margin-top:7px;color:#7f93a5;font-size:8px;min-height:11px}';
    document.head.appendChild(s);
  }
  function bind(){
    document.querySelectorAll('.card[data-product-id]').forEach(card=>{
      if(card.querySelector('[data-recommendation-id]'))return;
      const box=document.createElement('div');box.className='recommendation-box';box.dataset.recommendationId=card.dataset.productId;
      box.innerHTML='<span class="recommendation-question">Would you recommend this product?</span><div class="recommendation-actions"><button type="button" data-vote="yes" aria-pressed="false">👍 Yes</button><button type="button" data-vote="no" aria-pressed="false">👎 No</button></div><span class="recommendation-status" data-recommendation-status>Vote to help us improve our product picks.</span>';
      box.querySelectorAll('button[data-vote]').forEach(b=>b.addEventListener('click',()=>vote(box.dataset.recommendationId,b.dataset.vote)));
      card.querySelector('.body')?.appendChild(box);
    });
    sync();
  }
  window.AmazoniteRecommendations={get,vote,sync};
  document.addEventListener('DOMContentLoaded',function(){addStyles();bind();const grid=document.getElementById('grid');if(grid&&window.MutationObserver)new MutationObserver(bind).observe(grid,{childList:true});});
})();
