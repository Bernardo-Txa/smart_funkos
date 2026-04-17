const elementosReveal = document.querySelectorAll("[data-reveal]");
const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reduzMovimento) {
  elementosReveal.forEach(elemento => elemento.classList.add("revelado"));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add("revelado");
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.16,
    rootMargin: "0px 0px -8% 0px"
  });

  elementosReveal.forEach((elemento, index) => {
    elemento.style.setProperty("--reveal-delay", `${Math.min(index * 70, 280)}ms`);
    observer.observe(elemento);
  });
}
