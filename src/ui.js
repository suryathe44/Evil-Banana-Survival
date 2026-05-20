import { LANG, getLanguage, onLanguageChange, setLanguage, t } from "./language.js";

export class UIManager {
  constructor() {
    this.startMenu = document.querySelector("#startMenu");
    this.pointerOverlay = document.querySelector("#pointerOverlay");
    this.playButton = document.querySelector("#playButton");
    this.languageButtons = document.querySelector("#languageButtons");
    this.hud = document.querySelector("#hud");
    this.scoreText = document.querySelector("#scoreText");
    this.languageText = document.querySelector("#languageText");
    this.warningText = document.querySelector("#warningText");
    this.muteButton = document.querySelector("#muteButton");
    this.staminaLabel = document.querySelector("#staminaLabel");
    this.staminaFill = document.querySelector("#staminaFill");
    this.interactionPrompt = document.querySelector("#interactionPrompt");
    this.redFlash = document.querySelector("#redFlash");
    this.jumpscareText = document.querySelector("#jumpscareText");
    this.menuEyebrow = document.querySelector("#menuEyebrow");
    this.menuTitle = document.querySelector("#menuTitle");
    this.menuObjective = document.querySelector("#menuObjective");

    this.score = 0;
    this.proximity = Infinity;
    this.isMuted = false;
    this.muteHandler = null;
    this.muteButton.addEventListener("click", () => {
      this.setMuted(!this.isMuted);
      this.muteHandler?.(this.isMuted);
    });
    this.createLanguageButtons();
    onLanguageChange(() => this.updateAll());
    this.updateAll();
  }

  createLanguageButtons() {
    Object.entries(LANG).forEach(([language, copy]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.language = language;
      button.textContent = copy.code;
      button.addEventListener("click", () => setLanguage(language));
      this.languageButtons.append(button);
    });
  }

  showStartMenu(isVisible) {
    this.startMenu.hidden = !isVisible;
    this.hud.hidden = isVisible;
    this.pointerOverlay.hidden = true;
  }

  showPointerOverlay(isVisible) {
    this.pointerOverlay.hidden = !isVisible;
  }

  setScore(score) {
    this.score = score;
    this.updateHud();
  }

  setProximity(distance) {
    this.proximity = distance;
    this.updateHud();
  }

  setStamina(value) {
    this.staminaFill.style.transform = `scaleX(${Math.max(0, Math.min(1, value))})`;
  }

  setMuteHandler(handler) {
    this.muteHandler = handler;
  }

  setMuted(isMuted) {
    this.isMuted = isMuted;
    this.updateHud();
  }

  showInteraction(jokeIndex) {
    const jokes = t("jokes");
    this.interactionPrompt.textContent = `${t("prompt")} - ${jokes[jokeIndex % jokes.length]}`;
    this.interactionPrompt.classList.add("is-visible");
  }

  hideInteraction() {
    this.interactionPrompt.classList.remove("is-visible");
  }

  triggerJumpscare() {
    this.redFlash.classList.remove("is-active");
    this.jumpscareText.classList.remove("is-active");
    void this.redFlash.offsetWidth;
    this.jumpscareText.textContent = t("slipped");
    this.redFlash.classList.add("is-active");
    this.jumpscareText.classList.add("is-active");
  }

  updateAll() {
    this.menuEyebrow.textContent = t("menuEyebrow");
    this.menuTitle.textContent = t("title");
    this.menuObjective.textContent = t("objective");
    this.playButton.textContent = t("play");
    this.pointerOverlay.textContent = t("start");
    this.staminaLabel.textContent = t("stamina");

    this.languageButtons.querySelectorAll("button").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.language === getLanguage()));
    });
    this.updateHud();
  }

  updateHud() {
    this.scoreText.textContent = `${t("score")}: ${this.score}`;
    this.languageText.textContent = `${t("language")}: ${LANG[getLanguage()].code}`;
    this.warningText.textContent = this.getWarningText();
    this.muteButton.textContent = this.isMuted ? t("unmute") : t("mute");
  }

  getWarningText() {
    if (this.proximity < 5) return t("warningDanger");
    if (this.proximity < 12) return t("warningNear");
    return t("warningSafe");
  }
}
