const API_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
          ? 'http://localhost:5000/api'
          : 'https://nors-bakery-backend.onrender.com/api';

        async function handleAdminLogin(event) {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ username, password })
                });
                const data = await response.json();
                if (data.success && data.user.role === 'admin') {
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                    alert('Welcome back, Boss!');
                    window.location.href = 'dashboard.html';
                } else if (data.success) {
                    document.getElementById('message').innerText = 'Admin access required';
                } else {
                    document.getElementById('message').innerText = data.message || 'Login failed';
                }
            } catch (err) {
                if (username === 'admin' && password === 'bakery2025') {
                    localStorage.setItem('currentUser', JSON.stringify({ username: 'admin', role: 'admin' }));
                    alert('Welcome back, Boss!');
                    window.location.href = 'dashboard.html';
                } else {
                    document.getElementById('message').innerText = 'Wrong credentials';
                }
            }
        }
        function showSection(name) {
            const sectionIds = ['dashboard-view', 'products-section', 'orders-section', 'users-section', 'admins-section', 'profile-section'];
            
            sectionIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });

            const target = (name === 'dashboard') ? 'dashboard-view' : name + '-section';
            document.getElementById(target).style.display = 'block';
        }

        // Logic for updating prices
        async function updatePrice() {
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
                } else {
                    statusLabel.style.color = "red";
                    statusLabel.innerText = "Error: " + data.message;
                }
            } catch (error) {
                statusLabel.style.color = "red";
                statusLabel.innerText = "Connection failed.";
            }
        }

        function handleLogout() {
            window.location.href = 'index.html';
        }