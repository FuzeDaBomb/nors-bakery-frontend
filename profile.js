import { supabase } from './script.js';

document.addEventListener('DOMContentLoaded', () => {
    loadProfileData();
    loadOrderHistory();

    document.getElementById('edit-profile-btn').addEventListener('click', toggleEditMode);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
});

let isEditing = false;

async function toggleEditMode() {
    const btn = document.getElementById('edit-profile-btn');
    const nameDisplay = document.getElementById('info-full-name');
    const nameInput = document.getElementById('edit-name-input');

    if (!isEditing) {
        isEditing = true;
        btn.textContent = "Done";
        btn.style.background = "var(--secondary)";

        nameInput.value = nameDisplay.textContent;
        nameDisplay.style.display = "none";
        nameInput.style.display = "block";
        nameInput.focus();
    } else {
        const newName = nameInput.value.trim();

        if (newName && newName !== nameDisplay.textContent) {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: newName }
            });

            if (error) {
                alert("Update failed: " + error.message);
                return;
            }
            nameDisplay.textContent = newName;
            document.getElementById('user-display-name').textContent = newName;
        }


        isEditing = false;
        btn.textContent = "Edit Profile";
        btn.style.background = "";
        nameDisplay.style.display = "block";
        nameInput.style.display = "none";
    }
}

async function loadProfileData() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        window.location.href = 'login.html';
        return;
    }

    const name = user.user_metadata?.full_name || user.email.split('@')[0];
    const avatar = user.user_metadata?.avatar_url || 'Gambars/logo2.jpg';

    document.getElementById('user-display-name').textContent = name;
    document.getElementById('info-full-name').textContent = name;
    document.getElementById('user-email-header').textContent = user.email;
    document.getElementById('info-email').textContent = user.email;
    document.getElementById('user-avatar-img').src = avatar;
}

async function loadOrderHistory() {
    const { data: { user } } = await supabase.auth.getUser();
    const container = document.getElementById('order-history-container');
    const { data: orders, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error || !orders || orders.length === 0) {
        container.innerHTML = `<p style="color: var(--muted-foreground);">No orders found.</p>`;
        return;
    }

    container.innerHTML = orders.map(order => `
        <div style="background: #fff; padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 1rem; color: #000;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <strong>Order #${order.id.slice(0, 8)}</strong>
                <span style="color: var(--primary); font-weight: bold;">RM${order.total_amount.toFixed(2)}</span>
            </div>
            <div style="font-size: 0.9rem; color: #666;">
                Status: ${order.status}
            </div>
        </div>
    `).join('');
}

async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
}