const DEFAULT_SHEET_ID = "1IDBADaXdqf6JUpWXLODf9aEU0L8vNG2kUho4cpRCrn8";
const DEFAULT_SHEET_NAME = "Лиды";
const DEFAULT_LEAD_MAGNET_URL =
  "https://drive.google.com/file/d/1FPlYttRQTvp11Vh5V3995UVnbMBUOKZ8/view?usp=drive_link";
const LEAD_HEADERS = ["Дата", "Email", "Источник", "Материал", "Согласие на рассылку"];

function doGet() {
  return ContentService.createTextOutput("Lead bridge is running.");
}

function doPost(e) {
  try {
    const params = normalizeParams_(e);
    validateLead_(params);

    const lead = {
      date: params.submitted_at || formatLeadDate_(new Date()),
      email: params.email,
      source: params.source || "",
      material: params.lead_magnet || "",
      mailingConsent: params.marketing_mailing_consent === "accepted" ? "Да" : "Нет",
    };

    appendLeadToSheet_(lead);
    sendLeadMagnetEmail_(lead);
    sendTelegramNotification_(lead);

    return createRedirectHtml_(
      params.redirect_url,
      "Спасибо! Разбор уже отправляется вам на почту."
    );
  } catch (error) {
    return createErrorHtml_(error);
  }
}

function normalizeParams_(e) {
  const raw = (e && e.parameter) || {};
  const params = {};

  Object.keys(raw).forEach((key) => {
    params[key] = String(raw[key] || "").trim();
  });

  return params;
}

function validateLead_(params) {
  if (!params.email) {
    throw new Error("Email не передан.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.email)) {
    throw new Error("Email передан в некорректном формате.");
  }
}

function appendLeadToSheet_(lead) {
  const sheet = getLeadSheet_();
  ensureSheetHeader_(sheet);
  sheet.appendRow([lead.date, lead.email, lead.source, lead.material, lead.mailingConsent]);
}

function sendLeadMagnetEmail_(lead) {
  const leadMagnetUrl = getLeadMagnetUrl_();
  const materialName = lead.material || "разбор";
  const subject = "Ваш разбор от Анны Николаичук";
  const plainBody = [
    "Здравствуйте!",
    "",
    "Спасибо, что оставили заявку на сайте.",
    "Ваш материал: " + materialName,
    "",
    "Открыть разбор можно по ссылке:",
    leadMagnetUrl,
    "",
    "Если письмо попало не туда, добавьте этот адрес в контакты, чтобы не потерять следующие материалы.",
    "",
    "С теплом,",
    "Анна Николаичук",
  ].join("\n");
  const htmlBody = [
    '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#2f2924;">',
    "<p>Здравствуйте!</p>",
    "<p>Спасибо, что оставили заявку на сайте.</p>",
    "<p>Ваш материал: <strong>" + escapeHtml_(materialName) + "</strong></p>",
    '<p><a href="' +
      escapeHtmlAttribute_(leadMagnetUrl) +
      '" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#2f2924;color:#fffaf1;text-decoration:none;font-weight:700;">Открыть разбор</a></p>',
    '<p>Если кнопка не открывается, скопируйте ссылку:<br><a href="' +
      escapeHtmlAttribute_(leadMagnetUrl) +
      '">' +
      escapeHtml_(leadMagnetUrl) +
      "</a></p>",
    "<p>С теплом,<br>Анна Николаичук</p>",
    "</div>",
  ].join("");

  MailApp.sendEmail({
    to: lead.email,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody,
    name: "Анна Николаичук",
  });
}

function getLeadMagnetUrl_() {
  const properties = PropertiesService.getScriptProperties();
  return properties.getProperty("LEAD_MAGNET_URL") || DEFAULT_LEAD_MAGNET_URL;
}

function getLeadSheet_() {
  const properties = PropertiesService.getScriptProperties();
  const sheetId = properties.getProperty("SHEET_ID") || DEFAULT_SHEET_ID;
  const sheetName = properties.getProperty("SHEET_NAME") || DEFAULT_SHEET_NAME;

  if (!sheetId) {
    throw new Error("Не задан ID Google Таблицы.");
  }

  const spreadsheet = SpreadsheetApp.openById(sheetId);
  return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
}

function ensureSheetHeader_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(LEAD_HEADERS);
    sheet.setFrozenRows(1);
    return;
  }

  const headerRange = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1));
  const currentHeaders = headerRange.getValues()[0].map(function (header) {
    return String(header || "").trim();
  });

  LEAD_HEADERS.forEach(function (header, index) {
    if (currentHeaders[index] !== header) {
      sheet.getRange(1, index + 1).setValue(header);
    }
  });
}

function sendTelegramNotification_(lead) {
  const properties = PropertiesService.getScriptProperties();
  const botToken = properties.getProperty("TELEGRAM_BOT_TOKEN");
  const chatId = properties.getProperty("TELEGRAM_CHAT_ID");

  if (!botToken || !chatId) return;

  const response = UrlFetchApp.fetch(
    "https://api.telegram.org/bot" + botToken + "/sendMessage",
    {
      method: "post",
      contentType: "application/json; charset=utf-8",
      payload: JSON.stringify({
        chat_id: chatId,
        text:
          "Новый лид: " +
          lead.email +
          " | " +
          lead.date +
          " | рассылка: " +
          lead.mailingConsent,
      }),
      muteHttpExceptions: true,
    }
  );

  if (response.getResponseCode() >= 300) {
    console.error("Telegram notification failed: " + response.getContentText());
  }
}

function createRedirectHtml_(redirectUrl, message) {
  const safeMessage = escapeHtml_(message);
  const safeUrl = redirectUrl ? String(redirectUrl).trim() : "";
  const redirectMarkup = safeUrl
    ? [
        '<meta http-equiv="refresh" content="0; url=' + escapeHtmlAttribute_(safeUrl) + '">',
        "<script>",
        "window.location.replace(" + JSON.stringify(safeUrl) + ");",
        "</script>",
      ].join("")
    : "";

  return HtmlService.createHtmlOutput(
    [
      "<!doctype html>",
      '<html lang="ru">',
      "<head>",
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
      "<title>Спасибо</title>",
      redirectMarkup,
      "</head>",
      '<body style="font-family:Arial,sans-serif;padding:32px;line-height:1.6;">',
      "<p>" + safeMessage + "</p>",
      safeUrl
        ? '<p>Если переадресация не сработала, <a href="' +
          escapeHtmlAttribute_(safeUrl) +
          '">нажмите сюда</a>.</p>'
        : "",
      "</body>",
      "</html>",
    ].join("")
  );
}

function createErrorHtml_(error) {
  const message = escapeHtml_(
    error && error.message ? error.message : "Не удалось обработать форму."
  );

  return HtmlService.createHtmlOutput(
    [
      "<!doctype html>",
      '<html lang="ru">',
      "<head>",
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
      "<title>Ошибка отправки</title>",
      "</head>",
      '<body style="font-family:Arial,sans-serif;padding:32px;line-height:1.6;">',
      "<h1>Не удалось обработать форму</h1>",
      "<p>" + message + "</p>",
      "<p>Проверьте настройки Google Sheets и Telegram, затем попробуйте ещё раз.</p>",
      "</body>",
      "</html>",
    ].join("")
  );
}

function formatLeadDate_(date) {
  return Utilities.formatDate(
    date,
    Session.getScriptTimeZone(),
    "yyyy-MM-dd HH:mm:ss"
  );
}

function escapeHtml_(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeHtmlAttribute_(value) {
  return escapeHtml_(value);
}
