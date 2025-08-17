// public/scripts/payment.js
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const packageId = params.get("packageId");
  const container = document.getElementById("paymentContainer");

  if (!packageId) {
    container.innerHTML = "<p>No package selected.</p>";
    return;
  }
  

  try {
    const res = await fetch("/api/buy-package/packages",{ credentials: "include"});
    const data = await res.json();
    if (!data.success) throw new Error("Failed to fetch package data");

    const pkg = data.packages.find(p => p.packageId === packageId);
    if (!pkg) {
      container.innerHTML = "<p>Package not found.</p>";
      return;
    }

    container.innerHTML = `
      <h2>Checkout — ${pkg.title}</h2>
      <p>${pkg.description}</p>
      <p>Price: <strong>${pkg.price} coins</strong></p>
      <p>Pay via Google Pay: <strong>90233-97894</strong></p>
      <img src="/images/gpay.jpeg" alt="Google Pay QR" style="max-width:200px; display:block; margin-bottom:10px;">
      <form id="paymentForm" enctype="multipart/form-data">
        <input type="hidden" name="packageId" value="${pkg.packageId}">
        <div class="mb-3">
          <label>Upload Payment Screenshot</label>
          <input type="file" id="paymentss" name="screenshot" accept="image/*" required />
        </div>
        <button class="btn btn-primary" type="submit">Submit Request</button>
      </form>
      <div id="message"></div>
    `;

    const paymentForm = document.getElementById("paymentForm");
    const messageDiv = document.getElementById("message");

    paymentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      messageDiv.textContent = "Submitting request...";

      const formData = new FormData(paymentForm);

      try {
        const purchaseRes = await fetch("/api/buy-package/purchase", {
          method: "POST",
          credentials: "include",
          body: formData
        });

        const result = await purchaseRes.json();
        if (result.success) {
          messageDiv.textContent = "Request submitted successfully.";
          setTimeout(() => window.location.href = "/index.html", 1500);
        } else {
          messageDiv.textContent = result.message || "Request failed.";
        }
      } catch (err) {
        console.error(err);
        messageDiv.textContent = "Network error.";
      }
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Failed to load package info.</p>";
  }
});
