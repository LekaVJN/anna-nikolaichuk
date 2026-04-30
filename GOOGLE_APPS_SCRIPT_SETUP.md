# Подключение формы к Google Sheets и Telegram

В проекте уже готово всё со стороны сайта. Осталось один раз настроить Google Apps Script и вставить его URL в конфиг.

## 1. Создайте таблицу Google Sheets

1. Создайте новую таблицу.
2. Скопируйте `SHEET_ID` из адресной строки.

Пример:

```text
https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=0
```

## 2. Создайте Google Apps Script

1. Откройте таблицу.
2. Перейдите в `Расширения -> Apps Script`.
3. Вставьте код из файла [google-apps-script.gs](./google-apps-script.gs).

## 3. Задайте Script Properties

В Apps Script откройте:

`Project Settings -> Script Properties`

Добавьте свойства:

- `SHEET_ID` — ID вашей Google Таблицы
- `SHEET_NAME` — имя листа, например `Лиды`
- `TELEGRAM_BOT_TOKEN` — токен бота
- `TELEGRAM_CHAT_ID` — ID чата или канала для уведомлений

## 4. Опубликуйте Web App

1. Нажмите `Deploy -> New deployment`
2. Тип: `Web app`
3. `Execute as`: `Me`
4. `Who has access`: `Anyone`
5. Нажмите `Deploy`
6. Скопируйте URL веб-приложения

## 5. Вставьте URL в сайт

Откройте файл [site-config.js](./site-config.js) и вставьте URL:

```js
window.ANNA_SITE_CONFIG = {
  leadFormEndpoint: "https://script.google.com/macros/s/ВАШ_ID/exec",
  leadFormRedirect: "thanks.html",
};
```

## Что будет после этого

- при отправке формы создаётся новая строка в Google Sheets
- записываются `Дата`, `Email`, `Источник`, `Материал`
- в Telegram уходит сообщение:

```text
Новый лид: email@example.com | 2026-04-30 12:34:56
```

- после отправки пользователь попадает на страницу `thanks.html`
