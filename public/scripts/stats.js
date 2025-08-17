// public/js/stats.js

// =============================
// Load Admin Stats on Page Load
// =============================
document.addEventListener("DOMContentLoaded", () => {
  loadAdminStats();
});

// 🔹 Fetch and display admin dashboard stats
async function loadAdminStats() {
  try {
    const response = await fetch("/api/admin/stats",{ credentials: "include"});
    const result = await response.json();

    if (!result.success) {
      throw new Error("Failed to load dashboard stats");
    }

    const { totalUsers, totalEarnings, pendingRequests } = result.data;

    // Populate DOM elements with stats
    const totalUsersDiv = document.getElementById("totalUsers");
    const totalEarningsDiv = document.getElementById("totalEarnings");
    const pendingRequestsDiv = document.getElementById("pendingRequests");

    if (totalUsersDiv) totalUsersDiv.textContent = totalUsers;
    if (totalEarningsDiv) totalEarningsDiv.textContent = `${totalEarnings} coins`;
    if (pendingRequestsDiv) pendingRequestsDiv.textContent = pendingRequests;
  } catch (error) {
    console.error("❌ Error loading admin dashboard stats:", error);
  }
}
