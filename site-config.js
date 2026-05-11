window.ANNA_SITE_CONFIG = {
  leadFormEndpoint:
    "https://script.google.com/macros/s/AKfycbxxVamNlNxUMNbm_U4_7VdVZRMr4uvulWk8CnAy4OtdVTUu0W7n_4tneMmLohY6g9Hw4w/exec",
  leadFormRedirect: "thanks.html",
};

(() => {
  if (document.head && !document.querySelector("[data-site-runtime-fixes]")) {
    const runtimeStyle = document.createElement("style");
    runtimeStyle.dataset.siteRuntimeFixes = "anna";
    runtimeStyle.textContent = `
      .pain-section {
        padding-bottom: clamp(34px, 4.5vw, 58px);
      }

      .pain-section > .container + .container {
        margin-top: clamp(42px, 5vw, 62px);
      }

      .pain-section .soft-statement {
        margin-top: 0;
      }
    `;
    document.head.append(runtimeStyle);
  }

  document
    .querySelectorAll('.testimonials-section img[src*="foto/отзывы/"]')
    .forEach((image) => {
      const source = image.getAttribute("src");
      if (!source) return;
      image.src = source.replace("foto/отзывы/", "foto/Отзывы/");
    });
})();
