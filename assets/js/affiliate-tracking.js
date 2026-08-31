/* Amazonite Store — privacy-safe product and affiliate click tracking.
 * The event is sent to the local analytics endpoint/file when available.
 * No passwords, payment data, tokens, or unnecessary PII are collected.
 */
(function () {
  const KEY = 'amazonite_analytics_events';
  function save(event) {
    try {
      const events = JSON.parse(localStorage.getItem(KEY) || '[]');
      events.push(event);
      localStorage.setItem(KEY, JSON.stringify(events.slice(-500)));
    } catch (_) {}
  }
  window.AmazoniteAnalytics = {
    track(type, data) {
      const event = {
        type,
        product_id: data?.product_id || null,
        path: location.pathname,
        ts: new Date().toISOString()
      };
      save(event);
      window.dispatchEvent(new CustomEvent('amazonite:analytics', { detail: event }));
    }
  };
  document.addEventListener('DOMContentLoaded', () => {
    AmazoniteAnalytics.track('landing_view', {});
    document.querySelectorAll('[data-product-id]').forEach(el => {
      const id = el.getAttribute('data-product-id');
      if (el.matches('[data-product-view]')) AmazoniteAnalytics.track('product_view', { product_id: id });
      el.addEventListener('click', () => {
        if (el.matches('[data-affiliate-link]')) AmazoniteAnalytics.track('affiliate_click', { product_id: id });
      });
    });
  });
})();
