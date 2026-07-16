class MickeyPromoPopup extends HTMLElement {
  connectedCallback() {
    this.enabled = this.getAttribute("enabled") !== "false";
    this.delay = Number(this.getAttribute("delay-seconds") || 5) * 1000;
    this.flyer = this.getAttribute("flyer") || "";
    this.titleText = this.getAttribute("popup-title") || "Upcoming Event";
    this.message = this.getAttribute("message") || "";
    this.buttonText = this.getAttribute("button-text") || "View Event";
    this.buttonLink = this.getAttribute("button-link") || "#";
    this.countdownDate = this.getAttribute("countdown-date") || "";
    this.storageKey = this.getAttribute("storage-key") || "mm-promo-popup";
    this.showOnce = this.getAttribute("show-once") === "true";
    this.showCheckbox = this.getAttribute("show-dismiss-option") !== "false";

    if (!this.enabled) return;

    if (this.showOnce && localStorage.getItem(this.storageKey) === "dismissed") {
      return;
    }

    this.innerHTML = `
      <div class="mm-popup-overlay" hidden>
        <section class="mm-popup-card" role="dialog" aria-modal="true" aria-labelledby="mm-popup-title">
          <button class="mm-popup-close" type="button" aria-label="Close popup">×</button>

          <div class="mm-popup-media">
            ${
              this.flyer
                ? `<img src="${this.escapeAttr(this.flyer)}" alt="${this.escapeAttr(this.titleText)} flyer">`
                : `<div class="mm-popup-placeholder"><span>8</span></div>`
            }
          </div>

          <div class="mm-popup-content">
            <p class="mm-popup-kicker">Mickey Milligans Billiards</p>
            <h2 id="mm-popup-title">${this.escapeHTML(this.titleText)}</h2>

            ${
              this.message
                ? `<p class="mm-popup-message">${this.escapeHTML(this.message)}</p>`
                : ""
            }

            ${
              this.countdownDate
                ? `
                  <div class="mm-popup-countdown" aria-label="Event countdown">
                    <div><strong data-days>00</strong><span>Days</span></div>
                    <div><strong data-hours>00</strong><span>Hours</span></div>
                    <div><strong data-minutes>00</strong><span>Minutes</span></div>
                    <div><strong data-seconds>00</strong><span>Seconds</span></div>
                  </div>
                `
                : ""
            }

            <div class="mm-popup-actions">
              ${
                this.buttonLink && this.buttonLink !== "#"
                  ? `<a class="mm-popup-button" href="${this.escapeAttr(this.buttonLink)}">${this.escapeHTML(this.buttonText)}</a>`
                  : ""
              }
              <button class="mm-popup-secondary" type="button">Close</button>
            </div>

            ${
              this.showCheckbox
                ? `
                  <label class="mm-popup-dismiss">
                    <input type="checkbox">
                    <span>Don’t show this again on this device</span>
                  </label>
                `
                : ""
            }
          </div>
        </section>
      </div>
    `;

    this.overlay = this.querySelector(".mm-popup-overlay");
    this.card = this.querySelector(".mm-popup-card");
    this.dismissCheckbox = this.querySelector(".mm-popup-dismiss input");

    this.querySelector(".mm-popup-close").addEventListener("click", () => this.closePopup());
    this.querySelector(".mm-popup-secondary").addEventListener("click", () => this.closePopup());

    this.overlay.addEventListener("click", event => {
      if (event.target === this.overlay) this.closePopup();
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !this.overlay.hidden) this.closePopup();
    });

    if (this.countdownDate) this.startCountdown();

    this.timer = window.setTimeout(() => this.openPopup(), this.delay);
  }

  openPopup() {
    if (!this.overlay) return;
    this.overlay.hidden = false;
    document.body.classList.add("mm-popup-open");
    this.querySelector(".mm-popup-close").focus();
  }

  closePopup() {
    if (!this.overlay) return;

    if (this.dismissCheckbox?.checked || this.showOnce) {
      localStorage.setItem(this.storageKey, "dismissed");
    }

    this.overlay.hidden = true;
    document.body.classList.remove("mm-popup-open");
  }

  startCountdown() {
    const target = new Date(this.countdownDate).getTime();

    const update = () => {
      const difference = target - Date.now();

      if (difference <= 0) {
        this.setCountdown(0, 0, 0, 0);
        clearInterval(this.countdownInterval);
        return;
      }

      const days = Math.floor(difference / 86400000);
      const hours = Math.floor((difference % 86400000) / 3600000);
      const minutes = Math.floor((difference % 3600000) / 60000);
      const seconds = Math.floor((difference % 60000) / 1000);

      this.setCountdown(days, hours, minutes, seconds);
    };

    update();
    this.countdownInterval = window.setInterval(update, 1000);
  }

  setCountdown(days, hours, minutes, seconds) {
    this.querySelector("[data-days]").textContent = String(days).padStart(2, "0");
    this.querySelector("[data-hours]").textContent = String(hours).padStart(2, "0");
    this.querySelector("[data-minutes]").textContent = String(minutes).padStart(2, "0");
    this.querySelector("[data-seconds]").textContent = String(seconds).padStart(2, "0");
  }

  escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  escapeAttr(value) {
    return this.escapeHTML(value);
  }
}

if (!customElements.get("mickey-promo-popup")) {
  customElements.define("mickey-promo-popup", MickeyPromoPopup);
}
