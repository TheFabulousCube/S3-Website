import { wouldYouData } from "./data/would-you-rather-data.js";
import { fadeCardTransition, flipCard, toggleCardFlip } from "./flip-card.js";

export function initializeWouldYouRather() {
  const wouldYouContainer = document.getElementById("wouldyou-container");
  const nextWYR = document.getElementById("next-wyr");

  if (!wouldYouContainer || !nextWYR) return;

  function renderWouldYouRather() {
    const round = wouldYouData[Math.floor(Math.random() * wouldYouData.length)];
    let answered = false;

    const cards = ["left", "right"].map((side) =>
      createChoiceCard(round, side, () => handleChoice(side)),
    );

    wouldYouContainer.append(...cards);

    function handleChoice(selectedSide) {
      if (answered) {
        toggleRound(cards);
        return;
      }
      answered = true;

      cards.forEach((card) => {
        const side = card.dataset.side;
        const back = card.querySelector(".card-back");
        const isPreferred = side === round.preferred;

        card.classList.add("answered");
        card.setAttribute("aria-disabled", "true");
        back.classList.add(isPreferred ? "true" : "false");
        flipCard(card, true, side === "left" ? "left" : "right");
      });

      wouldYouContainer.dataset.guessedCorrectly =
        selectedSide === round.preferred ? "true" : "false";
    }
  }

  function renderWithFade() {
    fadeCardTransition(wouldYouContainer, renderWouldYouRather);
  }

  renderWithFade();
  nextWYR.addEventListener("click", renderWithFade);
}

function createChoiceCard(round, side, onChoose) {
  const option = round[side];
  const isPreferred = side === round.preferred;

  const card = document.createElement("div");
  card.classList.add("card", "wyr-card", "visible");
  card.dataset.side = side;
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.setAttribute("aria-label", `Choose ${option.text}`);

  const inner = document.createElement("div");
  inner.classList.add("card-inner");

  const front = document.createElement("div");
  front.classList.add("card-front");

  const title = document.createElement("h3");
  title.textContent = option.text;

  front.appendChild(title);

  const back = document.createElement("div");
  back.classList.add("card-back");

  const verdict = document.createElement("h3");
  verdict.textContent = isPreferred ? "My Pick" : "Not My Pick";

  const explanation = document.createElement("p");
  explanation.textContent = option.explanation;

  back.append(verdict, explanation);
  inner.append(front, back);
  card.appendChild(inner);

  card.addEventListener("click", onChoose);
  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onChoose();
  });

  return card;
}

function toggleRound(cards) {
  const shouldFlipToBack = cards.some((card) => !card.classList.contains("flipped"));
  cards.forEach((card) => {
    if (card.classList.contains("flipped") !== shouldFlipToBack) {
      toggleCardFlip(card);
    }
  });
}
