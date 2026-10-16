/* =========================================================
auth.js — shared login/session helpers used by EVERY page
---------------------------------------------------------
HOW IT WORKS (no server needed):
- Registered users are saved in the browser's localStorage
under the key "mt_users" as a JSON array.
- Passwords are never saved as plain text. We store a
SHA-256 hash made with the browser's built-in Web Crypto API.
- The logged-in user is saved in sessionStorage under
"mt_session", so the session ends when the tab is closed.
NOTE: This is "client-side" authentication, good for learning
and for a static free host (GitHub Pages / Netlify / Vercel).
A real production app would check passwords on a server.
========================================================= */
const USERS_KEY = "gg_users"; // CHANGE "mt_" to your app's prefix
const SESSION_KEY = "gg_session";
/** Turn a password into a SHA-256 hex string. */
async function hashPassword(password) {
    if (!window.crypto || !window.crypto.subtle) {
        throw new Error(
            "Secure context required. Open the site through Live Server " +
            "(http://127.0.0.1) or your https:// hosting URL."
        );
    }
    const data = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}
/** Read the list of users from localStorage (always returns an array). */
function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch (e) {
        return [];
    }
}
/** Save the list of users to localStorage. */
function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
/** Create the demo account the first time the app runs, so your
instructor can log in right away. */
async function seedDemoUser() {
    const users = getUsers();
    if (!users.some((u) => u.email === "demo@mytracker.com")) {
        users.push({
            name: "Demo Student",
            email: "demo@mytracker.com",
            passwordHash: await hashPassword("demo1234"),
            createdAt: new Date().toISOString(),
        });
        saveUsers(users);
    }
}
/** Register a new user. Returns { ok, message }. */
async function registerUser(name, email, password) {
    email = email.trim().toLowerCase();
    const users = getUsers();
    if (users.some((u) => u.email === email)) {
        return { ok: false, message: "That email is already registered. Please log in." };
    }
    users.push({
        name: name.trim(),
        email: email,
        passwordHash: await hashPassword(password),
        createdAt: new Date().toISOString(),
    });
    saveUsers(users);
    return { ok: true, message: "Account created! You can now log in." };
}
/** Check email + password. Returns { ok, message }. */
async function loginUser(email, password) {
    email = email.trim().toLowerCase();
    const user = getUsers().find((u) => u.email === email);
    if (!user) {
        return { ok: false, message: "No account found with that email." };
    }
    const hash = await hashPassword(password);
    if (hash !== user.passwordHash) {
        return { ok: false, message: "Incorrect password. Please try again." };
    }
    sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ name: user.name, email: user.email, loginAt: new Date().toISOString() })
    );
    return { ok: true, message: "Login successful!" };
}
/** Return the logged-in user object, or null if nobody is logged in. */
function getCurrentUser() {
    try {
        return JSON.parse(sessionStorage.getItem(SESSION_KEY));
    } catch (e) {
        return null;
    }
}
/** Log out and go back to the login page. */
function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = "index.html";
}
/** Put this at the top of protected pages: kicks out visitors who
are not logged in. */
function requireLogin() {
    const user = getCurrentUser();
    if (!user) {
        window.location.replace("index.html");
        return null;
    }
    return user;
}