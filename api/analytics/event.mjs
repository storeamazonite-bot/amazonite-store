import { appendAnalyticsEvent, validateAnalyticsEvent } from '../../lib/analytics-store.mjs';
import { createPublicRateLimiter } from '../../lib/public-rate-limit.mjs';

const limiter = createPublicRateLimiter({ windowMs: 60_000, maxRequests: 60 });

export default async function handler(request) {
  if (request.method !== 'POST') return new Response(JSON.stringify({ok:false,error:'METHOD_NOT_ALLOWED'}),{status:405,headers:{'content-type':'application/json','allow':'POST','cache-control':'no-store'}});
  if (limiter.isLimited(request)) return new Response(JSON.stringify({ok:false,error:'RATE_LIMITED'}),{status:429,headers:{'content-type':'application/json','cache-control':'no-store','retry-after':'60'}});
  limiter.record(request);
  try {
    const body = await request.json();
    validateAnalyticsEvent(body);
    await appendAnalyticsEvent(body);
    return new Response(JSON.stringify({ok:true}),{status:202,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'}});
  } catch (e) {
    const status = e.code === 'ANALYTICS_INVALID_EVENT' ? 400 : e.code === 'ANALYTICS_STORAGE_NOT_CONFIGURED' ? 503 : 500;
    return new Response(JSON.stringify({ok:false,error:e.code||'ANALYTICS_ERROR'}),{status,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'}});
  }
}
