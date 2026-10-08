// Contact section: the "Copy" button copies the email address and briefly
// confirms it.
(() => {
  document.querySelectorAll(".copy-btn[data-copy]").forEach((button) => {
    let timer;
    button.addEventListener("click", async () => {
      const text = button.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Older browsers or file:// pages: fall back to a hidden text field
        const field = document.createElement("textarea");
        field.value = text;
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        document.execCommand("copy");
        field.remove();
      }
      button.textContent = "Copied";
      button.classList.add("is-copied");
      clearTimeout(timer);
      timer = setTimeout(() => {
        button.textContent = "Copy";
        button.classList.remove("is-copied");
      }, 1800);
    });
  });
})();
