/**
 * <gh-feedback> — A Web Component that adds a floating feedback button
 * and files GitHub Issues via a proxy endpoint or direct API call.
 *
 * Usage:
 *   <gh-feedback repo="owner/repo" endpoint="https://your-worker.example.com/feedback"></gh-feedback>
 *   <gh-feedback repo="owner/repo" token="ghp_xxx"></gh-feedback>
 *
 * @see https://github.com/zeveck/gh-feedback
 */

const ICONS = {
  chat: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z',
  bug: 'M20 8h-2.81a5.985 5.985 0 0 0-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5s-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z',
  megaphone: 'M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1l5 6V3L5 9H4z',
  lightbulb: 'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z',
  pencil: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  flag: 'M14.4 6l-.24-1.2c-.09-.46-.5-.8-.98-.8H6c-.55 0-1 .45-1 1v15h2v-6h5.6l.24 1.2c.09.47.5.8.98.8H19c.55 0 1-.45 1-1V7c0-.55-.45-1-1-1h-4.6z',
  memo: 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 2l5 5h-5V4zM8 17h8v-2H8v2zm0-4h8v-2H8v2zm0-4h5V7H8v2z',
};

const TYPE_DEFS = {
  bug: { label: 'Bug', icon: ICONS.bug, ghLabel: 'bug' },
  feature: { label: 'Feature', icon: ICONS.lightbulb, ghLabel: 'enhancement' },
  question: { label: 'Question', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z', ghLabel: 'question' },
  ui: { label: 'UI', icon: 'M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c.55 0 1-.45 1-1 0-.28-.11-.53-.29-.71-.18-.18-.29-.43-.29-.71 0-.55.45-1 1-1h1.67c3.68 0 6.67-2.99 6.67-6.67C22 5.92 17.51 2 12 2zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z', ghLabel: 'ui' },
  docs: { label: 'Docs', icon: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z', ghLabel: 'documentation' },
  performance: { label: 'Performance', icon: 'M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13.01 3h1l-1 7h3.51c.4 0 .62.19.4.66C12.97 17.55 11 21 11 21z', ghLabel: 'performance' },
};

function iconSvg(name, width, height) {
  if (name === 'none') return '';
  const path = ICONS[name] || ICONS.chat;
  return `<svg viewBox="0 0 24 24" width="${width}" height="${height}" fill="currentColor"><path d="${path}"/></svg>`;
}

const STYLES = `
  :host {
    --_primary: var(--gh-feedback-primary, #238636);
    --_primary-hover: var(--gh-feedback-primary-hover, #2ea043);
    --_popup-accent: var(--gh-feedback-popup-color, var(--_primary));
    --_popup-accent-hover: var(--gh-feedback-popup-color-hover, var(--_primary-hover));
    --_bg: var(--gh-feedback-bg, #ffffff);
    --_text: var(--gh-feedback-text, #1f2328);
    --_border: var(--gh-feedback-border, #d1d9e0);
    --_input-bg: var(--gh-feedback-input-bg, #f6f8fa);
    --_error: var(--gh-feedback-error, #d1242f);
    --_success: var(--gh-feedback-success, #238636);
    --_fab-bg: var(--gh-feedback-fab-bg, var(--_primary));
    --_fab-text: var(--gh-feedback-fab-text, #ffffff);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif;
    font-size: 14px;
    line-height: 1.5;
  }

  :host([theme="dark"]) {
    --_primary: var(--gh-feedback-primary, #238636);
    --_primary-hover: var(--gh-feedback-primary-hover, #2ea043);
    --_popup-accent: var(--gh-feedback-popup-color, var(--_primary));
    --_popup-accent-hover: var(--gh-feedback-popup-color-hover, var(--_primary-hover));
    --_bg: var(--gh-feedback-bg, #1c2128);
    --_text: var(--gh-feedback-text, #e6edf3);
    --_border: var(--gh-feedback-border, #444c56);
    --_input-bg: var(--gh-feedback-input-bg, #22272e);
    --_error: var(--gh-feedback-error, #d1242f);
    --_success: var(--gh-feedback-success, #238636);
    --_fab-bg: var(--gh-feedback-fab-bg, var(--_primary));
    --_fab-text: var(--gh-feedback-fab-text, #ffffff);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .fab {
    position: fixed;
    z-index: 999997;
    width: 48px;
    height: 48px;
    border-radius: 24px;
    border: none;
    background: var(--_fab-bg);
    color: var(--_fab-text);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    transition: background 0.15s ease-out;
    padding: 0;
  }
  .fab:hover { background: var(--_primary-hover); }
  .fab:focus-visible { outline: 2px solid var(--_primary); outline-offset: 2px; }

  .fab.pill {
    width: auto;
    padding: 0 20px;
    border-radius: 28px;
  }
  .fab .fab-text {
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;
  }

  .fab.bottom-right { bottom: 20px; right: 20px; }
  .fab.bottom-left  { bottom: 20px; left: 20px; }
  .fab.top-right    { top: 20px; right: 20px; }
  .fab.top-left     { top: 20px; left: 20px; }

  /* Trigger: button */
  .trigger-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    background: var(--_primary);
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease-out;
    font-family: inherit;
  }
  .trigger-btn:hover { background: var(--_primary-hover); }
  .trigger-btn:focus-visible { outline: 2px solid var(--_primary); outline-offset: 2px; }

  /* Trigger: link */
  .trigger-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    color: var(--_primary);
    font-size: 14px;
    font-family: inherit;
    cursor: pointer;
    text-decoration: none;
    padding: 0;
  }
  .trigger-link:hover { text-decoration: underline; }

  /* Size: sm */
  .fab.size-sm { width: 36px; height: 36px; border-radius: 18px; }
  .fab.pill.size-sm { width: auto; min-height: 36px; height: auto; border-radius: 18px; padding: 0 14px; }
  .trigger-btn.size-sm { font-size: 13px; padding: 6px 12px; }
  .trigger-link.size-sm { font-size: 13px; }

  /* Size: md (default) */
  .fab.size-md { width: 48px; height: 48px; border-radius: 24px; }
  .fab.pill.size-md { width: auto; min-height: 48px; height: auto; border-radius: 24px; padding: 0 20px; }
  .trigger-btn.size-md { font-size: 14px; padding: 8px 16px; }
  .trigger-link.size-md { font-size: 14px; }

  /* Size: lg */
  .fab.size-lg { width: 56px; height: 56px; border-radius: 28px; }
  .fab.pill.size-lg { width: auto; min-height: 56px; height: auto; border-radius: 28px; padding: 0 20px; }
  .trigger-btn.size-lg { font-size: 16px; padding: 10px 20px; }

  /* Icon-only buttons get equal padding (square) — must come after size rules */
  .trigger-btn.icon-only { padding: 8px; }
  .trigger-btn.icon-only.size-sm { padding: 6px; }
  .trigger-btn.icon-only.size-lg { padding: 10px; }
  .trigger-link.size-lg { font-size: 16px; }

  .backdrop {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.3);
    z-index: 999998;
    opacity: 0;
    transition: opacity 150ms ease-out;
  }
  .backdrop.open { display: block; opacity: 1; }

  .popup {
    display: none;
    position: fixed;
    z-index: 999999;
    width: 380px;
    max-width: calc(100vw - 32px);
    /* Never taller than the screen (a phone held sideways is ~390px tall). */
    max-height: min(600px, calc(100vh - 32px));
    max-height: min(600px, calc(100dvh - 32px));
    overflow-y: auto;
    overscroll-behavior: contain;
    background: var(--_bg);
    color: var(--_text);
    border: 1px solid var(--_border);
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
    padding: 20px;
    transform: scale(0.95);
    opacity: 0;
    transition: transform 150ms ease-out, opacity 150ms ease-out;
  }
  .popup.open { display: block; transform: scale(1); opacity: 1; }

  .popup.bottom-right { bottom: 88px; right: 20px; }
  .popup.bottom-left  { bottom: 88px; left: 20px; }
  .popup.top-right    { top: 88px; right: 20px; }
  .popup.top-left     { top: 88px; left: 20px; }
  .popup.bottom-right, .popup.bottom-left, .popup.top-right, .popup.top-left {
    max-height: min(600px, calc(100vh - 108px));
    max-height: min(600px, calc(100dvh - 108px));
  }
  .popup.centered     { top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.95); }
  .popup.centered.open { transform: translate(-50%, -50%) scale(1); }

  @media (max-width: 479px) {
    /* .popup.centered.open is more specific than .popup.open: undo its centering too. */
    .popup.open, .popup.centered.open {
      transform: none;
      bottom: 0;
      left: 0;
      right: 0;
      top: auto;
      width: 100%;
      max-width: 100%;
      max-height: 80vh;
      max-height: 80dvh;
      border-radius: 12px 12px 0 0;
    }
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  .header h2 {
    font-size: 16px;
    font-weight: 600;
    color: var(--_text);
  }
  .close-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--_text);
    font-size: 20px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
  }
  .close-btn:hover { background: var(--_input-bg); }
  .close-btn:focus-visible { outline: 2px solid var(--_popup-accent); outline-offset: 2px; }

  .type-selector {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }
  .type-pill {
    flex: 1 1 30%;
    min-width: 0;
    padding: 6px 12px;
    border: 1px solid var(--_border);
    border-radius: 20px;
    background: var(--_bg);
    color: var(--_text);
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    transition: background 0.1s, border-color 0.1s;
  }
  .type-selector.multi-row .type-pill { max-width: 33%; }
  .type-pill:hover { border-color: var(--_popup-accent); }
  .type-pill:focus-visible { outline: 2px solid var(--_popup-accent); outline-offset: 2px; }
  .type-pill.active {
    background: var(--_popup-accent);
    color: #ffffff;
    border-color: var(--_popup-accent);
  }

  .severity-selector {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }
  .severity-selector.hidden { display: none; }
  .severity-pill {
    flex: 1;
    padding: 6px 12px;
    border: 1px solid var(--_border);
    border-radius: 20px;
    background: var(--_bg);
    color: var(--_text);
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    text-align: center;
    transition: background 0.1s, border-color 0.1s;
  }
  .severity-pill:hover { border-color: var(--_popup-accent); }
  .severity-pill:focus-visible { outline: 2px solid var(--_popup-accent); outline-offset: 2px; }
  .severity-pill.active {
    background: var(--_popup-accent);
    color: #ffffff;
    border-color: var(--_popup-accent);
  }

  .field { margin-bottom: 12px; }
  .field label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 4px;
    color: var(--_text);
  }
  .field input, .field textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--_border);
    border-radius: 6px;
    background: var(--_input-bg);
    color: var(--_text);
    font-size: 14px;
    font-family: inherit;
    transition: border-color 0.15s;
  }
  .field input:focus, .field textarea:focus {
    outline: none;
    border-color: var(--_popup-accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--_popup-accent) 15%, transparent);
  }
  .field textarea { resize: vertical; }

  .char-count {
    font-size: 11px;
    color: var(--_border);
    text-align: right;
    margin-top: 2px;
  }

  .error-msg {
    color: var(--_error);
    font-size: 13px;
    margin-bottom: 8px;
    display: none;
  }
  .error-msg.visible { display: block; }

  .success-msg {
    text-align: center;
    padding: 20px 0;
  }
  .success-msg .check {
    color: var(--_success);
    font-size: 36px;
    margin-bottom: 8px;
  }
  .success-msg a {
    color: var(--_popup-accent);
    text-decoration: underline;
  }

  .submit-btn {
    width: 100%;
    padding: 10px;
    border: none;
    border-radius: 6px;
    background: var(--_popup-accent);
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background 0.15s;
  }
  .submit-btn:hover:not(:disabled) { background: var(--_popup-accent-hover); }
  .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .submit-btn:focus-visible { outline: 2px solid var(--_popup-accent); outline-offset: 2px; }

  .spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* Link mode: screenshot thumbnail and hints */
  .shot {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    font-size: 12px;
  }
  .shot[hidden] { display: none; }
  .shot img {
    max-width: 96px;
    max-height: 64px;
    border: 1px solid var(--_border);
    border-radius: 4px;
    object-fit: contain;
    background: var(--_input-bg);
  }
  .shot-remove, .link-btn {
    background: none;
    border: none;
    padding: 0;
    color: var(--_popup-accent);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
  .shot-remove:focus-visible, .link-btn:focus-visible { outline: 2px solid var(--_popup-accent); outline-offset: 2px; }
  .link-hint {
    font-size: 12px;
    opacity: 0.75;
    text-align: center;
    margin-top: 8px;
  }
  .link-note p { margin-bottom: 8px; }
  .link-note .done-btn { margin-top: 12px; }
`;

/** Longest pre-filled new-issue URL link mode will build (GitHub answers 414 past its limit). */
const LINK_URL_MAX = 6000;

const SHOT_HINT = '<!-- Your screenshot is copied: click here and paste it (Ctrl/Cmd+V) -->';

function dataUrlToBlob(url) {
  const m = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(url);
  if (!m) return null;
  const type = m[1] || 'application/octet-stream';
  if (!m[2]) return new Blob([decodeURIComponent(m[3])], { type });
  const bin = atob(m[3]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

/** Normalise what getScreenshot() returned to an image Blob, or null. */
async function toImageBlob(value) {
  const v = await value;
  if (v instanceof Blob) return v.size ? v : null;
  if (typeof v === 'string' && v.startsWith('data:image/')) return dataUrlToBlob(v);
  return null;
}

/** The clipboard only takes PNG, so re-encode anything else. */
async function toPng(blob) {
  if (blob.type === 'image/png') return blob;
  const bmp = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  canvas.getContext('2d').drawImage(bmp, 0, 0);
  bmp.close?.();
  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('PNG encode failed'))), 'image/png'));
}

function canCopyImage() {
  return typeof ClipboardItem !== 'undefined' && !!navigator.clipboard?.write &&
    (typeof ClipboardItem.supports !== 'function' || ClipboardItem.supports('image/png'));
}

/** Stop "@name" from pinging a GitHub user (a zero-width space after the @). */
function noMentions(s) {
  return String(s).replace(/(^|[^\w])@(?=\w)/g, '$1@\u200B');
}

/** Make a value safe inside one cell of a Markdown table. */
function escCell(s) {
  return noMentions(String(s)
    .replace(/\r\n|\r|\n/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/([|`*_~])/g, '\\$1'));
}

/** A CSS colour, or null if the value isn't one. */
function cssColor(v) {
  return v && CSS.supports('color', v) && !/["'<>&]/.test(v) ? v : null;
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

class GhFeedback extends HTMLElement {
  static get observedAttributes() {
    return ['repo', 'endpoint', 'token', 'position', 'theme', 'labels', 'button-text', 'trigger', 'no-severity', 'no-type-icons', 'icon', 'size', 'color', 'popup-color', 'types', 'border-color', 'border-width', 'border-radius', 'mode', 'template', 'template-field'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._isOpen = false;
    this._type = 'bug';
    this._severity = 'medium';
    this._rateLimitTimer = null;
    this._autoCloseTimer = null;
    this._escapeHandler = null;
    this._focusTrapHandler = null;
    this._pendingRender = false;
    // Hooks a page set before this script loaded are own properties already
    // (the element was upgraded later): keep them rather than resetting them.
    this.getContext = this.getContext ?? null;
    this.getScreenshot = this.getScreenshot ?? null;
    this.openLink = this.openLink ?? null;    // link mode: optional (url) => truthy if it opened the page itself
    this._token = null;
    if (Object.prototype.hasOwnProperty.call(this, 'token')) {
      // An early `el.token = ...` shadows the accessor; move it behind it.
      const early = this.token;
      delete this.token;
      this.token = early;
    }
    this._shot = null;       // Promise<Blob|null> captured when the form opened (link mode)
    this._shotUrl = null;    // object URL for the thumbnail / download link
    this._shotRemoved = false;
    this._submitId = 0;      // bumped on close/reset, so a late result from an old submit is ignored
    this._abort = null;      // AbortController of the in-flight request
    this._returnFocus = null;
    // While open, keep keys and pointer input typed into the popup away from the
    // page (a game's own listeners). Bubbling phase, so page capture listeners still run.
    const stop = (e) => {
      if (!this._isOpen) return;
      e.stopPropagation();
      // Escape no longer reaches the document listener from here: close directly.
      if (e.type === 'keydown' && e.key === 'Escape') this._close();
    };
    for (const t of ['keydown', 'keyup', 'keypress', 'pointerdown', 'pointerup', 'pointermove',
      'mousedown', 'mouseup', 'mousemove', 'click', 'dblclick', 'contextmenu', 'touchstart', 'touchmove', 'touchend', 'wheel']) {
      this.shadowRoot.addEventListener(t, stop);
    }
  }

  /** True while the feedback popup is open. */
  get isOpen() {
    return this._isOpen;
  }

  /** Set token via JS property to avoid exposing it in the DOM. */
  get token() {
    return this._token ?? this.getAttribute('token');
  }

  set token(value) {
    this._token = value;
  }

  connectedCallback() {
    this._applyColor(this.getAttribute('color'));
    this._applyPopupColor(this.getAttribute('popup-color'));
    this._render();
    this._bindEvents();
  }

  disconnectedCallback() {
    if (this._escapeHandler) {
      document.removeEventListener('keydown', this._escapeHandler);
      this._escapeHandler = null;
    }
    if (this._isOpen) this._close();
    if (this._rateLimitTimer) { clearInterval(this._rateLimitTimer); this._rateLimitTimer = null; }
    if (this._autoCloseTimer) { clearTimeout(this._autoCloseTimer); this._autoCloseTimer = null; }
    clearTimeout(this._focusTimer);
    this._focusTimer = null;
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'repo' && newVal && !this._parseRepo()) {
      console.warn('gh-feedback: "repo" must be a GitHub repository URL or owner/repo format');
    }
    if (name === 'color') {
      this._applyColor(newVal);
    }
    if (name === 'popup-color') {
      this._applyPopupColor(newVal);
    }
    if (this.isConnected) {
      if (this._isOpen) {
        this._pendingRender = true;
      } else {
        this._render();
        this._bindEvents();
      }
    }
  }

  _getIcon() {
    const icon = this.getAttribute('icon');
    if (icon === 'none') return 'none';
    return ICONS[icon] ? icon : 'memo';
  }

  _parseRepo() {
    let repo = this.getAttribute('repo') || '';
    // Strip GitHub URL prefix
    repo = repo.replace(/^https?:\/\/(www\.)?github\.com\//, '');
    // Strip non-protocol prefix (github.com/owner/repo)
    repo = repo.replace(/^(www\.)?github\.com\//, '');
    // Strip trailing slash
    repo = repo.replace(/\/$/, '');
    // Validate: must be exactly owner/repo (two segments)
    if (repo.split('/').length !== 2 || !repo.split('/')[0] || !repo.split('/')[1]) return null;
    return repo;
  }

  _getSize() {
    const size = this.getAttribute('size');
    if (size === 'sm' || size === 'lg') return size;
    const px = parseInt(size, 10);
    if (px > 0) return px; // numeric pixel value
    return 'md'; // default
  }

  _lighten(hex, percent) {
    if (!hex || typeof hex !== 'string') return hex;
    const h = hex.replace('#', '');
    // Expand 3-digit shorthand: #fff → #ffffff
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    if (!/^[0-9a-fA-F]{6}$/.test(full)) return `color-mix(in srgb, ${hex} 85%, white)`;
    const r = parseInt(full.substring(0, 2), 16);
    const g = parseInt(full.substring(2, 4), 16);
    const b = parseInt(full.substring(4, 6), 16);
    const lighten = (c) => Math.min(255, Math.round(c + (255 - c) * (percent / 100)));
    return `#${[r, g, b].map(lighten).map(c => c.toString(16).padStart(2, '0')).join('')}`;
  }

  _applyColor(color) {
    color = cssColor(color);
    if (color) {
      this.style.setProperty('--gh-feedback-primary', color);
      this.style.setProperty('--gh-feedback-primary-hover', this._lighten(color, 15));
      this.style.setProperty('--gh-feedback-fab-bg', color);
    } else {
      this.style.removeProperty('--gh-feedback-primary');
      this.style.removeProperty('--gh-feedback-primary-hover');
      this.style.removeProperty('--gh-feedback-fab-bg');
    }
  }

  _applyPopupColor(color) {
    color = cssColor(color);
    if (color) {
      this.style.setProperty('--gh-feedback-popup-color', color);
      this.style.setProperty('--gh-feedback-popup-color-hover', this._lighten(color, 15));
    } else {
      this.style.removeProperty('--gh-feedback-popup-color');
      this.style.removeProperty('--gh-feedback-popup-color-hover');
    }
  }

  _getPosition() {
    const pos = this.getAttribute('position');
    if (['bottom-right', 'bottom-left', 'top-right', 'top-left'].includes(pos)) return pos;
    return 'bottom-right';
  }

  _getTriggerType() {
    const t = this.getAttribute('trigger');
    if (t === 'fab' || t === 'link' || t === 'none') return t;
    return 'button';
  }

  /**
   * How Submit files the report: "proxy" (POST to endpoint), "direct" (GitHub API
   * with a token), or "link" (open a pre-filled GitHub new-issue page; no server).
   * An explicit mode attribute wins; otherwise endpoint → proxy, token → direct, else link.
   */
  _getMode() {
    const m = this.getAttribute('mode');
    if (m === 'link' || m === 'proxy' || m === 'direct') return m;
    if (this.getAttribute('endpoint')) return 'proxy';
    if (this.token) return 'direct';
    return 'link';
  }

  _submitLabel() {
    return this._getMode() === 'link' ? 'Continue on GitHub' : 'Submit Feedback';
  }

  /**
   * Open the feedback popup programmatically.
   * Use with trigger="none" to control the popup from your own button:
   *   <button onclick="document.querySelector('gh-feedback').open()">Feedback</button>
   *   <gh-feedback trigger="none" repo="..." endpoint="..."></gh-feedback>
   */
  open() { this._open(); }

  /**
   * Close the feedback popup programmatically.
   * Use with trigger="none" when controlling the popup from external UI.
   */
  close() { this._close(); }

  /**
   * Toggle the feedback popup open/closed programmatically.
   * Use with trigger="none" to control the popup from your own toggle button:
   *   <button onclick="document.querySelector('gh-feedback').toggle()">Toggle Feedback</button>
   *   <gh-feedback trigger="none" repo="..." endpoint="..."></gh-feedback>
   */
  toggle() { this._isOpen ? this._close() : this._open(); }

  _getTypes() {
    const attr = this.getAttribute('types');
    if (attr) {
      const keys = attr.split(',').map(k => k.trim()).filter(k => TYPE_DEFS[k]);
      if (keys.length > 0) return keys;
    }
    return ['bug', 'feature', 'question'];
  }

  _render() {
    // Clean up document-level listeners before replacing DOM
    if (this._escapeHandler) {
      document.removeEventListener('keydown', this._escapeHandler);
      this._escapeHandler = null;
    }
    if (this._focusTrapHandler) {
      this.shadowRoot.removeEventListener('keydown', this._focusTrapHandler);
      this._focusTrapHandler = null;
    }

    const pos = this._getPosition();
    const buttonText = this.getAttribute('button-text');
    const triggerType = this._getTriggerType();
    const showSeverity = !this.hasAttribute('no-severity');
    const text = buttonText || '';
    const iconName = this._getIcon();
    const size = this._getSize();
    const types = this._getTypes();

    // Ensure current type is valid for selected types
    if (!types.includes(this._type)) this._type = types[0];

    // Icon sizes per size variant
    const isPixelSize = typeof size === 'number';
    const fabIconSize = isPixelSize ? Math.round(size * 0.5) : { sm: 18, md: 22, lg: 24 }[size];
    const smIconSize = isPixelSize ? Math.round(size * 0.35) : { sm: 14, md: 16, lg: 18 }[size];

    // Border customization
    const borderColor = cssColor(this.getAttribute('border-color'));
    const borderWidth = this.getAttribute('border-width');
    const borderRadius = this.getAttribute('border-radius');

    // Build inline style for border and pixel-size customization
    const buildTriggerStyle = (type) => {
      const parts = [];
      const bw = parseInt(borderWidth, 10);
      const br = parseInt(borderRadius, 10);
      if (borderColor && bw > 0) {
        parts.push(`border: ${bw}px solid ${borderColor}`);
      } else if (borderColor) {
        parts.push(`border: 1px solid ${borderColor}`);
      } else if (bw > 0) {
        parts.push(`border-width: ${bw}px`);
        parts.push('border-style: solid');
      }
      if (borderRadius !== null && !isNaN(br)) parts.push(`border-radius: ${br}px`);

      if (isPixelSize) {
        if (type === 'fab') {
          parts.push(`width: ${size}px`, `height: ${size}px`);
          if (!borderRadius) parts.push('border-radius: 50%');
        } else if (type === 'button') {
          parts.push(`padding: ${Math.round(size * 0.2)}px ${Math.round(size * 0.35)}px`);
          parts.push(`font-size: ${Math.max(12, Math.round(size * 0.3))}px`);
        }
      }
      return parts.length > 0 ? ` style="${parts.join('; ')}"` : '';
    };

    let triggerHtml;
    if (triggerType === 'none') {
      triggerHtml = ''; // No trigger — use .open()/.toggle() from your own button
    } else if (triggerType === 'button') {
      const sizeClass = isPixelSize ? '' : ` size-${size}`;
      const textHtml = text ? ` <span>${esc(text)}</span>` : '';
      const iconOnly = !text && iconName !== 'none' ? ' icon-only' : '';
      triggerHtml = `<button class="trigger-btn${sizeClass}${iconOnly}" aria-label="Send feedback" aria-expanded="false" part="trigger"${buildTriggerStyle('button')}>${iconSvg(iconName, smIconSize, smIconSize)}${textHtml}</button>`;
    } else if (triggerType === 'link') {
      const sizeClass = isPixelSize ? '' : ` size-${size}`;
      const textHtml = text ? ` <span>${esc(text)}</span>` : '';
      triggerHtml = `<a href="#" role="button" class="trigger-link${sizeClass}" aria-label="Send feedback" aria-expanded="false" part="trigger"${buildTriggerStyle('link')}>${iconSvg(iconName, smIconSize, smIconSize)}${textHtml}</a>`;
    } else {
      const pillClass = buttonText ? ' pill' : '';
      const sizeClass = isPixelSize ? '' : ` size-${size}`;
      // For pixel-sized pill FABs, add inline styles for pill text and dimensions
      let fabStyle = buildTriggerStyle('fab');
      if (isPixelSize && buttonText) {
        // Override to pill shape
        const styleParts = [];
        const bw = parseInt(borderWidth, 10);
        const br = parseInt(borderRadius, 10);
        if (borderColor) {
          styleParts.push(`border: ${bw > 0 ? bw : 1}px solid ${borderColor}`);
        } else if (bw > 0) {
          styleParts.push(`border-width: ${bw}px`);
          styleParts.push('border-style: solid');
        }
        styleParts.push(`min-height: ${size}px`, `height: auto`, `width: auto`, `padding: 0 ${Math.round(size * 0.4)}px`);
        styleParts.push(`border-radius: ${isNaN(br) ? Math.round(size / 2) : br}px`);
        fabStyle = ` style="${styleParts.join('; ')}"`;
      }
      const pillTextStyle = isPixelSize ? ` style="font-size: ${Math.max(12, Math.round(size * 0.3))}px"` : '';
      triggerHtml = `<button class="fab ${pos}${pillClass}${sizeClass}" aria-label="Send feedback" aria-expanded="false" part="fab"${fabStyle}>${iconSvg(iconName, fabIconSize, fabIconSize)}${buttonText ? `<span class="fab-text"${pillTextStyle}>${esc(buttonText)}</span>` : ''}</button>`;
    }

    const severityHidden = !showSeverity || this._type !== 'bug' ? ' hidden' : '';
    const severityHtml = showSeverity ? `
          <div class="severity-selector${severityHidden}" data-field="severity">
            <button class="severity-pill${this._severity === 'low' ? ' active' : ''}" data-severity="low" type="button">Low</button>
            <button class="severity-pill${this._severity === 'medium' ? ' active' : ''}" data-severity="medium" type="button">Medium</button>
            <button class="severity-pill${this._severity === 'high' ? ' active' : ''}" data-severity="high" type="button">High</button>
            <button class="severity-pill${this._severity === 'critical' ? ' active' : ''}" data-severity="critical" type="button">Critical</button>
          </div>` : '';

    // Popup position class: FAB uses directional position, others use centered
    const popupPosClass = triggerType === 'fab' ? ` ${pos}` : ' centered';

    this.shadowRoot.innerHTML = `
      <style>${STYLES}</style>
      ${triggerHtml}
      <div class="backdrop" part="backdrop"></div>
      <div class="popup${popupPosClass}" role="dialog" aria-label="Send feedback" part="popup">
        <div class="form-view">
          <div class="header">
            <h2>Send Feedback</h2>
            <button class="close-btn" aria-label="Close">&times;</button>
          </div>
          <div class="type-selector${types.length > 3 ? ' multi-row' : ''}">
            ${types.map(key => {
              const def = TYPE_DEFS[key];
              const active = this._type === key ? ' active' : '';
              const showTypeIcons = !this.hasAttribute('no-type-icons');
              const icon = showTypeIcons ? `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="${def.icon}"/></svg>` : '';
              return `<button class="type-pill${active}" data-type="${key}" type="button">${icon}${esc(def.label)}</button>`;
            }).join('\n            ')}
          </div>${severityHtml}
          <div class="field">
            <label for="ghf-title">Title *</label>
            <input type="text" id="ghf-title" required maxlength="120" placeholder="Brief summary">
          </div>
          <div class="field">
            <label for="ghf-desc">Description</label>
            <textarea id="ghf-desc" maxlength="2000" rows="4" placeholder="Details (optional, supports markdown)"></textarea>
            <div class="char-count">0 / 2000</div>
          </div>
          <div class="shot" hidden>
            <img alt="Screenshot to include">
            <span>Screenshot included</span>
            <button class="shot-remove" type="button">Remove</button>
          </div>
          <div class="error-msg" role="alert"></div>
          <button class="submit-btn" type="button">${this._submitLabel()}</button>${this._getMode() === 'link' ? `
          <div class="link-hint">Opens GitHub to finish your report (you'll need a GitHub account).</div>` : ''}
        </div>
        <div class="success-msg" style="display:none">
          <div class="check">&#10003;</div>
          <div class="success-text"></div>
        </div>
      </div>
    `;
  }

  _getTriggerEl() {
    const shadow = this.shadowRoot;
    return shadow.querySelector('.fab') || shadow.querySelector('.trigger-btn') || shadow.querySelector('.trigger-link');
  }

  _bindEvents() {
    const shadow = this.shadowRoot;
    const trigger = this._getTriggerEl();
    const backdrop = shadow.querySelector('.backdrop');
    const closeBtn = shadow.querySelector('.close-btn');
    const submitBtn = shadow.querySelector('.submit-btn');
    const titleInput = shadow.querySelector('#ghf-title');
    const descTextarea = shadow.querySelector('#ghf-desc');
    const charCount = shadow.querySelector('.char-count');
    const typePills = shadow.querySelectorAll('.type-pill');
    const severityPills = shadow.querySelectorAll('.severity-pill');

    if (trigger) {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        if (this._isOpen) this._close(); else this._open();
      });
    }

    backdrop.addEventListener('click', () => this._close());
    closeBtn.addEventListener('click', () => this._close());

    typePills.forEach(pill => {
      pill.addEventListener('click', () => {
        this._type = pill.dataset.type;
        typePills.forEach(p => p.classList.toggle('active', p.dataset.type === this._type));
        // Show/hide severity selector based on type
        this._updateSeverityVisibility();
      });
    });

    severityPills.forEach(pill => {
      pill.addEventListener('click', () => {
        this._severity = pill.dataset.severity;
        severityPills.forEach(p => p.classList.toggle('active', p.dataset.severity === this._severity));
      });
    });

    descTextarea.addEventListener('input', () => {
      charCount.textContent = `${descTextarea.value.length} / 2000`;
    });

    // Clear errors on any input change
    const clearError = () => {
      const errEl = shadow.querySelector('.error-msg');
      errEl.classList.remove('visible');
      errEl.textContent = '';
    };
    titleInput.addEventListener('input', clearError);
    descTextarea.addEventListener('input', clearError);
    typePills.forEach(pill => pill.addEventListener('click', clearError));

    submitBtn.addEventListener('click', (e) => this._handleSubmit(e));

    shadow.querySelector('.shot-remove').addEventListener('click', () => {
      this._shotRemoved = true;
      shadow.querySelector('.shot').hidden = true;
      titleInput.focus();
    });
  }

  /** Link mode: ask the page for a screenshot now, before the popup covers anything. */
  _captureScreenshot() {
    this._clearScreenshot();
    if (this._getMode() !== 'link' || typeof this.getScreenshot !== 'function') return;
    let result;
    try { result = this.getScreenshot(); } catch { return; }
    const shot = toImageBlob(result).catch(() => null);
    this._shot = shot;
    shot.then(blob => {
      if (!blob || this._shot !== shot || !this._isOpen) return;
      this._shotUrl = URL.createObjectURL(blob);
      const box = this.shadowRoot.querySelector('.shot');
      box.querySelector('img').src = this._shotUrl;
      box.hidden = this._shotRemoved;
    });
  }

  _clearScreenshot() {
    this._shot = null;
    this._shotRemoved = false;
    if (this._shotUrl) { URL.revokeObjectURL(this._shotUrl); this._shotUrl = null; }
    const box = this.shadowRoot?.querySelector('.shot');
    if (box) { box.hidden = true; box.querySelector('img').removeAttribute('src'); }
  }

  _updateSeverityVisibility() {
    const severitySelector = this.shadowRoot.querySelector('.severity-selector');
    if (!severitySelector) return;
    if (this._type === 'bug') {
      severitySelector.classList.remove('hidden');
    } else {
      severitySelector.classList.add('hidden');
    }
  }

  _open() {
    if (this._isOpen) {
      // Already open: after a link-mode submit show a fresh form, otherwise just focus it.
      if (this.shadowRoot.querySelector('.link-note')) this._resetForm();
      const focusable = this._getFocusableElements();
      const title = this.shadowRoot.querySelector('#ghf-title');
      (focusable.includes(title) ? title : focusable[0])?.focus();
      return;
    }
    // Screenshot first, while the page is still uncovered
    this._captureScreenshot();
    this._returnFocus = document.activeElement;

    // A game may hold the pointer or have its canvas fullscreen: release both so the popup can be used.
    document.exitPointerLock?.();
    if (document.fullscreenElement && !document.fullscreenElement.contains(this)) {
      document.exitFullscreen?.()?.catch?.(() => {});
    }

    // Close all other instances first
    document.querySelectorAll('gh-feedback').forEach(el => {
      if (el !== this) el._close?.();
    });

    const shadow = this.shadowRoot;
    const trigger = this._getTriggerEl();
    const backdrop = shadow.querySelector('.backdrop');
    const popup = shadow.querySelector('.popup');
    const successMsg = shadow.querySelector('.success-msg');
    const formView = shadow.querySelector('.form-view');

    // Ensure form view is showing (not success)
    successMsg.style.display = 'none';
    formView.style.display = 'block';

    this._isOpen = true;
    if (trigger) trigger.setAttribute('aria-expanded', 'true');

    // Show elements first, then trigger transition in next frame
    backdrop.style.display = 'block';
    popup.style.display = 'block';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        backdrop.classList.add('open');
        popup.classList.add('open');
      });
    });

    // Focus the title input once the popup shows, unless focus has already
    // moved inside it, or it has closed again, by then.
    const titleInput = shadow.querySelector('#ghf-title');
    clearTimeout(this._focusTimer);
    this._focusTimer = setTimeout(() => {
      this._focusTimer = null;
      const active = shadow.activeElement;
      if (this._isOpen && !(active && popup.contains(active))) titleInput?.focus();
    }, 50);

    // Escape handler
    this._escapeHandler = (e) => {
      if (e.key === 'Escape' && this._isOpen) {
        e.stopPropagation();
        this._close();
      }
    };
    document.addEventListener('keydown', this._escapeHandler);

    // Focus trap — must be on shadowRoot so Firefox bubbles keydown from inner elements
    this._focusTrapHandler = (e) => {
      if (e.key !== 'Tab' || !this._isOpen) return;
      const focusable = this._getFocusableElements();
      if (focusable.length === 0) return;
      // Focus outside the popup's visible controls counts as an end, so it wraps.
      const i = focusable.indexOf(shadow.activeElement);
      if (e.shiftKey ? i <= 0 : (i === -1 || i === focusable.length - 1)) {
        e.preventDefault();
        focusable[e.shiftKey ? focusable.length - 1 : 0].focus();
      }
    };
    shadow.addEventListener('keydown', this._focusTrapHandler);

    this.dispatchEvent(new CustomEvent('gh-feedback:open', { bubbles: true, composed: true }));
  }

  _close() {
    if (!this._isOpen) return;
    const shadow = this.shadowRoot;
    const trigger = this._getTriggerEl();
    const backdrop = shadow.querySelector('.backdrop');
    const popup = shadow.querySelector('.popup');

    this._isOpen = false;
    clearTimeout(this._focusTimer);
    this._focusTimer = null;
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    backdrop.classList.remove('open');
    popup.classList.remove('open');

    // After transition, hide elements
    setTimeout(() => {
      if (!this._isOpen) {
        backdrop.style.display = 'none';
        popup.style.display = 'none';
      }
    }, 160);

    // Stop an in-flight request
    if (this._abort) { this._abort.abort(); this._abort = null; }

    // Remove listeners
    if (this._escapeHandler) {
      document.removeEventListener('keydown', this._escapeHandler);
      this._escapeHandler = null;
    }
    if (this._focusTrapHandler) {
      shadow.removeEventListener('keydown', this._focusTrapHandler);
      this._focusTrapHandler = null;
    }

    // Cancel auto-close timer
    if (this._autoCloseTimer) {
      clearTimeout(this._autoCloseTimer);
      this._autoCloseTimer = null;
    }

    // Cancel rate limit timer
    if (this._rateLimitTimer) {
      clearInterval(this._rateLimitTimer);
      this._rateLimitTimer = null;
    }

    // Reset form
    this._resetForm();

    // Apply deferred re-render if attributes changed while popup was open
    if (this._pendingRender) {
      this._pendingRender = false;
      this._render();
      this._bindEvents();
    }

    // Return focus to what had it before opening, else the trigger (read after any
    // re-render; deferred so Firefox processes the close before focus moves).
    const back = this._returnFocus;
    this._returnFocus = null;
    setTimeout(() => {
      if (this._isOpen) return;
      if (back && back !== this && back !== document.body && back.isConnected) back.focus();
      else this._getTriggerEl()?.focus();
    }, 0);

    this.dispatchEvent(new CustomEvent('gh-feedback:close', { bubbles: true, composed: true }));
  }

  _getFocusableElements() {
    const shadow = this.shadowRoot;
    const popup = shadow.querySelector('.popup');
    if (!popup) return [];
    return Array.from(popup.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled])'
    )).filter(el => el.getClientRects().length > 0);
  }

  _resetForm() {
    const shadow = this.shadowRoot;
    const titleInput = shadow.querySelector('#ghf-title');
    const descTextarea = shadow.querySelector('#ghf-desc');
    const charCount = shadow.querySelector('.char-count');
    const errorMsg = shadow.querySelector('.error-msg');
    const successMsg = shadow.querySelector('.success-msg');
    const formView = shadow.querySelector('.form-view');
    const submitBtn = shadow.querySelector('.submit-btn');

    this._submitId++;
    this._clearScreenshot();
    const note = shadow.querySelector('.link-note');
    if (note) note.remove();
    if (titleInput) titleInput.value = '';
    if (descTextarea) descTextarea.value = '';
    if (charCount) charCount.textContent = '0 / 2000';
    if (errorMsg) { errorMsg.classList.remove('visible'); errorMsg.textContent = ''; }
    if (successMsg) successMsg.style.display = 'none';
    if (formView) formView.style.display = 'block';

    // Reset type to first available type
    const types = this._getTypes();
    this._type = types[0];
    shadow.querySelectorAll('.type-pill').forEach(p =>
      p.classList.toggle('active', p.dataset.type === this._type)
    );

    // Reset severity to medium
    this._severity = 'medium';
    shadow.querySelectorAll('.severity-pill').forEach(p =>
      p.classList.toggle('active', p.dataset.severity === 'medium')
    );
    this._updateSeverityVisibility();

    // Re-enable fields
    this._setFieldsDisabled(false);
    if (submitBtn) {
      submitBtn.textContent = this._submitLabel();
      submitBtn.disabled = false;
    }
  }

  _showError(msg) {
    const errEl = this.shadowRoot.querySelector('.error-msg');
    errEl.textContent = msg;
    errEl.classList.add('visible');
  }

  _setFieldsDisabled(disabled) {
    const shadow = this.shadowRoot;
    shadow.querySelector('#ghf-title').disabled = disabled;
    shadow.querySelector('#ghf-desc').disabled = disabled;
    shadow.querySelectorAll('.type-pill').forEach(p => p.disabled = disabled);
    shadow.querySelectorAll('.severity-pill').forEach(p => p.disabled = disabled);
  }

  async _handleSubmit(event) {
    const shadow = this.shadowRoot;
    const titleInput = shadow.querySelector('#ghf-title');
    const descTextarea = shadow.querySelector('#ghf-desc');
    const submitBtn = shadow.querySelector('.submit-btn');

    const title = titleInput.value.trim();
    const description = descTextarea.value.trim();
    const repo = this._parseRepo();
    const endpoint = this.getAttribute('endpoint');
    const token = this.token;

    // Validation
    if (!title) {
      this._showError('Title is required');
      titleInput.focus();
      return;
    }
    if (!repo) {
      this._showError('Invalid repo — use "owner/repo" or a GitHub URL');
      return;
    }
    const mode = this._getMode();
    if (mode === 'link') return this._submitLink(title, description, repo);
    if ((mode === 'proxy' && !endpoint) || (mode === 'direct' && !token)) {
      this._showError('No endpoint or token configured');
      return;
    }

    // Build detail object
    const detail = { title, type: this._type, description, labels: this._getLabels(), repo, mode };
    if (!this.hasAttribute('no-severity') && this._type === 'bug') detail.severity = this._severity;

    // Dispatch cancelable submit event
    const submitEvent = new CustomEvent('gh-feedback:submit', {
      bubbles: true, composed: true, cancelable: true,
      detail
    });
    if (!this.dispatchEvent(submitEvent)) return;

    // Loading state
    this._setFieldsDisabled(true);
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Filing issue...';

    const payload = {
      title,
      type: this._type,
      description,
      labels: this._getLabels()
    };

    // Add severity only for bug type when severity is enabled
    if (!this.hasAttribute('no-severity') && this._type === 'bug') {
      payload.severity = this._severity;
    }

    // Capture context if getContext is a function
    let context = null;
    if (typeof this.getContext === 'function') {
      try { context = this.getContext(); } catch { /* ignore errors in user callback */ }
    }
    if (context) payload.context = context;

    const id = this._submitId;
    const abort = this._abort = new AbortController();
    try {
      let response;
      if (mode === 'proxy') {
        // Proxy mode
        response = await fetch(endpoint, {
          method: 'POST',
          signal: abort.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, repo })
        });
      } else {
        // Direct mode
        let labels = [...payload.labels];
        // Add priority label for high/critical severity
        if (payload.severity === 'high') labels.push('priority: high');
        if (payload.severity === 'critical') labels.push('priority: critical');
        labels = labels.slice(0, 10);

        response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
          method: 'POST',
          signal: abort.signal,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'gh-feedback/1.0'
          },
          body: JSON.stringify({
            title: payload.title,
            body: this._buildIssueBody(payload),
            labels
          })
        });
      }

      let data;
      try {
        data = await response.json();
      } catch {
        if (id !== this._submitId) return;
        this._onError('Unexpected response — check endpoint URL');
        return;
      }
      if (id !== this._submitId) return; // closed or reset meanwhile
      this._abort = null;

      if (!response.ok) {
        if (response.status >= 500) {
          this._onError('Server error — try again later');
        } else if (response.status === 401) {
          this._onError('GitHub token invalid or expired');
        } else if (response.status === 403) {
          this._onError('GitHub rate limit exceeded or insufficient permissions');
        } else if (response.status === 404) {
          this._onError('Repository not found — check the repo attribute');
        } else {
          this._onError(data.error || data.message || `Request failed (${response.status})`);
        }
        return;
      }

      // Success — normalize response
      const issueNumber = data.issueNumber ?? data.number;
      const issueUrl = data.issueUrl ?? data.html_url;

      this._onSuccess(issueNumber, issueUrl);

    } catch (err) {
      if (id !== this._submitId) return; // aborted by close, or stale
      this._abort = null;
      // Network / CORS error
      if (err instanceof TypeError && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        this._onError('Request blocked — this may be a CORS issue. Check that your endpoint allows requests from this origin.');
      } else {
        this._onError('Could not reach the server');
      }
    }
  }

  /**
   * Link mode: no server. Copy the screenshot to the clipboard, then open GitHub's
   * new-issue page pre-filled with the report. Both need the click's user activation,
   * so nothing here may wait long before window.open().
   */
  async _submitLink(title, description, repo) {
    const shadow = this.shadowRoot;
    const payload = { title, type: this._type, description };
    if (!this.hasAttribute('no-severity') && this._type === 'bug') payload.severity = this._severity;
    let context = null;
    if (typeof this.getContext === 'function') {
      try { context = this.getContext(); } catch { /* ignore errors in user callback */ }
    }
    if (context && typeof context === 'object') payload.context = context;

    const shot = this._shotRemoved ? null : this._shot;
    const id = this._submitId;

    this._setFieldsDisabled(true);
    const submitBtn = shadow.querySelector('.submit-btn');
    submitBtn.disabled = true;

    // Copy first: once the new tab takes focus, the clipboard refuses writes.
    let copied = false;
    if (shot && canCopyImage()) {
      try {
        const png = shot.then(b => (b ? toPng(b) : Promise.reject(new Error('no screenshot'))));
        const write = navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
        copied = await Promise.race([
          write.then(() => true, () => false),
          new Promise(r => setTimeout(() => r(false), 1000)),
        ]);
      } catch { copied = false; }
    }
    const blob = shot ? await Promise.race([shot, new Promise(r => setTimeout(() => r(null), 1000))]) : null;
    if (id !== this._submitId) return; // closed while waiting

    // Built only now, so it says "screenshot copied" only when one was.
    const url = this._buildLinkUrl(payload, repo, copied);
    const detail = { ...payload, labels: this._getLabels(), repo, mode: 'link', url };
    delete detail.context;
    const submitEvent = new CustomEvent('gh-feedback:submit', {
      bubbles: true, composed: true, cancelable: true, detail
    });
    if (!this.dispatchEvent(submitEvent)) {
      this._setFieldsDisabled(false);
      submitBtn.disabled = false;
      return;
    }

    let opened = false;
    if (typeof this.openLink === 'function') {
      // The page opens it (e.g. an app shell that sends links to the system browser).
      try { opened = !!(await this.openLink(url)); } catch { opened = false; }
    } else {
      let tab = null;
      try { tab = window.open(url, '_blank'); } catch { tab = null; }
      if (tab) { try { tab.opener = null; } catch { /* cross-origin */ } }
      opened = !!tab;
    }
    if (id !== this._submitId) return;

    this._onLinkOpened({ url, opened, copied, blob });
  }

  /** Build the pre-filled new-issue URL, trimming context (then description) to fit. */
  _buildLinkUrl(payload, repo, withShot) {
    const template = this.getAttribute('template');
    const isForm = !!template && /\.ya?ml$/i.test(template);
    const field = this.getAttribute('template-field') || (isForm ? 'description' : 'body');

    const clip = (s, n) => (s.length > n ? s.slice(0, Math.max(0, n - 1)) + '…' : s);
    let ctx = payload.context
      ? Object.entries(payload.context).map(([k, v]) => [clip(String(k), 60), String(v)])
      : null;
    let desc = payload.description || '';
    let descTrimmed = false;

    const build = () => {
      const p = { ...payload, description: desc + (descTrimmed ? ' … (trimmed)' : '') };
      if (ctx) p.context = Object.fromEntries(ctx); else delete p.context;
      const params = new URLSearchParams();
      params.set('title', payload.title);
      if (template) params.set('template', template);
      params.set(field, this._buildIssueBody(p, { shotHint: withShot }));
      return `https://github.com/${repo}/issues/new?${params}`;
    };

    let url = build();
    while (url.length > LINK_URL_MAX) {
      if (ctx && ctx.length) {
        // Shorten the longest value; once all are short, drop the last row.
        let li = 0;
        ctx.forEach(([, v], i) => { if (v.length > ctx[li][1].length) li = i; });
        const longest = ctx[li][1];
        if (longest.length > 40) ctx[li][1] = clip(longest, Math.max(40, Math.floor(longest.length / 2)));
        else ctx.pop();
        if (!ctx.length) ctx = null;
      } else if (desc.length) {
        const over = url.length - LINK_URL_MAX;
        desc = desc.slice(0, Math.max(0, desc.length - Math.max(20, Math.ceil(over / 3))));
        descTrimmed = true;
      } else {
        break;
      }
      url = build();
    }
    return url;
  }

  _onLinkOpened({ url, opened, copied, blob }) {
    const shadow = this.shadowRoot;
    const formView = shadow.querySelector('.form-view');
    const successMsg = shadow.querySelector('.success-msg');
    const successText = shadow.querySelector('.success-text');
    shadow.querySelector('.check').style.display = 'none';

    const note = document.createElement('div');
    note.className = 'link-note';
    const para = (...parts) => { const p = document.createElement('p'); p.append(...parts); note.append(p); return p; };
    const link = (text, href, extra = {}) => {
      const a = document.createElement('a');
      a.href = href; a.textContent = text; a.target = '_blank'; a.rel = 'noopener';
      Object.assign(a, extra);
      return a;
    };

    if (opened) para('GitHub opened in a new tab. Finish your report there.');
    else para('Your browser blocked the new tab. ', link('Open GitHub to finish your report', url));
    if (copied) {
      para('Your screenshot is copied: paste it into the issue (Ctrl/Cmd+V).');
    } else if (blob) {
      if (!this._shotUrl) this._shotUrl = URL.createObjectURL(blob);
      para(link('Download the screenshot', this._shotUrl, { download: 'screenshot.png', target: '' }),
        ' and drag it into the issue.');
    }
    if (opened) para(link('Open it again', url));

    const done = document.createElement('button');
    done.type = 'button';
    done.className = 'submit-btn done-btn';
    done.textContent = 'Done';
    done.addEventListener('click', () => this._close());
    note.append(done);

    successText.textContent = '';
    successText.append(note);
    formView.style.display = 'none';
    successMsg.style.display = 'block';
    setTimeout(() => done.focus(), 0);

    this.dispatchEvent(new CustomEvent('gh-feedback:opened', {
      bubbles: true, composed: true,
      detail: { url, opened, screenshotCopied: copied }
    }));
  }

  _onSuccess(issueNumber, issueUrl) {
    const shadow = this.shadowRoot;
    const formView = shadow.querySelector('.form-view');
    const successMsg = shadow.querySelector('.success-msg');
    const successText = shadow.querySelector('.success-text');

    formView.style.display = 'none';
    successMsg.style.display = 'block';
    shadow.querySelector('.check').style.display = '';
    successText.textContent = '';
    successText.append('Issue filed! ');
    const link = document.createElement('a');
    link.href = issueUrl;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = `#${issueNumber}`;
    successText.append(link);

    // Dispatch filed event
    this.dispatchEvent(new CustomEvent('gh-feedback:filed', {
      bubbles: true, composed: true,
      detail: { issueNumber, issueUrl }
    }));

    // Auto-close after 2 seconds
    this._autoCloseTimer = setTimeout(() => {
      if (this._isOpen) this._close();
    }, 2000);

    // Rate limit: disable for 10s
    this._startRateLimit(10);
  }

  _onError(msg) {
    this._showError(msg);
    this._setFieldsDisabled(false);
    const submitBtn = this.shadowRoot.querySelector('.submit-btn');
    submitBtn.textContent = this._submitLabel();

    // Dispatch error event
    this.dispatchEvent(new CustomEvent('gh-feedback:error', {
      bubbles: true, composed: true,
      detail: { error: msg }
    }));

    // Rate limit: disable for 5s
    this._startRateLimit(5);
  }

  _startRateLimit(seconds) {
    if (this._rateLimitTimer) { clearInterval(this._rateLimitTimer); this._rateLimitTimer = null; }
    const submitBtn = this.shadowRoot.querySelector('.submit-btn');
    let remaining = seconds;
    submitBtn.disabled = true;

    // Show countdown only if form view is visible
    const updateText = () => {
      const formView = this.shadowRoot.querySelector('.form-view');
      if (formView && formView.style.display !== 'none') {
        submitBtn.textContent = `Submit (${remaining}s)`;
      }
    };
    updateText();

    this._rateLimitTimer = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(this._rateLimitTimer);
        this._rateLimitTimer = null;
        submitBtn.disabled = false;
        submitBtn.textContent = this._submitLabel();
      } else {
        updateText();
      }
    }, 1000);
  }

  _buildIssueBody(payload, { shotHint = false } = {}) {
    const typeLabel = TYPE_DEFS[payload.type]?.label || 'Bug';
    const desc = payload.description ? noMentions(payload.description) : 'No description provided';
    let body = `**Type:** ${typeLabel}\n`;

    if (payload.severity) {
      const sevLabel = payload.severity.charAt(0).toUpperCase() + payload.severity.slice(1);
      body += `**Severity:** ${sevLabel}\n`;
    }

    body += `\n${desc}\n`;
    if (shotHint) body += `\n${SHOT_HINT}\n`;

    // Append context if available
    if (payload.context && typeof payload.context === 'object') {
      const rows = Object.entries(payload.context)
        .map(([k, v]) => `| ${escCell(k)} | ${escCell(v)} |`)
        .join('\n');
      body += `\n<details>\n<summary>Context</summary>\n\n| Key | Value |\n|-----|-------|\n${rows}\n\n</details>\n`;
    }

    body += `\n---\n*Filed via [gh-feedback](https://github.com/zeveck/gh-feedback)*`;
    return body;
  }

  _getLabels() {
    const ghLabel = TYPE_DEFS[this._type]?.ghLabel || 'bug';
    const labels = [ghLabel];
    const custom = this.getAttribute('labels');
    if (custom) {
      custom.split(',').map(l => l.trim()).filter(Boolean).forEach(l => {
        if (!labels.includes(l)) labels.push(l);
      });
    }
    return labels;
  }
}

customElements.define('gh-feedback', GhFeedback);
