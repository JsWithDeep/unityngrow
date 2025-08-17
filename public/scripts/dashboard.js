document.addEventListener("DOMContentLoaded", () => {
  const dashboardTable = document.getElementById("dashboardTable");
  const dashboardBtn = document.getElementById("dashboard");
  const teamBtn = document.getElementById("Teams");
  const earningsBtn = document.getElementById("Earnings");

  if (!dashboardTable || !dashboardBtn || !teamBtn || !earningsBtn) {
    console.error("One or more elements not found.");
    return;
  }

  const navLinks = [dashboardBtn, teamBtn, earningsBtn];

  function setActive(btn) {
    const navlinks = document.querySelectorAll(".nav-link");
    if (navlinks.length) {
      navLinks.forEach((link) => link.classList.remove("active"));
      btn.classList.add("active");
    }
  }

  // Default load
  loadUserProfile();
  setActive(dashboardBtn);

  dashboardBtn.addEventListener("click", () => {
    setActive(dashboardBtn);
    loadUserProfile();
  });

  teamBtn.addEventListener("click", async () => {
    setActive(teamBtn);
    try {
      const res = await fetch("/api/team/my-team",{ credentials: "include"});
      const result = await res.json();

      dashboardTable.innerHTML = "";

      if (!result.success || result.data.length === 0) {
        dashboardTable.innerHTML = `<p>No team members found.</p>`;
        return;
      }

      const table = document.createElement("table");
      table.classList.add("custom-table");

      table.innerHTML = `
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>User ID</th>
            <th>Registered On</th>
          </tr>
        </thead>
        <tbody>
          ${result.data
          .map(
            (member) => `
            <tr>
              <td>${member.name || "N/A"}</td>
              <td>${member.email || "N/A"}</td>
              <td>${member.phone || "N/A"}</td>
              <td>${member.userId || "N/A"}</td>
              <td>${member.registrationDate || "N/A"}</td>
            </tr>`
          )
          .join("")}
        </tbody>
      `;

      dashboardTable.appendChild(table);
    } catch (error) {
      console.error("❌ Error fetching team:", error);
      dashboardTable.innerHTML =
        "<p>Something went wrong while loading your team.</p>";
    }
  });

  earningsBtn.addEventListener("click", async () => {
    setActive(earningsBtn);

    try {
      const res = await fetch("/api/transactions", { credentials: "include" });
      const data = await res.json();

      dashboardTable.innerHTML = "";

      if (!res.ok) {
        dashboardTable.innerHTML = `<p>Error: ${data.message || "Could not fetch transactions"
          }</p>`;
        return;
      }

      const transactions = data.transactions;

      if (!transactions.length) {
        dashboardTable.innerHTML = "<p>No transactions yet.</p>";
        return;
      }

      const tableHTML = `
      <div class="table-responsive">
        <table class="dashboard-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${transactions
          .map(
            (tx) => `
              <tr>
                <td>${tx._id}</td>
                <td>${tx.amount} coins</td>
                <td class="${tx.status === "completed"
                ? "status-completed"
                : "status-pending"
              }">
                  ${tx.status}
                </td>
              </tr>
            `
          )
          .join("")}
          </tbody>
        </table>
      </div>
    `;

      dashboardTable.innerHTML = tableHTML;
    } catch (err) {
      console.error("Error loading transactions:", err);
      dashboardTable.innerHTML = "<p>Failed to load transactions.</p>";
    }
  });

  async function loadUserProfile() {
    try {
      const res = await fetch("/api/profile", { credentials: "include" });
      const result = await res.json();

      dashboardTable.innerHTML = "";

      if (!result.success) {
        dashboardTable.innerHTML = `<p>User not found.</p>`;
        return;
      }

      const user = result.data;

      const profileDiv = document.createElement("div");
      profileDiv.classList.add("profile-container");

      profileDiv.innerHTML = `
        <h2 class="profile-title">My Profile</h2>
        <form id="updateProfileForm" class="profile-form">
          <label>Name:
            <input type="text" name="name" value="${user.name || ""
        }" required />
          </label>
          <label>Email:
            <input type="email" name="email" value="${user.email || ""
        }" readonly />
          </label>
          <label>Phone:
            <input type="text" name="phone" value="${user.phone || ""
        }" required />
          </label>
          <label>User ID:
            <input type="text" name="userId" value="${user.userId || ""
        }" readonly />
          </label>
          <button type="submit" class="profileUpdateBtn">Update Profile</button>
        </form>
        <div id="updateStatus"></div>
      `;

      dashboardTable.appendChild(profileDiv);

      const form = document.getElementById("updateProfileForm");
      const statusDiv = document.getElementById("updateStatus");

      if (form) {
        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);

          const updateRes = await fetch("/api/profile/update", {
            credentials: "include",
            method: "PUT",
            body: new URLSearchParams(formData),
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }, { credentials: "include" });

          const updateResult = await updateRes.json();

          if (statusDiv) {
            if (updateResult.success) {
              statusDiv.innerHTML = `<p style="color:green;">Profile updated successfully!</p>`;
            } else {
              statusDiv.innerHTML = `<p style="color:red;">${updateResult.message || "Update failed."
                }</p>`;
            }
          }
        });
      }
    } catch (err) {
      console.error("Profile load error:", err);
      dashboardTable.innerHTML = "<p>Something went wrong.</p>";
    }
  }
});
