window.CarrdPluginOptions = window.CarrdPluginOptions || {};

/* Shopping Cart */
window.CarrdPluginOptions.shoppingCart = window.CarrdPluginOptions.shoppingCart || {
    currency: '$',
    currencyPosition: 'before',
    position: 'top-right',
    storageKey: 'carrd_cart_v1',
    orderInputSelector: '[data-shopping-cart-output="order-details"]',
    checkoutTargetId: 'shopping-cart',
    texts: {
        title: 'Shopping Cart',
        empty: 'Your cart is empty.',
        checkout: 'Checkout',
        total: 'Total',
        remove: 'Remove',
        required: 'Required',
        addedToCart: 'Added "${name}" to cart',
        errorName: 'Invalid product name',
        errorPrice: 'Invalid price for ${name}',
        errorForm: 'Error: Could not find the order form. Please contact support.',
        consoleErrorForm: 'Carrd Cart: Could not find the checkout textarea. Please ensure [data-shopping-cart-output="order-details"] exists.'
    }
};

/* FAQ */
window.CarrdPluginOptions.faq = window.CarrdPluginOptions.faq || {};

/* Accordeon */
window.CarrdPluginOptions.accordeon = window.CarrdPluginOptions.accordeon || {
    enabled: true,
    hashPrefix: '#data-accordeon-',
    linkPrefix: '#data-accordeon-',
    linkSelector: null,
    targetAttributes: ['data-accordeon'],
    defaultOpen: false,
    scrollOnOpen: true,
    scrollBehavior: 'smooth',
    scrollBlock: 'start'
};

/* Cards */
window.CarrdPluginOptions.cards = window.CarrdPluginOptions.cards || {
    enabled: true,
    cardSelector: '[data-cards]'
};

/* Grid Cluster */
window.CarrdPluginOptions.gridCluster = window.CarrdPluginOptions.gridCluster || {
    enabled: true
};

/* Archived note: the old `columns` plugin no longer participates in the active contract. */

/* No-loadwaiting */
window.CarrdPluginOptions.noLoadwaiting = window.CarrdPluginOptions.noLoadwaiting || {
    animationDuration: 750,
    observerTimeout: 5000,
    scrollPulseInterval: 120,
    scrollPulseCount: 2,
    rafPulseCount: 2
};

/* Modal */
window.CarrdPluginOptions.modal = window.CarrdPluginOptions.modal || {
    modalSelector: '.container-component[data-modal]',
    targetAttribute: 'data-modal',
    triggerAttribute: 'data-modal-open',
    legacyTriggerAttribute: 'data-modal-target',
    hashPrefix: '#data-modal-',
    legacyHashTargets: true,
    closeOnOverlay: true,
    closeOnEscape: true,
    showCloseButton: true,
    lockBodyScroll: true,
    preventWhenCartOpen: false
};

/* Typography */
window.CarrdPluginOptions.typography = window.CarrdPluginOptions.typography || {
    containerSelector: '.txt',
    paragraphSelector: 'span.p'
};

/* Cookie Banner */
window.CarrdPluginOptions.cookieBanner = window.CarrdPluginOptions.cookieBanner || {
    cookieName: 'cookies_accepted',
    fadeOutDuration: 300,
    fadeInDuration: 400
};

/* Header Nav */
window.CarrdPluginOptions.headerNav = window.CarrdPluginOptions.headerNav || {
    breakpoint: 736,
    closeOnLinkClick: true
};

/* Floating CTA */
window.CarrdPluginOptions.floatingCta = window.CarrdPluginOptions.floatingCta || {
    selector: '[data-floating]',
    defaultPosition: 'bottom-right',
    scrollY: 800
};
