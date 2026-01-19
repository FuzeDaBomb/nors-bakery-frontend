import { supabase } from './script.js'; 

async function protectPage() {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        alert("Please login to access your profile.");
        window.location.href = 'login.html';
        return;
    }

    console.log("Welcome,", user.email);
}

protectPage();

async function handleLogin(e) {
    e.preventDefault(); 
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    console.log("Attempting login for:", email);

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert("Login failed: " + error.message);
    } else {
        console.log("Login success!", data);
        window.location.href = 'index.html';
    }
}

document.getElementById('login-form').addEventListener('submit', handleLogin);