// Flip-card toggle logic (click/tap/keyboard only)
document.addEventListener("DOMContentLoaded", () => {
  const isInteractive = (el) =>
    !!el &&
    !!el.closest &&
    !!el.closest("a, button, input, textarea, select, label");

  // --- Flip cards: click/tap/keyboard toggle ---
  document.addEventListener("click", (ev) => {
    const card = ev.target.closest(".flip-card");
    if (!card) return;
    if (isInteractive(ev.target)) return; // allow links/buttons inside card to work
    card.classList.toggle("is-flipped");
    card.setAttribute(
      "aria-pressed",
      String(card.classList.contains("is-flipped"))
    );
    ev.preventDefault();
  });

  document.addEventListener("keydown", (ev) => {
    const card = ev.target.closest && ev.target.closest(".flip-card");
    if (!card) return;
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      card.classList.toggle("is-flipped");
      card.setAttribute(
        "aria-pressed",
        String(card.classList.contains("is-flipped"))
      );
    } else if (ev.key === "Escape") {
      card.classList.remove("is-flipped");
      card.setAttribute("aria-pressed", "false");
    }
  });

  // Close flipped cards when clicking/tapping outside
  document.addEventListener("click", (ev) => {
    if (ev.target.closest(".flip-card")) return; // internal clicks handled above
    document.querySelectorAll(".flip-card.is-flipped").forEach((c) => {
      c.classList.remove("is-flipped");
      c.setAttribute("aria-pressed", "false");
    });
  });
});
