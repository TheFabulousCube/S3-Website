import { createSingleFlipCard, toggleCardFlip } from "./flip-card.js";
import { ouTopics } from "./data/overrated-underrated-data.js";

// Game initialization
export function initializeOverratedUnderrated() {
  const ouContainer = document.getElementById("ou-container");
  const nextOU = document.getElementById("next-ou");

  async function renderOUTopic() {
    await createSingleFlipCard(ouContainer, ouTopics);
  }

  renderOUTopic();
  nextOU.addEventListener("click", renderOUTopic);
}
