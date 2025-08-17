// sessionUser.js
async function fetchAndUpdateUser() {
    try {
        const res = await fetch("/api/auth/user", {
            credentials: "include" // ✅ important for cookies
        });

        // If not logged in → don’t force redirect here, just return null
        if (res.status === 401) {
            console.warn("Not logged in");
            return null;
        }

        const data = await res.json();

        if (data.loggedIn && data.user) {
            const name = data.user.name || "User";
            const coins = data.user.coins || 0;

            // ✅ Update coins display (supports both IDs)
            const coinsEl = document.getElementById("user-coins") || document.getElementById("coinDisplay");
            if (coinsEl) coinsEl.textContent = coins;

            // ✅ Update avatar with first letter of username
            const avatarEl = document.getElementById("profile-avatar");
            if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();

            return data.user;
        } else {
            console.warn("User not logged in (backend returned false)");
            return null;
        }
    } catch (err) {
        console.error("Error fetching user session:", err);
        return null;
    }
}

// On page load
document.addEventListener("DOMContentLoaded", () => {
    fetchAndUpdateUser();
    setInterval(fetchAndUpdateUser, 10000); // auto refresh coins/avatar every 10s
});
