// saves.js: the save slots behind a game's Load screen (gamegen's
// references/saves.md). Copy it into the game unchanged and load it before
// the game's code:
//   const saves = gameSaves.setup({ key: 'pp3', slots: 3, version: 1,
//     oldKey: 'pp3-save', fromOld: (old) => ({ data: old.progress, summary: { area: old.progress.area } }) });
// slots: how many fixed slots, or Infinity for as many as the player makes.
// oldKey: the single save the game kept before it had slots, moved into slot 1
// the first time (fromOld picks the progress out of it; settings stay where
// the game keeps them). Each slot holds { version, savedAt, summary, data }:
// summary is the little the Load screen shows (name, chapter, area, time...).
(() => {
  'use strict';
  window.gameSaves = {
    setup({ key = 'game', slots = 3, version = 1, oldKey = null, fromOld = (old) => ({ data: old, summary: {} }) }) {
      const many = !Number.isFinite(slots);
      const indexKey = `${key}-saves`;
      const slotKey = (id) => `${key}-slot-${id}`;
      const get = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
      const put = (k, v) => { try { localStorage.setItem(k, v); return true; } catch { return false; } };
      const drop = (k) => { try { localStorage.removeItem(k); } catch {} };
      if (oldKey && (oldKey === indexKey || oldKey.startsWith(`${key}-slot-`))) {
        throw new Error(`saves.js: oldKey '${oldKey}' is one of the keys the slots use; give setup a different key`);
      }

      // The list of slots, read again before every use, so two tabs of the
      // game never undo each other's saves.
      let index;
      const readIndex = () => {
        index = { ids: [], last: null, next: 1 };
        try {
          const i = JSON.parse(get(indexKey));
          if (i && Array.isArray(i.ids)) index = { ids: i.ids.filter(Number.isInteger), last: i.last ?? null, next: Number(i.next) || 1 };
        } catch {}
        if (!many) index.ids = Array.from({ length: Math.max(1, Math.floor(slots)) }, (_, n) => n + 1);
        index.next = Math.max(index.next, ...index.ids.map((id) => id + 1));
      };
      readIndex();
      const writeIndex = () => put(indexKey, JSON.stringify(index));
      // Slot ids are numbers, even when a Load screen hands back "2".
      const num = (id) => Number(id);

      // A slot is empty, unreadable (broken), or a save.
      const read = (id) => {
        const raw = get(slotKey(id));
        if (raw === null) return { id, empty: true };
        try {
          const r = JSON.parse(raw);
          if (r && typeof r === 'object' && 'data' in r && Number.isFinite(r.version)) return { id, ...r };
        } catch {}
        return { id, broken: true };
      };
      const meta = ({ data, ...rest }) => rest;
      const usable = (r) => !r.empty && !r.broken;

      const api = {
        // Every slot for the Load screen, without its data: fixed slots in
        // order, empty ones included; with Infinity, the saves, newest first.
        list: () => {
          readIndex();
          const all = index.ids.map(read).map(meta);
          return many ? all.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)) : all;
        },
        // The saved game in a slot, or null (empty or unreadable).
        load: (id) => {
          id = num(id); readIndex();
          const r = read(id);
          if (!usable(r)) return null;
          index.last = id; writeIndex();
          return r.data;
        },
        // Save into a slot. false if the browser refused (storage full):
        // tell the player, and keep playing; nothing else was lost.
        save: (id, data, summary = {}) => {
          id = num(id); readIndex();
          if (!Number.isInteger(id) || id < 1 || data === undefined || (!many && !index.ids.includes(id))) return false;
          if (!put(slotKey(id), JSON.stringify({ version, savedAt: Date.now(), summary, data }))) return false;
          const added = !index.ids.includes(id);
          if (added) index.ids.push(id);
          index.next = Math.max(index.next, id + 1);
          index.last = id;
          // A new slot the list couldn't take would vanish on reload: undo it.
          if (!writeIndex() && added) { drop(slotKey(id)); return false; }
          return true;
        },
        // A slot for a new game: the first empty one (null when every fixed
        // slot is taken: ask which to overwrite), or a new one with Infinity.
        create: () => {
          readIndex();
          if (many) {
            while (get(slotKey(index.next)) !== null) index.next++;
            return index.next++;
          }
          return index.ids.find((id) => read(id).empty) ?? null;
        },
        // Delete a save (ask the player first).
        remove: (id) => {
          id = num(id); readIndex();
          drop(slotKey(id));
          if (many) index.ids = index.ids.filter((i) => i !== id);
          if (index.last === id) index.last = null;
          writeIndex();
        },
        // The slot Continue picks: the one played last, or else the newest save.
        last: () => {
          readIndex();
          if (index.last !== null && index.ids.includes(index.last) && usable(read(index.last))) return index.last;
          const newest = index.ids.map(read).filter(usable).sort((a, b) => b.savedAt - a.savedAt)[0];
          return newest ? newest.id : null;
        },
        slots: many ? Infinity : index.ids.length,
      };

      // The game's old single save moves into slot 1, once, before any slot
      // is used; it's removed only after slot 1 holds it. An unreadable old
      // save is left as it is.
      if (oldKey && get(oldKey) !== null && index.ids.every((id) => read(id).empty)) {
        try {
          const moved = fromOld(JSON.parse(get(oldKey)));
          // Dropped only once slot 1 reads back as a real save.
          if (moved && api.save(1, moved.data, moved.summary || {}) && usable(read(1))) drop(oldKey);
        } catch {}
      }
      return api;
    },
  };
})();
