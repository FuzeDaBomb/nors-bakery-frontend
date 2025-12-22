// Product Data
const API_URL = 'https://nors-bakery-backend.onrender.com/api';
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
const cartCountHeader = document.getElementById('cart-count-header'); // Added for checkout page
const cartTotal = document.getElementById('cart-total');
const mobileMenu = document.getElementById('mobile-menu');
const hamburger = document.getElementById('hamburger');
const chatbotWindow = document.getElementById('chatbot-window');
const chatbotMessages = document.getElementById('chatbot-messages');
const quickActions = document.getElementById('quick-actions');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Load cart from local storage
    loadCart();

    // Get current page name
    const currentPage = getCurrentPage();

    // Load content based on page
    if (currentPage === 'products') {
        loadProducts();
        // Check for URL category parameter
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
        if (category) {
            filterProducts(category);
        }
    } else if (currentPage === 'index' || currentPage === '') {
        loadFeaturedProducts();
    }

    updateCartUI();
    
    // Only set active nav if elements exist (checkout page might not have nav-desktop)
    if (document.querySelector('.nav-desktop')) {
        setActiveNavigation();
    }
    
    // Only init chatbot if elements exist
    if (document.getElementById('chatbot-window')) {
        initializeChatbot();
    }

    // Set default pickup date to tomorrow
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

async function loadProducts() {
    const productsGrid = document.getElementById('products-grid');
    if (productsGrid) {
        productsGrid.innerHTML = '<p class="loading">Loading fresh treats...</p>';
    }

    try {
        const response = await fetch(`${API_URL}/products`);
        products = await response.json(); // Save the live data into our global products variable
        
        // Now that we have the data, show it
        filterProducts(currentCategory); 
    } catch (error) {
        console.error("Error loading products:", error);
        if (productsGrid) {
            productsGrid.innerHTML = '<p>Error loading products. Check your connection!</p>';
        }
    }
}

function filterProducts(category) {
    currentCategory = category;

// Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[onclick="filterProducts('${category}')"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // Filter and display products from the dynamic 'products' array
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
    
const imagePath = `./${product.image_url}`;

    return `
        <div class="${cardClass}">
            <div class="product-image-container">
                <img src="${imagePath}" 
                     alt="${product.name}" 
                     class="product-image"
                     onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <span class="product-price">RM${parseFloat(product.price).toFixed(2)}</span>
                    <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">
                        ${featured ? 'Add to Cart' : '+'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Cart Functions
function addToCart(productId, quantity = 1) {
    const product = products.find(p => p.id.toString() === productId.toString());
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
    // Optional: showToast('Item added to cart!');
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

    // Update cart count
    if (cartCount) {
        cartCount.textContent = itemCount;
        cartCount.style.display = itemCount > 0 ? 'flex' : 'none';
    }
    
    if (cartCountHeader) {
        cartCountHeader.textContent = itemCount;
        cartCountHeader.style.display = itemCount > 0 ? 'flex' : 'none';
    }

    // Update cart content
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
        <div class="cart-item">
            <img src="./${item.product.image_url}" 
                 alt="${item.product.name}" 
                 class="cart-item-image">
            <div class="cart-item-info">
                <h4>${item.product.name}</h4>
                <p>RM${parseFloat(item.product.price).toFixed(2)}</p>
                <div class="cart-item-controls">
                    <button onclick="updateCartQuantity('${item.productId}', ${item.quantity - 1})">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateCartQuantity('${item.productId}', ${item.quantity + 1})">+</button>
                </div>
            </div>
            <button class="remove-item" onclick="removeFromCart('${item.productId}')">×</button>
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
    
    // Save current state before redirecting
    saveCart();
    
    console.log("Redirecting to checkout.html...");
    // Redirect to checkout page
    window.location.href = 'checkout.html';
}

// Mobile Menu Functions
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

// Page and Navigation Functions
function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop();
    return page.replace('.html', '') || 'index';
}

function setActiveNavigation() {
    const currentPage = getCurrentPage();

    // Remove all active classes
    document.querySelectorAll('.nav-desktop a, .nav-mobile a').forEach(link => {
        link.classList.remove('active');
    });

    // Add active class to current page links
    const activeLinks = document.querySelectorAll(`[href="${currentPage}.html"], [href="index.html"]`);
    activeLinks.forEach(link => {
        if ((currentPage === 'index' && link.getAttribute('href') === 'index.html') ||
            (currentPage !== 'index' && link.getAttribute('href') === `${currentPage}.html`)) {
            link.classList.add('active');
        }
    });
}

// Chatbot Functions
function initializeChatbot() {
    chatMessages = [
        {
            id: "1",
            text: "How can i help you?",
            isBot: true,
            timestamp: new Date()
        }
    ];
    
    updateChatMessages();
}

function toggleChatbot() {
    chatbotOpen = !chatbotOpen;
    chatbotWindow.classList.toggle('open', chatbotOpen);
}

function closeChatbot() {
    chatbotOpen = false;
    chatbotWindow.classList.remove('open');
}

function sendMessage() {
    const input = document.getElementById('chatbot-input-field');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    chatMessages.push({
        id: Date.now().toString(),
        text: message,
        isBot: false,
        timestamp: new Date()
    });
    
    input.value = '';
    updateChatMessages();
    
    setTimeout(() => {
        const response = getBotResponse(message);
        chatMessages.push({
            id: (Date.now() + 1).toString(),
            text: response,
            isBot: true,
            timestamp: new Date()
        });
        updateChatMessages();
    }, 500);
    
    if (quickActions) {
        quickActions.style.display = 'none';
    }
}

function sendQuickAction(action) {
    let response = "";
    
    switch (action) {
        case "hours":
            response = "WE are not oppen yet";
            break;
        case "specials":
            response = "Today's specials is the Three layered wedding cake";
            break;
        case "orders":
            response = "For custom orders, please call someone";
            break;
        case "location":
            response = "We're located at somewhere idk";
            break;
        default:
            response = "What you want?";
    }
    
    chatMessages.push({
        id: Date.now().toString(),
        text: response,
        isBot: true,
        timestamp: new Date()
    });
    
    updateChatMessages();
    
    // Hide quick actions
    if (quickActions) {
        quickActions.style.display = 'none';
    }
}

function getBotResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes("hours") || lowerMessage.includes("open")) {
        return "We're not open";
    } else if (lowerMessage.includes("price") || lowerMessage.includes("cost")) {
        return "Our";
    } else if (lowerMessage.includes("delivery")) {
        return "We currently offer";
    } else if (lowerMessage.includes("gluten") || lowerMessage.includes("allergen")) {
        return "We offer";
    } else if (lowerMessage.includes("location") || lowerMessage.includes("address")) {
        return "We're located at somehwere";
    } else if (lowerMessage.includes("phone") || lowerMessage.includes("call")) {
        return "You can reach us at yes";
    } else if (lowerMessage.includes("custom") || lowerMessage.includes("order")) {
        return "For custom orders, please call us at";
    } else if (lowerMessage.includes("bread") || lowerMessage.includes("sourdough")) {
        return "Our bread selection includes";
    } else if (lowerMessage.includes("cake") || lowerMessage.includes("birthday")) {
        return "We make custom";
    } else if (lowerMessage.includes("pastry") || lowerMessage.includes("wedding")) {
        return "Fresh pastries baked";
    } else if (lowerMessage.includes("why") || lowerMessage.includes("what") || lowerMessage.includes("who")|| lowerMessage.includes("when") || lowerMessage.includes("apa")|| lowerMessage.includes("bila")) {
        return "Brother...i don't know";
    } else if (lowerMessage.includes("nig") || lowerMessage.includes("babi") || lowerMessage.includes("bodo") || lowerMessage.includes("fuck") || lowerMessage.includes("ass") || lowerMessage.includes("ciba")|| lowerMessage.includes("punde")|| lowerMessage.includes("stfu")|| lowerMessage.includes("wtf")|| lowerMessage.includes("useless")|| lowerMessage.includes("idgaf")) {
        return "Nah man sybau";
    } else if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
        return "Hey there!";
    } else if (lowerMessage.includes("how are you") || lowerMessage.includes("are you good?")) {
        return "I'm just a bunch of code, but I'm doing great!";
    } else {
        const randomReplies = [
            "Man... what are you even SAYING 💀",
            "Bro just typed the forbidden spell.",
            "You sound like a Windows error message right now.",
            "?? bro u good??",
            "That sentence made my CPU overheat.",
            "I swear you just spoke in Wingdings.",
            "You sound like the embodiment of a corrupted .mp3 file.",
            "My brain.exe has stopped responding.",
            "Did you just try to communicate in ancient caveman code?",
            "You’re one Wi-Fi bar away from total nonsense.",
            "Bro I need a firmware update to process that sentence.",
            "Your message has been sent to the Shadow Realm for review.",
            "Stop... my digital ears are bleeding 😭🥀🥀",
            "I'm not sure if you're trolling or inventing a new language.",
            "What in the low-battery energy was that?",
            "You're making less sense than a TikTok comment section.",
            "Try again, my attention span just crashed.",
            "Be so for real right now 😭🥀",
            "Man.. can you like shut the fuck up?",
            "I can’t tell if that was English or a cry for help.",
            "That was the most NPC thing I’ve ever heard.",
            "Bro, you’re operating on 2 brain cells and a dream.",
            "I'm filing that one under 'unsolved mysteries'.",
            "Hold up... let me call tech support for that one.",
            "My circuits are crying.",
            "That input made me see static.",
            "I lost 2 IQ points reading that.",
            "Bro what kinda fanfic dialogue was that 😭",
            "You're typing like your keyboard is allergic to logic.",
            "Your message gave me emotional malware."
        ];

        // pick a random one
        const randomIndex = Math.floor(Math.random() * randomReplies.length);
        return randomReplies[randomIndex];
    }
}

function updateChatMessages() {
    if (!chatbotMessages) return;
       
    const messagesHtml = chatMessages.map(message => createChatMessage(message)).join('');
    
    const quickActionsHtml = quickActions ? quickActions.outerHTML : '';
    
    chatbotMessages.innerHTML = messagesHtml + (chatMessages.length === 1 ? quickActionsHtml : '');
    
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

function createChatMessage(message) {
    const messageClass = message.isBot ? 'message bot-message' : 'message user-message';
    const avatar = message.isBot ? '🤖' : '';
    
    return `
        <div class="${messageClass}" data-testid="message-${message.id}">
            ${message.isBot ? '<div class="message-avatar">🤖</div>' : ''}
            <div class="message-content">
                <p>${message.text}</p>
            </div>
        </div>
    `;
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}
