// loader.js

// Utility: Load a component into a target element
async function loadComponent(id, file) {
  const el = document.getElementById(id);
  if (!el) {
    console.error(`Element with id "${id}" not found.`);
    return;
  }

  try {
    const res = await fetch(file);
    const html = await res.text();
    el.innerHTML = html;
  } catch (err) {
    console.error(`Error loading ${file}:`, err);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // ✅ Load components
  await loadComponent("navbar-placeholder", "./components/navbar.html");
  await loadComponent("sidebar-placeholder", "./components/sidebar.html");
  await loadComponent("overlay-placeholder", "./components/overlay.html");

  // ✅ Check user session AFTER navbar loads
  const user = await fetchAndUpdateUser();

  const path = window.location.pathname;
  // 🚨 Redirect to login ONLY on protected pages
  const protectedPages = ["dashboard", "adminDashboard", "buyPackage","index.html"];
  const isProtected = protectedPages.some((page) =>
    path.includes(page)
  );

  if (!user && isProtected) {
    window.location.href = "login.html";
    return;
  }
  // Special case → if already logged in and on login.html, go to dashboard
  if (user && path.includes("login.html")) {
    window.location.href = "dashboard.html";
    return;
  }


  // Setup UI events (sidebar, withdraw, etc.)
  setupEventListeners();

  // ✅ Load footer
  const footerContainer = document.createElement("div");
  document.body.appendChild(footerContainer);

  try {
    const footerHTML = await (await fetch("./components/footer.html")).text();
    footerContainer.innerHTML = footerHTML;
  } catch (err) {
    console.error("Footer loading error:", err);
  }
});

// =================================================
// Event Listeners
// =================================================
function setupEventListeners() {
  // Sidebar toggle
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const sidebarMenu = document.getElementById("sidebarMenu");
  const overlay = document.getElementById("overlay");
  const spans = hamburgerBtn?.querySelectorAll("span");

  function toggleSidebar() {
    const isOpen = sidebarMenu.classList.toggle("show");
    overlay.classList.toggle("active", isOpen);
    spans?.forEach((span) => {
      span.style.backgroundColor = isOpen ? "white" : "black";
    });
  }

  hamburgerBtn?.addEventListener("click", toggleSidebar);
  overlay?.addEventListener("click", toggleSidebar);

  // Withdraw Section
  const withdrawBtn = document.getElementById("withdrawSectionBtn");
  const withdrawSection = document.getElementById("withdrawSection");
  const buttons = withdrawSection?.querySelectorAll(".pay-option-btn");
  const selectedAmountInput = document.getElementById("selectedAmount");
  const withdrawSubmitBtn = document.getElementById("withdrawSubmitBtn");
  const methodSelect = document.getElementById("method");
  const accountInput = document.getElementById("account");

  if (withdrawBtn && withdrawSection) {
    withdrawBtn.addEventListener("click", () => {
      withdrawSection.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
      if (
        !withdrawSection.contains(e.target) &&
        !withdrawBtn.contains(e.target) &&
        withdrawSection.classList.contains("show")
      ) {
        withdrawSection.classList.remove("show");
      }
    });

    buttons?.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const amount = btn.getAttribute("data-amount");
        if (selectedAmountInput) {
          selectedAmountInput.value = amount;
        }
      });
    });
  }

  // Withdraw form submission
  if (withdrawSubmitBtn && selectedAmountInput) {
    withdrawSubmitBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const amount = selectedAmountInput.value;
      const method = methodSelect?.value;
      const account = accountInput?.value;

      if (!amount) {
        alert("Please select an amount to withdraw.");
        return;
      }
      if (!method || !account) {
        alert("Please select a method and enter account details.");
        return;
      }

      try {
        const res = await fetch("/api/transactions", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, method, account }),
        });

        const data = await res.json();

        if (res.ok) {
          alert("Withdrawal request submitted successfully!");

          const coinDisplay =
            document.getElementById("user-coins") || document.getElementById("coinDisplay");
          if (coinDisplay && data.coins !== undefined) {
            coinDisplay.innerText = data.coins;
          }

          withdrawSection.classList.remove("show");
          selectedAmountInput.value = "";
          methodSelect.value = "";
          accountInput.value = "";
          buttons.forEach((b) => b.classList.remove("active"));
        } else {
          alert(data.message || "Something went wrong.");
        }
      } catch (err) {
        console.error("Withdraw Error:", err);
        alert("Failed to process withdrawal.");
      }
    });
  }
}

// =================================================
// Scroll Animations
// =================================================
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("visible", entry.isIntersecting);
    });
  },
  { threshold: 0.3 }
);

document.querySelectorAll("#contact_section, #about-section").forEach((section) => {
  if (section) sectionObserver.observe(section);
});

const heading = document.getElementById("contact_heading");
if (heading) {
  const headingObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        heading.classList.toggle("visible", entry.isIntersecting);
      });
    },
    { threshold: 0.3 }
  );
  headingObserver.observe(heading);
}
