document.addEventListener("click", (event) => {
  const trigger = event.target.closest(".accordion-trigger");

  if (!trigger) return;

  const contentId = trigger.getAttribute("aria-controls");
  const content = document.getElementById(contentId);

  if (!content) return;

  const isOpen = trigger.getAttribute("aria-expanded") === "true";

  if (isOpen) {
    closeAccordion(trigger, content);
  } else {
    openAccordion(trigger, content);
  }
});

const transitionTokens = new WeakMap();

function beginTransition(content) {
  const token = (transitionTokens.get(content) ?? 0) + 1;
  transitionTokens.set(content, token);
  return token;
}

function isHeightTransitionFor(event, content) {
  return event.target === content && event.propertyName === "height";
}

function openAccordion(trigger, content) {
  const token = beginTransition(content);

  trigger.setAttribute("aria-expanded", "true");

  // The element must not be hidden before measuring or animating.
  content.hidden = false;

  // Start from 0 height.
  content.style.height = "0px";

  // Force browser to notice the starting height.
  content.offsetHeight;

  content.classList.add("open");

  // Animate to real height.
  content.style.height = `${content.scrollHeight}px`;

  content.addEventListener("transitionend", function handleOpen(event) {
    if (!isHeightTransitionFor(event, content)) return;

    content.removeEventListener("transitionend", handleOpen);
    if (transitionTokens.get(content) !== token) return;

    // Key nested-accordion fix:
    // once open, let it size naturally.
    content.style.height = "auto";

    refreshOpenAncestors(content);
  });
}

function closeAccordion(trigger, content) {
  const token = beginTransition(content);

  trigger.setAttribute("aria-expanded", "false");

  // If currently auto, convert to pixel height first so it can animate.
  content.style.height = `${content.scrollHeight}px`;

  // Force browser to apply that pixel height.
  content.offsetHeight;

  content.classList.remove("open");

  // Animate down.
  content.style.height = "0px";

  content.addEventListener("transitionend", function handleClose(event) {
    if (!isHeightTransitionFor(event, content)) return;

    content.removeEventListener("transitionend", handleClose);
    if (transitionTokens.get(content) !== token) return;

    // Now it is safe to actually hide it.
    content.hidden = true;

    refreshOpenAncestors(content);
  });
}

function refreshOpenAncestors(element) {
  let parent = element.parentElement.closest(".accordion-content.open");

  while (parent) {
    if (parent.style.height !== "auto") {
      parent.style.height = `${parent.scrollHeight}px`;
    }

    parent = parent.parentElement.closest(".accordion-content.open");
  }
}
