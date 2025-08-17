document.addEventListener("DOMContentLoaded", () => {
  const approvalsBtn = document.getElementById("viewApprovals");
  const manageUsersBtn = document.getElementById("manageUsers");
  const dashboardTable = document.getElementById("AdmindashboardTable");

  // =====================
  // LOAD APPROVALS TABLE
  // =====================
  approvalsBtn.addEventListener("click", async () => {
    dashboardTable.innerHTML = "<p>Loading approvals...</p>";

    try {
      const res = await fetch("/api/admin/approvals", { credentials: "include" });
      const data = await res.json();

      if (!data.success) {
        dashboardTable.innerHTML = "<p>Failed to load approvals.</p>";
        return;
      }

      if (!data.purchases.length) {
        dashboardTable.innerHTML = "<p>No pending approvals.</p>";
        return;
      }

      let tableHTML = `
        <table class="table table-bordered table-striped">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Name</th>
              <th>Package ID</th>
              <th>Price</th>
              <th>Screenshot</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
      `;

      data.purchases.forEach((p) => {
        tableHTML += `
          <tr data-id="${p._id}">
            <td>${p.userId}</td>
            <td>${p.name}</td>
            <td>${p.packageId}</td>
            <td>${p.price}</td>
            <td>
              ${p.screenshot
            ? `<button class="btn btn-info btn-sm view-screenshot" data-url="${p.screenshot}">View</button>`
            : "No SS"
          }
            </td>
            <td>
              <button class="btn btn-success btn-sm approve-btn">Approve</button>
              <button class="btn btn-danger btn-sm reject-btn">Reject</button>
            </td>
          </tr>
        `;
      });

      tableHTML += `</tbody></table>`;
      dashboardTable.innerHTML = tableHTML;

      // View Screenshot
      dashboardTable.querySelectorAll(".view-screenshot").forEach((btn) => {
        btn.addEventListener("click", () => {
          window.open(btn.dataset.url, "_blank");
        });
      });

      // Approve Request
      dashboardTable.querySelectorAll(".approve-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const purchaseId = btn.closest("tr").dataset.id;
          const approveRes = await fetch(
            `https://ung-backend.onrender.com/api/admin/approvals/${purchaseId}/approve`,
            { method: "PUT", credentials: "include" }
          );
          const approveData = await approveRes.json();

          if (approveData.success) {
            btn.closest("tr").remove();
          } else {
            alert("Approval failed: " + approveData.message);
          }
        });
      });
      // Reject Request
      dashboardTable.querySelectorAll(".reject-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const purchaseId = btn.closest("tr").dataset.id;
          const rejectRes = await fetch(`/api/admin/approvals/${purchaseId}/reject`, {
            method: "PUT"
            , credentials: "include"
          });
          const rejectData = await rejectRes.json();

          if (rejectData.success) {
            // Remove from approvals table
            btn.closest("tr").remove();
            alert("Purchase rejected — user can buy again.");
          } else {
            alert("Rejection failed: " + rejectData.message);
          }
        });
      });
    } catch (err) {
      console.error("Error loading approvals:", err);
      dashboardTable.innerHTML = "<p>Error loading approvals.</p>";
    }
  });


  // ================================
  // MANAGE USERS CLICK HANDLER
  // ================================
  manageUsersBtn.addEventListener("click", async () => {
    dashboardTable.innerHTML = "<p>Loading users...</p>";

    try {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      const data = await res.json();
      if (!data.success) {
        dashboardTable.innerHTML = "<p>Failed to load users</p>";
        return;
      }

      if (data.users.length === 0) {
        dashboardTable.innerHTML = "<p>No users found.</p>";
        return;
      }

      let html = `
      <table class="table table-bordered table-hover">
        <thead>
          <tr>
            <th>User ID</th>
            <th>Username</th>
            <th>Rf Phone</th>
            <th>phone</th>
            <th>Packages Purchased</th>
            <th>Total Earnings</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

      data.users.forEach((user) => {
        html += `
        <tr>
          <td>${user.userId}</td>
          <td>${user.name}</td>
          <td>${user.referralPhone}</td>
          <td>${user.phone}</td>
          <td>${user.packages.join(", ") || "-"}</td>
          <td>${user.totalEarnings}</td>
          <td>
            <button class="btn btn-sm btn-warning update-user" data-id="${user.userId
          }">Update</button>
            <button class="btn btn-sm btn-danger delete-user" data-id="${user.userId
          }">Delete</button>
          </td>
        </tr>
      `;
      });

      html += "</tbody></table>";
      dashboardTable.innerHTML = html;

      // UPDATE USER BUTTON
      document.querySelectorAll(".update-user").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const userId = btn.dataset.id;

          // Fetch full user details from backend
          const userRes = await fetch(`/api/admin/users/${userId}`, { credentials: "include" });
          const userData = await userRes.json();
          if (!userData.success) return alert("Failed to load user details");

          showUpdateForm(userData.user);
        });
      });

      // DELETE USER BUTTON
      document.querySelectorAll(".delete-user").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const userId = btn.getAttribute("data-id");
          if (!confirm(`Delete user ${userId}?`)) return;

          const delRes = await fetch(`/api/admin/users/${userId}`, {
            method: "DELETE",
            credentials: "include"
          });
          const delData = await delRes.json();
          if (delData.success) {
            alert("User deleted");
            btn.closest("tr").remove();
          } else {
            alert(delData.message || "Delete failed");
          }
        });
      });
    } catch (err) {
      console.error("Error fetching users:", err);
      dashboardTable.innerHTML = "<p>Error loading users</p>";
    }
  });

  // ================================
  // POPUP FORM FUNCTION
  // ================================
  function showUpdateForm(user) {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
    position: fixed;top:0;left:0;width:100%;height:100%;
    background: rgba(0,0,0,0.6);display:flex;
    align-items:center;justify-content:center;z-index:9999;
  `;

    overlay.innerHTML = `
    <div style="background:white;padding:20px;border-radius:8px;max-width:400px;width:100%">
      <h4>Update User</h4>
      <form id="updateUserForm">
        <div class="mb-2">
          <label>Name</label>
          <input type="text" name="name" class="form-control" value="${user.name
      }">
        </div>
        <div class="mb-2">
          <label>Phone</label>
          <input type="text" name="phone" class="form-control" value="${user.phone
      }">
        </div>
       <div class="mb-2">
  <label>Referral Phone</label>
  <input type="text" name="referralPhone" class="form-control" value="${user.referralPhone || ""
      }">
</div>
        <div class="mt-3 d-flex justify-content-between">
          <button type="submit" class="btn btn-success">Save</button>
          <button type="button" class="btn btn-secondary cancel-update">Cancel</button>
        </div>
      </form>
    </div>
  `;

    document.body.appendChild(overlay);

    // Cancel button
    overlay.querySelector(".cancel-update").addEventListener("click", () => {
      overlay.remove();
    });

    // Submit form
    overlay
      .querySelector("#updateUserForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const body = {
          name: formData.get("name"),
          phone: formData.get("phone"),
          password: formData.get("referralPhone"),
        };

        const updateRes = await fetch(`/api/admin/users/${user.userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          credentials: "include"
        });

        const updateData = await updateRes.json();
        if (updateData.success) {
          alert("User updated successfully");
          overlay.remove();
          manageUsersBtn.click(); // refresh table
        } else {
          alert(updateData.message || "Update failed");
        }
      });
  }



  const withdrawalBtn = document.getElementById("withdrawalRequests");

  withdrawalBtn.addEventListener("click", async () => {
    dashboardTable.innerHTML = "<p>Loading withdrawal requests...</p>";

    try {
      const res = await fetch("/api/admin/withdrawals", { credentials: "include" });
      const data = await res.json();

      if (!data.success) {
        dashboardTable.innerHTML = "<p>Failed to load withdrawal requests.</p>";
        return;
      }

      if (!data.withdrawals.length) {
        dashboardTable.innerHTML = "<p>No pending withdrawals.</p>";
        return;
      }

      let html = `
      <table class="table table-bordered table-hover">
        <thead>
          <tr>
            <th>User ID</th>
            <th>Name</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Account</th>
            <th>Requested At</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
    `;

      data.withdrawals.forEach((tx) => {
        html += `
        <tr data-id="${tx._id}">
          <td>${tx.userId}</td>
          <td>${tx.name}</td>
          <td>${tx.amount}</td>
          <td>${tx.method}</td>
          <td>${tx.account}</td>
          <td>${new Date(tx.requestedAt).toLocaleString()}</td>
          <td>
            <button class="btn btn-success btn-sm approve-withdrawal">Approve</button>
          </td>
        </tr>
      `;
      });

      html += "</tbody></table>";
      dashboardTable.innerHTML = html;

      dashboardTable.querySelectorAll(".approve-withdrawal").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.closest("tr").dataset.id;
          const confirmApproval = confirm("Approve this withdrawal?");
          if (!confirmApproval) return;

          const res = await fetch(`/api/admin/withdrawals/${id}/approve`, {
            method: "PUT",
            credentials: "include"
          });

          const result = await res.json();
          if (result.success) {
            btn.closest("tr").remove();
          } else {
            alert("Approval failed: " + result.message);
          }
        });
      });
    } catch (err) {
      console.error("Error loading withdrawals:", err);
      dashboardTable.innerHTML = "<p>Error loading withdrawals.</p>";
    }
  });
});
