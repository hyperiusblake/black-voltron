document.documentElement.classList.add("js");

const motionPreference = window.matchMedia("(prefers-reduced-motion: no-preference)");
const siteHeader = document.querySelector(".site-header");
const navLinks = document.querySelectorAll(".nav-link");

function updateHeaderState() {
  siteHeader.classList.toggle("is-scrolled", window.scrollY > 40);
}

function updateCurrentPageLink() {
  const activePage = document.querySelector(".page.is-active");
  if (!activePage) return;

  navLinks.forEach(link => {
    if (link.getAttribute("href") === `#${activePage.id}`) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

window.addEventListener("scroll", updateHeaderState, { passive: true });
window.addEventListener("hashchange", updateCurrentPageLink);
updateHeaderState();

function initializeMotion() {
  updateCurrentPageLink();

  if ("IntersectionObserver" in window) {
    const pageObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting && entry.target.classList.contains("is-active"))) {
        updateCurrentPageLink();
      }
    }, { threshold: 0.01 });

    document.querySelectorAll(".page").forEach(page => pageObserver.observe(page));
  }

  if (!motionPreference.matches) return;

  const observedElements = new WeakSet();
  const animatedHeroes = new WeakSet();
  let revealObserver;

  function prepareHero(page) {
    const hero = page.querySelector(".hero");
    if (!hero || animatedHeroes.has(hero)) return;

    hero.querySelectorAll("h1, .lead, .button-row").forEach((element, index) => {
      const releaseWillChange = () => element.style.removeProperty("will-change");
      element.style.setProperty("--hero-order", index);
      element.style.willChange = "transform, opacity";
      element.addEventListener("animationend", releaseWillChange, { once: true });
      element.addEventListener("animationcancel", releaseWillChange, { once: true });
      element.classList.add("hero-sequence-item");
    });

    animatedHeroes.add(hero);
  }

  function prepareReveals(page) {
    page.querySelectorAll(".grid, .stats, .media-carousel-track").forEach(group => {
      Array.from(group.children)
        .filter(element => element.matches(".card, .stat, .media-carousel-slide"))
        .forEach((element, index) => {
          element.style.setProperty("--reveal-delay", `${index * 80}ms`);
        });
    });

    page.querySelectorAll(".section, .card, .stat, .media-carousel-slide, .media-image").forEach(element => {
      if (observedElements.has(element)) return;

      element.classList.add("reveal");
      revealObserver.observe(element);
      observedElements.add(element);
    });
  }

  function prepareActivePage() {
    const activePage = document.querySelector(".page.is-active");
    if (!activePage) return;
    prepareHero(activePage);
    if (revealObserver) prepareReveals(activePage);
  }

  if ("IntersectionObserver" in window) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const element = entry.target;
        const delay = Number.parseInt(element.style.getPropertyValue("--reveal-delay"), 10) || 0;
        const revealDuration = Number.parseFloat(
          window.getComputedStyle(document.documentElement).getPropertyValue("--duration-reveal")
        ) || 650;
        element.classList.add("is-revealing");
        element.addEventListener("transitionend", event => {
          if (event.target === element && event.propertyName === "opacity") {
            element.classList.remove("is-revealing");
            element.style.removeProperty("will-change");
          }
        }, { once: true });
        requestAnimationFrame(() => element.classList.add("is-revealed"));
        window.setTimeout(() => {
          element.classList.remove("is-revealing");
          element.style.removeProperty("will-change");
        }, revealDuration + delay + 100);
        revealObserver.unobserve(element);
      });
    }, { threshold: 0.15 });
  }

  prepareActivePage();
  window.addEventListener("hashchange", () => requestAnimationFrame(prepareActivePage));
}

window.addEventListener("DOMContentLoaded", initializeMotion, { once: true });
