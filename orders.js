import { supabase } from './script.js';

async function loadMyOrders() {
    const ordersList = document.getElementById('orders-list');
    const emptyState = document.querySelector('.empty-orders');

    // 1. Get Current User
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!user || userError) {
        ordersList.innerHTML = `
            <div class="container text-center" style="padding: 50px;">
                <p>Please login to view your order history.</p>
                <a href="login.html" class="btn btn-primary">Login Now</a>
            </div>`;
        return;
    }

    // 2. Fetch Orders from Supabase
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching orders:", error.message);
        return;
    }

    // 3. Display Orders
    if (orders && orders.length > 0) {
        emptyState.style.display = 'none';
        ordersList.innerHTML = orders.map(order => `
            <div class="order-card" data-status="${order.status}">
                <div class="order-header">
                    <span class="order-id">Order ID: #NB${order.id}</span>
                    <span class="order-status status-${order.status.toLowerCase().replace(/\s+/g, '-')}">${order.status}</span>
                </div>
                <div class="order-body">
                    <div class="item-row">
                        <div class="item-details">
                            <div class="item-name">${order.product_name}</div>
                            <div class="item-meta">Date: ${new Date(order.created_at).toLocaleDateString()}</div>
                            <div class="item-meta">RM ${order.price.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
                <div class="order-footer">
                    <div class="order-total"><span>Total:</span> RM ${order.price.toFixed(2)}</div>
                    <button class="btn-reorder" onclick="window.location.href='products.html'">Buy Again</button>
                </div>
            </div>
        `).join('');
    } else {
        ordersList.innerHTML = '';
        emptyState.style.display = 'flex';
    }
}

window.filterOrders = function(status, element) {
    const tabs = document.querySelectorAll('.tab-item');
    tabs.forEach(tab => tab.classList.remove('active'));
    element.classList.add('active');

    const cards = document.querySelectorAll('.order-card');
    let visibleCount = 0;

    cards.forEach(card => {
        const cardStatus = card.getAttribute('data-status');
        if (status === 'all' || cardStatus === status) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    const emptyState = document.querySelector('.empty-orders');
    emptyState.style.display = (visibleCount === 0) ? 'flex' : 'none';
};

document.addEventListener('DOMContentLoaded', loadMyOrders);