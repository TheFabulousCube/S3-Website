// Main games initialization
import { initializePillMenu } from "../pill-menu.js";
import { initializeTwoTruths } from "./two-truths.js";
import { initializeOverratedUnderrated } from "./overrated-underrated.js";
import { initializeWouldISay } from "./would-i-say.js";
import { initializeWouldYouRather } from "./would-you-rather.js";

document.addEventListener("DOMContentLoaded", () => {
  initializeTwoTruths();
  initializeOverratedUnderrated();
  initializeWouldISay();
  initializeWouldYouRather();

  initializePillMenu();
});
