window.CarrdPluginOptionsV2 = window.CarrdPluginOptionsV2 || {};

/* Shopping Cart */
window.CarrdPluginOptionsV2.shoppingCart = {
    currency: '$',
    currencyPosition: 'before',
    position: 'top-right',
    storageKey: 'carrd_cart_v1',
    orderInputSelector: '[name="order-details"], .cart-output, [data-shopping-cart-v2-output="order-details"], [data-cart-v2-output="order-details"]',
    orderInputClass: '.cart-output',
    orderInputId: 'order-details',
    checkoutTargetSelector: '.shopping-cart-target, [data-shopping-cart-v2-target]',
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
        consoleErrorForm: 'Carrd Cart: Could not find "Order Details" field. Please ensure a textarea matching orderInputSelector, .cart-output, #order-details, [data-shopping-cart-v2-output="order-details"], or [data-cart-v2-output="order-details"] exists.'
    }
};

/* FAQ */
window.CarrdPluginOptionsV2.faq = {};

/* Accordeon */
window.CarrdPluginOptionsV2.accordeon = {
    enabled: true,
    hashPrefix: '#data-accordeon-v2-',
    legacyHashPrefix: '#accordeon-',
    linkPrefix: '#data-accordeon-v2-',
    linkSelector: null,
    targetAttributes: ['data-accordeon-v2', 'data-accorderon-v2'],
    defaultOpen: false,
    scrollOnOpen: true,
    scrollBehavior: 'smooth',
    scrollBlock: 'start'
};

/* Cards */
window.CarrdPluginOptionsV2.cards = {
    enabled: true,
    cardSelector: '[data-cards-v2], .cards',
    defaultCardBg: 'var(--theme-card-bg-default)'
};

/* Grid Cluster */
window.CarrdPluginOptionsV2.gridCluster = {
    enabled: true,
    gridAttribute: 'data-grid-v2',
    gridClasses: ['grid-2', 'grid-3', 'grid-4', 'grid-5', 'grid-6'],
    widthClasses: {
        'w-20': '20%',
        'w-25': '25%',
        'w-30': '33%',
        'w-40': '40%',
        'w-50': '50%',
        'w-60': '60%',
        'w-70': '67%',
        'w-75': '75%',
        'w-80': '80%'
    }
};

/* Legacy note: the old `columns` plugin is archived and no longer participates in the active plugin contract. */

/* No-loadwaiting */
window.CarrdPluginOptionsV2.noLoadwaiting = {
    animationDuration: 750,
    observerTimeout: 5000,
    scrollPulseInterval: 120,
    scrollPulseCount: 2,
    rafPulseCount: 2
};

/* Slider */
window.CarrdPluginOptionsV2.slider = {
    slideSelector: '[data-slider-v2], .slider',
    sliderAttribute: 'data-slider-v2',
    showDots: true,
    showArrows: true,
    loop: false,
    autoplay: false,
    autoplayInterval: 5000,
    gap: 16,
    hideOverflow: false,
    slidesPerView: 1,
    peek: 0,
    maxSlideWidth: 400,
    equalHeight: true,
    breakpoints: {
        737: { slidesPerView: 3 },            // Tablet/Mobile
        1280: { slidesPerView: 4, gap: 32 }   // Desktop M
    }
};

/* Modal */
window.CarrdPluginOptionsV2.modal = {
    modalSelector: '.container-component.modal, .container-component[data-modal-v2]',
    targetAttribute: 'data-modal-v2',
    triggerAttribute: 'data-modal-v2-open',
    legacyTriggerAttribute: 'data-modal-v2-target',
    hashPrefix: '#data-modal-v2-',
    legacyHashTargets: true,
    closeOnOverlay: true,
    closeOnEscape: true,
    showCloseButton: true,
    lockBodyScroll: true,
    preventWhenCartOpen: false
};

/* Typography */
window.CarrdPluginOptionsV2.typography = {
    containerSelector: '.txt',
    paragraphSelector: 'span.p'
};

/* Cookie Banner */
window.CarrdPluginOptionsV2.cookieBanner = {
    cookieName: 'cookies_accepted',
    fadeOutDuration: 300,
    fadeInDuration: 400
};

/* Header Nav */
window.CarrdPluginOptionsV2.headerNav = {
    breakpoint: 736,
    closeOnLinkClick: true,
    sticky: true,
    hideOnScrollDown: false,
    stickyTop: 0,
    navMaxHeight: '80vh'
};

/* Floating CTA */
window.CarrdPluginOptionsV2.floatingCta = {
    selector: '[data-floating-v2]',
    defaultPosition: 'bottom-right',
    scrollY: 800
};
