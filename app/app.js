'use strict';
var APP_VER = '1.5.0';
var KEY_N = 'gj_win_news_v1', KEY_S = 'gj_win_sources_v1', KEY_L = 'gj_login_v1', KEY_C = 'gj_win_settings_v1';
function ld(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
function sv(k, v) {
  var j = JSON.stringify(v);
  try { localStorage.setItem(k, j); } catch (e) { }
  try { if (window.gj && window.gj.mirrorSet) window.gj.mirrorSet(k, j); } catch (e) { }   // 控えを保存
}
// 保存データが空のときだけ、控え（自動バックアップ）から復元して読み込み直す
(function () {
  try {
    if (!localStorage.getItem(KEY_L) && !localStorage.getItem(KEY_N) && window.gj && window.gj.mirrorAll && !sessionStorage.getItem('gj_restored')) {
      window.gj.mirrorAll().then(function (m) {
        if (m && (m[KEY_L] || m[KEY_N])) { for (var k in m) localStorage.setItem(k, m[k]); sessionStorage.setItem('gj_restored', '1'); location.reload(); }
      });
    }
  } catch (e) { }
})();
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function $(id) { return document.getElementById(id); }
function jstDay(ts) { return new Date((ts == null ? Date.now() : ts) + 9 * 3600000).toISOString().slice(0, 10); }
function fmt(ts) { return jstDay(ts).replace(/-/g, '.'); }
function today() { return jstDay(); }
function dayDiff(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }
function addDays(ymd, n) { var d = new Date(ymd + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function normTitle(t) { return String(t).replace(/[\s　「」『』（）()【】\[\]・、。!！?？\-‐―ー:：|｜]/g, '').toLowerCase().slice(0, 40); }

/* ---------- 記事の判定（v1.3.1）：ゴジラ作品に関係する記事だけを通し、ジャンルを付け直す ---------- */
// ゴジラ作品・関連商品・関連イベントに固有の言葉（ひとつでもあれば通す）
var G_HARD = /『ゴジラ|ゴジラ[-－−‐]|ゴジラ・|ゴジラ×|ゴジラ(vs|ＶＳ|VS|対)|シン・ゴジラ|ゴジラ（|ゴジラ\(|ゴジラストア|ゴジラ展|ゴジラフェス|ゴジラ・フェス|映画ゴジラ|東宝|怪獣|特撮|モスラ|キングギドラ|ラドン|メカゴジラ|ヘドラ|ビオランテ|ミニラ|ガイガン|呉爾羅|山崎貴|庵野秀明|伊福部|円谷|MonsterArts|S\.H\.Monster|ムービーモンスター|godzilla|gojira|[-－−]\s?[01]\.0/i;
// ゴジラの話題によく出る一般的な言葉（スポーツ等の話題でなければ通す）
var G_SOFT = /映画|新作|最新作|続編|主題歌|キャスト|解禁|ビジュアル|ポスター|興行|動員|特典|公開|予告|特報|上映|劇場|舞台挨拶|試写|フィギュア|ソフビ|予約|発売|グッズ|一番くじ|ブルーレイ|Blu-ray|DVD|パンフレット|ポップアップ|コラボ|展示|特別展|ガチャ|ねんどろいど|プラモ/i;
// ほかの話題（愛称としての「ゴジラ」など）
var G_NOISE = /ソフトボール|野球|プロ野球|高校野球|打者|投手|本塁打|ホームラン|先制弾|逆転弾|サヨナラ|球団|球場|登板|打線|試合|連覇|優勝|日本一|ダイヤモンドシリーズ|サッカー|Ｊリーグ|Jリーグ|ラグビー|バスケ|バレーボール|相撲|力士|横綱|競馬|騎手|ゴルフ|マラソン|ボクシング|プロレス|選手権|ドラフト|逮捕|容疑|議員|市長|知事|株価|決算/;
var G_NICK = /[“"”]ゴジラ[”"“]|界の[“"]?ゴジラ|[“"]?ゴジラ[”"]?の異名|ゴジラ級|ゴジラ(と呼ばれ|の愛称|の異名)/;
function gateOK(it) {
  if (it.trusted) return true;
  var t = (it.title || '') + ' ' + (it.summary || '') + ' ' + (it.detail || '');
  if (G_HARD.test(t)) return true;
  if (G_NOISE.test(t)) return false;
  if (G_NICK.test(t) && !G_SOFT.test(t)) return false;
  return G_SOFT.test(t);
}
var C_MOVIE = ['映画', '予告', '特報', '公開', '興行', '動員', '監督', '出演', 'キャスト', '主題歌', '受賞', 'アカデミー', '脚本', 'ビジュアル', '解禁', 'ポスター', '本編', '配信', '撮影', '特撮', '最新作', '続編', 'レビュー', '感想'];
var C_EVENT = ['舞台挨拶', '舞台あいさつ', '試写', '初日', '登壇', 'イベント', 'フェス', '開催', '展示', '特別展', '展覧', 'コラボ', 'カフェ', 'ポップアップ', '上映会', 'ツアー', 'キャンペーン', 'プレミア', 'レッドカーペット', '来場', '入場', 'アトラクション', 'スタンプラリー', '展'];
var C_GOODS = ['フィギュア', 'ソフビ', '発売', '予約', '一番くじ', 'くじ', 'Tシャツ', 'グッズ', 'ストア', '商品', 'ねんどろいど', '限定', 'プラモ', 'ガチャ', 'ぬいぐるみ', 'アパレル', 'ブルーレイ', 'Blu-ray', 'DVD', 'パンフレット', 'アクスタ', 'マグカップ', 'MonsterArts', 'ムービーモンスター', '万円', '円(税込)', '円（税込）'];
function catScore(words, title, rest) {
  var sc = 0;
  words.forEach(function (w) { if (title.indexOf(w) > -1) sc += 3; else if (rest.indexOf(w) > -1) sc += 1; });
  return sc;
}
function classify2(it) {   // 同点のときは イベント > グッズ > 映画
  var title = it.title || '', rest = (it.summary || '') + ' ' + (it.detail || '');
  var m = catScore(C_MOVIE, title, rest), e = catScore(C_EVENT, title, rest), g = catScore(C_GOODS, title, rest);
  if (!m && !e && !g) return '映画';
  if (e >= g && e >= m) return 'イベント';
  if (g >= m) return 'グッズ';
  return '映画';
}
function fetchedItem(n) { return !n.seed && String(n.id).indexOf('u:') !== 0; }   // 自動取得された記事（手動追加・初期データ以外）
function tidyStored() {   // 保存済みの記事を整理：関係ない記事を消し、ジャンルを付け直す（ブックマーク済みは残す）
  var before = st.items.length;
  st.items = st.items.filter(function (n) { return !fetchedItem(n) || n.bm || n.trusted || gateOK(n); });
  st.items.forEach(function (n) { if (fetchedItem(n)) n.category = classify2(n); });
  return before - st.items.length;
}

/* ---------- 設定 ---------- */
var cfg = Object.assign({ theme: 'auto', interval: 30, notify: true, removedSrc: [], updateUrl: '', autoUpdate: true, maxItems: 100, titleScreen: true }, ld(KEY_C, {}) || {});
function saveCfg() { sv(KEY_C, cfg); }
function maxN() { var n = +cfg.maxItems; return n >= 20 && n <= 5000 ? n : 100; }
function applyTheme() {
  var r = document.documentElement;
  if (cfg.theme === 'light' || cfg.theme === 'dark') r.setAttribute('data-theme', cfg.theme); else r.removeAttribute('data-theme');
}
applyTheme();

/* ---------- データ ---------- */
var st = ld(KEY_N, { items: [], gone: [], last: 0 });
if (!st || !st.items) st = { items: [], gone: [], last: 0 };
if (!st.ss) st.ss = {};
function save() { sv(KEY_N, st); }

(function mergeSeeds() {
  (window.SEED || []).forEach(function (x, i) {
    if (st.gone.indexOf(x[0]) > -1) return;
    var o = { id: x[0], seed: true, ts: Date.parse(x[1] + 'T09:00:00+09:00') - i * 1000, dateKind: x[2], category: x[3], title: x[4], source: x[5], label: x[6], summary: x[7], detail: x[8], url: x[9], image: '' };
    var k = -1; st.items.forEach(function (n, j) { if (n.id === x[0]) k = j; });
    if (k < 0) st.items.push(o); else st.items[k] = Object.assign({}, o, { image: st.items[k].image || '', bm: !!st.items[k].bm });
  });
  trim(); save();
})();

function trim() {
  st.items.sort(function (a, b) { return b.ts - a.ts; });
  var keep = 0;   // 古いものから自動削除。ただしブックマーク済みは削除しない（100件の枠にも数えない）
  st.items = st.items.filter(function (n) { if (n.bm) return true; keep++; return keep <= maxN(); });
}

/* ---------- カウントダウン ---------- */
function renderCountdown() {
  var t = today(), rows = [];
  (window.EVENTS || []).forEach(function (e) {
    var diff = dayDiff(t, e.date), label = '', big = '', rank = 0;
    if (diff > 0) { big = 'あと <b>' + diff + '</b><small> 日</small>'; rank = diff; }
    else if (diff === 0) { big = esc(e.today); rank = 0; }
    else if (t <= e.until) { big = esc(e.ongoing); rank = 9999; }
    else return;
    rows.push({ rank: rank, html: '<div class="cr"><div><div class="cl">' + esc(e.label) + '</div><div class="cs">' + esc(e.sub) + '</div></div><div class="cn">' + big + '</div></div>' });
  });
  rows.sort(function (a, b) { return a.rank - b.rank; });
  $('cd').innerHTML = rows.slice(0, 2).map(function (r) { return r.html; }).join('');
}

/* ---------- ニュース表示 ---------- */
var UNREAD = '● 未読', BM = '★ ブックマーク';
var cats = ['すべて', '映画', 'グッズ', 'イベント', UNREAD, BM], cur = 'すべて', q = '';
function bmCount() { return st.items.filter(function (n) { return n.bm; }).length; }
function unreadCount() { return st.items.filter(function (n) { return n.unread; }).length; }
function toggleBm(id) {
  var n = st.items.filter(function (x) { return String(x.id) === String(id); })[0]; if (!n) return false;
  n.bm = !n.bm; save(); return n.bm;
}
function matchQ(n) {
  if (!q) return true;
  return (n.title + ' ' + n.summary + ' ' + n.detail + ' ' + n.source).toLowerCase().indexOf(q) > -1;
}
function inCat(n) {
  if (cur === 'すべて') return true;
  if (cur === BM) return !!n.bm;
  if (cur === UNREAD) return !!n.unread;
  return n.category === cur;
}
function renderNews() {
  var ch = $('chips'); ch.innerHTML = '';
  cats.forEach(function (c) {
    var b = document.createElement('button');
    b.textContent = c === BM ? BM + '（' + bmCount() + '）' : (c === UNREAD ? UNREAD + '（' + unreadCount() + '）' : c);
    if (c === cur) b.className = 'on'; b.onclick = function () { cur = c; renderNews(); }; ch.appendChild(b);
  });
  var arr = st.items.filter(function (n) { return inCat(n) && matchQ(n); });
  $('count').textContent = (q || cur !== 'すべて' ? arr.length + ' 件' : (st.items.length - bmCount()) + ' / ' + maxN() + ' 件');
  $('list').innerHTML = arr.map(function (n) {
    return '<article class="item' + (n.unread ? ' unread' : '') + '" data-id="' + esc(n.id) + '">' +
      (n.image ? '<img src="' + esc(n.image) + '" alt="" referrerpolicy="no-referrer">' : '') +
      '<div style="flex:1;min-width:0"><div class="meta"><span class="cat">' + esc(n.category) + '</span>' + (n.unread ? '<span class="newb">NEW</span>' : '') + '<span class="dt">' + esc(n.dateKind) + ' ' + fmt(n.ts) + '</span><button class="star' + (n.bm ? ' on' : '') + '" data-s="' + esc(n.id) + '" title="ブックマーク">' + (n.bm ? '★' : '☆') + '</button><button class="del" data-id="' + esc(n.id) + '">削除</button></div>' +
      '<h3>' + esc(n.title) + '</h3><p>' + esc(n.summary) + '</p>' +
      '<div class="meta" style="margin-top:4px"><span class="note">' + esc(n.source) + '</span></div></div></article>';
  }).join('') || (cur === BM ? '<div class="empty">ブックマークはまだありません。ニュースの☆を押すと保存できます。</div>' : (cur === UNREAD ? '<div class="empty">未読のニュースはありません。</div>' : (q ? '<div class="empty">「' + esc(q) + '」に合うニュースはありません。</div>' : '<div class="empty">まだニュースがありません</div>')));
  [].forEach.call(document.querySelectorAll('#list img'), function (im) { im.onerror = function () { im.remove(); }; });
  [].forEach.call(document.querySelectorAll('.item'), function (a) { a.onclick = function () { openD(a.dataset.id); }; });
  [].forEach.call(document.querySelectorAll('.star'), function (b) { b.onclick = function (e) { e.stopPropagation(); toggleBm(b.dataset.s); renderNews(); }; });
  [].forEach.call(document.querySelectorAll('.del'), function (b) {
    b.onclick = function (e) {
      e.stopPropagation(); var id = b.dataset.id; var tg = st.items.filter(function (n) { return String(n.id) === id; })[0]; if (tg && tg.bm && !confirm('ブックマーク済みのニュースです。削除しますか？')) return;
      st.items = st.items.filter(function (n) { return String(n.id) !== id; });
      st.gone.push(id); st.gone = st.gone.slice(-1000); save(); renderNews();
    };
  });
}
$('q').oninput = function () { q = this.value.trim().toLowerCase(); renderNews(); };
$('readall').onclick = function () { st.items.forEach(function (n) { n.unread = false; }); save(); renderNews(); };

function openD(id) {
  var n = st.items.filter(function (x) { return String(x.id) === String(id); })[0]; if (!n) return;
  if (n.unread) { n.unread = false; save(); }
  var link = n.url && /^https?:/.test(n.url) ? '<a class="lk" href="' + esc(n.url) + '" target="_blank" rel="noopener">元の記事を読む →</a>' : '';
  $('sheet').innerHTML = '<div class="meta"><span class="cat">' + esc(n.category) + '</span><span class="dt">' + esc(n.dateKind) + ' ' + fmt(n.ts) + '</span></div><h2>' + esc(n.title) + '</h2>' +
    (n.image ? '<img src="' + esc(n.image) + '" alt="" referrerpolicy="no-referrer">' : '') +
    '<div class="note">' + esc(n.label || '') + '　／　情報元：' + esc(n.source) + '</div><p class="tx">' + esc(n.detail || n.summary) + '</p>' + link +
    '<div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap"><button class="btn" id="cl">閉じる</button><button class="btn2" id="bmb">' + (n.bm ? '★ ブックマーク済み' : '☆ ブックマークする') + '</button></div>';
  var im = $('sheet').querySelector('img'); if (im) im.onerror = function () { im.remove(); };
  $('md').className = 'md'; $('cl').onclick = closeD;
  $('bmb').onclick = function () { var on = toggleBm(n.id); $('bmb').textContent = on ? '★ ブックマーク済み' : '☆ ブックマークする'; renderNews(); };
}
function closeD() { $('md').className = 'md hide'; renderNews(); }
$('md').onclick = function (e) { if (e.target.id === 'md') closeD(); };
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('md').classList.contains('hide')) closeD(); });

/* ---------- 手動追加 ---------- */
function shrink(file, cb) {
  var r = new FileReader();
  r.onload = function () {
    var im = new Image();
    im.onload = function () { var w = Math.min(480, im.width), h = im.height * w / im.width, c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h); cb(c.toDataURL('image/jpeg', .7)); };
    im.onerror = function () { cb(''); }; im.src = r.result;
  };
  r.readAsDataURL(file);
}
$('f').onsubmit = function (e) {
  e.preventDefault(); var f = e.target, fd = new FormData(f), file = f.img.files[0];
  function add(img) {
    var now = Date.now(), body = fd.get('body') || '';
    st.items.push({ id: 'u:' + now, ts: now, dateKind: '追加日', category: fd.get('cat'), title: fd.get('title'), source: fd.get('src') || '手動追加', label: '追加', summary: body, detail: body, url: fd.get('url') || '', image: img, seed: false });
    trim(); save(); f.reset(); renderNews();
  }
  if (file) shrink(file, add); else add('');
};

/* ---------- 情報源 ---------- */
var sources = ld(KEY_S, null);
function saveSources() { sv(KEY_S, sources); }
function newId() { return 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function fmtTime(t) { return new Date(t).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function renderSources() {
  $('slist').innerHTML = sources.map(function (s, i) {
    var ss = st.ss[s.id], stt = '';
    if (ss) stt = ss.ok ? '<div class="stt ok">✓ ' + ss.n + ' 件　' + fmtTime(ss.t) + '</div>' : '<div class="stt ng">× ' + fmtTime(ss.t) + '　' + esc(ss.err) + '</div>';
    else stt = '<div class="stt note">未取得</div>';
    return '<div class="fd"><input type="checkbox" data-i="' + i + '"' + (s.enabled !== false ? ' checked' : '') + '><div style="min-width:0"><div class="nm">' + esc(s.name) + (s.type === 'html' ? '<span class="tp">ページ読み取り</span>' : '') + (s.filter === false ? '<span class="tp">ゴジラ専用</span>' : '') + '</div><div class="ur">' + esc(s.url) + '</div>' + stt + '</div><button data-d="' + i + '">削除</button></div>';
  }).join('') || '<div class="note">情報源がありません。</div>';
  [].forEach.call(document.querySelectorAll('#slist input'), function (c) { c.onchange = function () { sources[+c.dataset.i].enabled = c.checked; saveSources(); }; });
  [].forEach.call(document.querySelectorAll('#slist button'), function (b) {
    b.onclick = function () {
      var s = sources.splice(+b.dataset.d, 1)[0];
      if (s && cfg.removedSrc.indexOf(s.id) < 0) { cfg.removedSrc.push(s.id); saveCfg(); }
      saveSources(); renderSources();
    };
  });
}
async function initSources() {
  var defs = [];
  try { defs = await window.gj.defaultSources(); } catch (e) { }
  if (!sources || !sources.length) sources = defs.slice();
  else {   // 新しく増えた標準の情報源を追加（自分で消したものは戻さない）
    var have = {}; sources.forEach(function (s) { if (s.id) have[s.id] = 1; });
    defs.forEach(function (d) { if (!have[d.id] && cfg.removedSrc.indexOf(d.id) < 0) sources.push(d); });
  }
  sources.forEach(function (s) { if (!s.id) s.id = newId(); });
  saveSources();
}
$('sf').onsubmit = async function (e) {
  e.preventDefault(); var f = e.target, url = f.url.value.trim(), name = f.name.value.trim(), only = f.only.checked;
  $('smsg').textContent = 'RSSを探しています…';
  var r = await window.gj.discover(url);
  var host = ''; try { host = new URL(url).hostname; } catch (x) { }
  if (r && r.ok && r.url) {
    try { host = new URL(r.url).hostname; } catch (x) { }
    sources.push({ id: newId(), name: name || host || '情報源', url: r.url, enabled: true, filter: !only });
    saveSources(); renderSources(); f.reset(); $('smsg').textContent = '追加しました。「今すぐ更新」で取り込みます。';
  } else if (r && r.ok) {
    if (confirm('RSSが見つかりませんでした。\nこのページの中にあるゴジラ関連のリンクを、直接読み取る方式で追加しますか？')) {
      sources.push({ id: newId(), name: name || host || '情報源', url: url, enabled: true, filter: true, type: 'html' });
      saveSources(); renderSources(); f.reset(); $('smsg').textContent = 'ページ読み取りの情報源として追加しました。「今すぐ更新」で取り込みます。';
    } else $('smsg').textContent = '追加しませんでした。';
  } else { $('smsg').textContent = 'ページを開けませんでした（' + ((r && r.error) || '通信エラー') + '）。URLとネットワークを確認してください。'; }
};
$('sreset').onclick = async function () {
  if (!confirm('情報源を初期の状態に戻しますか？（追加した情報源は消えます）')) return;
  cfg.removedSrc = []; saveCfg();
  sources = await window.gj.defaultSources(); saveSources(); renderSources();
};

/* ---------- 更新 ---------- */
var busy = false, timer = null;
async function doRefresh(auto) {
  if (busy) return; busy = true;
  var btn = $('reload'); btn.disabled = true; btn.textContent = '更新中…'; $('status').textContent = '更新中…';
  try {
    var known = { ids: st.items.map(function (n) { return n.id; }).concat(st.gone), titles: st.items.map(function (n) { return n.title; }) };
    var r = await window.gj.refresh({ sources: sources, known: known });
    if (!r || !r.ok) { $('status').textContent = '更新に失敗しました：' + ((r && r.error) || '不明なエラー'); return; }
    var added = 0, skipped = 0;
    r.items.forEach(function (it) {
      if (st.gone.indexOf(it.id) > -1) return;
      if (st.items.some(function (n) { return n.id === it.id; })) return;
      if (!gateOK(it)) { skipped++; return; }
      it.category = classify2(it);
      st.items.push({ id: it.id, ts: it.ts, dateKind: it.dateKind, category: it.category, title: it.title, source: it.source, label: it.label, summary: it.summary, detail: it.detail, url: it.url, image: it.image, seed: false, unread: true, trusted: !!it.trusted });
      added++;
    });
    (r.perSource || []).forEach(function (p) { st.ss[p.id] = { t: Date.now(), ok: p.ok, n: p.count || 0, err: p.error || '' }; });
    st.last = Date.now(); trim(); save(); renderNews(); renderSources();
    var failed = r.errors.length, total = r.checked;
    var msg = '最終更新 ' + new Date(st.last).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) + '　新着 ' + added + ' 件' + (skipped ? '　除外 ' + skipped + ' 件' : '');
    if (failed) msg += '　（' + failed + '件は取得できませんでした）';
    if (failed === total && total > 0) msg = '取得できませんでした。通信を確認してください。';
    $('status').textContent = msg;
    if (added > 0 && auto && cfg.notify) window.gj.notify('GODZILLA 通信', '新着ニュースが ' + added + ' 件あります');
  } catch (e) { $('status').textContent = '更新に失敗しました：' + e.message; }
  finally { busy = false; btn.disabled = false; btn.textContent = '今すぐ更新'; }
}
$('reload').onclick = function () { doRefresh(false); };
function schedule() {
  if (timer) clearInterval(timer); timer = null;
  var m = +cfg.interval || 0;
  $('auto').textContent = m ? '自動更新：' + (m >= 60 ? (m / 60) + '時間' : m + '分') + 'ごと' : '自動更新：なし';
  if (m > 0) timer = setInterval(function () { doRefresh(true); }, m * 60 * 1000);
}

/* ---------- 称号 ---------- */
var TITLES = ['大戸島の目撃者','巨大不明生物 避難誘導班','報道部 特撮災害取材班','対策本部 観測・分析オペレーター','メーサー殺獣光線車 砲手','Gフォース 訓練兵','スーパーX 航空パイロット','MOGERA 操縦士','3式機龍 メインオペレーター','Gフォース 総司令官','インファント島 調査員','怪獣島 監視員','X星人 地球統制官','ブラックホール第3惑星人 工作員','次元障壁 開発者','超能力怪獣研究者（M機関）','護国聖獣の祈祷師','G細胞 適合体','オキシジェン・デストロイヤー 継承者','巨大不明生物 特設災害対策本部長','サイボーグ怪獣 ガイガン級','バイオ怪獣 ビオランテ級','完全生命体 デストロイア級','超大怪獣 カイザーギドラ級','世紀末覇王 バーニング級','虚空の神 ギドラの信奉者','第5形態への進化体','シン・人類（破壊神の代弁者）','怪獣王（キング・オブ・モンスターズ）','呉爾羅（ゴジラ・究極の破壊神）'];
function titleOf(n) { return TITLES[Math.min(n, TITLES.length) - 1] || ''; }
function renderTitles() {
  var n = Math.min(L.done, TITLES.length);
  var cls = n === TITLES.length ? ' gold' : '';
  var h = '<div class="note">現在の称号</div><div class="tt' + cls + '">' + (n ? esc(titleOf(n)) : '称号なし') + '</div>';
  if (n < TITLES.length) { var rem = L.streak % 7 === 0 ? 7 : 7 - L.streak % 7; h += '<div class="note">次の称号まで あと ' + rem + ' 日</div>'; }
  else h += '<div class="note">すべて獲得</div>';
  $('ttl').innerHTML = h;
  var l = '';
  for (var i = 1; i <= TITLES.length; i++) {
    var on = i <= n, last = i === TITLES.length;
    l += '<div class="tl' + (on ? '' : ' lock') + '"><span class="no">第' + i + '枚目</span><span class="nm2' + (on && last ? ' gold' : '') + '">' + (on ? esc(TITLES[i - 1]) : '？？？') + '</span></div>';
  }
  $('tlist').innerHTML = l;
}

/* ---------- スタンプカード ---------- */
var L = ld(KEY_L, { streak: 0, last: '', done: 0, best: 0 }) || {};
L = Object.assign({ streak: 0, last: '', done: 0, best: 0 }, L);
if (typeof L.total !== 'number') L.total = Math.max(L.best || 0, L.streak || 0, L.last ? 1 : 0);
if (!Array.isArray(L.days)) L.days = L.last ? [L.last] : [];
if (typeof L.gp !== 'number') L.gp = 0;
if (typeof L.gpTotal !== 'number') L.gpTotal = 0;
if (!Array.isArray(L.gpLog)) L.gpLog = [];
if (!Array.isArray(L.owned)) L.owned = [];
function checkBreak() { if (L.last && dayDiff(L.last, today()) > 1 && L.streak !== 0) { L.streak = 0; sv(KEY_L, L); } }

function loginDays() {   // 記録のある日（v1.3より前の連続分も、連続ログイン日数から復元する）
  var set = {}; L.days.forEach(function (d) { set[d] = 1; });
  if (L.last && L.streak > 0) for (var i = 0; i < L.streak; i++) set[addDays(L.last, -i)] = 1;
  return set;
}
var calY = 0, calM = 0;
function renderCal() {
  if (!calY) { var t = today().split('-'); calY = +t[0]; calM = +t[1] - 1; }
  var set = loginDays(), td = today();
  var first = new Date(Date.UTC(calY, calM, 1)).getUTCDay(), len = new Date(Date.UTC(calY, calM + 1, 0)).getUTCDate();
  var h = '<div class="calh"><button class="lnk" id="cal_p">◀ 前の月</button><span>' + calY + '年' + (calM + 1) + '月</span><button class="lnk" id="cal_n">次の月 ▶</button></div><div class="cal">';
  ['日', '月', '火', '水', '木', '金', '土'].forEach(function (w) { h += '<div class="wd">' + w + '</div>'; });
  for (var i = 0; i < first; i++) h += '<div></div>';
  var cnt = 0;
  for (var d = 1; d <= len; d++) {
    var ymd = calY + '-' + ('0' + (calM + 1)).slice(-2) + '-' + ('0' + d).slice(-2), on = !!set[ymd]; if (on) cnt++;
    h += '<div class="dy' + (on ? ' on' : '') + (ymd === td ? ' td' : '') + '">' + d + '</div>';
  }
  h += '</div><div class="note" style="margin-top:6px">この月のログイン：' + cnt + ' 日</div>';
  $('cal').innerHTML = h;
  $('cal_p').onclick = function () { calM--; if (calM < 0) { calM = 11; calY--; } renderCal(); };
  $('cal_n').onclick = function () { calM++; if (calM > 11) { calM = 0; calY++; } renderCal(); };
}

function triviaToday() {
  var T = window.TRIVIA || [];
  if (!T.length) return '';
  return T[Math.floor(Date.parse(today() + 'T00:00:00Z') / 86400000) % T.length];
}
function renderBonus() {
  var got = L.last === today(), el = $('bonus'), Z = window.ZUKAN || [];
  if (!got) { el.innerHTML = '<div class="note">スタンプで豆知識と図鑑が開きます。</div>'; return; }
  var h = (L.gpDay === today() ? '<div class="gpx"><div class="bh">Godzilla Point</div><b>+' + L.gpGain + ' GP</b></div>' : '') + '<div class="bx"><div class="bh">今日の豆知識</div><div class="bt">' + esc(triviaToday()) + '</div></div>';
  if (L.total >= 1 && L.total <= Z.length) { var z = Z[L.total - 1]; h += '<div class="bx"><div class="bh">図鑑に追加</div><div class="bt"><b>' + esc(z[0]) + '</b>　' + esc(z[1]) + '（' + z[2] + '年）</div></div>'; }
  else if (L.total > Z.length) h += '<div class="bx"><div class="bh">図鑑</div><div class="bt">図鑑コンプリート！</div></div>';
  el.innerHTML = h;
}

function renderGpLog() {
  var h = L.gpLog.slice(-14).reverse().map(function (g) { return '<div class="glog"><span>' + esc(g.d.replace(/-/g, '.')) + '</span><b>+' + g.n + ' GP</b></div>'; }).join('');
  $('gplog').innerHTML = (h || '<div class="note">まだありません</div>') + '<div class="note" style="margin-top:6px">これまでの合計 ' + L.gpTotal + ' GP</div>';
}
function renderLogin() {
  checkBreak();
  var n = L.streak % 7, full = L.streak > 0 && n === 0 ? 7 : n;
  $('sn').textContent = L.streak; $('done').textContent = L.done; $('best').textContent = L.best; $('total').textContent = L.total;
  var s = ''; for (var i = 1; i <= 7; i++) { s += '<div class="st' + (i <= full ? ' f' : '') + (i === 7 ? ' last' : '') + '">' + (i <= full ? (i === 7 ? '満願' : '済') : (i === 7 ? 'GOAL' : i + '日目')) + '</div>'; }
  s += '<div class="st" style="border:0"></div>'; $('stamps').innerHTML = s;
  var got = L.last === today(), b = $('go');
  b.disabled = got; b.style.opacity = got ? .5 : 1; b.textContent = got ? '今日はもう押しました' : '今日のスタンプを押す';
  $('gp').textContent = L.gp;
  renderGpLog(); renderTitles(); renderBonus(); renderCal();
  $('msg').textContent = got ? '明日もまた来てね。' : (L.streak === 0 ? '今日が1日目。ここから始めよう。' : 'あと一歩。今日押して連続記録を伸ばそう。');
}
function rollGP() {   // 1〜100 のどれか（同じ確率）
  var a = new Uint32Array(1);
  try { crypto.getRandomValues(a); } catch (e) { a[0] = Math.floor(Math.random() * 4294967296); }
  return a[0] % 100 + 1;
}
$('go').onclick = function () {
  checkBreak(); if (L.last === today()) return;
  L.streak += 1; L.last = today(); if (L.streak > L.best) L.best = L.streak;
  if (L.streak % 7 === 0) L.done += 1;
  L.total += 1; L.days.push(L.last); L.days = L.days.slice(-400);
  var gain = rollGP(); L.gp += gain; L.gpTotal += gain; L.gpDay = L.last; L.gpGain = gain; L.gpLog.push({ d: L.last, n: gain }); L.gpLog = L.gpLog.slice(-60);
  sv(KEY_L, L); renderLogin();
  if (L.streak % 7 === 0) $('msg').textContent = 'カード満願！称号「' + titleOf(L.done) + '」を獲得しました。';
};

/* ---------- 図鑑 ---------- */
function renderZukan() {
  var Z = window.ZUKAN || [], u = Math.min(L.total || 0, Z.length), justNow = L.last === today();
  $('zkn').textContent = '図鑑 ' + u + ' / ' + Z.length;
  var h = u === Z.length ? '<div class="zdone" style="grid-column:1/-1">コンプリート！</div>' : '';
  Z.forEach(function (z, i) {
    var no = 'No.' + ('0' + (i + 1)).slice(-2);
    if (i < u) h += '<div class="zc' + (justNow && i === u - 1 ? ' new' : '') + '">' + (justNow && i === u - 1 ? '<span class="newb zb">NEW</span>' : '') + '<div class="zn">' + no + '</div><div class="zt">' + esc(z[0]) + '</div><div class="zs">' + esc(z[1]) + '（' + z[2] + '）</div><div class="zd">' + esc(z[3]) + '</div></div>';
    else h += '<div class="zc lock"><div class="zn">' + no + '</div><div class="zt">？？？</div><div class="zd">あと ' + (i - u + 1) + ' 日</div></div>';
  });
  $('zgrid').innerHTML = h;
}

/* ---------- 期間限定図鑑（Godzilla Point で解放） ---------- */
function ownedLim(id) { return L.owned.indexOf(id) > -1; }
function renderLimited() {
  var t = today(), G = window.LIM_GROUPS || [], I = window.LIMITED || [], h = '', act = 0;
  $('gp2').textContent = L.gp;
  G.forEach(function (g) {
    var items = I.filter(function (e) { return e[1] === g.id; });
    var st_ = t < g.from ? 0 : (t > g.until ? 2 : 1), mine = items.filter(function (e) { return ownedLim(e[0]); });
    if (st_ === 2 && !mine.length) return;
    if (st_ === 1) act++;
    var label = st_ === 1 ? '残り ' + (dayDiff(t, g.until) + 1) + ' 日' : (st_ === 0 ? g.from.slice(5).replace('-', '/') + ' から' : '終了');
    h += '<div class="lg"><span>' + esc(g.title) + '</span><small>' + label + '（' + mine.length + ' / ' + items.length + '）</small></div><div class="zgrid">';
    items.forEach(function (e) {
      if (ownedLim(e[0])) h += '<div class="zc lim"><span class="newb zb">限定</span><div class="zn">' + esc(g.title) + '</div><div class="zt">' + esc(e[2]) + '</div><div class="zs">' + esc(e[3]) + '（' + e[4] + '）</div><div class="zd">' + esc(e[5]) + '</div></div>';
      else if (st_ === 1) h += '<div class="zc lock"><div class="zn">限定</div><div class="zt">' + esc(e[2]) + '</div><div class="zd">？？？</div><button class="btn buy" data-lim="' + esc(e[0]) + '"' + (L.gp < e[6] ? ' disabled' : '') + '>' + (L.gp < e[6] ? 'あと ' + (e[6] - L.gp) + ' GP' : e[6] + ' GP で解放') + '</button></div>';
      else if (st_ === 0) h += '<div class="zc lock"><div class="zn">限定</div><div class="zt">？？？</div><div class="zd">' + g.from.slice(5).replace('-', '/') + ' から</div></div>';
    });
    h += '</div>';
  });
  $('zlh').textContent = act ? '開催中の期間限定図鑑があります。解放したものは、期間が終わっても残ります。' : '開催中の期間限定図鑑はありません。';
  $('zlim').innerHTML = h || '<div class="empty">いまはありません</div>';
  [].forEach.call(document.querySelectorAll('#zlim .buy'), function (b) { b.onclick = function () { buyLim(b.dataset.lim); }; });
}
function buyLim(id) {
  var e = (window.LIMITED || []).filter(function (x) { return x[0] === id; })[0]; if (!e || ownedLim(id)) return;
  var g = (window.LIM_GROUPS || []).filter(function (x) { return x.id === e[1]; })[0], t = today();
  if (!g || t < g.from || t > g.until) { renderLimited(); return; }
  if (L.gp < e[6]) return;
  if (!confirm('「' + e[2] + '」を ' + e[6] + ' GP で解放しますか？')) return;
  L.gp -= e[6]; L.owned.push(id); sv(KEY_L, L); renderLimited(); renderLogin();
}
var zTab = 'a';
function zukanTab(k) {
  zTab = k; $('zpa').className = k === 'a' ? '' : 'hide'; $('zpb').className = k === 'b' ? '' : 'hide';
  $('zt_a').className = k === 'a' ? 'on' : ''; $('zt_b').className = k === 'b' ? 'on' : '';
  if (k === 'b') renderLimited(); else renderZukan();
}
$('zt_a').onclick = function () { zukanTab('a'); }; $('zt_b').onclick = function () { zukanTab('b'); };

/* ---------- データの引継ぎ ---------- */
var KEYS = [KEY_N, KEY_S, KEY_L, KEY_C];
function msgD(t, bad) { var m = $('d_msg'); m.textContent = t; m.style.color = bad ? 'var(--red)' : ''; }
function buildExport() {
  var data = {};
  KEYS.forEach(function (k) { var v = localStorage.getItem(k); if (v) { try { data[k] = JSON.parse(v); } catch (e) { } } });
  return { app: 'godzilla-tsushin', format: 1, version: APP_VER, exportedAt: new Date().toISOString(), data: data };
}
$('d_exp').onclick = async function () {
  save(); saveSources(); saveCfg(); sv(KEY_L, L);
  var name = 'godzilla-tsushin-backup-' + jstDay().replace(/-/g, '') + '.json';
  var r = await window.gj.exportData(JSON.stringify(buildExport(), null, 1), name);
  if (r && r.ok) msgD('書き出しました：' + r.path);
  else if (r && r.canceled) msgD('キャンセルしました。');
  else msgD('書き出せませんでした：' + ((r && r.error) || '不明なエラー'), true);
};
function pickData(obj) {   // 書き出しファイル／自動バックアップ(backup.json)のどちらでも読めるようにする
  var src = (obj && obj.data && typeof obj.data === 'object') ? obj.data : obj, out = {};
  if (!src || typeof src !== 'object') return out;
  KEYS.forEach(function (k) {
    var v = src[k]; if (v == null) return;
    if (typeof v === 'string') { try { v = JSON.parse(v); } catch (e) { return; } }
    if (v && typeof v === 'object') out[k] = v;
  });
  return out;
}
$('d_imp').onclick = async function () {
  var r = await window.gj.importData();
  if (!r || !r.ok) { if (r && r.canceled) msgD('キャンセルしました。'); else msgD('読み込めませんでした：' + ((r && r.error) || '不明なエラー'), true); return; }
  var obj; try { obj = JSON.parse(r.text); } catch (e) { msgD('ファイルの形式が正しくありません（JSONとして読めません）。', true); return; }
  var d = pickData(obj), n = d[KEY_N], l = d[KEY_L];
  if (!(n && Array.isArray(n.items)) && !(l && typeof l.streak === 'number')) { msgD('このアプリのデータではないようです。', true); return; }
  var info = [];
  if (n && n.items) info.push('ニュース ' + n.items.length + ' 件（ブックマーク ' + n.items.filter(function (x) { return x.bm; }).length + ' 件）');
  if (l) info.push('スタンプカード（連続 ' + (l.streak || 0) + ' 日、満願 ' + (l.done || 0) + ' 枚）');
  if (d[KEY_S]) info.push('情報源 ' + d[KEY_S].length + ' 件');
  if (!confirm('次の内容を読み込みます。いまのデータは置き換えられます。\n\n・' + info.join('\n・') + '\n\nよろしいですか？')) { msgD('キャンセルしました。'); return; }
  Object.keys(d).forEach(function (k) { sv(k, d[k]); });
  msgD('読み込みました。再読み込みします…');
  setTimeout(function () { try { location.reload(); } catch (e) { } }, 400);
};
$('d_open').onclick = function () { window.gj.showBackup(); };

/* ---------- 遠隔アップデート（v1.4.0） ---------- */
function msgU(t, bad) { var m = $('u_msg'); m.textContent = t; m.style.color = bad ? 'var(--red)' : ''; }
async function checkUpdate(auto) {
  var url = (cfg.updateUrl || '').trim();
  if (!url) { if (!auto) msgU('配信元のURLを入力してください。', true); return; }
  if (!/^https:\/\//i.test(url)) { msgU('URLは https:// で始まるものを入れてください。', true); return; }
  if (!auto) msgU('確認しています…');
  var r;
  try { r = await window.gj.checkUpdate(url); } catch (e) { r = { ok: false, error: e.message }; }
  if (!r || !r.ok) { msgU('確認できませんでした：' + ((r && r.error) || '通信エラー'), true); return; }
  if (r.status === 'latest') { msgU('最新の状態です（v' + r.version + '）。'); return; }
  if (r.status === 'needs-exe') { msgU('新しい版 v' + r.version + '（' + r.title + '）は、exe の作り直しが必要です。配布された zip を上書きして build-exe.bat を実行してください。', true); return; }
  if (r.status === 'updated') {
    msgU('v' + r.version + '（' + r.title + '）をダウンロードしました。「反映する」を押すと切り替わります。');
    $('u_apply').className = 'btn2';
    if (auto && confirm('新しいバージョン v' + r.version + '（' + r.title + '）をダウンロードしました。\n今すぐ反映しますか？（保存データはそのまま残ります）')) applyUpdate();
  }
}
async function applyUpdate() { try { sessionStorage.setItem('gj_notitle', '1'); } catch (e) { } msgU('反映しています…'); try { await window.gj.reloadApp(); } catch (e) { msgU('反映できませんでした。アプリを閉じて開き直してください。', true); } }

/* ---------- 設定 ---------- */
function initSettings() {
  $('s_theme').value = cfg.theme; $('s_int').value = String(cfg.interval); $('s_nt').checked = !!cfg.notify;
  $('s_theme').onchange = function () { cfg.theme = this.value; saveCfg(); applyTheme(); };
  $('s_int').onchange = function () { cfg.interval = +this.value; saveCfg(); schedule(); };
  $('s_nt').onchange = function () { cfg.notify = this.checked; saveCfg(); };
  $('s_max').value = String(maxN()); $('s_title').checked = cfg.titleScreen !== false;
  $('s_title').onchange = function () { cfg.titleScreen = this.checked; saveCfg(); };
  $('s_max').onchange = function () {
    var v = +this.value, over = st.items.filter(function (n) { return !n.bm; }).length - v;
    if (over > 0 && !confirm('保存件数を ' + v + ' 件にすると、古いニュース ' + over + ' 件が消えます。よろしいですか？')) { this.value = String(maxN()); return; }
    cfg.maxItems = v; saveCfg(); trim(); save(); renderNews();
  };
  $('u_url').value = cfg.updateUrl || ''; $('u_auto').checked = cfg.autoUpdate !== false;
  $('u_url').onchange = function () { cfg.updateUrl = this.value.trim(); saveCfg(); };
  $('u_auto').onchange = function () { cfg.autoUpdate = this.checked; saveCfg(); };
  $('u_chk').onclick = function () { cfg.updateUrl = $('u_url').value.trim(); saveCfg(); checkUpdate(false); };
  $('u_apply').onclick = applyUpdate;
}
async function loadInfo() {
  try {
    var inf = await window.gj.info();
    $('ver').textContent = 'v' + inf.base + (inf.packs.length ? '　適用中のアップデート：' + inf.packs.map(function (p) { return p.title + (p.version ? ' ' + p.version : ''); }).join('、') : '');
    $('d_bk').textContent = inf.backup && inf.backup.path ? inf.backup.path + (inf.backup.time ? '　（最終保存 ' + fmtTime(inf.backup.time) + '）' : '　（まだ作られていません。少し操作すると作られます）') : 'このパソコンでは使えません';
    $('about').textContent = 'GODZILLA 通信 v' + inf.base + (inf.packs.length ? '　＋更新 ' + inf.packs.length + ' 件' : '');
  } catch (e) { }
}

/* ---------- タブ ---------- */
var SECS = ['news', 'login', 'zk', 'src', 'set'];
function tab(n) {
  SECS.forEach(function (id, i) { $(id).className = (i + 1 === n) ? '' : 'hide'; $('t' + (i + 1)).className = (i + 1 === n) ? 'on' : ''; });
  if (n === 2) renderLogin(); if (n === 3) zukanTab(zTab); if (n === 4) renderSources(); if (n === 5) loadInfo();
}
[1, 2, 3, 4, 5].forEach(function (n) { $('t' + n).onclick = function () { tab(n); }; });

/* ---------- タイトル画面 ---------- */
function showTitle() {
  var got = L.last === today(), t = today();
  checkBreak();
  $('ts_stats').innerHTML = '<div>連続ログイン<b>' + L.streak + '</b></div><div>Godzilla Point<b>' + L.gp + '</b></div><div>未読<b>' + unreadCount() + '</b></div>';
  var next = null;
  (window.EVENTS || []).forEach(function (e) { var d = dayDiff(t, e.date); if (d >= 0 && (next === null || d < next.d)) next = { d: d, e: e }; });
  $('ts_cd').innerHTML = next ? esc(next.e.label) + '　' + (next.d === 0 ? '<b>' + esc(next.e.today) + '</b>' : 'あと <b>' + next.d + '</b> 日') : '';
  $('ts_stamp').textContent = got ? '' : '今日のスタンプを押しに行く';
  $('ts_ver').textContent = 'v' + APP_VER;
  $('title').className = 'ttlscr';
  try { $('ts_go').focus(); } catch (e) { }
}
function hideTitle(toStamp) { $('title').className = 'ttlscr hide'; if (toStamp) tab(2); }
$('ts_go').onclick = function () { hideTitle(false); };
$('ts_stamp').onclick = function () { hideTitle(true); };

/* ---------- 起動 ---------- */
(async function start() {
  await initSources();
  try { KEYS.forEach(function (k) { var v = localStorage.getItem(k); if (v && window.gj && window.gj.mirrorSet) window.gj.mirrorSet(k, v); }); } catch (e) { }
  var tidied = 0;
  if ((cfg.gate || 0) < 2) { tidied = tidyStored(); cfg.gate = 2; saveCfg(); save(); }
  initSettings(); schedule(); loadInfo();
  var skipTitle = false; try { skipTitle = !!sessionStorage.getItem('gj_notitle'); sessionStorage.removeItem('gj_notitle'); } catch (e) { }
  if (cfg.titleScreen !== false && !skipTitle) showTitle();
  renderCountdown(); renderNews(); renderLogin(); renderSources();
  if (st.last) $('status').textContent = '最終更新 ' + fmtTime(st.last);
  if (tidied) $('status').textContent = '記事を整理しました（' + tidied + ' 件）';
  doRefresh(false);
  if (cfg.autoUpdate !== false && cfg.updateUrl) setTimeout(function () { checkUpdate(true); }, 2500);
  window.addEventListener('focus', function () {
    renderLogin(); renderCountdown();
    var m = +cfg.interval || 0;
    if (m > 0 && Date.now() - (st.last || 0) > m * 60 * 1000) doRefresh(true);
  });
})();
