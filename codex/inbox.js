/* Resonance Codex — page photos straight from the codex.
   On a sealed section of a tome (or a discovered entry) the owner picks photos of the pages. Each photo is shrunk to
   at most 2200 px on its long side, uploaded to the artifact's asset store, and listed in the db document
   inbox/<target>: { id, target, label, photos: [{ id, name, at }], status: 'collecting'|'sent', sentAt }.
   "Send to Claude" posts a comment to Claude naming the document and the asset ids; Claude reads the photos
   and integrates the section. */
(function () {
  'use strict';
  const C = window.Codex;
  const V = window.CodexView;
  if (!C || !V) return;
  const esc = V.esc;
  const MAX_SIDE = 2200;
  const MAX_PHOTOS = 12;

  const S = { assets: undefined, db: null, docs: new Map(), busy: new Map() };

  function docIdFor(t) { const pre = C.lore === C.DEFAULT_LORE ? '' : C.lore + '-'; return pre + (t.kind === 'section' ? ('sec-' + t.tome + '-' + t.num).replace(/[^A-Za-z0-9_.~:@+-]/g, '_') : 'ent-' + t.id); }
  function targetFrom(el) {
    return el.dataset.inboxKind === 'section' ? { kind: 'section', tome: el.dataset.tome, num: el.dataset.num, label: el.dataset.label } : { kind: 'entry', id: el.dataset.entry, label: el.dataset.label };
  }
  async function connect() {
    const cl = window.claude;
    if (!cl || typeof cl.use !== 'function') { S.assets = null; refreshAll(); return; }
    try { S.assets = await cl.use('assets'); } catch (err) { S.assets = null; }
    try { S.db = await cl.use('db'); } catch (err) { S.db = null; }
    if (S.db) {
      try {
        S.db.collection('inbox').onSnapshot((qs) => {
          S.docs.clear();
          for (const snap of qs.docs) { const d = snap.data ? snap.data() : snap; if (d && typeof d.id === 'string') S.docs.set(d.id, d); }
          refreshAll();
        }, () => {});
      } catch (err) { /* no inbox in this view */ }
    }
    refreshAll();
  }
  function cleanDoc(d) {
    return { id: d.id, lore: /^[a-z0-9-]+$/.test(String(d.lore || '')) ? d.lore : C.DEFAULT_LORE, target: d.target, label: String(d.label || '').slice(0, 200), status: d.status === 'sent' ? 'sent' : 'collecting', sentAt: String(d.sentAt || '').slice(0, 30),
      photos: (Array.isArray(d.photos) ? d.photos : []).filter((p) => p && /^[0-9a-f]{32}$/.test(String(p.id))).slice(0, MAX_PHOTOS).map((p) => ({ id: p.id, name: String(p.name || '').slice(0, 80), at: String(p.at || '').slice(0, 30) })) };
  }
  async function write(doc) {
    S.docs.set(doc.id, doc);
    refreshAll();
    if (!S.db) return false;
    try { await S.db.collection('inbox').doc(doc.id).set(JSON.parse(JSON.stringify(doc))); return true; }
    catch (err) { V.toast('The photo list was not saved (' + ((err && err.code) || 'error') + ').'); return false; }
  }

  /* shrink a photo in the browser: keeps the orientation, caps the long side, re-encodes as JPEG */
  async function shrink(file) {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
      const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
      const cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.round(bmp.width * k)); cv.height = Math.max(1, Math.round(bmp.height * k));
      cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
      if (bmp.close) bmp.close();
      const blob = await new Promise((res) => cv.toBlob(res, 'image/jpeg', 0.88));
      if (blob) return blob;
    } catch (err) { /* fall back to the original file */ }
    return /^image\/(jpeg|png|webp|gif)$/.test(file.type) ? file : null;
  }

  function slotHtml(t) {
    const id = docIdFor(t);
    const attrs = 'data-inbox="' + esc(id) + '" data-inbox-kind="' + t.kind + '"' + (t.kind === 'section' ? ' data-tome="' + esc(t.tome) + '" data-num="' + esc(t.num) + '"' : ' data-entry="' + esc(t.id) + '"') + ' data-label="' + esc(t.label) + '"';
    return '<div class="inbox" ' + attrs + '>' + innerHtml(id) + '</div>';
  }
  function innerHtml(id) {
    if (S.assets === undefined) return '<p class="muted small">Checking whether photos can be added here…</p>';
    const doc = S.docs.get(id) ? cleanDoc(S.docs.get(id)) : null;
    const photos = doc ? doc.photos : [];
    const busy = S.busy.get(id);
    if (!S.assets) {
      return photos.length ? '<p class="muted small">' + photos.length + ' page photo' + (photos.length === 1 ? ' is' : 's are') + ' waiting for Claude.</p>' : '<p class="muted small">Send Claude photos of these pages in the chat. (Adding photos here needs edit access to the codex.)</p>';
    }
    let h = '<div class="inbox-head"><span class="lbl">Page photos</span>' + (doc && doc.status === 'sent' ? '<span class="badge badge-ok">sent to Claude ' + esc(doc.sentAt.slice(0, 10)) + '</span>' : '') + '</div>';
    if (photos.length) h += '<ul class="inbox-thumbs">' + photos.map((p, i) => '<li><img src="/_blob/' + esc(p.id) + '" alt="Page photo ' + (i + 1) + (p.name ? ' (' + esc(p.name) + ')' : '') + '" loading="lazy"><button type="button" class="slot-x" data-inbox-del="' + esc(p.id) + '" aria-label="Remove photo ' + (i + 1) + '">×</button></li>').join('') + '</ul>';
    h += '<div class="inbox-actions"><label class="btn ghost inbox-pick"' + (busy || photos.length >= MAX_PHOTOS ? ' aria-disabled="true"' : '') + '><input type="file" accept="image/*" multiple data-inbox-file' + (busy || photos.length >= MAX_PHOTOS ? ' disabled' : '') + '>' + (photos.length ? 'Add more photos' : 'Add page photos') + '</label>' +
      (photos.length ? '<button type="button" class="btn" data-inbox-send' + (busy ? ' disabled' : '') + '>' + (doc && doc.status === 'sent' ? 'Send again' : 'Send to Claude') + '</button>' : '') + '</div>';
    h += busy ? '<p class="small inbox-busy"><span class="spin" aria-hidden="true"></span> ' + esc(busy) + '</p>' : '<p class="muted small">Photos are shrunk in your browser and stored with the codex. Claude reads them and integrates the pages.</p>';
    return h;
  }
  function refreshAll() { document.querySelectorAll('.inbox[data-inbox]').forEach((el) => { el.innerHTML = innerHtml(el.dataset.inbox); }); }

  async function addFiles(el, files) {
    const id = el.dataset.inbox; const t = targetFrom(el);
    const doc = cleanDoc(S.docs.get(id) || { id, lore: C.lore, target: t, label: t.label, photos: [], status: 'collecting' });
    doc.target = t; doc.label = t.label;
    const list = Array.from(files).slice(0, MAX_PHOTOS - doc.photos.length);
    let n = 0;
    for (const f of list) {
      S.busy.set(id, 'Uploading photo ' + (++n) + ' of ' + list.length + '…'); refreshAll();
      const blob = await shrink(f);
      if (!blob) { V.toast(f.name + ' is not a photo format the codex can store (use JPEG or PNG).'); continue; }
      try {
        const r = await S.assets.upload(blob, { type: blob.type || 'image/jpeg' });
        doc.photos = doc.photos.concat([{ id: r.id, name: String(f.name || '').slice(0, 80), at: new Date().toISOString() }]);
        doc.status = 'collecting';
        await write(doc);
      } catch (err) {
        const code = err && err.code;
        V.toast(code === 'too_large' ? 'That photo is too large even after shrinking.' : code === 'quota_or_state' ? 'The codex has no room for more files.' : code === 'rate_limited' ? 'Too many uploads at once; wait a moment.' : 'The photo was not uploaded (' + (code || 'error') + ').');
        if (code === 'not_granted' || code === 'capability_disabled' || code === 'capability_removed') { S.assets = null; break; }
      }
    }
    S.busy.delete(id); refreshAll();
  }
  async function removePhoto(el, pid) {
    const id = el.dataset.inbox; const doc = S.docs.get(id) && cleanDoc(S.docs.get(id));
    if (!doc) return;
    doc.photos = doc.photos.filter((p) => p.id !== pid);
    await write(doc);
    try { await S.assets.delete(pid); } catch (err) { /* the list no longer points at it; housekeeping can remove it later */ }
  }
  async function send(el, btn) {
    const id = el.dataset.inbox; const doc = S.docs.get(id) && cleanDoc(S.docs.get(id));
    if (!doc || !doc.photos.length) return;
    const text = 'Integrate ' + doc.label + ' into ' + ((C.pack() || {}).name || 'the codex') + ' (lore “' + C.lore + '”) from the ' + doc.photos.length + ' page photo' + (doc.photos.length === 1 ? '' : 's') + ' I added in the codex (database collection “inbox”, document “' + id + '”; asset ids: ' + doc.photos.map((p) => p.id).join(', ') + ').';
    const how = await V.askClaude(text, el.closest('.sec, .panel, [data-anchor]') || el, btn);
    if (how === 'sent') { doc.status = 'sent'; doc.sentAt = new Date().toISOString(); await write(doc); }
  }

  document.addEventListener('change', (ev) => {
    const inp = ev.target;
    if (!inp.matches || !inp.matches('[data-inbox-file]')) return;
    const el = inp.closest('.inbox'); if (!el || !S.assets || !inp.files || !inp.files.length) return;
    addFiles(el, inp.files);
  });
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest && ev.target.closest('.inbox[data-inbox]');
    if (!el) return;
    const del = ev.target.closest('[data-inbox-del]');
    if (del) { removePhoto(el, del.dataset.inboxDel); return; }
    const snd = ev.target.closest('[data-inbox-send]');
    if (snd) send(el, snd);
  });

  window.CodexInbox = { slotHtml, refreshAll };
  connect();
})();
