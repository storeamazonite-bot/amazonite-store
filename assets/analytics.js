(function () {
  'use strict';

  var provider = window.AMAZONITE_ANALYTICS_PROVIDER || null;
  var enabled = window.AMAZONITE_ANALYTICS_ENABLED === true;

  function clean(value) {
    if (typeof value !== 'string') return undefined;
    return value.length > 100 ? value.slice(0, 100) : value;
  }

  function emit(name, properties) {
    if (!enabled || !provider || typeof provider.track !== 'function') return false;
    var safe = {};
    Object.keys(properties || {}).forEach(function (key) {
      var value = properties[key];
      if (key === 'product_id' || key === 'category' || key === 'cta_location' || key === 'reason' || key === 'destination_class') {
        var cleaned = clean(String(value));
        if (cleaned) safe[key] = cleaned;
      }
    });
    provider.track(name, safe);
    return true;
  }

  window.AmazoniteAnalytics = {
    pageView: function (pageType) { return emit('page_view', { page_type: pageType }); },
    productView: function (productId, category) { return emit('product_view', { product_id: productId, category: category }); },
    ctaView: function (productId, location) { return emit('cta_view', { product_id: productId, cta_location: location }); },
    affiliateClick: function (productId, category, location) { return emit('affiliate_click', { product_id: productId, category: category, cta_location: location, destination_class: 'verified_affiliate' }); },
    affiliateBlocked: function (productId, reason) { return emit('affiliate_blocked', { product_id: productId, reason: reason }); }
  };
})();
