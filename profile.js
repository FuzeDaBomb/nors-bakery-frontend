import { supabase } from './script.js'; // Adjust the path if your supabase client is elsewhere

async function initProfile() {
    // 1. Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Fill in the Profile Card
    document.getElementById('user-email').textContent = user.email;
    document.getElementById('user-display-name').textContent = user.email.split('@')[0];
    
    // Format the date (Member Since)
    const joinedDate = new Date(user.created_at).toLocaleDateString();
    document.getElementById('user-joined').textContent = joinedDate;

    // 3. Fetch Transactions for THIS user
    fetchOrders(user.id);
}

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