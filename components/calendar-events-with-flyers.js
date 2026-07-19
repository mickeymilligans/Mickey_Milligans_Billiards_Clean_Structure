class MickeyCalendarEvents extends HTMLElement {
  async connectedCallback() {
    this.apiKey = this.getAttribute("api-key") || "";
    this.calendarId = this.getAttribute("calendar-id") || "";
    this.maxResults = Number(this.getAttribute("max-results") || 30);
    this.defaultImage = this.getAttribute("default-image") || "";
    this.timeZone = this.getAttribute("timezone") || "America/New_York";

    this.innerHTML = `
      <section class="mm-events-component">
        <div class="mm-events-heading">
          <p class="mm-events-kicker">Upcoming at Mickey Milligans</p>
          <h2>Events & Tournaments</h2>
          <div class="mm-events-rule"></div>
          <p>
            View upcoming tournaments, league nights, poker events,
            benefits, and weekly specials.
          </p>
        </div>

        <div class="mm-events-status" role="status" aria-live="polite">
          Loading upcoming events…
        </div>

        <div class="mm-events-grid"></div>
      </section>

      <dialog class="mm-event-modal">
        <div class="mm-modal-card">
          <button class="mm-modal-close" type="button" aria-label="Close">×</button>
          <img class="mm-modal-image" alt="">
          <div class="mm-modal-content"></div>
        </div>
      </dialog>
    `;

    this.grid = this.querySelector(".mm-events-grid");
    this.status = this.querySelector(".mm-events-status");
    this.modal = this.querySelector(".mm-event-modal");

    this.querySelector(".mm-modal-close").addEventListener("click", () => {
      this.modal.close();
    });

    this.modal.addEventListener("click", event => {
      if (event.target === this.modal) this.modal.close();
    });

    if (!this.apiKey || !this.calendarId) {
      this.showSetupMessage();
      return;
    }

    await this.loadEvents();
  }

  async loadEvents() {
    const now = new Date().toISOString();
    const calendar = encodeURIComponent(this.calendarId);

    const params = new URLSearchParams({
      key: this.apiKey,
      timeMin: now,
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: String(this.maxResults),
      timeZone: this.timeZone
    });

    const url =
      `https://www.googleapis.com/calendar/v3/calendars/${calendar}/events?${params}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        throw new Error(details?.error?.message || `Google Calendar error ${response.status}`);
      }

      const data = await response.json();
      const events = (data.items || []).filter(event => event.status !== "cancelled");

      this.renderEvents(events);
    } catch (error) {
      console.error(error);
      this.status.innerHTML = `
        <strong>The event calendar could not be loaded.</strong>
        <span>${this.escapeHTML(error.message)}</span>
      `;
      this.status.className = "mm-events-status is-error";
    }
  }

  renderEvents(events) {
    if (!events.length) {
      this.status.textContent = "No upcoming events have been posted.";
      this.status.className = "mm-events-status";
      this.grid.innerHTML = "";
      return;
    }

    this.status.hidden = true;
    this.grid.innerHTML = "";

    events.forEach(event => {
      const details = this.parseDescription(event.description || "");
      const flyerUrl = details.flyer || this.defaultImage;
      const start = this.getStartDate(event);
      const end = this.getEndDate(event);
      const eventType = details.type || this.guessEventType(event.summary || "");
      const location = event.location || details.location || "";

      const card = document.createElement("article");
      card.className = "mm-event-card";

      card.innerHTML = `
        <button type="button" class="mm-event-card-button">
          <div class="mm-event-image-wrap">
            ${
              flyerUrl
                ? `<img class="mm-event-image" src="${this.escapeAttribute(flyerUrl)}"
                     alt="${this.escapeAttribute(event.summary || "Event flyer")}"
                     loading="lazy">`
                : `<div class="mm-event-placeholder"><span>8</span></div>`
            }
            <span class="mm-event-category">${this.escapeHTML(eventType)}</span>
          </div>

          <div class="mm-event-card-content">
            <div class="mm-event-date-box">
              <span>${start.toLocaleDateString("en-US", { month: "short" })}</span>
              <strong>${start.getDate()}</strong>
            </div>

            <div class="mm-event-summary">
              <h3>${this.escapeHTML(event.summary || "Mickey Milligans Event")}</h3>
              <p class="mm-event-time">${this.formatDateTime(start, end, event.start?.date)}</p>
              ${location ? `<p class="mm-event-location">${this.escapeHTML(location)}</p>` : ""}
              ${details.cleanDescription
                ? `<p class="mm-event-description">${this.escapeHTML(details.cleanDescription)}</p>`
                : ""}
              <span class="mm-event-more">View event details</span>
            </div>
          </div>
        </button>
      `;

      const image = card.querySelector(".mm-event-image");
      if (image) {
        image.addEventListener("error", () => {
          image.replaceWith(this.createPlaceholder());
        });
      }

      card.querySelector(".mm-event-card-button").addEventListener("click", () => {
        this.openModal({
          event,
          flyerUrl,
          start,
          end,
          eventType,
          location,
          description: details.cleanDescription
        });
      });

      this.grid.appendChild(card);
    });
  }

  openModal({ event, flyerUrl, start, end, eventType, location, description }) {
    const image = this.querySelector(".mm-modal-image");

    if (flyerUrl) {
      image.src = flyerUrl;
      image.alt = event.summary || "Event flyer";
      image.hidden = false;
    } else {
      image.removeAttribute("src");
      image.hidden = true;
    }

    image.onerror = () => {
      image.hidden = true;
    };

    const googleLink = event.htmlLink
      ? `<a class="mm-google-event-link" href="${this.escapeAttribute(event.htmlLink)}"
            target="_blank" rel="noopener">View in Google Calendar</a>`
      : "";

    this.querySelector(".mm-modal-content").innerHTML = `
      <p class="mm-modal-category">${this.escapeHTML(eventType)}</p>
      <h3>${this.escapeHTML(event.summary || "Mickey Milligans Event")}</h3>
      <p><strong>Date and time:</strong><br>${this.formatDateTime(start, end, event.start?.date)}</p>
      ${location ? `<p><strong>Location:</strong><br>${this.escapeHTML(location)}</p>` : ""}
      ${description ? `<p class="mm-modal-description">${this.escapeHTML(description)}</p>` : ""}
      ${googleLink}
    `;

    this.modal.showModal();
  }

  parseDescription(description) {
    const container = document.createElement("div");
    container.innerHTML = description;
    container.querySelectorAll("a").forEach(link => {
      link.replaceWith(link.href);
    });

    const plainDescription = container.textContent ||
    container.innerText || "";

    const lines = plainDescription.split(/\r?\n/);
    
    let flyer = "";
    let type = "";
    let location = "";
    const cleanLines = [];

    lines.forEach(line => {
      const trimmedLine = line.trim();
      const flyerMatch = trimmedLine.match(/^(?:FLYER|IMAGE|FLYER URL)\s*:\s*(https?:\/\/\S+)/i);
      const typeMatch = trimmedLine.match(/^TYPE\s*:\s*(.+)$/i);
      const locationMatch = trimmedLine.match(/^LOCATION\s*:\s*(.+)$/i);

      if (flyerMatch) flyer = this.convertGoogleDriveURL(flyerMatch[1]);
      else if (typeMatch) type = typeMatch[1].trim();
      else if (locationMatch) location = locationMatch[1].trim();
      else if (trimmedLine) cleanLines.push(trimmedLine);
    });

    return {
      flyer,
      type,
      location,
      cleanDescription: cleanLines.join("\n").trim()
    };
  }

  convertGoogleDriveURL(url) {
    //Handles:
    //https://drive.google.com/file/d/FILE_ID/view
    //https://drive.google.com/open?id=FILE_ID
    //https://drive.google.com/uc?id=FILE_ID

    const fileIdMatch = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/;

    const idParameterMatch = url.match(/[?&]id=([^&#]+)/);

    const fileId = filePathMatch?.[1] ||
      idParameterMatch?.[1];
      
    if (!fileId) {
      return url;
    }

    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1600`;
  }

  guessEventType(title) {
    const value = title.toLowerCase();
    if (value.includes("poker")) return "Poker";
    if (value.includes("apa") || value.includes("napa") || value.includes("league")) return "League";
    if (value.includes("benefit") || value.includes("fundraiser")) return "Benefit";
    if (value.includes("special")) return "Special";
    return "Tournament";
  }

  getStartDate(event) {
    return new Date(event.start?.dateTime || `${event.start?.date}T12:00:00`);
  }

  getEndDate(event) {
    return new Date(event.end?.dateTime || `${event.end?.date}T12:00:00`);
  }

  formatDateTime(start, end, allDayDate) {
    if (allDayDate) {
      return start.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
      });
    }

    const date = start.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });

    const startTime = start.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    });

    const endTime = end.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    });

    return `${date} · ${startTime}–${endTime}`;
  }

  createPlaceholder() {
    const placeholder = document.createElement("div");
    placeholder.className = "mm-event-placeholder";
    placeholder.innerHTML = "<span>8</span>";
    return placeholder;
  }

  showSetupMessage() {
    this.status.className = "mm-events-status is-error";
    this.status.innerHTML = `
      <strong>Calendar setup is incomplete.</strong>
      <span>Add the Google Calendar ID and restricted API key to this component.</span>
    `;
  }

  escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  escapeAttribute(value) {
    return this.escapeHTML(value);
  }
}

if (!customElements.get("mickey-calendar-events")) {
  customElements.define("mickey-calendar-events", MickeyCalendarEvents);
}
