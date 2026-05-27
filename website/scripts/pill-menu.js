// Pill menu navigation handler
export function initializePillMenu() {
  const pills = document.querySelectorAll(".pill");

  const extraSpaceFor = (el) => (el && el.id === "game-truths" ? 50 : 0);

  document.querySelectorAll(".game-section").forEach((section) => {
    const extra = extraSpaceFor(section);
    section.style.setProperty("--height", `${section.scrollHeight + extra}px`);

    if (
      section.hasAttribute("hidden") ||
      section.classList.contains("hidden")
    ) {
      section.classList.remove("open");
      section.style.opacity = "0";
    } else {
      section.classList.add("open");
      section.style.opacity = "1";
    }
  });

  // Click handlers
  pills.forEach((pill) => {
    if (pill.classList.contains("disabled")) return;
    const targetId = `game-${pill.dataset.target}`;
    const target = document.getElementById(targetId);
    if (!target) return;

    pill.addEventListener("click", () => {
      const currentlyOpen = document.querySelector(".game-section.open");

      if (currentlyOpen && currentlyOpen !== target) {
        collapseSection(currentlyOpen);
      }

      const isHidden =
        target.hasAttribute("hidden") || target.classList.contains("hidden");
      if (isHidden) {
        openSection(target);
      } else if (target.classList.contains("open")) {
        collapseSection(target);
      } else {
        openSection(target);
      }
    });
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      document.querySelectorAll(".game-section.open").forEach((s) => {
        s.style.setProperty(
          "--height",
          `${s.scrollHeight + extraSpaceFor(s)}px`,
        );
      });
    }, 120);
  });

  function openSection(section) {
    cancelCollapse(section);
    section.hidden = false;
    section.classList.remove("hidden");
    section.dataset.pillState = "opening";

    const extra = extraSpaceFor(section);
    requestAnimationFrame(() => {
      section.style.setProperty(
        "--height",
        `${section.scrollHeight + extra}px`,
      );
      section.classList.add("open");
      section.style.opacity = "1";
      section.dataset.pillState = "open";
    });
  }

  function collapseSection(section) {
    cancelCollapse(section);
    section.dataset.pillState = "closing";
    section.style.setProperty("--height", "0px");
    section.classList.remove("open");

    const onEnd = (e) => {
      if (e.propertyName !== "max-height") return;
      cancelCollapse(section);
      if (section.classList.contains("open")) return;
      section.classList.add("hidden");
      section.hidden = true;
      section.dataset.pillState = "closed";
    };

    section._collapseEndHandler = onEnd;
    section.addEventListener("transitionend", onEnd);
  }

  function cancelCollapse(section) {
    if (!section._collapseEndHandler) return;
    section.removeEventListener("transitionend", section._collapseEndHandler);
    section._collapseEndHandler = null;
  }
}
