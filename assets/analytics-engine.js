(function(root){
  'use strict';

  const EVENT_TYPES = new Set([
    'product_view', 'affiliate_click', 'category_view', 'search_used', 'cta_click',
    'wishlist_add', 'wishlist_remove', 'recommendation_vote', 'ai_interaction', 'system_status'
  ]);

  const ALLOWED_FIELDS = new Set([
    'product_id', 'offer_id', 'category', 'placement', 'cta_label', 'destination_domain',
    'query_type', 'query_length', 'vote', 'previous_vote', 'interaction', 'provider', 'status', 'surface'
  ]);

  const PII_KEYS = new Set([
    'name', 'full_name', 'first_name', 'last_name', 'email', 'phone', 'telephone',
    'address', 'street', 'city', 'postal_code', 'zip', 'payment', 'card', 'card_number',
    'cvv', 'iban', 'account_number', 'password', 'token', 'credential'
  ]);

  // Reject common PII-bearing key names anywhere in the payload, and reject obvious
  // contact/payment strings even when hidden inside an otherwise allowed analytics field.
  const PII_KEY_PATTERN = /(email|phone|telephone|address|password|credential|card|iban|account_number|cvv)/i;
  const PII_VALUE_PATTERNS = [
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /\b(?:\+?\d[\d .()\-]{7,}\d)\b/,
    /\b(?:\d[ -]?){13,19}\b/
  ];

  class AnalyticsValidationError extends Error {
    constructor(message){ super(message); this.name = 'AnalyticsValidationError'; }
  }

  function isPlainObject(value){
    if(value === null || typeof value !== 'object' || Array.isArray(value)) return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
  }

  function scanForPII(value, path){
    if(typeof value === 'string'){
      if(PII_VALUE_PATTERNS.some(pattern => pattern.test(value))) {
        throw new AnalyticsValidationError(`Potential PII value rejected: ${path}`);
      }
      return;
    }
    if(!isPlainObject(value)) return;
    for(const [key, child] of Object.entries(value)){
      const normalized = key.toLowerCase();
      if(PII_KEYS.has(normalized) || PII_KEY_PATTERN.test(normalized)) {
        throw new AnalyticsValidationError(`PII field rejected: ${path}${key}`);
      }
      scanForPII(child, `${path}${key}.`);
    }
  }

  function stringField(payload, key, max=200){
    if(payload[key] === undefined || payload[key] === null) return null;
    if(typeof payload[key] !== 'string' || payload[key].length === 0 || payload[key].length > max){
      throw new AnalyticsValidationError(`Invalid ${key}`);
    }
    return payload[key];
  }

  function validate(type, payload){
    if(!EVENT_TYPES.has(type)) throw new AnalyticsValidationError(`Unknown event type: ${type}`);
    if(!isPlainObject(payload)) throw new AnalyticsValidationError('Event payload must be a plain object');
    scanForPII(payload, 'payload.');

    for(const key of Object.keys(payload)){
      if(!ALLOWED_FIELDS.has(key)) throw new AnalyticsValidationError(`Unsupported field: ${key}`);
    }

    const normalized = Object.create(null);
    for(const key of ALLOWED_FIELDS){
      if(payload[key] !== undefined) normalized[key] = payload[key];
    }

    ['product_id','offer_id','category','placement','cta_label','destination_domain','interaction','provider','status','surface']
      .forEach(key => { if(normalized[key] !== undefined) normalized[key] = stringField(normalized, key); });

    if(normalized.query_type !== undefined) normalized.query_type = stringField(normalized, 'query_type', 50);
    if(normalized.query_length !== undefined &&
       (!Number.isInteger(normalized.query_length) || normalized.query_length < 0 || normalized.query_length > 500)){
      throw new AnalyticsValidationError('Invalid query_length');
    }

    if(type === 'recommendation_vote' && normalized.vote !== 'yes' && normalized.vote !== 'no'){
      throw new AnalyticsValidationError('Invalid recommendation vote');
    }
    if(normalized.vote !== undefined && normalized.vote !== 'yes' && normalized.vote !== 'no'){
      throw new AnalyticsValidationError('Invalid vote');
    }
    if(normalized.previous_vote !== undefined && normalized.previous_vote !== null &&
       normalized.previous_vote !== 'yes' && normalized.previous_vote !== 'no'){
      throw new AnalyticsValidationError('Invalid previous_vote');
    }

    return normalized;
  }

  function createLocalStore(storage, key='amazonite_events_v2'){
    const backend = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    return {
      append(event){
        if(!backend) return;
        try{
          const current = JSON.parse(backend.getItem(key) || '[]');
          const next = Array.isArray(current) ? current : [];
          next.push(event);
          backend.setItem(key, JSON.stringify(next.slice(-5000)));
        }catch(_){ /* Analytics must never break storefront UX. */ }
      },
      read(){
        if(!backend) return [];
        try{
          const current = JSON.parse(backend.getItem(key) || '[]');
          return Array.isArray(current) ? current : [];
        }catch(_){ return []; }
      }
    };
  }

  function createAnalyticsEngine(options){
    const opts = options || {};
    const store = opts.store || createLocalStore(opts.storage);
    // Central aggregation is deliberately opt-in. Without a sink, this is browser-local analytics.
    const centralSink = opts.centralSink && typeof opts.centralSink.append === 'function' ? opts.centralSink : null;

    return {
      track(type, payload){
        const clean = validate(type, payload || {});
        const event = Object.assign({
          schema_version: 1,
          type,
          source: centralSink ? 'central' : 'local',
          timestamp: new Date().toISOString(),
          page: typeof location !== 'undefined' ? String(location.pathname || '/') : null
        }, clean);
        store.append(event);
        if(centralSink) centralSink.append(event);
        return event;
      },
      readLocal(){ return typeof store.read === 'function' ? store.read() : []; },
      isCentralized(){ return Boolean(centralSink); }
    };
  }

  root.AmazoniteAnalyticsEngine = { createAnalyticsEngine, createLocalStore, AnalyticsValidationError };
})(typeof window !== 'undefined' ? window : globalThis);
