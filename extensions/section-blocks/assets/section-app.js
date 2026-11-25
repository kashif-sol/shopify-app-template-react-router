document.addEventListener("click", function (event) {
  const trigger = event.target.closest("[data-sa-faq-toggle]");
  if (!trigger) return;

  const item = trigger.closest(".sa-faq-item");
  if (!item) return;

  const answer = item.querySelector(".sa-faq-answer");
  const icon = trigger.querySelector("[data-sa-faq-icon]");
  if (!answer) return;

  const isExpanded = trigger.getAttribute("aria-expanded") === "true";
  trigger.setAttribute("aria-expanded", String(!isExpanded));
  answer.hidden = isExpanded;
  if (icon) {
    icon.textContent = isExpanded ? "+" : "−";
  }
});
