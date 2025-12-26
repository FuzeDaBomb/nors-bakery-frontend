async function handleRegister(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
    });

    if (error) {
        alert("Error: " + error.message);
    } else {
        alert("Check your email for the confirmation link!");
        window.location.href = 'login.html';
    }
}async function handleRegister(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
    });

    if (error) {
        alert("Error: " + error.message);
    } else {
        alert("Check your email for the confirmation link!");
        window.location.href = 'login.html';
    }
}