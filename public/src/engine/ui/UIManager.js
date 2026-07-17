// DOM-based UI overlay controller: dialogue box, HUD, proximity hints, and the
// loading screen. The engine manipulates only element IDs and text — all
// styling lives in CSS, so the game can be re-themed without touching JS.

export class UIManager {
  constructor(ids = {}) {
    const $ = (id) => document.getElementById(id);
    this.loadingEl = $(ids.loading ?? 'loading');
    this.loadingBar = $(ids.loadingBar ?? 'loading-bar');
    this.loadingText = $(ids.loadingText ?? 'loading-text');
    this.hudEl = $(ids.hud ?? 'hud');
    this.hudTitle = $(ids.hudTitle ?? 'hud-title');
    this.hudLocation = $(ids.hudLocation ?? 'hud-location');
    this.hudWallet = $(ids.hudWallet ?? 'hud-wallet');
    this.hintEl = $(ids.hint ?? 'hint');
    this.dialogueEl = $(ids.dialogue ?? 'dialogue');
    this.dialogueName = $(ids.dialogueName ?? 'dialogue-name');
    this.dialogueText = $(ids.dialogueText ?? 'dialogue-text');

    this._lines = [];
    this._lineIndex = 0;
    this._onClose = null;
  }

  // ---- Loading -----------------------------------------------------------

  setLoadingProgress(p) {
    if (this.loadingBar) this.loadingBar.style.width = `${Math.round(p * 100)}%`;
  }

  setLoadingError(message) {
    if (this.loadingText) this.loadingText.textContent = message;
  }

  hideLoading() {
    this.loadingEl?.classList.add('hidden');
  }

  // ---- HUD ---------------------------------------------------------------

  showHUD() {
    this.hudEl?.classList.remove('hidden');
  }

  setTitle(t) {
    if (this.hudTitle) this.hudTitle.textContent = t;
  }

  setLocation(t) {
    if (this.hudLocation) this.hudLocation.textContent = t;
  }

  setWallet(t) {
    if (this.hudWallet) this.hudWallet.textContent = t;
  }

  // ---- Proximity hint ------------------------------------------------------

  showHint(text) {
    if (!this.hintEl) return;
    this.hintEl.textContent = text;
    this.hintEl.classList.remove('hidden');
  }

  hideHint() {
    this.hintEl?.classList.add('hidden');
  }

  // ---- Dialogue ------------------------------------------------------------

  get dialogueOpen() {
    return this._lines.length > 0;
  }

  openDialogue(name, lines, onClose = null) {
    if (!this.dialogueEl || lines.length === 0) return;
    this._lines = lines;
    this._lineIndex = 0;
    this._onClose = onClose;
    this.dialogueName.textContent = name;
    this.dialogueText.textContent = lines[0];
    this.dialogueEl.classList.remove('hidden');
    this.hideHint();
  }

  /** Advance one line. Returns true while the conversation continues. */
  advanceDialogue() {
    this._lineIndex += 1;
    if (this._lineIndex >= this._lines.length) {
      this.closeDialogue();
      return false;
    }
    this.dialogueText.textContent = this._lines[this._lineIndex];
    return true;
  }

  closeDialogue() {
    this._lines = [];
    this._lineIndex = 0;
    this.dialogueEl?.classList.add('hidden');
    const cb = this._onClose;
    this._onClose = null;
    if (cb) cb();
  }
}
