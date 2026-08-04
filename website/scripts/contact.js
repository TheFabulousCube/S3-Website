// Contact form submission handler
document.addEventListener("DOMContentLoaded", function () {
  const contactForm = document.getElementById("contact-form");
  const responseMessage = document.getElementById("responseMessage");
  const submitBtn = document.getElementById("submitBtn");

  const API_ENDPOINT =
    "https://r4pgr1w0j0.execute-api.us-east-1.amazonaws.com/prod/contact";
  const API_KEY = "XNQdPROKzb7tWEMb6aKTz2SqQIB5IfxJ4lY2FTyH";

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

  contactForm.addEventListener("submit", async function (e) {
    e.preventDefault(); // Prevent default form submission

    const formData = {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
	  subject: document.getElementById("subject").value,
      message: document.getElementById("message").value,
      screenResolution: window.screen.width + "x" + window.screen.height,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      device: isMobile ? "mobile" : "desktop",
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    responseMessage.style.display = "none";

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": API_KEY,
        },
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
