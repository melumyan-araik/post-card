#!/usr/bin/env node
/**
 * build.js — генератор admin.html для конструктора открыток.
 * Запуск: node build.js
 * Результат: admin.html — полностью автономный файл (открывается без сервера).
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const POSTCARD = path.join(ROOT, 'postcard');
const CSS_DIR = path.join(POSTCARD, 'css');
const JS_DIR = path.join(POSTCARD, 'script');
const FONT_DIR = path.join(CSS_DIR, 'fonts');

// ── Хелперы ────────────────────────────────────────────────────────────────

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readB64(filePath) {
  return fs.readFileSync(filePath).toString('base64');
}

function escape(str) {
  // Экранируем для вставки в JS-строку с обратными кавычками
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

// ── Читаем исходники ────────────────────────────────────────────────────────

console.log('Читаю исходные файлы...');

const partnerCardCss = read(path.join(CSS_DIR, 'partner_card.css@v=1614772361.css'));
const styleCss = read(path.join(CSS_DIR, 'style.css'));

// Шрифты → base64
const fontRegular = readB64(path.join(FONT_DIR, 'GothamPro.woff'));
const fontBold    = readB64(path.join(FONT_DIR, 'GothamProBold.woff'));
const fontLight   = readB64(path.join(FONT_DIR, 'GothamProLight.woff'));

// Патчим ссылки на шрифты в CSS
let cardCss = partnerCardCss
  .replace(/url\(['"]?[^'"()]*GothamPro\.woff['"]?\)/g,      `url('data:font/woff;base64,${fontRegular}')`)
  .replace(/url\(['"]?[^'"()]*GothamProBold\.woff['"]?\)/g,  `url('data:font/woff;base64,${fontBold}')`)
  .replace(/url\(['"]?[^'"()]*GothamProLight\.woff['"]?\)/g,  `url('data:font/woff;base64,${fontLight}')`);

const jqueryJs    = read(path.join(JS_DIR, 'jquery-2.1.3.min.js@v=1614772361'));
const lodashJs    = read(path.join(JS_DIR, 'lodash.min.js@v=1614772361'));
const clipboardJs = read(path.join(JS_DIR, 'clipboard.min.js@v=1614772361'));
const cleaveJs    = read(path.join(JS_DIR, 'cleave.min.js@v=1614772361'));
const simJs       = read(path.join(JS_DIR, 'script.js'));
const partnerJs   = read(path.join(JS_DIR, 'partner_card.js@v=1614772361'));

// Значки (system images) → base64
const IMG = path.join(POSTCARD, 'img', 'system');
const faviconB64  = readB64(path.join(IMG, 'favicon.ico'));
const fotGifB64   = readB64(path.join(IMG, 'fot.gif'));
const button2B64  = readB64(path.join(IMG, 'button2.png'));

// ── Читаем шаблоны ─────────────────────────────────────────────────────────

const TEMPLATES_DIR = path.join(ROOT, 'templates');
const templates = fs.readdirSync(TEMPLATES_DIR)
  .filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(read(path.join(TEMPLATES_DIR, f))));

console.log(`Загружено шаблонов: ${templates.length}`);
console.log('Исходники прочитаны. Генерирую admin.html...');

// ── Шаблон HTML открытки (встраивается в iframe) ───────────────────────────

const CARD_BODY_HTML = `
<div class="animation-block hide">
  <div class="envelope" id="envelope-back">
    <div class="envelop-rotate">
      <div class="envelope-flap envelope-flap--up" id="envelope-flap-up"></div>
      <a href="javascript:void(0);" class="open-btn">
        <span class="tooltip-holder" id="_jsi_tooltip-holder">
          <span class="tooltip">Нажмите чтобы открыть</span>
          <img src="data:image/png;base64,${button2B64}" />
        </span>
      </a>
    </div>

    <div class="gift-card-block" id="gift-card">
      <div class="gift-card">
        <div class="gift-card__inner">
          <div class="header">
            <div class="card-block card-block--no_sparks">
              <div class="card-container">
                <div class="sim-slider">
                  <ul class="sim-slider-list"></ul>
                  <div class="sim-slider-arrow-left"></div>
                  <div class="sim-slider-arrow-right"></div>
                  <div class="sim-slider-dots"></div>
                </div>
                <div class="push-pins"></div>
              </div>
            </div>
          </div>

          <div class="qr-code">
            <div class="container container--header">
              <h1 id="event"></h1>
            </div>
            <div class="container container--data">
              <div class="row-flex">
                <div class="qr-col-info-flex qr-col-info-flex--alter">
                  <div class="wrap1">
                    <div class="content1">
                      <div class="modal-close1">
                        <div class="modal-close1_x" onclick="closePopupRulesOffer()">×</div>
                      </div>
                      <div class="modal-header1"><h2 class="modal-header1_title"></h2></div>
                      <div class="offer1"><p class="element_body"></p></div>
                    </div>
                  </div>
                  <div class="qr-col-info-flex-wrap">
                    <div class="qr-code__tabs" id="qr"></div>
                  </div>
                  <div class="mail-text">
                    <div class="mail-text__container">
                      <div class="mail-text__grats">
                        <p class="name" id="recipientName"></p>
                        <p id="wishes"></p>
                        <p class="name send-name" id="senderName"></p>
                        <br>
                        <p id="personalMessage"></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="container">
              <div class="row">
                <div class="col-md-3 col-sm-3 footer-logo-col"></div>
                <div class="col-md-9 col-sm-9"><ul class="footer__menu"></ul></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="envelope-flaps">
      <div class="envelope-flap envelope-flap--left"></div>
      <div class="envelope-flap envelope-flap--right"></div>
      <div class="envelope-flap envelope-flap--bottom"></div>
    </div>
  </div>
</div>`;

// ── Встроенный json_loader (без зависимости от внешних файлов) ──────────────

const INLINE_LOADER = `
document.addEventListener("DOMContentLoaded", function() {
  document.title = jsonData.title || 'Открытка';
  document.getElementById("event").innerText = jsonData.event || '';
  document.getElementById("recipientName").innerText = jsonData.recipientName || '';
  document.getElementById("senderName").innerText = jsonData.senderName || '';
  document.getElementById("personalMessage").innerText = jsonData.personalMessage || '';

  const wishesContainer = document.getElementById("wishes");
  (jsonData.wishes || []).forEach(function(wish) {
    const d = document.createElement('div');
    d.innerText = wish;
    wishesContainer.appendChild(d);
  });

  const simSliderList = document.querySelector('.sim-slider-list');
  (jsonData.images || []).slice(0, 10).forEach(function(image) {
    const li = document.createElement('li');
    li.classList.add('sim-slider-element');
    const img = document.createElement('img');
    img.src = image;
    li.appendChild(img);
    simSliderList.appendChild(li);
  });

  const qrEl = document.getElementById('qr');
  if (jsonData.qrCode && qrEl) {
    const img = document.createElement('img');
    img.src = jsonData.qrCode;
    img.style.maxWidth = '100px';
    qrEl.appendChild(img);
  }

  const pushPinsContainer = document.querySelector('.push-pins');
  const defaultClasses = ['price-left','price-right','price-lb','price-rb'];
  (jsonData.pushPins || []).slice(0, 4).forEach(function(pin, i) {
    if (!pin || !pin.src) return;
    const div = document.createElement('div');
    div.classList.add(pin.class || defaultClasses[i] || 'price-left');
    const img = document.createElement('img');
    img.src = pin.src;
    div.appendChild(img);
    pushPinsContainer.appendChild(div);
  });
});
`;

// ── CSS для режима «без анимации» (показывает содержимое сразу) ────────────

const NO_ANIM_CSS = `
/* ── edit-mode: skip envelope animation ── */
.animation-block.hide { display: block !important; }
.animation-block { animation: none !important; transition: none !important; opacity: 1 !important; }
.bounceInLeft, .animated { animation: none !important; }
.envelop-rotate { display: none !important; }
.envelope-flaps { display: none !important; }
#envelope-back  { top: 0 !important; background: none !important; border: none !important; box-shadow: none !important; }
#gift-card      { top: 0 !important; overflow: visible !important; z-index: 4 !important; position: relative !important; }
.gift-card-block { display: block !important; }
`;

// ── Функция генерации HTML открытки ───────────────────────────────────────

function makeCardHtml(jsonDataStr) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Открытка</title>
  <style>
${cardCss}
${styleCss}
  </style>
</head>
<body>
${CARD_BODY_HTML}
<script>const jsonData = ${jsonDataStr};<\/script>
<script>${jqueryJs}<\/script>
<script>${lodashJs}<\/script>
<script>${clipboardJs}<\/script>
<script>${cleaveJs}<\/script>
<script>${simJs}<\/script>
<script>${INLINE_LOADER}<\/script>
<script>${partnerJs}<\/script>
</body>
</html>`;
}

// ── Дефолтные данные для нового редактора ──────────────────────────────────

const DEFAULT_DATA = {
  title: "Поздравление",
  event: "День Рождения",
  recipientName: "Имя",
  wishes: ["Поздравляю с днем рождения!", "Желаю всего самого наилучшего!"],
  senderName: "Отправитель",
  personalMessage: "",
  images: [],
  qrCode: "",
  pushPins: []
};

// ── Генерируем admin.html ──────────────────────────────────────────────────

// Для вставки в JS-строки внутри admin.html используем escape
const NO_ANIM_ESC    = escape(NO_ANIM_CSS);
const CSS_ESCAPED    = escape(cardCss);
const STYLE_ESCAPED  = escape(styleCss);
const JQUERY_ESC     = escape(jqueryJs);
const LODASH_ESC     = escape(lodashJs);
const CLIPBOARD_ESC  = escape(clipboardJs);
const CLEAVE_ESC     = escape(cleaveJs);
const SIM_ESC        = escape(simJs);
const LOADER_ESC     = escape(INLINE_LOADER);
const PARTNER_ESC    = escape(partnerJs);
const BODY_ESC       = escape(CARD_BODY_HTML);

const adminHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Конструктор открытки</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f0f2f5;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* ── Шапка ── */
    header {
      background: #1a2340;
      color: #fff;
      padding: 14px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    header h1 { font-size: 18px; font-weight: 600; letter-spacing: 0.3px; }
    header span { font-size: 13px; color: #8899bb; }

    /* ── Основная раскладка ── */
    .workspace {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* ── Левая панель (форма) ── */
    .editor {
      width: 380px;
      min-width: 320px;
      background: #fff;
      border-right: 1px solid #e2e6ee;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .editor-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }

    .editor-body::-webkit-scrollbar { width: 6px; }
    .editor-body::-webkit-scrollbar-track { background: #f0f2f5; }
    .editor-body::-webkit-scrollbar-thumb { background: #cbd3e2; border-radius: 3px; }

    .editor-footer {
      padding: 16px 20px;
      border-top: 1px solid #e2e6ee;
      background: #f8f9fc;
    }

    /* ── Группы полей ── */
    .field-group {
      margin-bottom: 20px;
    }
    .field-group label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #5a6480;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .field-group input[type="text"],
    .field-group textarea {
      width: 100%;
      padding: 9px 12px;
      border: 1px solid #dde2ee;
      border-radius: 6px;
      font-size: 14px;
      color: #1a2340;
      outline: none;
      transition: border-color 0.15s;
      background: #fafbfd;
    }
    .field-group input[type="text"]:focus,
    .field-group textarea:focus {
      border-color: #4c75af;
      background: #fff;
    }
    .field-group textarea {
      min-height: 72px;
      resize: vertical;
    }

    /* ── Секция пожеланий ── */
    .wish-item {
      display: flex;
      gap: 8px;
      margin-bottom: 6px;
    }
    .wish-item input {
      flex: 1;
      padding: 8px 10px;
      border: 1px solid #dde2ee;
      border-radius: 6px;
      font-size: 14px;
      outline: none;
      background: #fafbfd;
    }
    .wish-item input:focus { border-color: #4c75af; background: #fff; }
    .wish-item button {
      padding: 0 10px;
      border: 1px solid #e0e5ef;
      border-radius: 6px;
      background: #fff;
      color: #c0392b;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
    }
    .wish-item button:hover { background: #ffeaea; }

    /* ── Кнопки действий ── */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 9px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: background 0.15s, opacity 0.15s;
    }
    .btn-outline {
      background: #f0f4fb;
      color: #4c75af;
      border: 1px solid #c8d6ee;
    }
    .btn-outline:hover { background: #e0eaf8; }
    .btn-primary {
      background: #0fc3ad;
      color: #fff;
      width: 100%;
      justify-content: center;
      font-size: 15px;
      padding: 12px;
    }
    .btn-primary:hover { background: #0daf9b; }

    /* ── Загрузка изображений ── */
    .upload-zone {
      border: 2px dashed #c8d6ee;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      color: #8899bb;
      font-size: 13px;
    }
    .upload-zone:hover { border-color: #4c75af; background: #f5f8ff; }
    .upload-zone input[type="file"] { display: none; }
    .upload-zone .zone-icon { font-size: 28px; display: block; margin-bottom: 6px; }

    .thumb-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
      gap: 8px;
      margin-top: 10px;
    }
    .thumb-item {
      position: relative;
      aspect-ratio: 1;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #e2e6ee;
    }
    .thumb-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .thumb-item .thumb-del {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 20px;
      height: 20px;
      background: rgba(0,0,0,0.55);
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      cursor: pointer;
    }
    .thumb-item .thumb-del:hover { background: rgba(192,57,43,0.85); }

    .qr-preview {
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .qr-preview img {
      width: 64px;
      height: 64px;
      object-fit: contain;
      border: 1px solid #e2e6ee;
      border-radius: 6px;
    }
    .qr-preview .qr-del {
      font-size: 12px;
      color: #c0392b;
      cursor: pointer;
      text-decoration: underline;
    }

    /* ── Разделитель секций ── */
    .section-title {
      font-size: 11px;
      font-weight: 700;
      color: #8899bb;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 24px 0 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #f0f2f5;
    }

    /* ── Правая панель (превью) ── */
    .preview-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #e8ecf5;
    }

    .preview-toolbar {
      background: #f8f9fc;
      border-bottom: 1px solid #e2e6ee;
      padding: 10px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      flex-shrink: 0;
    }
    .preview-toolbar span {
      font-size: 13px;
      color: #5a6480;
      font-weight: 500;
    }
    .preview-badge {
      background: #eef2ff;
      color: #4c75af;
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 10px;
      font-weight: 600;
    }

    .preview-frame-wrap {
      flex: 1;
      overflow: hidden;
      padding: 16px;
      position: relative;
    }

    #preview-iframe {
      width: 800px;
      height: 680px;
      border: none;
      border-radius: 8px;
      box-shadow: 0 4px 32px rgba(0,0,0,0.18);
      background: #fff;
      transform-origin: top left;
      position: absolute;
    }

    .count-badge {
      display: inline-block;
      background: #4c75af;
      color: #fff;
      border-radius: 10px;
      font-size: 11px;
      padding: 1px 7px;
      margin-left: 4px;
    }

    /* ── Выбор шаблона ── */
    .section-title { margin-top: 8px; }

    .template-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .template-card {
      border: 2px solid #e2e6ee;
      border-radius: 8px;
      padding: 10px;
      cursor: pointer;
      transition: border-color 0.15s, box-shadow 0.15s;
      background: #fafbfd;
    }
    .template-card:hover { border-color: #4c75af; }
    .template-card.active {
      border-color: #0fc3ad;
      box-shadow: 0 0 0 2px rgba(15,195,173,0.2);
      background: #f0fdfb;
    }
    .template-swatch {
      display: flex;
      gap: 4px;
      margin-bottom: 6px;
    }
    .template-swatch span {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: inline-block;
      border: 1px solid rgba(0,0,0,0.08);
    }
    .template-card .tpl-name {
      font-size: 12px;
      font-weight: 600;
      color: #1a2340;
    }

    /* ── Панель кастомизации ── */
    .custom-panel {
      overflow: hidden;
      max-height: 0;
      transition: max-height 0.3s ease;
    }
    .custom-panel.open { max-height: 600px; }

    .custom-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      user-select: none;
    }
    .custom-header .chevron {
      font-size: 12px;
      color: #8899bb;
      transition: transform 0.2s;
    }
    .custom-header.open .chevron { transform: rotate(180deg); }

    .color-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }
    .color-field label {
      display: block;
      font-size: 11px;
      font-weight: 600;
      color: #5a6480;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .color-swatch-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      border: 1px solid #dde2ee;
      border-radius: 6px;
      padding: 5px 8px;
      background: #fafbfd;
      cursor: pointer;
    }
    .color-swatch-wrap:hover { border-color: #4c75af; }
    .color-swatch-wrap input[type="color"] {
      width: 0; height: 0; opacity: 0; position: absolute; pointer-events: none;
    }
    .color-dot {
      width: 20px; height: 20px;
      border-radius: 50%;
      border: 1px solid rgba(0,0,0,0.1);
      flex-shrink: 0;
    }
    .color-hex {
      font-size: 12px;
      font-family: monospace;
      color: #5a6480;
    }

    .layout-toggles { display: flex; flex-direction: column; gap: 8px; margin-bottom: 4px; }
    .layout-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
      color: #3a4460;
    }
    .toggle-switch {
      position: relative; width: 36px; height: 20px;
    }
    .toggle-switch input { opacity: 0; width: 0; height: 0; }
    .toggle-switch .slider {
      position: absolute; inset: 0;
      background: #dde2ee; border-radius: 20px;
      cursor: pointer; transition: background 0.2s;
    }
    .toggle-switch .slider::before {
      content: '';
      position: absolute;
      width: 14px; height: 14px;
      left: 3px; top: 3px;
      background: #fff;
      border-radius: 50%;
      transition: transform 0.2s;
    }
    .toggle-switch input:checked + .slider { background: #0fc3ad; }
    .toggle-switch input:checked + .slider::before { transform: translateX(16px); }

    .reset-link {
      font-size: 11px; color: #8899bb; cursor: pointer;
      text-decoration: underline; display: block; text-align: right; margin-top: 8px;
    }
    .reset-link:hover { color: #4c75af; }

    /* ── Тоггл анимации ── */
    .anim-toggle {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: 1.5px solid #c8d6ee;
      background: #f0f4fb;
      color: #4c75af;
      transition: all 0.2s;
      user-select: none;
    }
    .anim-toggle:hover { background: #e0eaf8; }
    .anim-toggle.active {
      background: #1a2340;
      border-color: #1a2340;
      color: #fff;
    }
    .anim-toggle .dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #4c75af;
      transition: background 0.2s;
    }
    .anim-toggle.active .dot { background: #0fc3ad; }

    /* ── Сообщение об успехе ── */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0fc3ad;
      color: #fff;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 20px rgba(15,195,173,0.4);
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
    }
    .toast.show { opacity: 1; }
  </style>
</head>
<body>

<header>
  <h1>&#127881; Конструктор открытки</h1>
  <span>Редактируйте и скачивайте готовый HTML-файл</span>
</header>

<div class="workspace">

  <!-- ── Левая панель ── -->
  <div class="editor">
    <div class="editor-body">

      <div class="section-title" style="margin-top:0">Шаблон</div>
      <div class="template-grid" id="template-grid"></div>

      <div class="section-title custom-header" id="custom-header" onclick="toggleCustomPanel()">
        Кастомизация
        <span class="chevron">&#9650;</span>
      </div>
      <div class="custom-panel open" id="custom-panel">
        <div class="color-row">
          <div class="color-field">
            <label>Акцент</label>
            <div class="color-swatch-wrap" onclick="document.getElementById('cp-primary').click()">
              <input type="color" id="cp-primary" oninput="setOverrideColor('primary', this.value)">
              <div class="color-dot" id="dot-primary"></div>
              <span class="color-hex" id="hex-primary">#000000</span>
            </div>
          </div>
          <div class="color-field">
            <label>Фон карточки</label>
            <div class="color-swatch-wrap" onclick="document.getElementById('cp-cardbg').click()">
              <input type="color" id="cp-cardbg" oninput="setOverrideColor('cardBg', this.value)">
              <div class="color-dot" id="dot-cardbg"></div>
              <span class="color-hex" id="hex-cardbg">#000000</span>
            </div>
          </div>
          <div class="color-field">
            <label>Пожелания</label>
            <div class="color-swatch-wrap" onclick="document.getElementById('cp-wishes').click()">
              <input type="color" id="cp-wishes" oninput="setOverrideColor('wishes', this.value)">
              <div class="color-dot" id="dot-wishes"></div>
              <span class="color-hex" id="hex-wishes">#000000</span>
            </div>
          </div>
          <div class="color-field">
            <label>Текст</label>
            <div class="color-swatch-wrap" onclick="document.getElementById('cp-text').click()">
              <input type="color" id="cp-text" oninput="setOverrideColor('text', this.value)">
              <div class="color-dot" id="dot-text"></div>
              <span class="color-hex" id="hex-text">#000000</span>
            </div>
          </div>
        </div>

        <div class="layout-toggles">
          <div class="layout-row">
            <span>Слайдер фотографий</span>
            <label class="toggle-switch">
              <input type="checkbox" id="lt-slider" checked onchange="setOverrideLayout('showSlider', this.checked)">
              <span class="slider"></span>
            </label>
          </div>
          <div class="layout-row">
            <span>QR-код / Сертификат</span>
            <label class="toggle-switch">
              <input type="checkbox" id="lt-qr" checked onchange="setOverrideLayout('showQr', this.checked)">
              <span class="slider"></span>
            </label>
          </div>
        </div>
        <span class="reset-link" onclick="resetOverrides()">Сбросить к шаблону</span>
      </div>

      <div class="section-title">Основное</div>

      <div class="field-group">
        <label>Заголовок страницы</label>
        <input type="text" id="f-title" value="Поздравление" oninput="scheduleUpdate()">
      </div>
      <div class="field-group">
        <label>Событие</label>
        <input type="text" id="f-event" value="День Рождения" oninput="scheduleUpdate()">
      </div>

      <div class="section-title">Текст</div>

      <div class="field-group">
        <label>Получатель</label>
        <input type="text" id="f-recipient" value="" placeholder="Имя получателя" oninput="scheduleUpdate()">
      </div>

      <div class="field-group">
        <label>Пожелания <span id="wishes-count" class="count-badge">0</span></label>
        <div id="wishes-list"></div>
        <button class="btn btn-outline" style="margin-top:8px" onclick="addWish()">+ Добавить пожелание</button>
      </div>

      <div class="field-group">
        <label>Отправитель</label>
        <input type="text" id="f-sender" value="" placeholder="Имя отправителя" oninput="scheduleUpdate()">
      </div>

      <div class="field-group">
        <label>Личное сообщение</label>
        <textarea id="f-message" placeholder="Дополнительный текст..." oninput="scheduleUpdate()"></textarea>
      </div>

      <div class="section-title">Медиа</div>

      <div class="field-group">
        <label>Фотографии <span id="images-count" class="count-badge">0</span> / 10</label>
        <div class="upload-zone" onclick="document.getElementById('f-images').click()">
          <input type="file" id="f-images" accept="image/*" multiple onchange="handleImages(this)">
          <span class="zone-icon">&#128247;</span>
          Нажмите или перетащите фото
        </div>
        <div class="thumb-grid" id="thumb-grid"></div>
      </div>

      <div class="field-group">
        <label>QR-код / Сертификат</label>
        <div class="upload-zone" onclick="document.getElementById('f-qr').click()">
          <input type="file" id="f-qr" accept="image/*" onchange="handleQr(this)">
          <span class="zone-icon">&#128241;</span>
          Загрузить QR-код или изображение
        </div>
        <div id="qr-preview-area"></div>
      </div>

    </div><!-- /editor-body -->

    <div class="editor-footer">
      <button class="btn btn-primary" onclick="exportCard()">&#11015; Скачать открытку (HTML)</button>
    </div>
  </div><!-- /editor -->

  <!-- ── Правая панель ── -->
  <div class="preview-panel">
    <div class="preview-toolbar">
      <span>Предпросмотр</span>
      <span class="preview-badge">Live</span>
      <button class="anim-toggle" id="anim-toggle-btn" onclick="toggleAnimation()" title="Включить/выключить анимацию конверта">
        <span class="dot"></span>
        <span id="anim-toggle-label">Анимация выкл.</span>
      </button>
    </div>
    <div class="preview-frame-wrap">
      <iframe id="preview-iframe" sandbox="allow-scripts allow-same-origin"></iframe>
    </div>
  </div>

</div><!-- /workspace -->

<div class="toast" id="toast">&#10003; Открытка скачана!</div>

<script>
// ══════════════════════════════════════════════════════════════════
//  Встроенные ресурсы открытки (читаются build.js из исходников)
// ══════════════════════════════════════════════════════════════════

const TEMPLATES = ${JSON.stringify(templates, null, 2)};
const NO_ANIM_CSS = \`${NO_ANIM_ESC}\`;
const CARD_CSS   = \`${CSS_ESCAPED}\`;
const STYLE_CSS  = \`${STYLE_ESCAPED}\`;
const JQUERY_JS  = \`${JQUERY_ESC}\`;
const LODASH_JS  = \`${LODASH_ESC}\`;
const CLIPBOARD  = \`${CLIPBOARD_ESC}\`;
const CLEAVE_JS  = \`${CLEAVE_ESC}\`;
const SIM_JS     = \`${SIM_ESC}\`;
const LOADER_JS  = \`${LOADER_ESC}\`;
const PARTNER_JS = \`${PARTNER_ESC}\`;
const CARD_BODY  = \`${BODY_ESC}\`;

// ══════════════════════════════════════════════════════════════════
//  Режим анимации (false = без анимации, сразу видно содержимое)
// ══════════════════════════════════════════════════════════════════

let animationMode = false;

function toggleAnimation() {
  animationMode = !animationMode;
  const btn   = document.getElementById('anim-toggle-btn');
  const label = document.getElementById('anim-toggle-label');
  if (animationMode) {
    btn.classList.add('active');
    label.textContent = 'Анимация вкл.';
  } else {
    btn.classList.remove('active');
    label.textContent = 'Анимация выкл.';
  }
  updatePreview();
}

// ══════════════════════════════════════════════════════════════════
//  Состояние редактора
// ══════════════════════════════════════════════════════════════════

let state = {
  title:           "Поздравление",
  event:           "День Рождения",
  recipientName:   "",
  wishes:          ["Поздравляю с днем рождения!", "Желаю всего самого наилучшего!"],
  senderName:      "",
  personalMessage: "",
  images:          [],   // base64 data URLs
  qrCode:          "",   // base64 data URL
  pushPins:        []
};

// ══════════════════════════════════════════════════════════════════
//  Шаблоны
// ══════════════════════════════════════════════════════════════════

function renderTemplates() {
  const grid = document.getElementById('template-grid');
  grid.innerHTML = '';
  TEMPLATES.forEach(function(tpl) {
    const card = document.createElement('div');
    card.className = 'template-card' + (state.template && state.template.id === tpl.id ? ' active' : '');
    card.onclick = function() { selectTemplate(tpl); };
    const c = tpl.colors || {};
    card.innerHTML =
      '<div class="template-swatch">' +
        '<span style="background:' + (c.primary || '#ccc') + '"></span>' +
        '<span style="background:' + (c.cardBg  || '#fff') + '"></span>' +
        '<span style="background:' + (c.wishes  || '#333') + '"></span>' +
      '</div>' +
      '<div class="tpl-name">' + tpl.name + '</div>';
    grid.appendChild(card);
  });
}

function selectTemplate(tpl) {
  state.template = tpl;
  state.overrides = { colors: {}, layout: {} };
  renderTemplates();
  syncCustomPanel();
  scheduleUpdate();
}

// ══════════════════════════════════════════════════════════════════
//  Кастомизация (оверрайды поверх шаблона)
// ══════════════════════════════════════════════════════════════════

function syncCustomPanel() {
  const tpl = state.template || {};
  const c = Object.assign({}, tpl.colors || {}, (state.overrides && state.overrides.colors) || {});
  const l = Object.assign({}, tpl.layout || {}, (state.overrides && state.overrides.layout) || {});

  setColorPicker('primary', c.primary || '#0fc3ad');
  setColorPicker('cardbg',  c.cardBg  || '#f1f3f8');
  setColorPicker('wishes',  c.wishes  || '#2c3e50');
  setColorPicker('text',    c.text    || '#1a2340');

  const sliderEl = document.getElementById('lt-slider');
  const qrEl     = document.getElementById('lt-qr');
  if (sliderEl) sliderEl.checked = l.showSlider !== false;
  if (qrEl)     qrEl.checked     = l.showQr     !== false;
}

function setColorPicker(key, hex) {
  const input = document.getElementById('cp-' + key);
  const dot   = document.getElementById('dot-' + key);
  const label = document.getElementById('hex-' + key);
  if (input) input.value = hex;
  if (dot)   dot.style.background = hex;
  if (label) label.textContent = hex;
}

function setOverrideColor(key, hex) {
  if (!state.overrides) state.overrides = { colors: {}, layout: {} };
  state.overrides.colors[key] = hex;
  setColorPicker(key === 'cardBg' ? 'cardbg' : key, hex);
  scheduleUpdate();
}

function setOverrideLayout(key, val) {
  if (!state.overrides) state.overrides = { colors: {}, layout: {} };
  state.overrides.layout[key] = val;
  scheduleUpdate();
}

function resetOverrides() {
  state.overrides = { colors: {}, layout: {} };
  syncCustomPanel();
  scheduleUpdate();
}

function toggleCustomPanel() {
  const panel  = document.getElementById('custom-panel');
  const header = document.getElementById('custom-header');
  panel.classList.toggle('open');
  header.classList.toggle('open');
}

// ══════════════════════════════════════════════════════════════════
//  Инициализация форм
// ══════════════════════════════════════════════════════════════════

function init() {
  state.template  = TEMPLATES[0];
  state.overrides = { colors: {}, layout: {} };
  renderTemplates();
  syncCustomPanel();
  renderWishes();
  scheduleUpdate();
}

// ══════════════════════════════════════════════════════════════════
//  Пожелания
// ══════════════════════════════════════════════════════════════════

function renderWishes() {
  const list = document.getElementById('wishes-list');
  list.innerHTML = '';
  state.wishes.forEach(function(wish, i) {
    const row = document.createElement('div');
    row.className = 'wish-item';
    row.innerHTML =
      '<input type="text" value="' + escAttr(wish) + '" oninput="updateWish(' + i + ', this.value)">' +
      '<button onclick="removeWish(' + i + ')">&#10005;</button>';
    list.appendChild(row);
  });
  document.getElementById('wishes-count').textContent = state.wishes.length;
}

function addWish() {
  state.wishes.push('');
  renderWishes();
  scheduleUpdate();
}

function removeWish(i) {
  state.wishes.splice(i, 1);
  renderWishes();
  scheduleUpdate();
}

function updateWish(i, val) {
  state.wishes[i] = val;
  scheduleUpdate();
}

// ══════════════════════════════════════════════════════════════════
//  Загрузка изображений
// ══════════════════════════════════════════════════════════════════

function handleImages(input) {
  const files = Array.from(input.files);
  const remaining = 10 - state.images.length;
  files.slice(0, remaining).forEach(function(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      state.images.push(e.target.result);
      renderThumbs();
      scheduleUpdate();
    };
    reader.readAsDataURL(file);
  });
  input.value = '';
}

function renderThumbs() {
  const grid = document.getElementById('thumb-grid');
  grid.innerHTML = '';
  state.images.forEach(function(src, i) {
    const item = document.createElement('div');
    item.className = 'thumb-item';
    item.innerHTML =
      '<img src="' + src + '">' +
      '<div class="thumb-del" onclick="removeImage(' + i + ')">&#10005;</div>';
    grid.appendChild(item);
  });
  document.getElementById('images-count').textContent = state.images.length;
}

function removeImage(i) {
  state.images.splice(i, 1);
  renderThumbs();
  scheduleUpdate();
}

// ══════════════════════════════════════════════════════════════════
//  QR-код
// ══════════════════════════════════════════════════════════════════

function handleQr(input) {
  if (!input.files.length) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    state.qrCode = e.target.result;
    renderQrPreview();
    scheduleUpdate();
  };
  reader.readAsDataURL(input.files[0]);
  input.value = '';
}

function renderQrPreview() {
  const area = document.getElementById('qr-preview-area');
  if (!state.qrCode) { area.innerHTML = ''; return; }
  area.innerHTML =
    '<div class="qr-preview">' +
    '<img src="' + state.qrCode + '">' +
    '<span class="qr-del" onclick="removeQr()">Удалить</span>' +
    '</div>';
}

function removeQr() {
  state.qrCode = '';
  renderQrPreview();
  scheduleUpdate();
}

// ══════════════════════════════════════════════════════════════════
//  Сбор данных из формы
// ══════════════════════════════════════════════════════════════════

function collectState() {
  state.title           = document.getElementById('f-title').value;
  state.event           = document.getElementById('f-event').value;
  state.recipientName   = document.getElementById('f-recipient').value;
  state.senderName      = document.getElementById('f-sender').value;
  state.personalMessage = document.getElementById('f-message').value;
  // wishes, images, qrCode обновляются отдельно
}

// ══════════════════════════════════════════════════════════════════
//  Генерация HTML открытки
// ══════════════════════════════════════════════════════════════════

function buildTemplateVars(tpl, overrides) {
  const c = Object.assign({}, (tpl && tpl.colors) || {}, (overrides && overrides.colors) || {});
  const t = (tpl && tpl.typography) || {};
  return ':root{' +
    (c.primary    ? '--color-primary:' + c.primary + ';'   : '') +
    (c.cardBg     ? '--card-bg:'       + c.cardBg  + ';'   : '') +
    (c.text       ? '--text-color:'    + c.text    + ';'   : '') +
    (c.wishes     ? '--wishes-color:'  + c.wishes  + ';'   : '') +
    (t.wishesSize ? '--wishes-size:'   + t.wishesSize + ';': '') +
    (t.align      ? '--text-align:'    + t.align   + ';'   : '') +
  '}';
}

function buildLayoutCss(tpl, overrides) {
  const l = Object.assign({}, (tpl && tpl.layout) || {}, (overrides && overrides.layout) || {});
  let css = '';
  if (l.showSlider === false) css += '.sim-slider,.card-block{display:none!important;}';
  if (l.showQr     === false) css += '#qr,.qr-code__tabs{display:none!important;}';
  return css;
}

function generateCardHtml(skipAnim) {
  const data    = JSON.stringify(state, null, 2);
  const tpl     = state.template  || null;
  const ov      = state.overrides || {};
  const tplVars   = buildTemplateVars(tpl, ov);
  const tplLayout = buildLayoutCss(tpl, ov);
  const envColor  = (ov.colors && ov.colors.primary) || (tpl && tpl.colors && tpl.colors.primary) || '';
  const isDark    = (tpl && tpl.envelope === 'dark');
  const envClass  = isDark ? 'envelope-dark' : '';
  const extraCss = tplVars + tplLayout + (skipAnim ? NO_ANIM_CSS : '');
  return '<!DOCTYPE html>\\n' +
    '<html lang="ru">\\n' +
    '<head>\\n' +
    '  <meta charset="UTF-8">\\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\\n' +
    '  <title>' + (state.title || 'Открытка') + '</title>\\n' +
    '  <style>\\n' + CARD_CSS + '\\n' + STYLE_CSS + '\\n' + extraCss + '\\n  </style>\\n' +
    '</head>\\n' +
    '<body class="' + envClass.trim() + '">\\n' +
    CARD_BODY + '\\n' +
    '<script>const jsonData = ' + data + ';<\\/script>\\n' +
    '<script>' + JQUERY_JS + '<\\/script>\\n' +
    '<script>' + LODASH_JS + '<\\/script>\\n' +
    '<script>' + CLIPBOARD  + '<\\/script>\\n' +
    '<script>' + CLEAVE_JS  + '<\\/script>\\n' +
    '<script>' + SIM_JS     + '<\\/script>\\n' +
    '<script>' + LOADER_JS  + '<\\/script>\\n' +
    '<script>' + PARTNER_JS + '<\\/script>\\n' +
    '</body>\\n</html>';
}

// ══════════════════════════════════════════════════════════════════
//  Обновление превью
// ══════════════════════════════════════════════════════════════════

let updateTimer = null;

function scheduleUpdate() {
  collectState();
  clearTimeout(updateTimer);
  updateTimer = setTimeout(updatePreview, 400);
}

function updatePreview() {
  // skipAnim = true когда анимация ВЫКЛЮЧЕНА (режим редактирования)
  const html = generateCardHtml(!animationMode);
  const iframe = document.getElementById('preview-iframe');
  iframe.srcdoc = html;
}

// ══════════════════════════════════════════════════════════════════
//  Экспорт
// ══════════════════════════════════════════════════════════════════

function exportCard() {
  collectState();
  // Экспорт всегда с анимацией (skipAnim = false)
  const html = generateCardHtml(false);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'card.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function() { URL.revokeObjectURL(url); }, 5000);
  showToast();
}

function showToast() {
  const t = document.getElementById('toast');
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 2500);
}

// ══════════════════════════════════════════════════════════════════
//  Утилиты
// ══════════════════════════════════════════════════════════════════

function escAttr(str) {
  return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

// ══════════════════════════════════════════════════════════════════
//  Масштабирование превью
// ══════════════════════════════════════════════════════════════════

function scalePreview() {
  const wrap   = document.querySelector('.preview-frame-wrap');
  const iframe = document.getElementById('preview-iframe');
  const IFRAME_W = 800, IFRAME_H = 680;
  const availW = wrap.offsetWidth  - 32;
  const availH = wrap.offsetHeight - 32;
  const scale  = Math.min(availW / IFRAME_W, availH / IFRAME_H, 1);
  iframe.style.transform = 'scale(' + scale + ')';
  iframe.style.left = (16 + (availW - IFRAME_W * scale) / 2) + 'px';
  iframe.style.top  = '16px';
}

window.addEventListener('resize', scalePreview);

// ══════════════════════════════════════════════════════════════════
//  Запуск
// ══════════════════════════════════════════════════════════════════

init();
scalePreview();
</script>

</body>
</html>`;

fs.writeFileSync(path.join(ROOT, 'admin.html'), adminHtml, 'utf8');
console.log('✅ admin.html успешно создан!');
console.log('   Размер: ' + Math.round(adminHtml.length / 1024) + ' KB');
console.log('   Откройте admin.html в браузере для работы с конструктором.');
