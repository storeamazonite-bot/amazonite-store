import { readAnalyticsEvents } from '../../lib/analytics-store.mjs';
import { isOwnerRequest } from '../../lib/owner-auth.mjs';

export default async function handler(request) {
  if (!(await isOwnerRequest(request))) return new Response(JSON.stringify({ok:false,error:'UNAUTHORIZED'}),{status:401,headers:{'content-type':'application/json','cache-control':'no-store'}});
  if (request.method !== 'GET') return new Response(JSON.stringify({ok:false,error:'METHOD_NOT_ALLOWED'}),{status:405,headers:{'content-type':'application/json','allow':'GET'}});
  try {
    const events = await readAnalyticsEvents();
    return new Response(JSON.stringify({ok:true,events}),{status:200,headers:{'content-type':'application/json','cache-control':'no-store'}});
  } catch (e) {
    const status = e.code === 'ANALYTICS_STORAGE_NOT_CONFIGURED' ? 503 : 500;
    return new Response(JSON.stringify({ok:false,error:e.code||'ANALYTICS_ERROR'}),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
  }
}
