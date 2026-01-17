import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
// Check Auth State and Update Header
async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    
    const guestNav = document.getElementById('guest-nav');
    const userNav = document.getElementById('user-nav');
    const avatar = document.getElementById('header-avatar');

    if (user) {
        guestNav.style.display = 'none';
        userNav.style.display = 'flex';
        if (user.user_metadata && user.user_metadata.avatar_url) {
            avatar.src = user.user_metadata.avatar_url;
        }
    } else {
        guestNav.style.display = 'flex';
        userNav.style.display = 'none';
    }
}

// Logout Function
window.handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        alert(error.message);
    } else {
        window.location.href = 'index.html'; 
    }
};

// Run the check when the page loads
document.addEventListener('DOMContentLoaded', checkUser);

export const supabase = createClient('https://kvgongvthegnvavswzvm.supabase.co', 'sb_publishable_jSl4sfOozbfNKYunsvNRZA_hF_ve8t8');

// Product Data
const API_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
  ? 'http://localhost:5000'
  : 'https://nors-bakery-backend.onrender.com';
let products = [];

// Global State
let cart = [];
let currentCategory = 'all';
let chatMessages = [];
let chatbotOpen = false;

// --- AUTH FUNCTIONS ---
window.signUp = async (event) => {
    event.preventDefault();
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const fullName = document.getElementById('reg-fullname').value;

    // 1. Create account in Supabase
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) return alert("Auth Error: " + error.message);

    if (data.user) {
        try {
            // 2. Sync to Render Backend with timeout/error check
            const response = await fetch('https://nors-bakery-backend.onrender.com/register-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: data.user.id,
                    email: email,
                    full_name: fullName
                })
            });

            if (!response.ok) throw new Error("Backend sync failed.");

            alert("Registration successful! Please check your email for confirmation.");
            window.location.href = 'login.html';
        } catch (err) {
            console.error("Profile Sync Error:", err);
            alert("Account created, but profile sync failed. You may need to contact support.");
        }
    }
};

window.login = async (event) => {
    event.preventDefault(); // Stop page from refreshing
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const messageElement = document.getElementById('message');

    console.log("Attempting login for:", email);

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        if (messageElement) {
            messageElement.innerText = "Login failed: " + error.message;
            messageElement.style.color = "red";
        } else {
            alert("Login failed: " + error.message);
        }
    } else {
        console.log("Login successful!");
        // Redirect to profile page after success
        window.location.href = 'profile.html';
    }
};

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
document.addEventListener('DOMContentLoaded', async function() {
    // Run UI management first
    await manageAuthUI(); 
    
    loadCart();
    await loadProducts(); 

    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user || null;

    if (session) {
        console.log("Logged in as:", session.user.email);
    }

    supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) console.log("User signed out");
    });

    const currentPage = getCurrentPage();

// 3. Profile Page Logic
if (currentPage === 'profile') {
    if (!currentUser) {
        window.location.href = 'login.html';
    } else {
        const nameSpan = document.getElementById('user-display-name');
        const emailSpan = document.getElementById('user-email');
        const joinedSpan = document.getElementById('user-joined');

        // FIXED: Fallback to email if full_name is missing
        if (nameSpan) {
            nameSpan.textContent = currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
        }
        if (emailSpan) emailSpan.textContent = currentUser.email;
        if (joinedSpan) joinedSpan.textContent = new Date(currentUser.created_at).toLocaleDateString();
        
        // ADD THIS: Load the orders for this specific user
        loadUserOrders(currentUser.id);
    }
}

    // 4. Products Page Logic
    if (currentPage === 'products') {
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category') || 'all';
        filterProducts(category);
    }

    // 5. Update UI components
    updateCartUI();
    
    if (document.querySelector('.nav-desktop')) {
        setActiveNavigation();
    }

    if (document.getElementById('chatbot-window')) {
        initializeChatbot();
    }
});

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

function saveCart() {
    // This saves your cart array into the browser's local storage
    // so the items stay there even if you refresh the page
    localStorage.setItem('norsCart', JSON.stringify(cart));
}

// Product Functions
function loadFeaturedProducts() {
    // 1. Try to find the grid on the homepage
    const featuredGrid = document.getElementById('featured-products'); 
    
    // If we aren't on the homepage, stop the function so it doesn't error out
    if (!featuredGrid) return; 

    // 2. Filter products that are marked as TRUE in your Supabase 'featured' column
    const featuredProducts = products.filter(product => {
        return product.featured === true || product.featured === 'true';
    });

    // 3. Put the cakes into the HTML
    if (featuredProducts.length === 0) {
        featuredGrid.innerHTML = '<p class="no-products">Our featured treats are coming soon!</p>';
    } else {
        featuredGrid.innerHTML = featuredProducts.map(product => createProductCard(product, true)).join('');
    }
}

async function loadProducts() {
    const productsGrid = document.getElementById('products-grid');
    if (productsGrid) {
        productsGrid.innerHTML = '<div class="loading-spinner">🍞 Preheating the oven... (Our server takes a moment to wake up)</div>';
    }

    try {
        const response = await fetch(`${API_URL}/products`);
        
        // CHECK 1: Did the server actually respond correctly?
        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        // CHECK 2: Try to parse JSON safely
        products = await response.json(); 
        
        console.log("Products loaded successfully:", products);
        
        filterProducts(currentCategory); 
        loadFeaturedProducts(); 
    } catch (error) {
        console.error("Critical Error loading products:", error);
        if (productsGrid) {
            productsGrid.innerHTML = `
                <div class="error-state">
                    <p>⚠️ Cannot connect to the bakery kitchen.</p>
                    <small>Error: ${error.message}</small>
                    <button onclick="location.reload()" class="btn btn-outline">Try Again</button>
                </div>`;
        }
    }
}

function filterProducts(category) {
    currentCategory = category;

    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // This finds the button you clicked and makes it orange
    const activeBtn = document.querySelector(`[onclick="filterProducts('${category}')"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // THE FIX: Check for exact matches with your Supabase data
    const filteredProducts = (category === 'all' || !category)
    ? products
    : products.filter(product => {
        if (!product.category) return false;
        // This makes sure 'Wedding Cake' matches 'wedding cake' regardless of spaces
        return product.category.toString().toLowerCase().trim() === category.toLowerCase().trim();
    });

    const productsGrid = document.getElementById('products-grid');
    if (productsGrid) {
        if (filteredProducts.length === 0) {
            productsGrid.innerHTML = `<p>No cakes found for "${category}".</p>`;
        } else {
            productsGrid.innerHTML = filteredProducts.map(product => createProductCard(product, false)).join('');
        }
    }
}

function createProductCard(product, featured = false) {
    const imgPath = product.image_url || product.imageUrl;
    const cardClass = featured ? 'product-card featured' : 'product-card';
    
    return `
        <div class="${cardClass}">
            <div class="image-container">
                <img src="${imgPath}" alt="${product.name}" class="product-image" onerror="this.src='Gambars/logo2.jpg'">
                
                <div class="product-detail-popup">
                    <h4>${product.name}</h4>
                    <p>${product.description}</p>
                    <ul class="product-specs">
                        <li><i class="fas fa-check"></i> Freshly Baked</li>
                        <li><i class="fas fa-tag"></i> ${product.category}</li>
                    </ul>
                </div>
            </div>

            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-footer">
                    <span class="product-price">RM${parseFloat(product.price).toFixed(2)}</span>
                    <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">Add to Cart</button>
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
            <img src="${item.product.image_url}" 
                 alt="${item.product.name}" 
                 class="cart-item-image">
            <div class="cart-item-info">
                <h4 class="cart-item-name">${item.product.name}</h4>
                <p class="cart-item-price">RM${parseFloat(item.product.price).toFixed(2)}</p>
                <div class="cart-item-controls">
                    <button class="quantity-btn" onclick="updateCartQuantity('${item.productId}', ${item.quantity - 1})">−</button>
                    <span class="cart-item-quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateCartQuantity('${item.productId}', ${item.quantity + 1})">+</button>
                </div>
            </div>
            <button class="cart-close" onclick="removeFromCart('${item.productId}')">×</button>
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
function renderCheckoutItems() {
    const container = document.getElementById('checkout-items');
    
    // Check window.cart if cart is undefined
    const currentCart = window.cart || []; 
    
    if (currentCart.length === 0) {
        container.innerHTML = '<p>Your cart is empty. <a href="products.html">Go shopping</a></p>';
        updateCheckoutTotals();
        return;
    }

    container.innerHTML = currentCart.map(item => `
        <div class="summary-item" style="display: flex; gap: 1rem; margin-bottom: 1rem; align-items: center;">
            <img src="${item.product.image_url}" alt="${item.product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
            <div class="summary-details" style="flex: 1;">
                <h4 style="margin: 0;">${item.product.name}</h4>
                <div style="font-size: 0.8rem; color: gray;">Qty: ${item.quantity}</div>
            </div>
            <div class="summary-price">RM ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}</div>
        </div>
    `).join('');

    updateCheckoutTotals();
}

function updateCheckoutTotals() {
    const currentCart = window.cart || [];
    const subtotal = currentCart.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0);
    // ... rest of your code ...
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
            "Your message gave me emotional malware.",
            "SYFM"
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

async function loadUserOrders(userId) {
    const orderList = document.getElementById('order-list'); // Make sure this ID exists in profile.html
    if (!orderList) return;

    const { data: orders, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        orderList.innerHTML = "<p>Error loading orders.</p>";
        return;
    }

    if (orders.length === 0) {
        orderList.innerHTML = "<p>No orders yet. Go get some cake!</p>";
    } else {
    orderList.innerHTML = orders.map(order => `
        <div class="order-card">
            <p><strong>Item:</strong> ${order.name}</p> <p><strong>Price:</strong> RM${parseFloat(order.price).toFixed(2)}</p>
            <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
        </div>
    `).join('');
    }
}

function selectPayment(type) {
    // Update radio option styles
    const options = document.querySelectorAll('input[name="payment"]');
    options.forEach(opt => {
        const parent = opt.closest('.radio-option');
        if (opt.value === type) {
            opt.checked = true;
            parent.classList.add('selected');
        } else {
            parent.classList.remove('selected');
        }
    });

    // Toggle detail views
    const cardFields = document.getElementById('card-fields');
    const alipayQR = document.getElementById('alipay-qr');

    if (type === 'card') {
        cardFields.style.display = 'block';
        alipayQR.style.display = 'none';
    } else if (type === 'alipay') {
        cardFields.style.display = 'none';
        alipayQR.style.display = 'block';
    } else {
        cardFields.style.display = 'none';
        alipayQR.style.display = 'none';
    }
}
// This function manages the visibility of your buttons
async function manageAuthUI() {
    // 1. Check if Supabase has a logged-in user session
    const { data: { user } } = await supabase.auth.getUser();

    const loggedOutUI = document.getElementById('auth-logged-out');
    const loggedInUI = document.getElementById('auth-logged-in');

    if (user) {
        // User is logged in: Hide Login/Register, Show Profile/Logout
        if(loggedOutUI) loggedOutUI.style.display = 'none';
        if(loggedInUI) loggedInUI.style.display = 'flex';
        console.log("User is logged in as:", user.email);
    } else {
        // User is a guest: Show Login/Register, Hide Logout
        if(loggedOutUI) loggedOutUI.style.display = 'flex';
        if(loggedInUI) loggedInUI.style.display = 'none';
        console.log("No user session found.");
    }
}
// Function to simulate purchase when "Proceed" is clicked
async function simulatePurchase(product) {
    // 1. Get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        console.error("Auth Check Failed:", userError);
        alert("Please login to place an order!");
        window.location.href = "login.html";
        return;
    }

    console.log("Found User ID:", user.id);
    console.log("Sending Product:", product.name, "Price:", product.price);

    // 2. Insert into 'transactions' (Make sure this name matches your Supabase table)
    const { data, error } = await supabase
        .from('transactions') 
        .insert([
            { 
                user_id: user.id, 
                name: product.name, // In your code, you used product_name earlier. Change to 'name' if that's your DB column.
                price: parseFloat(product.price), // Ensure it's a number
                created_at: new Date().toISOString()
            }
        ]);

    if (error) {
        // If this runs, it will tell you exactly which column is missing or if RLS is blocking it
        console.error("Supabase Insert Error:", error.message);
        console.error("Error Details:", error.details);
        alert("Database Error: " + error.message);
    } else {
        console.log("Success! Database updated:", data);
        alert("Order placed successfully! Check your profile.");
    }
}
// Updated for your script.js
async function handleCheckout() {
    // We use the global 'cart' array you defined at the top of the script
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }
    
    // Loop through each item in the cart and send it to Supabase
    for (const item of cart) {
        await simulatePurchase({
            name: item.product.name,
            price: item.product.price
        });
    }
    
    clearCart(); // Wipes the cart after the order is saved
    window.location.href = 'orders.html'; 
}

// Make it global so your HTML button can click it
window.handleCheckout = handleCheckout;

// Run this check every time the page finishes loading
document.addEventListener('DOMContentLoaded', manageAuthUI);

window.addToCart = addToCart;
window.toggleCart = toggleCart;
window.filterProducts = filterProducts;
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.checkout = checkout;
window.sendMessage = sendMessage;
window.toggleChatbot = toggleChatbot;
window.sendQuickAction = sendQuickAction;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.closeCart = closeCart;
window.toggleChatbot = toggleChatbot;
window.closeChatbot = closeChatbot;
window.clearCart = clearCart;
window.cart = cart;