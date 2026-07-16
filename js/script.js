const observer = new IntersectionObserver(
  entries => entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  }),
  { threshold: 0.12 }
);

document.querySelectorAll(
  ".event-card,.photo-card,.copy-card,.special-copy,.special-photo,.league-card,.rate-card"
).forEach(element => observer.observe(element));
