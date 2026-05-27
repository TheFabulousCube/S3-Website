import { wouldISayData } from "./data/would-i-say-data.js";
import { fadeCardTransition, flipCard, toggleCardFlip } from "./flip-card.js";

const VERDICTS = ["Would Say", "Wouldn't Say"];

export function initializeWouldISay() {
  const container = document.getElementById("wouldisay-container");
  const nextButton = document.getElementById("next-wis");

  if (!container || !nextButton) return;

  function renderSaying() {
    const saying = wouldISayData[Math.floor(Math.random() * wouldISayData.length)];
    let answered = false;

    const card = document.createElement("div");
    card.classList.add("card", "visible");

    const inner = document.createElement("div");
    inner.classList.add("card-inner");

    const front = document.createElement("div");
    front.classList.add("card-front");

    const title = document.createElement("h3");
    title.textContent = saying.saying;

    const buttonGroup = document.createElement("div");
    buttonGroup.classList.add("choice-buttons");

    VERDICTS.forEach((verdict, index) => {
      const button = document.createElement("button");
      button.classList.add("guess-btn", index === 0 ? "guess-over" : "guess-under");
      button.type = "button";
      button.textContent = verdict;
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        if (answered) return;
        answered = true;
        handleGuess(verdict);
      });
      buttonGroup.appendChild(button);
    });

    front.append(title, buttonGroup);

    const back = document.createElement("div");
    back.classList.add("card-back");

    const verdict = document.createElement("h3");
    verdict.textContent = saying.verdict;

    const response = document.createElement("p");
    response.textContent = saying.response;

    back.append(verdict, response);
    inner.append(front, back);
    card.appendChild(inner);
    container.appendChild(card);
    card.addEventListener("click", () => {
      if (!answered) return;
      toggleCardFlip(card);
    });

    function handleGuess(guess) {
      back.classList.add(guess === saying.verdict ? "true" : "false");
      flipCard(card, true, "left");
    }
  }

  function renderWithFade() {
    fadeCardTransition(container, renderSaying);
  }

  renderWithFade();
  nextButton.addEventListener("click", renderWithFade);
}
