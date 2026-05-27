// Game data
import { truths } from "./data/two-truths-data.js";
import { fadeCardTransition, toggleCardFlip } from "./flip-card.js";

// Game initialization
export function initializeTwoTruths() {
  const truthsContainer = document.getElementById("truths-container");
  const nextTruths = document.getElementById("next-truths");

  function renderTruths() {
    const truthsOnly = truths.filter((t) => t.truth);
    const liesOnly = truths.filter((t) => !t.truth);
    const selectedTruths = [];
    let truthsPool = [...truthsOnly];
    while (selectedTruths.length < 2 && truthsPool.length) {
      const idx = Math.floor(Math.random() * truthsPool.length);
      selectedTruths.push(truthsPool.splice(idx, 1)[0]);
    }
    let selectedLie = null;
    if (liesOnly.length) {
      selectedLie = liesOnly[Math.floor(Math.random() * liesOnly.length)];
    }
    // Combine and shuffle
    let selection = [...selectedTruths, selectedLie].filter(Boolean);
    for (let i = selection.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [selection[i], selection[j]] = [selection[j], selection[i]];
    }
    selection.forEach((item) => {
      const card = document.createElement("div");
      card.classList.add("card", "visible");
      const inner = document.createElement("div");
      inner.classList.add("card-inner");
      const front = document.createElement("div");
      front.classList.add("card-front");
      const title = document.createElement("h3");
      title.textContent = item.text;
      front.appendChild(title);
      const back = document.createElement("div");
      back.classList.add("card-back", item.truth ? "true" : "false");
      const p = document.createElement("p");
      p.textContent = item.detail;
      back.appendChild(p);
      inner.append(front, back);
      card.appendChild(inner);
      card.addEventListener("click", () => toggleCardFlip(card));
      truthsContainer.appendChild(card);
    });
  }

  function renderTruthsWithFade() {
    fadeCardTransition(truthsContainer, renderTruths);
  }

  renderTruthsWithFade();
  nextTruths.addEventListener("click", renderTruthsWithFade);
}
