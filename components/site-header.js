class SiteHeader extends HTMLElement {
  connectedCallback() {
    const currentPage =
      window.location.pathname.split("/").pop().split("#")[0] || "index.html";

    const links = [
      { label: "About Us", href: "about.html", page: "about.html" },
      { label: "Tables & Rates", href: "tables-rates.html", page: "tables-rates.html" },
      { label: "Events", href: "events.html", page: "events.html" },
      { label: "Leagues", href: "leagues.html", page: "leagues.html" },
      { label: "Contact", href: "contact.html", page: "contact.html" },
      { label: "Gallery", href: "gallery.html", page: "gallery.html" }
    ];

    const navLinks = links.map(link => {
      const active = link.page && currentPage === link.page ? "active" : "";
      return `<a class="${active}" href="${link.href}">${link.label}</a>`;
    }).join("");

    this.innerHTML = `
      <header class="site-header">
        <a class="logo" href="index.html">
  <img src="assets/logo.png" alt="Mickey Milligans Billiards">
</a>

        <button class="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>

        <nav aria-label="Main navigation">
          ${navLinks}
        </nav>

        <a href="https://www.facebook.com/mickeymilligans/"
        class="facebook-icon"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Visit our Facebook page">
        <img src="assets/facebook-icon-40x40.svg" alt="Facebook Icon">
      </a>

        <a class="header-call" href="tel:+12524977123">Call Us</a>
      </header>
    `;

    const header = this.querySelector(".site-header");
    const toggle = this.querySelector(".menu-toggle");

    toggle.addEventListener("click", () => {
      const open = header.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    this.querySelectorAll("nav a").forEach(link => {
      link.addEventListener("click", () => {
        header.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      });
    });
  }
}

if (!customElements.get("site-header")) {
  customElements.define("site-header", SiteHeader);
}
