import { createSingleFlipCard, toggleCardFlip } from "./flip-card.js";
import { goodbadData } from "./data/good-bad-data.js";

// Game initialization
export function initializeGoodBad() {
  const goodbadContainer = document.getElementById("goodbad-container");
  const nextGB = document.getElementById("next-gb");

  async function renderGBTopic() {
    await createSingleFlipCard(goodbadContainer, goodbadData);
  }

  renderGBTopic();
  nextGB.addEventListener("click", renderGBTopic);
}
