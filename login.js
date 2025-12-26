// login.js
import { supabase } from './script.js';

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
        window.location.href = 'profile.html'; // Move to profile after success
    }
}

// Attach the function to your form
document.getElementById('login-form').addEventListener('submit', handleLogin);