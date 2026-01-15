// Tab switching logic
        const tabs = document.querySelectorAll('.tab-item');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                // You can add filtering logic here later
            });
        });

        // Backend Integration Snippet
        async function fetchOrderHistory() {
            const user = JSON.parse(localStorage.getItem('currentUser'));
            if (!user) {
                window.location.href = 'login.html';
                return;
            }
        }
    function filterOrders(status, element) {
    // 1. Update active UI for tabs
    const tabs = document.querySelectorAll('.tab-item');
    tabs.forEach(tab => tab.classList.remove('active'));
    element.classList.add('active');

    // 2. Filter the cards
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

    // 3. Show "Empty" state if no orders match
    const emptyState = document.querySelector('.empty-orders');
    if (visibleCount === 0) {
        emptyState.style.display = 'flex';
        emptyState.querySelector('p').textContent = `No ${status} orders yet`;
    } else {
        emptyState.style.display = 'none';
    }
}