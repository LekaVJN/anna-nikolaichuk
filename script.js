const header = document.querySelector("[data-header]");
const revealItems = document.querySelectorAll(".reveal");
const faq = document.querySelector("[data-faq]");
const leadForms = document.querySelectorAll("[data-lead-form]");
const exitModal = document.querySelector("[data-exit-modal]");
const siteConfig = window.ANNA_SITE_CONFIG || {};
const cookieNoticeStorageKey = "annaCookieNoticeAccepted";
const metrikaCounterId = 109141188;
const leadFormGoalParam = "lead_form_submit";
const pendingRevealItems = new Set(revealItems);
let instantRevealTimer = 0;

const revealItem = (item) => {
  if (!item || !pendingRevealItems.has(item)) return;
  item.classList.add("is-visible");
  pendingRevealItems.delete(item);
};

const revealSection = (section) => {
  if (!section) return;

  if (section.classList?.contains("reveal")) {
    revealItem(section);
  }

  section.querySelectorAll?.(".reveal").forEach((item) => revealItem(item));
};

const revealTargetRegion = (target) => {
  const section = target?.closest(".section");
  if (!section) return;

  revealSection(section.previousElementSibling);
  revealSection(section);
};

const syncHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 16);
};

const scrollToTarget = (hash, behavior = "smooth") => {
  const target = document.querySelector(hash);
  if (!target) return;

  const headerOffset = (header?.offsetHeight || 0) + 30;
  const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
  document.documentElement.classList.add("instant-reveal");
  window.clearTimeout(instantRevealTimer);
  revealTargetRegion(target);
  window.scrollTo({ top, behavior });
  window.requestAnimationFrame(() => {
    syncReveals();
    window.setTimeout(syncReveals, 140);
    window.setTimeout(syncReveals, 320);
    instantRevealTimer = window.setTimeout(() => {
      document.documentElement.classList.remove("instant-reveal");
    }, 420);
  });
};

const syncReveals = () => {
  pendingRevealItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    const isVisible =
      rect.top < window.innerHeight * 0.94 && rect.bottom > window.innerHeight * 0.06;

    if (isVisible) {
      revealItem(item);
    }
  });
};

const reachMetrikaGoal = (goalName) => {
  if (typeof window.ym !== "function") return;

  window.ym(metrikaCounterId, "reachGoal", goalName);
};

const appendUrlParam = (url, key, value) => {
  const nextUrl = new URL(url, window.location.href);
  nextUrl.searchParams.set(key, value);
  return nextUrl.toString();
};

const maxChatGoalLabels = new Set([
  "Хочу доступ в секретный чат",
  "Перейти в чат",
  "Узнать подробности",
  "Узнать про систему",
  "Узнать новый подход",
  "Выстроить путь",
  "Узнать про сопровождение",
]);

document.querySelectorAll('a[href*="max.ru/join"]').forEach((link) => {
  const label = link.textContent.trim().replace(/\s+/g, " ");
  if (!maxChatGoalLabels.has(label)) return;

  link.addEventListener("click", () => {
    reachMetrikaGoal("max_chat_click");
  });
});

if (new URLSearchParams(window.location.search).has(leadFormGoalParam)) {
  reachMetrikaGoal("lead_form_submit");
}

syncHeader();
syncReveals();
window.addEventListener("scroll", syncHeader, { passive: true });
window.addEventListener("scroll", syncReveals, { passive: true });
window.addEventListener("resize", syncReveals);

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const hash = link.getAttribute("href");
    if (!hash || hash === "#") return;

    const target = document.querySelector(hash);
    if (!target) return;

    event.preventDefault();
    history.pushState(null, "", hash);
    scrollToTarget(hash);
  });
});

window.addEventListener("load", () => {
  if (window.location.hash) {
    window.setTimeout(() => scrollToTarget(window.location.hash, "auto"), 120);
  }
  syncReveals();
});

window.addEventListener("hashchange", () => {
  if (window.location.hash) scrollToTarget(window.location.hash);
});

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          revealItem(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px 0px 0px", threshold: 0.01 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

faq?.addEventListener("click", (event) => {
  const button = event.target.closest(".faq-question");
  if (!button) return;

  const isOpen = button.getAttribute("aria-expanded") === "true";
  faq.querySelectorAll(".faq-question").forEach((item) => {
    item.setAttribute("aria-expanded", "false");
  });
  button.setAttribute("aria-expanded", String(!isOpen));
});

const copyButtons = document.querySelectorAll("[data-copy-text]");

const fallbackCopyText = (text) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  textArea.style.pointerEvents = "none";
  document.body.appendChild(textArea);
  textArea.select();
  textArea.setSelectionRange(0, text.length);
  const copied = document.execCommand("copy");
  document.body.removeChild(textArea);

  if (!copied) {
    throw new Error("Copy command failed");
  }
};

const setCopyButtonState = (button, copied = false) => {
  const defaultLabel = button.dataset.defaultLabel || button.getAttribute("aria-label") || "";
  const defaultTitle = button.dataset.defaultTitle || button.getAttribute("title") || "";

  if (!button.dataset.defaultLabel) button.dataset.defaultLabel = defaultLabel;
  if (!button.dataset.defaultTitle) button.dataset.defaultTitle = defaultTitle;

  if (copied) {
    button.classList.add("is-copied");
    button.setAttribute("aria-label", "Скопировано");
    button.setAttribute("title", "Скопировано");
    return;
  }

  button.classList.remove("is-copied");
  if (defaultLabel) button.setAttribute("aria-label", defaultLabel);
  if (defaultTitle) button.setAttribute("title", defaultTitle);
};

copyButtons.forEach((button) => {
  let resetTimer = 0;

  button.addEventListener("click", async () => {
    const text = button.dataset.copyText?.trim();
    if (!text) return;

    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        fallbackCopyText(text);
      }

      window.clearTimeout(resetTimer);
      setCopyButtonState(button, true);
      resetTimer = window.setTimeout(() => {
        setCopyButtonState(button, false);
      }, 1600);
    } catch {
      setCopyButtonState(button, false);
    }
  });
});

const leadEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const padDatePart = (value) => String(value).padStart(2, "0");

const formatLeadTimestamp = (date = new Date()) =>
  `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())} ${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}:${padDatePart(date.getSeconds())}`;

const resolveFormEndpoint = (form) =>
  form.dataset.formEndpoint?.trim() || siteConfig.leadFormEndpoint?.trim() || "";

const resolveFormSubmitMode = (form, endpoint) => {
  const explicitMode = form.dataset.formSubmitMode?.trim();
  if (explicitMode) return explicitMode;
  if (endpoint.includes("script.google.com")) return "navigate";
  return "fetch";
};

const resolveSuccessRedirect = (form) =>
  form.dataset.successRedirect?.trim() || siteConfig.leadFormRedirect?.trim() || "thanks.html";

const setLeadFormStatus = (form, message = "", state = "") => {
  const status = form.querySelector("[data-form-status]");
  if (!status) return;

  status.textContent = message;
  status.className = "lead-form-status";
  if (state) status.classList.add(`is-${state}`);
  status.hidden = !message;
};

leadForms.forEach((form) => {
  const emailInput = form.querySelector('input[type="email"]');
  const submitButton = form.querySelector('button[type="submit"]');
  const submittedAtInput = form.querySelector('input[name="submitted_at"]');
  const redirectUrlInput = form.querySelector('input[name="redirect_url"]');
  const consentCheckbox = form.querySelector('input[name="personal_data_consent"]');
  const defaultButtonText = submitButton?.textContent?.trim() || "";

  const syncLeadFormState = () => {
    if (!submitButton) return;

    if (consentCheckbox) {
      submitButton.disabled = !consentCheckbox.checked;
      return;
    }

    submitButton.disabled = false;
  };

  syncLeadFormState();

  emailInput?.addEventListener("input", () => {
    if (!emailInput.value.trim()) {
      setLeadFormStatus(form);
      return;
    }

    if (leadEmailPattern.test(emailInput.value.trim())) {
      setLeadFormStatus(form);
    }
  });

  consentCheckbox?.addEventListener("change", () => {
    if (consentCheckbox.checked) {
      setLeadFormStatus(form);
    }

    syncLeadFormState();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput?.value.trim() || "";
    if (!leadEmailPattern.test(email)) {
      setLeadFormStatus(
        form,
        "Пожалуйста, введите корректный email, чтобы получить разбор.",
        "error"
      );
      emailInput?.focus();
      return;
    }

    if (consentCheckbox && !consentCheckbox.checked) {
      setLeadFormStatus(
        form,
        "Чтобы получить разбор, подтвердите согласие на обработку персональных данных.",
        "error"
      );
      consentCheckbox.focus();
      syncLeadFormState();
      return;
    }

    const endpoint = resolveFormEndpoint(form);
    const previewRedirect = appendUrlParam(
      resolveSuccessRedirect(form),
      leadFormGoalParam,
      "1"
    );
    if (!endpoint) {
      window.location.href = previewRedirect;
      return;
    }
    if (!endpoint) {
      setLeadFormStatus(
        form,
        form.dataset.noEndpointMessage ||
          "Форма уже готова. Осталось подключить автоматическую отправку разбора.",
        "info"
      );
      return;
    }

    const successRedirect = previewRedirect;
    const submitMode = resolveFormSubmitMode(form, endpoint);

    if (submittedAtInput) submittedAtInput.value = formatLeadTimestamp();
    if (redirectUrlInput) redirectUrlInput.value = successRedirect;

    submitButton?.setAttribute("disabled", "true");
    if (submitButton) submitButton.textContent = "Отправляем...";
    setLeadFormStatus(form);

    if (submitMode === "navigate") {
      form.setAttribute("action", endpoint);
      form.setAttribute("method", "POST");
      HTMLFormElement.prototype.submit.call(form);
      return;
    }

    try {
      const payload = new URLSearchParams(new FormData(form));
      const response = await fetch(endpoint, {
        method: "POST",
        body: payload,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
      });

      if (!response.ok) {
        throw new Error("Lead form request failed");
      }

      form.reset();
      if (submittedAtInput) submittedAtInput.value = "";
      if (redirectUrlInput) redirectUrlInput.value = "";

      setLeadFormStatus(
        form,
        form.dataset.successMessage ||
          "Готово. Разбор уже отправлен вам на почту.",
        "success"
      );

      window.setTimeout(() => {
        window.location.href = successRedirect;
      }, 220);
    } catch {
      setLeadFormStatus(
        form,
        "Не получилось отправить форму. Попробуйте ещё раз чуть позже или перейдите в секретный чат.",
        "error"
      );
    } finally {
      if (submitButton) submitButton.textContent = defaultButtonText;
      syncLeadFormState();
    }
  });
});

const readCookieNoticeAccepted = () => {
  try {
    return window.localStorage?.getItem(cookieNoticeStorageKey) === "true";
  } catch {
    return false;
  }
};

const acceptCookieNotice = (notice) => {
  try {
    window.localStorage?.setItem(cookieNoticeStorageKey, "true");
  } catch {
    // The notice can still close when storage is unavailable.
  }

  notice?.remove();
};

if (!readCookieNoticeAccepted()) {
  const cookieNotice = document.createElement("div");
  cookieNotice.className = "cookie-notice";
  cookieNotice.setAttribute("role", "status");
  cookieNotice.innerHTML = [
    "<p>",
    "Мы используем cookie, чтобы сайт работал корректно, а также для аналитики и улучшения материалов. ",
    '<a href="privacy.html">Подробнее в политике конфиденциальности</a>.',
    "</p>",
    '<button class="cookie-notice-button" type="button" data-accept-cookies>Понятно</button>',
  ].join("");

  cookieNotice.querySelector("[data-accept-cookies]")?.addEventListener("click", () => {
    acceptCookieNotice(cookieNotice);
  });

  document.body.append(cookieNotice);
}

const finePointer = window.matchMedia?.("(pointer: fine)")?.matches ?? false;
let exitModalArmed = false;
let exitModalVisible = false;
let exitModalShown = false;

const openExitModal = () => {
  if (!exitModal || exitModalVisible || exitModalShown) return;

  exitModal.hidden = false;
  exitModalVisible = true;
  exitModalShown = true;
  document.body.classList.add("has-modal");
  window.requestAnimationFrame(() => {
    exitModal.classList.add("is-visible");
  });
};

const closeExitModal = () => {
  if (!exitModal || !exitModalVisible) return;

  exitModal.classList.remove("is-visible");
  exitModalVisible = false;
  document.body.classList.remove("has-modal");
  window.setTimeout(() => {
    if (!exitModalVisible) {
      exitModal.hidden = true;
    }
  }, 220);
};

const matchesExitIntent = (event) => {
  if (!finePointer || !exitModalArmed || exitModalVisible || exitModalShown) return false;
  if (event.relatedTarget) return false;
  if (typeof event.clientY === "number" && event.clientY > 24) return false;
  return true;
};

if (exitModal) {
  window.setTimeout(() => {
    exitModalArmed = true;
  }, 1200);

  if (finePointer) {
    document.addEventListener("mouseout", (event) => {
      if (!matchesExitIntent(event)) return;
      openExitModal();
    });

    document.documentElement.addEventListener("mouseleave", (event) => {
      if (!matchesExitIntent(event)) return;
      openExitModal();
    });
  }

  exitModal.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-exit-modal]")) {
      closeExitModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeExitModal();
    }
  });
}
