// 1. Import the supabase connection from your main script
import { supabase } from './script.js'; 

async function protectPage() {
    console.log("Checking authorization...");
    
    // 2. Ask Supabase for the current session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
        console.log("No active session found. Redirecting...");
        alert("Please login to access your profile.");
        window.location.replace('login.html'); // Use replace so they can't click "back"
        return;
    }

    console.log("Access granted for:", session.user.email);
    // Now call your existing function to load data
    initProfile(); 
}

// Start the check immediately
protectPage();

async function fetchOrders(userId) {
    const { data: orders, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId); // This works because of the RLS policy you set!

    const orderContainer = document.getElementById('order-history');

    if (error) {
        orderContainer.innerHTML = '<p>Error loading orders.</p>';
        return;
    }

    if (!orders || orders.length === 0) {
        orderContainer.innerHTML = '<p>You haven\'t placed any orders yet.</p>';
        return;
    }

    // 4. Display orders in a list
    orderContainer.innerHTML = orders.map(order => `
        <div class="order-item" style="border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 8px;">
            <p><strong>Order ID:</strong> #${order.id}</p>
            <p><strong>Product:</strong> ${order.name}</p>
            <p><strong>Total:</strong> RM${order.price}</p>
        </div>
    `).join('');
}

// Logout function
window.logout = async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
};

document.addEventListener('DOMContentLoaded', initProfile);