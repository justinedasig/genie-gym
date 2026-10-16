/* =========================================================
login.js — logic for index.html (Login + Register forms)
========================================================= */
// If the user is already logged in, skip the login page.
if (getCurrentUser()) {
    window.location.replace("dashboard.html");
}
const messageBox = document.getElementById("message");
/** Show a Bootstrap alert. type = "danger" | "success" | "warning" */
function showMessage(text, type) {
    messageBox.textContent = text;
    messageBox.className = "alert alert-" + type;
}
function clearMessage() {
    messageBox.className = "alert d-none";
    messageBox.textContent = "";
}
/** Simple email format check. */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
// Create the demo account on first visit.
seedDemoUser().catch((err) => showMessage(err.message, "warning"));
// Clear old messages when switching tabs.
document.querySelectorAll('[data-bs-toggle="pill"]').forEach((tab) => {
    tab.addEventListener("shown.bs.tab", clearMessage);
});
// ----- LOGIN -----
document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault(); // stop the browser from reloading the page
    clearMessage();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    if (!email || !password) {
        showMessage("Please enter both email and password.", "danger");
        return;
    }
    if (!isValidEmail(email)) {
        showMessage("Please enter a valid email address.", "danger");
        return;
    }
    try {
        const result = await loginUser(email, password);
        if (result.ok) {
            showMessage(result.message + " Redirecting...", "success");
            setTimeout(() => window.location.replace("dashboard.html"), 600);
        } else {
            showMessage(result.message, "danger");
        }
    } catch (err) {
        showMessage(err.message, "warning");
    }
});
// ----- REGISTER -----
document.getElementById("registerForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();
    const name = document.getElementById("regName").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const confirm = document.getElementById("regConfirm").value;
    if (!name.trim() || !email || !password || !confirm) {
        showMessage("Please fill in all fields.", "danger");
        return;
    }
    if (!isValidEmail(email)) {
        showMessage("Please enter a valid email address.", "danger");
        return;
    }
    if (password.length < 8) {
        showMessage("Password must be at least 8 characters.", "danger");
        return;
    }
    if (password !== confirm) {
        showMessage("Passwords do not match.", "danger");
        return;
    }
    try {
        const result = await registerUser(name, email, password);
        if (result.ok) {
            showMessage(result.message, "success");
            document.getElementById("registerForm").reset();
            document.getElementById("loginEmail").value = email.trim().toLowerCase();
            // Switch to the Login tab after a short delay
            setTimeout(() => {
                const loginTab = document.getElementById("login-tab");
                loginTab.addEventListener(
                    "shown.bs.tab",
                    () => showMessage("Account created! Please log in.", "success"),
                    { once: true }
                );
                bootstrap.Tab.getOrCreateInstance(loginTab).show();
            }, 1200);
        } else {
            showMessage(result.message, "danger");
        }
    } catch (err) {
        showMessage(err.message, "warning");
    }
});
