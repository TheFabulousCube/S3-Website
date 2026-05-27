// Utility for fading out/in cards in a container
export function fadeCardTransition(container, renderFn, duration = 500) {
  const existingCards = container.querySelectorAll(".card");
  if (existingCards.length) {
    existingCards.forEach((card) => card.classList.remove("visible"));
    setTimeout(() => {
      container.innerHTML = "";
      renderFn();
    }, duration);
  } else {
    container.innerHTML = "";
    renderFn();
  }
}
// Utility for verdict-based single-card games
export async function createSingleFlipCard(
  container,
  data,
  verdictKey = "verdict"
) {
  // Fade out existing content first
  const existingCard = container.querySelector(".card");
  if (existingCard) {
    existingCard.classList.remove("visible");
    return new Promise((resolve) => {
      setTimeout(() => {
        container.innerHTML = "";
        resolve(createNewCard());
      }, 500); // Match CSS transition time
    });
  } else {
    container.innerHTML = "";
    return createNewCard();
  }

  function createNewCard() {
    const topicObj = data[Math.floor(Math.random() * data.length)];
    // Get all unique verdicts
    const verdicts = Array.from(new Set(data.map((d) => d[verdictKey])));

    // Card structure
    const card = document.createElement("div");
    card.classList.add("card");
    // Trigger reflow before adding visible class
    void card.offsetWidth;
    requestAnimationFrame(() => card.classList.add("visible"));

    const inner = document.createElement("div");
    inner.classList.add("card-inner");
    let answered = false;

    // Front
    const front = document.createElement("div");
    front.classList.add("card-front");
    const title = document.createElement("h3");
    title.textContent = topicObj.topic;
    const buttonDiv = document.createElement("div");
    buttonDiv.classList.add("choice-buttons");
    // Create a button for each verdict
    verdicts.forEach((verdict) => {
      const btn = document.createElement("button");
      btn.classList.add(
        "guess-btn",
        verdict === verdicts[0] ? "guess-over" : "guess-under"
      );
      btn.textContent = verdict;
      btn.addEventListener("click", (event) => {
        event.stopPropagation();
        handleGuess(verdict);
      });
      buttonDiv.appendChild(btn);
    });
    front.append(title, buttonDiv);

    // Back
    const back = document.createElement("div");
    back.classList.add("card-back");
    const verdictEl = document.createElement("h3");
    verdictEl.id = "verdict";
    const description = document.createElement("p");
    description.id = "description";
    back.append(verdictEl, description);

    inner.append(front, back);
    card.appendChild(inner);
    container.appendChild(card);
    card.addEventListener("click", () => {
      if (!answered) return;
      toggleCardFlip(card);
    });

    function handleGuess(guess) {
      if (answered) return;
      answered = true;
      verdictEl.textContent = topicObj[verdictKey];
      description.textContent = topicObj.note;
      back.classList.remove("true", "false");
      if (guess === topicObj[verdictKey]) {
        back.classList.add("true");
      } else {
        back.classList.add("false");
      }
      // Use centralized flip helper so flip direction can be randomized
      flipCard(card, true);
    }
  }
}

// Card flip directions as an enum
export const FlipDirection = {
  UP: "up",
  DOWN: "down",
  LEFT: "left",
  RIGHT: "right",
};

// Duration for each step of a two-step flip
const STEP_DURATION = 600; // ms

// Helper to get a random direction
function getRandomDirection() {
  const directions = Object.values(FlipDirection);
  return directions[Math.floor(Math.random() * directions.length)];
}

// Execute a flip in two steps for vertical flips
function executeFlip(inner, direction) {
  return new Promise((resolve) => {
    switch (direction) {
      case FlipDirection.UP:
        inner.style.transform = "rotateX(-180deg)";
        setTimeout(() => {
          inner.style.transform = "rotateX(-180deg) rotateZ(-180deg)";
          resolve();
        }, STEP_DURATION);
        break;
      case FlipDirection.DOWN:
        inner.style.transform = "rotateX(180deg)";
        setTimeout(() => {
          inner.style.transform = "rotateX(180deg) rotateZ(180deg)";
          resolve();
        }, STEP_DURATION);
        break;
      case FlipDirection.LEFT:
        inner.style.transform = "rotateY(-180deg)";
        resolve();
        break;
      case FlipDirection.RIGHT:
        inner.style.transform = "rotateY(180deg)";
        resolve();
        break;
    }
  });
}

// Main flip helper function
export async function flipCard(card, flip = true, direction = null) {
  const inner = card.querySelector(".card-inner");
  if (!inner) return;

  if (flip) {
    const chosenDirection = direction || getRandomDirection();
    card.classList.add("flipped");
    await executeFlip(inner, chosenDirection);
  } else {
    inner.style.transform = "";
    card.classList.remove("flipped");
  }
}

export function toggleCardFlip(card) {
  flipCard(card, !card.classList.contains("flipped"));
}
