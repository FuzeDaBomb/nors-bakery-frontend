// Product Data
let products = [];

// Global State
let cart = [];
let currentCategory = 'all';
let chatMessages = [];
let chatbotOpen = false;

// DOM Elements
const cartOverlay = document.getElementById('cart-overlay');
const cartSidebar = document.getElementById('cart-sidebar');
const cartContent = document.getElementById('cart-content');
const cartEmpty = document.getElementById('cart-empty');
const cartItems = document.getElementById('cart-items');
const cartFooter = document.getElementById('cart-footer');
const cartCount = document.getElementById('cart-count');
const cartCountHeader = document.getElementById('cart-count-header'); 
const cartTotal = document.getElementById('cart-total');
const mobileMenu = document.getElementById('mobile-menu');
const hamburger = document.getElementById('hamburger');
const chatbotWindow = document.getElementById('chatbot-window');
const chatbotMessages = document.getElementById('chatbot-messages');
const quickActions = document.getElementById('quick-actions');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadCart();

    const currentPage = getCurrentPage();

    if (currentPage === 'products') {
        loadProducts();
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
        if (category) {
            filterProducts(category);
        }
    } else if (currentPage === 'index' || currentPage === '') {
        loadFeaturedProducts();
    }

    updateCartUI();
    
    if (document.querySelector('.nav-desktop')) {
        setActiveNavigation();
    }
    
    if (document.getElementById('chatbot-window')) {
        initializeChatbot();
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const pickupDateInput = document.getElementById('pickup-date');
    if (pickupDateInput) {
        pickupDateInput.min = tomorrow.toISOString().split('T')[0];
        pickupDateInput.value = tomorrow.toISOString().split('T')[0];
    }
});

// Persistence Functions
function saveCart() {
    localStorage.setItem('norsCart', JSON.stringify(cart));
}

function loadCart() {
    const savedCart = localStorage.getItem('norsCart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
        } catch (e) {
            console.error('Error parsing cart', e);
            cart = [];
        }
    }
}

// Product Functions
function loadFeaturedProducts() {
    const featuredProducts = products.filter(product => product.featured);
    const featuredGrid = document.getElementById('featured-products');

    if (featuredGrid) {
        featuredGrid.innerHTML = featuredProducts.map(product => createProductCard(product, true)).join('');
    }
}

function loadProducts() {
    filterProducts(currentCategory);
}

function filterProducts(category) {
    currentCategory = category;

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-testid="button-filter-${category}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    const filteredProducts = category === 'all'
        ? products
        : products.filter(product => product.category === category);

    const productsGrid = document.getElementById('products-grid');
    if (productsGrid) {
        productsGrid.innerHTML = filteredProducts.map(product => createProductCard(product, false)).join('');
    }
}

function createProductCard(product, featured = false) {
    const cardClass = featured ? 'product-card featured hover-lift' : 'product-card hover-lift';
    const infoClass = featured ? 'product-info featured' : 'product-info';
    const nameClass = featured ? 'product-name featured' : 'product-name';
    const priceClass = featured ? 'product-price featured' : 'product-price';
    const btnClass = featured ? 'add-to-cart-btn featured' : 'add-to-cart-btn icon-only';
    const btnText = featured ? 'Add to Cart' : '+';

    return `
        <div class="${cardClass}">
            <img src="${product.imageUrl}" 
                 alt="${product.name}" 
                 class="product-image"
                 data-testid="${featured ? `img-product-featured-${product.id}` : `img-product-${product.id}`}">
            <div class="${infoClass}">
                <h3 class="${nameClass}" data-testid="text-product-name-${product.id}">
                    ${product.name}
                </h3>
                <p class="product-description" data-testid="text-product-description-${product.id}">
                    ${product.description}
                </p>
                <div class="product-footer">
                    <span class="${priceClass}" data-testid="text-product-price-${product.id}">
                        RM${product.price}
                    </span>
                    <button class="${btnClass}" 
                            onclick="addToCart('${product.id}')"
                            data-testid="button-add-cart-${product.id}">
                        ${btnText}
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Cart Functions
function addToCart(productId, quantity = 1) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.productId === productId);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: Date.now().toString(),
            productId: productId,
            quantity: quantity,
            product: product
        });
    }

    saveCart();
    updateCartUI();
}

function updateCartQuantity(productId, quantity) {
    if (quantity <= 0) {
        removeFromCart(productId);
        return;
    }

    const cartItem = cart.find(item => item.productId === productId);
    if (cartItem) {
        cartItem.quantity = quantity;
        saveCart();
        updateCartUI();
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.productId !== productId);
    saveCart();
    updateCartUI();
}

function clearCart() {
    cart = [];
    saveCart();
    updateCartUI();
}

function updateCartUI() {
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0);

    if (cartCount) {
        cartCount.textContent = itemCount;
        cartCount.style.display = itemCount > 0 ? 'flex' : 'none';
    }
    
    if (cartCountHeader) {
        cartCountHeader.textContent = itemCount;
        cartCountHeader.style.display = itemCount > 0 ? 'flex' : 'none';
    }

    if (cartItems && cartFooter && cartEmpty) {
        if (cart.length === 0) {
            cartEmpty.style.display = 'flex';
            cartItems.style.display = 'none';
            cartFooter.style.display = 'none';
        } else {
            cartEmpty.style.display = 'none';
            cartItems.style.display = 'block';
            cartFooter.style.display = 'block';

            cartItems.innerHTML = cart.map(item => createCartItem(item)).join('');
            if (cartTotal) {
                cartTotal.textContent = `RM${totalPrice.toFixed(2)}`;
            }
        }
    }
}

function createCartItem(item) {
    return `
        <div class="cart-item" data-testid="card-cart-item-${item.productId}">
            <img src="${item.product.imageUrl}" 
                 alt="${item.product.name}" 
                 class="cart-item-image"
                 data-testid="img-cart-item-${item.productId}">
            <div class="cart-item-info">
                <h4 class="cart-item-name" data-testid="text-cart-item-name-${item.productId}">
                    ${item.product.name}
                </h4>
                <p class="cart-item-price" data-testid="text-cart-item-price-${item.productId}">
                    RM ${item.product.price}
                </p>
            </div>
            <div class="cart-item-controls">
                <button class="quantity-btn" 
                        onclick="updateCartQuantity('${item.productId}', ${item.quantity - 1})"
                        data-testid="button-decrease-quantity-${item.productId}">
                    -
                </button>
                <span class="cart-item-quantity" data-testid="text-cart-item-quantity-${item.productId}">
                    ${item.quantity}
                </span>
                <button class="quantity-btn" 
                        onclick="updateCartQuantity('${item.productId}', ${item.quantity + 1})"
                        data-testid="button-increase-quantity-${item.productId}">
                    +
                </button>
            </div>
        </div>
    `;
}

function toggleCart() {
    if (cartOverlay && cartSidebar) {
        cartOverlay.classList.toggle('open');
        cartSidebar.classList.toggle('open');
        document.body.style.overflow = cartSidebar.classList.contains('open') ? 'hidden' : '';
    }
}

function closeCart() {
    if (cartOverlay && cartSidebar) {
        cartOverlay.classList.remove('open');
        cartSidebar.classList.remove('open');
        document.body.style.overflow = '';
    }
}

function checkout() {
    console.log("Checkout clicked. Cart length:", cart.length);
    
    if (cart.length === 0) {
        alert("Your cart is empty! Please add some items before checking out.");
        return;
    }
    
    saveCart();
    
    console.log("Redirecting to checkout.html...");
    window.location.href = 'checkout.html';
}

function toggleMobileMenu() {
    if (mobileMenu && hamburger) {
        mobileMenu.classList.toggle('open');
        const isOpen = mobileMenu.classList.contains('open');
        hamburger.textContent = isOpen ? '✕' : '☰';
    }
}

function closeMobileMenu() {
    if (mobileMenu && hamburger) {
        mobileMenu.classList.remove('open');
        hamburger.textContent = '☰';
    }
}

function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop();
    return page.replace('.html', '') || 'index';
}

function setActiveNavigation() {
    const currentPage = getCurrentPage();

    document.querySelectorAll('.nav-desktop a, .nav-mobile a').forEach(link => {
        link.classList.remove('active');
    });

    const activeLinks = document.querySelectorAll(`[href="${currentPage}.html"], [href="index.html"]`);
    activeLinks.forEach(link => {
        if ((currentPage === 'index' && link.getAttribute('href') === 'index.html') ||
            (currentPage !== 'index' && link.getAttribute('href') === `${currentPage}.html`)) {
            link.classList.add('active');
        }
    });
}

function initializeChatbot() {
}

function toggleChatbot() {
    chatbotOpen = !chatbotOpen;
    if (chatbotWindow) chatbotWindow.classList.toggle('open', chatbotOpen);
}

function closeChatbot() {
    chatbotOpen = false;
    if (chatbotWindow) chatbotWindow.classList.remove('open');
}

function sendMessage() {
    const input = document.getElementById('chatbot-input-field');
    if (input) input.value = '';
}

function sendQuickAction(action) {
}

async function placeOrder() {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{ 
            user_id: user.id, 
            total_price: calculateTotal(), 
            status: 'To Pay' 
        }])
        .select()
        .single();

    if (orderError) return console.error("Order failed:", orderError);

    const orderItems = cart.map(item => ({
        order_id: order.id, 
        product_id: item.product.id,
        qty: item.quantity,
        price: item.product.price,
        rated: false
    }));


    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

    if (itemsError) {
        console.error("Error syncing items:", itemsError);
    } else {
        alert("Order placed successfully!");
        localStorage.removeItem('cart'); 
        window.location.href = 'orders.html';
    }
}