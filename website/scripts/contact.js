// Contact form submission handler
document.addEventListener("DOMContentLoaded", async function () {
  const contactForm = document.getElementById("contact-form");
  const responseMessage = document.getElementById("responseMessage");
  const submitBtn = document.getElementById("submitBtn");
  const contactConfig = await loadContactConfig();

  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  document.getElementById("screen_resolution").value =
    window.screen.width + "x" + window.screen.height;
  document.getElementById("timezone").value =
    Intl.DateTimeFormat().resolvedOptions().timeZone;
  document.getElementById("device_type").value = isMobile
    ? "mobile"
    : "desktop";

  if (!contactConfig.endpoint) {
    submitBtn.disabled = true;
    responseMessage.className = "response-message error";
    responseMessage.innerHTML = `
      <p><strong>Contact form unavailable</strong></p>
      <p>The contact service configuration has not been published yet.</p>
    `;
    responseMessage.style.display = "block";
    return;
  }

  contactForm.addEventListener("submit", async function (e) {
    e.preventDefault(); // Prevent default form submission

    const formData = {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      message: document.getElementById("message").value,
      screenResolution: window.screen.width + "x" + window.screen.height,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      device: isMobile ? "mobile" : "desktop",
      environment: "s3 hosted",
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    responseMessage.style.display = "none";

    try {
      const headers = {
        "Content-Type": "application/json",
      };

      if (contactConfig.apiKey) {
        headers["X-Api-Key"] = contactConfig.apiKey;
      }

      const response = await fetch(contactConfig.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        responseMessage.className = "response-message success";
        responseMessage.innerHTML = `
          <p><strong>Success!</strong></p>
          <p>Thank you for your message. I'll get back to you soon!</p>
        `;

        contactForm.reset();
      } else if (response.status === 429) {
        responseMessage.className = "response-message error";
        responseMessage.innerHTML = `
          <p><strong>Whoa, too much!</strong></p>
          <p>I think that's enough for one day, I'll get back to you when I can</p>
        `;
      } else {
        responseMessage.className = "response-message error";
        responseMessage.innerHTML = `
          <p><strong>Dang.</strong></p>
          <p>${data.message || "Something went wrong. Please try again."}</p>
        `;
      }
    } catch (error) {
      responseMessage.className = "response-message error";
      responseMessage.innerHTML = `
        <p><strong>Error</strong></p>
        <p>Failed to send message. Please check your connection and try again.</p>
      `;
      console.error("Form submission error:", error);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send";
      responseMessage.style.display = "block";

      if (responseMessage.classList.contains("success")) {
        setTimeout(() => {
          responseMessage.style.display = "none";
        }, 5000);
      }
    }
  });
});

async function loadContactConfig() {
  try {
    const response = await fetch("/config/contact.json", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Config request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Contact config load error:", error);
    return {};
  }
}
