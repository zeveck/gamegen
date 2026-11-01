// scan-text.js: reads the words on screen the way a player sees them, and
// reports what looks broken. The play-test loads it into the page and runs it
// at every screenshot (see references/playtest-guide.md):
//
//   await page.addScriptTag({ path: '<skill folder>/scripts/scan-text.js' });
//   const found = await page.evaluate(() => window.__scanText());
//
// Each finding is { kind, text, where } (an orphan also has `last`):
//   junk     code or markup showing as text: undefined, NaN, [object …], tags,
//            escaped entities, template braces. Always a bug.
//   orphan   short text whose last line is one lone word.
//   clipped  text cut off by its own box, a box around it, or the screen edge.
// Only text that's on screen and visible is read. Text drawn on a canvas
// can't be read here: check those screenshots by eye.
window.__scanText = () => {
  const JUNK = /\[object \w+\]|\bundefined\b|\bNaN\b|\bnull\b|<\/?[a-z][a-z0-9]*[\s>\/]|\$\{|&[a-z]+;|&#\d+;|\{\{|\}\}|__[A-Z]+__|\[\[|\]\]|(^|\s)\*\w[^*]*\*/;
  const SLACK = 2; // pixels of rounding to forgive

  const shown = (e) => {
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    for (let a = e; a; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
    }
    return true;
  };
  const where = (e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') +
    (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).join('.') : '');
  const short = (t, n) => (t.length > n ? t.slice(0, n - 1) + '…' : t);

  const out = [];
  const blocks = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = walker.nextNode());) {
    const t = n.nodeValue;
    if (!t.trim()) continue;
    const p = n.parentElement;
    if (!p || p.closest('script,style,noscript,template,[hidden]') || !shown(p)) continue;
    if (JUNK.test(t)) out.push({ kind: 'junk', text: short(t.trim(), 120), where: where(p) });
    // The block it sits in: an HTML element (text in an SVG <text> belongs to
    // the HTML box around the SVG, since SVG elements have no innerText).
    let b = p;
    while (b.parentElement && (!(b instanceof HTMLElement) || ['inline', 'contents'].includes(getComputedStyle(b).display))) b = b.parentElement;
    blocks.add(b);
  }

  for (const b of blocks) {
    const text = b.innerText.trim().replace(/\s+/g, ' ');
    if (!text) continue;

    // A lone last word: group the words by the line they sit on.
    const words = text.split(' ');
    if (words.length >= 4 && text.length < 400) {
      const lines = [];
      const w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
      for (let n; (n = w.nextNode());) {
        const re = /\S+/g;
        for (let m; (m = re.exec(n.nodeValue));) {
          const r = document.createRange();
          r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
          const rc = r.getClientRects()[0];
          if (!rc || !rc.width) continue;
          let line = lines.find((l) => Math.abs(l.top - rc.top) < rc.height / 2);
          if (!line) lines.push((line = { top: rc.top, words: [] }));
          line.words.push(m[0]);
        }
      }
      lines.sort((a, c) => a.top - c.top);
      const last = lines[lines.length - 1];
      if (lines.length > 1 && last.words.length === 1 && last.words[0].length > 1) {
        out.push({ kind: 'orphan', text: short(text, 120), last: last.words[0], where: where(b) });
      }
    }

    // Clipped: wider than its own box (a "…" cut, or spilling out), or
    // reaching past a box around it that hides or scrolls what overflows, or
    // past the edge of the screen. A box that scrolls sideways counts too: a
    // player won't scroll a title to read it.
    const range = document.createRange();
    range.selectNodeContents(b);
    const tr = range.getBoundingClientRect();
    const cs = getComputedStyle(b);
    let cut = '';
    if (b.scrollWidth > b.clientWidth + SLACK && !/auto|scroll/.test(cs.overflowX) && text.length < 120) cut = 'its own box';
    for (let a = b.parentElement; !cut && a && a !== document.documentElement; a = a.parentElement) {
      const acs = getComputedStyle(a);
      const ar = a.getBoundingClientRect();
      const x = acs.overflowX !== 'visible', y = acs.overflowY !== 'visible';
      if (x && (tr.left < ar.left - SLACK || tr.right > ar.right + SLACK)) cut = where(a);
      else if (y && !/auto|scroll/.test(acs.overflowY) && (tr.top < ar.top - SLACK || tr.bottom > ar.bottom + SLACK)) cut = where(a);
    }
    if (!cut && (tr.left < -SLACK || tr.right > innerWidth + SLACK)) cut = 'the screen edge';
    if (cut) out.push({ kind: 'clipped', text: short(text, 80), where: where(b), by: cut });
  }
  return out;
};
