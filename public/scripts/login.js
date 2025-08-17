document.addEventListener("DOMContentLoaded", () => {
  // 🔁 Switch between forms
  function switchForm(formId) {
    document.querySelectorAll("form").forEach((form) => {
      form.classList.remove("active");
      form.style.display = "none";
    });

    const target = document.getElementById(formId);
    if (target) {
      target.classList.add("active");
      target.style.display = "block";
    }

    document
      .querySelectorAll(".tab, .switch-text a")
      .forEach((el) => el.classList.remove("active"));

    document
      .querySelectorAll(`[data-form="${formId}"]`)
      .forEach((el) => el.classList.add("active"));
  }

  // 🔁 Tabs and links
  document.querySelectorAll(".tab[data-form]").forEach((tab) => {
    tab.addEventListener("click", () => {
      switchForm(tab.getAttribute("data-form"));
    });
  });

  document.querySelectorAll(".switch-text a[data-form]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      switchForm(link.getAttribute("data-form"));
    });
  });

  const defaultForm = document.querySelector("form");
  if (defaultForm) switchForm(defaultForm.id);

  // ✅ Register
  const registerForm = document.getElementById("register");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("reg-name").value.trim();
      const phone = document.getElementById("reg-phone").value.trim();
      const email = document.getElementById("reg-email").value.trim();
      const password = document.getElementById("reg-password").value.trim();
      const referralInput = document.getElementById("referral-phone").value.trim() || null;

      if (!name || !phone || !email || !password) {
        alert("⚠️ Please fill in all required fields.");
        return;
      }

      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, email, password, referralInput }),
        });

        const data = await res.json();

        if (res.ok) {
          alert(`✅ OTP sent to ${email}`);
          registerForm.reset();
          switchForm("otp-form");
          document.getElementById("otp-email").value = email;
        } else {
          alert(`❌ ${data.message || "Registration failed"}`);
        }
      } catch (err) {
        console.error("Registration Error:", err);
        alert("❌ Something went wrong.");
      }
    });
  }

  // ✅ OTP Verification
  const otpForm = document.getElementById("otp-form");
  if (otpForm) {
    otpForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("otp-email").value.trim();
      const otp = document.getElementById("otp-code").value.trim();

      if (!otp) {
        alert("⚠️ Please enter the OTP.");
        return;
      }

      try {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        });

        const data = await res.json();

        if (res.ok) {
          alert("✅ OTP verified!");
          otpForm.reset();
          switchForm("login-form");
        } else {
          alert(`❌ ${data.message || "Invalid OTP"}`);
        }
      } catch (err) {
        console.error("OTP Verification Error:", err);
        alert("❌ Could not verify OTP.");
      }
    });
  }

  // ✅ Login
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const phone = document.getElementById("login-number").value.trim();
      const password = document.getElementById("login-password").value.trim();

      if (!phone || !password) {
        alert("⚠️ Please enter both phone and password.");
        return;
      }

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, password }),
        });

        const data = await res.json();

        if (res.ok) {
          alert(`✅ Welcome ${data.name || "User"}!`);
          loginForm.reset();

          const coinsElement = document.getElementById("user-coins");
          if (coinsElement) {
            coinsElement.textContent = `${data.coins || 0}`;
          }

          if (data.isAdmin) {
            window.location.href = "/adminDashboard.html";
          } else {
            window.location.href = "/";
          }
        } else {
          alert(`❌ ${data.message || "Login failed."}`);
        }
      } catch (err) {
        console.error("Login Error:", err);
        alert("❌ Network error during login.");
      }
    });
  }

  // 🔑 Forgot Password Flow

  const forgotPasswordLink = document.getElementById("forgot-password-link");
  const fpForm = document.getElementById("forgot-password-form");
  const fpOtpForm = document.getElementById("fp-otp-form");
  const newPasswordForm = document.getElementById("new-password-form");

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", (e) => {
      e.preventDefault();
      switchForm("forgot-password-form");
    });
  }

  // 1️⃣ Request Password Reset OTP
  if (fpForm) {
    fpForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const phone = document.getElementById("fp-phone").value.trim();

      try {
        const res = await fetch("/api/auth/request-password-reset", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        });

        const data = await res.json();

        if (res.ok) {
          alert(`✅ OTP sent to ${data.email}`);
          document.getElementById("fp-email").value = data.email;
          switchForm("fp-otp-form");
        } else {
          alert(`❌ ${data.message}`);
        }
      } catch (err) {
        console.error("Request Password Reset Error:", err);
        alert("❌ Failed to send OTP.");
      }
    });
  }

  // 2️⃣ Verify Reset OTP
  if (fpOtpForm) {
    fpOtpForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("fp-email").value.trim();
      const otp = document.getElementById("fp-otp").value.trim();

      try {
        const res = await fetch("/api/auth/verify-reset-otp", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        });

        const data = await res.json();

        if (res.ok) {
          alert("✅ OTP verified. Now set a new password.");
          document.getElementById("np-email").value = email;
          switchForm("new-password-form");
        } else {
          alert(`❌ ${data.message}`);
        }
      } catch (err) {
        console.error("Verify Reset OTP Error:", err);
        alert("❌ OTP verification failed.");
      }
    });
  }

  // 3️⃣ Reset Password
  if (newPasswordForm) {
    newPasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("np-email").value.trim();
      const newPassword = document.getElementById("new-password").value.trim();

      try {
        const res = await fetch("/api/auth/reset-password", { credentials: "include" }, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, newPassword }),
        });

        const data = await res.json();

        if (res.ok) {
          alert("✅ Password changed successfully. Please login.");
          switchForm("login-form");
        } else {
          alert(`❌ ${data.message}`);
        }
      } catch (err) {
        console.error("Reset Password Error:", err);
        alert("❌ Failed to reset password.");
      }
    });
  }
});
