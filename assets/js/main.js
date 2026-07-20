/* ============================================================
   KAS THREADZ — shared site scripts
   ============================================================ */

/* ------------------------------------------------------------------
   ⚙️  BUSINESS CONTACT SETTINGS  — EDIT THESE
   Change the values below to your real details. They are used by the
   contact page, the footer, and the "Send order" buttons everywhere.
   • whatsapp: full international number, digits only (no +, spaces or -)
   • email:    where order enquiries should be sent
   ------------------------------------------------------------------ */
window.KAS_CONFIG = {
  brand:     "KAS THREADZ",
  whatsapp:  "2349121942684",            // digits only, country code first (Nigeria = 234)
  email:     "orders@kasthreadz.com",    // ← set your business email
  phoneNice: "+234 912 194 2684",        // shown to visitors
  address:   "Abuja, Nigeria",           // ← set your studio location
  instagram: "https://www.instagram.com/kasthreadz",
  tiktok:    "",                          // ← add your TikTok URL, or leave "" to hide
  facebook:  "",                          // ← add your Facebook URL, or leave "" to hide
  x:         ""                           // no X/Twitter — icon is hidden
};

(function () {
  "use strict";
  const cfg = window.KAS_CONFIG;

  /* ---- Fill dynamic contact placeholders ---- */
  function fillContacts() {
    document.querySelectorAll("[data-wa]").forEach((el) => {
      const text = el.getAttribute("data-wa") || "";
      el.href = "https://wa.me/" + cfg.whatsapp + (text ? "?text=" + encodeURIComponent(text) : "");
    });
    document.querySelectorAll("[data-mail]").forEach((el) => {
      const sub = el.getAttribute("data-mail") || "Enquiry — KAS THREADZ";
      el.href = "mailto:" + cfg.email + "?subject=" + encodeURIComponent(sub);
    });
    document.querySelectorAll("[data-fill=email]").forEach((el) => (el.textContent = cfg.email));
    document.querySelectorAll("[data-fill=phone]").forEach((el) => (el.textContent = cfg.phoneNice));
    document.querySelectorAll("[data-fill=address]").forEach((el) => (el.textContent = cfg.address));
    /* set each social link, or remove its icon entirely when no URL is set */
    ["instagram", "tiktok", "facebook", "x"].forEach((key) => {
      const url = cfg[key];
      document.querySelectorAll("[data-social=" + key + "]").forEach((el) => {
        if (url) { el.href = url; }
        else { el.remove(); }
      });
    });
    document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  }

  /* ---- Dark mode toggle ---- */
  function initTheme() {
    const root = document.documentElement;
    const saved = localStorage.getItem("kas-theme");
    if (saved) root.dataset.theme = saved;
    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = root.dataset.theme === "dark" ? "light" : "dark";
        root.dataset.theme = next;
        localStorage.setItem("kas-theme", next);
      });
    });
  }

  /* ---- Header: solid on scroll (only where it starts transparent) ---- */
  function initHeader() {
    const header = document.querySelector(".site-header");
    if (!header) return;
    const transparentStart = header.classList.contains("transparent-start");
    const onScroll = () => {
      if (!transparentStart) return;
      header.classList.toggle("scrolled", window.scrollY > 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- Mobile nav ---- */
  function initNav() {
    const toggle = document.querySelector(".nav-toggle");
    const links = document.querySelector(".nav-links");
    if (!toggle || !links) return;
    toggle.addEventListener("click", () => {
      document.body.classList.toggle("nav-open");
      const open = document.body.classList.contains("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => document.body.classList.remove("nav-open"))
    );
  }

  /* ---- Scroll reveal ---- */
  function initReveal() {
    const items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach((i) => i.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    items.forEach((i) => io.observe(i));
  }

  /* ---- Simple contact form -> WhatsApp / email ---- */
  function initContactForm() {
    const form = document.getElementById("contact-form");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = new FormData(form);
      const lines = [
        "New enquiry — KAS THREADZ",
        "———————————————",
        "Name: " + (d.get("name") || ""),
        "Phone: " + (d.get("phone") || ""),
        "Email: " + (d.get("email") || ""),
        "Service: " + (d.get("service") || ""),
        "",
        "Message:",
        d.get("message") || ""
      ];
      const msg = lines.join("\n");
      const channel = form.querySelector("[name=channel]:checked");
      if (channel && channel.value === "email") {
        window.location.href =
          "mailto:" + cfg.email +
          "?subject=" + encodeURIComponent("Enquiry from " + (d.get("name") || "website")) +
          "&body=" + encodeURIComponent(msg);
      } else {
        window.open("https://wa.me/" + cfg.whatsapp + "?text=" + encodeURIComponent(msg), "_blank");
      }
      const note = form.querySelector(".form-note");
      if (note) note.hidden = false;
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    fillContacts();
    initTheme();
    initHeader();
    initNav();
    initReveal();
    initContactForm();
  });
})();
