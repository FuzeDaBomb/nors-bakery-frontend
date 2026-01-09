// login.js
// Add this at the very top of profile.js
import { supabase } from './script.js'; 

async function protectPage() {
    const { data: { user }, error } = await supabase.auth.getUser();

    // If there is an error or no user is found, kick them back to login
    if (error || !user) {
        alert("Please login to access your profile.");
        window.location.href = 'login.html';
        return;
    }

    // If we reach here, the user is logged in! 
    // You can now run your other functions like loading orders
    console.log("Welcome,", user.email);
}

// Run the protection check immediately
protectPage();

async function handleLogin(e) {
    e.preventDefault(); // This stops the page from refreshing immediately
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    console.log("Attempting login for:", email); // Helpful for debugging

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert("Login failed: " + error.message);
    } else {
        console.log("Login success!", data);
        window.location.href = 'index.html'; // Move to profile after success
    }
}

// Attach the function to your form
document.getElementById('login-form').addEventListener('submit', handleLogin);