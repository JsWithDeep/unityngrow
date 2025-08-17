document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("packages");
  if (!container) return;

  try {
    // Fetch packages and purchases in parallel
    const [pkgRes, upRes] = await Promise.all([
      fetch("/api/buy-package/packages", { credentials: "include" }),
      fetch("/api/buy-package/user-purchases", {
        method: "GET", 
        credentials: "include", 
        headers: {
          "Content-Type": "application/json"
        }
      })
    ]);

    const pkgData = await pkgRes.json();
    const upData = await upRes.json();

    if (!pkgData.success) {
      container.innerHTML = "<p>Failed to load packages.</p>";
      return;
    }

    // Map purchase status by packageId
    const purchaseStatusMap = {};
    if (upData.success && Array.isArray(upData.purchases)) {
      upData.purchases.forEach(p => {
        purchaseStatusMap[p.packageId] = p.status; // "pending" or "paid"
      });
    }

    // Render packages
    const html = pkgData.packages.map((p) => {
      const status = purchaseStatusMap[p.packageId];
      let buttonLabel = "Buy Now";
      let buttonClass = "btn-primary";
      let disabled = "";

      if (status === "pending") {
        buttonLabel = "Request Pending";
        buttonClass = "btn-warning";
        disabled = "disabled";
      } else if (status === "paid") {
        buttonLabel = "Paid";
        buttonClass = "btn-success";
        disabled = "disabled";
      }

      const imgSrc = p.image ? `/images/${p.image}` : "/images/placeholder.png";

      return `
        <div class="package-card" data-package-id="${p.packageId}">
          <div class="package-image-wrapper">
            <img src="${imgSrc}" alt="${p.title}" class="package-img" />
          </div>
          <div class="package-overlay">
            <h2>${p.title}</h2>
            <p>${p.description}</p>
            <p>Price: <span>${p.price}</span> coins</p>
            <button class="btn ${buttonClass} buy-btn" data-package-id="${p.packageId}" ${disabled}>
              ${buttonLabel}
            </button>
          </div>
        </div>
      `;
    }).join("");

    container.innerHTML = html;

    // Attach click events
    container.querySelectorAll(".buy-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return; // Skip if already pending or paid
        const packageId = btn.getAttribute("data-package-id");
        window.location.href = `/payment.html?packageId=${encodeURIComponent(packageId)}`;
      });
    });

  } catch (err) {
    console.error("❌ Error loading packages:", err);
    container.innerHTML = "<p>Error loading packages.</p>";
  }
});
