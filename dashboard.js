/**
 * Nors Bakery Admin Logic
 */

// 1. Navigation Logic: Controls which section is visible
window.showSection = function(name) {
    const sectionIds = [
        'dashboard-view', 
        'products-section', 
        'orders-section', 
        'users-section', 
        'admins-section', 
        'profile-section'
    ];
    
    // Hide everything first
    sectionIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // Show the specific section
    const target = (name === 'dashboard') ? 'dashboard-view' : name + '-section';
    const targetEl = document.getElementById(target);
    
    if (targetEl) {
        targetEl.style.display = 'block';
    } else {
        console.error(`Section ${target} not found.`);
    }
};

// 2. Logic for updating prices
window.updatePrice = async function() {
    const name = document.getElementById('itemName').value;
    const price = document.getElementById('newPrice').value;
    const statusLabel = document.getElementById('status');

    if (!name || !price) {
        statusLabel.style.color = "red";
        statusLabel.innerText = "Please fill in all fields";
        return;
    }

    statusLabel.style.color = "#007bff";
    statusLabel.innerText = "Updating...";

    try {
        const response = await fetch('https://nors-bakery-backend.onrender.com/update-price', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, price: price })
        });
        
        const data = await response.json();
        
        if (data.success) {
            statusLabel.style.color = "green";
            statusLabel.innerText = data.message;
            // Clear inputs on success
            document.getElementById('itemName').value = '';
            document.getElementById('newPrice').value = '';
        } else {
            statusLabel.style.color = "red";
            statusLabel.innerText = "Error: " + data.message;
        }
    } catch (error) {
        statusLabel.style.color = "red";
        statusLabel.innerText = "Connection failed.";
        console.error("Fetch error:", error);
    }
};

// 3. Authentication Logic
window.handleLogout = function() {
    // Clear any admin sessions if you have them
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
};

// 4. Initial Load (Optional: Remove overlay when ready)
window.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('overlay');
    if (overlay) {
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.style.display = 'none', 500);
        }, 300);
    }
});
function renderCheckoutItems() {
    const container = document.getElementById('checkout-items');
    
    // 1. Specifically look for window.cart
    const currentCart = window.cart || [];
    
    if (currentCart.length === 0) {
        container.innerHTML = '<p>Your cart is empty. <a href="products.html">Go shopping</a></p>';
        updateCheckoutTotals();
        return;
    }

    // 2. Ensure property names match (e.g., image_url vs imageUrl)
    container.innerHTML = currentCart.map(item => `
        <div class="summary-item" style="display: flex; gap: 1rem; margin-bottom: 1rem; align-items: center;">
            <img src="${item.product.image_url || item.product.imageUrl}" 
                 alt="${item.product.name}" 
                 style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">
            <div class="summary-details" style="flex: 1;">
                <h4 style="margin: 0;">${item.product.name}</h4>
                <div style="font-size: 0.8rem; color: gray;">Qty: ${item.quantity}</div>
            </div>
            <div class="summary-price">RM ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}</div>
        </div>
    `).join('');

    updateCheckoutTotals();
}