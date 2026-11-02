'use strict';
var APP_VER = '1.6.0';
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
var RU = window.GJ_RULES || null, RX = null;
if (RU) { try { RX = {}; ['core', 'hard', 'soft', 'noise', 'nick', 'src', 'junk'].forEach(function (k) { RX[k] = new RegExp(RU[k] || '(?!)', 'i'); }); } catch (e) { RX = null; } }
if (RX && RU.cat) { try { RX.cat = {}; ['event', 'goods', 'movie'].forEach(function (k) { RX.cat[k] = { s: new RegExp(RU.cat[k].s, 'i'), w: new RegExp(RU.cat[k].w, 'i'), sg: new RegExp(RU.cat[k].s, 'gi') }; }); } catch (e) { RX.cat = null; } }
function ruleVer() { return RX ? RU.v : 2; }
function relScore(it) {
  var title = it.title || '', body = (it.summary || '') + ' ' + (it.detail || ''), sc = 0;
  sc += RX.core.test(title) ? 4 : (RX.core.test(body) ? 1 : 0);
  sc += RX.hard.test(title) ? 3 : (RX.hard.test(body) ? 1 : 0);
  sc += RX.soft.test(title) ? 2 : (RX.soft.test(body) ? 1 : 0);
  if (RX.src.test(it.source || '')) sc += 1;
  if (RX.junk.test(title)) sc -= 10;   // 劇場ごとの上映時間・上映館のお知らせ
  sc -= RX.noise.test(title) ? 6 : (RX.noise.test(body) ? 3 : 0);
  sc -= RX.nick.test(title) ? 4 : (RX.nick.test(body) ? 2 : 0);
  return sc;
}
function blockWords() { return String(cfg.blockWords || '').toLowerCase().split(/[\s\u3000,、]+/).filter(function (w) { return w; }); }
function userBlocked(it) {
  var t = ((it.title || '') + ' ' + (it.summary || '')).toLowerCase();
  return blockWords().some(function (w) { return t.indexOf(w) > -1; });
}
// 似ているタイトル（同じニュースを別サイトが載せたもの）を見つける：サイト名を除いた2文字ずつの重なり具合
function bigrams(t) {
  var c = normTitle(String(t).replace(/\s+[-－–—]\s+[^\n]{1,24}$|\s*[|｜]\s*[^|｜]{1,24}$/, '')), o = {}, n = 0;
  for (var i = 0; i < c.length - 1; i++) { var g = c.substr(i, 2); if (!o[g]) { o[g] = 1; n++; } }
  return { g: o, n: n };
}
function similar(a, b) {
  if (a.n < 8 || b.n < 8) return false;
  var inter = 0; for (var k in a.g) if (b.g[k]) inter++;
  return inter / (a.n + b.n - inter) >= 0.65;
}

/* ---------- 同じニュースの複合（v1.5.4）：確証があるときだけ、別サイトの同じ話題を1件にまとめる ---------- */
var VER_RE = /[-−‐]\s?([01])\.0/;
var ENT_RE = /シン・?ゴジラ|キングギドラ|メカゴジラ|モスラ|ヘドラ|ビオランテ|ミニラ|ガイガン|ラドン|アンギラス|キングコング|モンスターバース|ゴジラ・?フェス|ゴジラ展|ゴジラストア|monsterarts|ねんどろいど|ムービーモンスター|一番くじ|フィギュア|ソフビ|tシャツ|blu-ray|dvd|パンフレット|プラモ|ガチャ|ぬいぐるみ|アクスタ/g;
var KIND_RE = [['tk', /特報/], ['hy', /本予告/], ['fy', /最終予告/], ['pt', /ポスター/], ['vs', /ビジュアル/], ['th', /主題歌/], ['ct', /キャスト|出演/], ['rl', /発売/], ['rv', /予約/], ['ev', /開催/], ['st', /舞台挨拶/], ['mu', /前売/], ['bo', /興行収入|動員/], ['pv', /試写/], ['aw', /受賞/], ['dl', /配信/]];
var _fc = {};
function setKey(a) { var o = {}; a.forEach(function (x) { o[x] = 1; }); return Object.keys(o).sort().join('|'); }
function cleanT(t) { return String(t || '').normalize('NFKC').replace(/\s+[-–—]\s+[^\n]{1,24}$|\s*[|｜]\s*[^|｜]{1,24}$/, ''); }
function normSrc(x) { return String(x || '').toLowerCase().replace(/[\s　\-－–—・.]/g, ''); }
function feat(it) {
  var k = it.id + '|' + it.title; if (_fc[k]) return _fc[k];
  var t = cleanT(it.title), low = t.toLowerCase(), v = VER_RE.exec(t), ver = v ? '-' + v[1] + '.0' : (/minus\s*zero/i.test(t) ? '-0.0' : (/minus\s*one/i.test(t) ? '-1.0' : ''));
  var core = low.replace(/[-−‐]\s?[01]\.0/g, '');
  var kinds = []; KIND_RE.forEach(function (x) { if (x[1].test(core)) kinds.push(x[0]); });
  if (/予告/.test(core.replace(/本予告|最終予告/g, ''))) kinds.push('yk');
  var ser = (core.match(/第\d+(弾|報|話|回)/g) || []).join(','), nums = (core.match(/\d+/g) || []);
  var bg = {}, n = 0, c = normTitle(core); for (var i = 0; i < c.length - 1; i++) { var g = c.substr(i, 2); if (!bg[g]) { bg[g] = 1; n++; } }
  return (_fc[k] = { ver: ver, ents: setKey(low.match(ENT_RE) || []), kinds: setKey(kinds), ser: ser, nums: setKey(nums), src: normSrc(it.source), bg: bg, n: n, ts: it.ts });
}
function jac(a, b) { var inter = 0; for (var k in a.bg) if (b.bg[k]) inter++; var u = a.n + b.n - inter; return u ? inter / u : 0; }
function sameStory(a, b) {   // どれか1つでも食い違えば false（確証がなければまとめない）
  if (a.nm || b.nm) return false;
  var x = feat(a), y = feat(b);
  if (x.ents !== y.ents || x.ser !== y.ser) return false;
  if (x.ver && y.ver && x.ver !== y.ver) return false;
  if (x.nums && y.nums && x.nums !== y.nums) return false;
  var j = jac(x, y);
  if (x.n >= 8 && y.n >= 8 && j >= 0.65) return true;   // ほぼ同じ見出し
  if (!x.src || !y.src || x.src === y.src) return false;   // 以下は「別のサイトが同じ話題を書いた」場合だけ
  if (Math.abs((a.ts || 0) - (b.ts || 0)) > 36 * 3600000) return false;
  if (!x.kinds || x.kinds !== y.kinds) return false;   // 内容の種類（特報／本予告／ポスター／発売…）が同じ
  return j >= 0.3;
}
function findTwin(it, list) { for (var i = 0; i < list.length; i++) if (list[i].id !== it.id && sameStory(list[i], it)) return list[i]; return null; }
function srcRec(it) { return { id: it.id, title: it.title, source: it.source, url: it.url, summary: it.summary, detail: it.detail, ts: it.ts, dateKind: it.dateKind, image: it.image }; }
function mergeInto(p, it) {
  var names = [normSrc(p.source)].concat((p.srcs || []).map(function (x) { return normSrc(x.source); }));
  var add = srcRec(it);
  if (it.srcs) it.srcs.forEach(function (x) { if (names.indexOf(normSrc(x.source)) < 0) { p.srcs = p.srcs || []; p.srcs.push(x); names.push(normSrc(x.source)); } });
  if (names.indexOf(normSrc(it.source)) < 0) {
    p.srcs = p.srcs || [];
    var fp = feat(p), fi = feat(it);
    if (fi.ver && !fp.ver) {   // 作品名（-0.0など）がはっきり書いてあるほうを、表の見出しにする
      p.srcs.push(srcRec(p)); p.title = it.title; p.source = it.source; p.url = it.url; p.summary = it.summary || p.summary; p.detail = it.detail || p.detail;
    } else p.srcs.push(add);
  }
  if (p.srcs) p.srcs = p.srcs.slice(0, 8);
  if (!p.image && it.image) p.image = it.image;
  return p;
}
function srcLine(n) {
  var o = [n.source].concat((n.srcs || []).map(function (x) { return x.source; })).filter(function (x, i, a) { return x && a.indexOf(x) === i; });
  return o.length < 2 ? esc(o[0] || '') : esc(o.slice(0, 2).join('　＋　')) + (o.length > 2 ? '　ほか ' + (o.length - 2) : '');
}
function gateOK(it) {
  if (it.trusted) return true;
  if (userBlocked(it)) return false;
  if (RX) return relScore(it) >= RU.th;
  return gateLegacy(it);
}
function gateLegacy(it) {
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
function classifyLegacy(it) {   // 同点のときは イベント > グッズ > 映画
  var title = it.title || '', rest = (it.summary || '') + ' ' + (it.detail || '');
  var m = catScore(C_MOVIE, title, rest), e = catScore(C_EVENT, title, rest), g = catScore(C_GOODS, title, rest);
  if (!m && !e && !g) return '映画';
  if (e >= g && e >= m) return 'イベント';
  if (g >= m) return 'グッズ';
  return '映画';
}
function catPts(c, title, body) {   // 決め手の語はタイトルで1つにつき6点（2つまで）。本文は2点
  var hits = {}, m = title.match(c.sg) || [], n = 0;
  m.forEach(function (x) { hits[x.toLowerCase()] = 1; }); n = Math.min(2, Object.keys(hits).length);
  return (n ? n * 6 : (c.s.test(body) ? 2 : 0)) + (c.w.test(title) ? 3 : (c.w.test(body) ? 1 : 0));
}
function classify2(it) {   // 決め手の語（タイトル6／本文2）＋手がかり（タイトル3／本文1）。同点は イベント > グッズ > 映画
  if (!RX || !RX.cat) return classifyLegacy(it);
  var title = it.title || '', body = (it.summary || '') + ' ' + (it.detail || '');
  var e = catPts(RX.cat.event, title, body), g = catPts(RX.cat.goods, title, body), m = catPts(RX.cat.movie, title, body);
  if (Math.max(e, g, m) < 3) return '映画';
  if (e >= g && e >= m) return 'イベント';
  return g >= m ? 'グッズ' : '映画';
}
function fetchedItem(n) { return !n.seed && String(n.id).indexOf('u:') !== 0; }   // 自動取得された記事（手動追加・初期データ以外）
function tidyStored() {   // 保存済みの記事を整理：関係ない記事・重複を消し、ジャンルを付け直す（ブックマーク済みは残す）
  var before = st.items.length;
  st.items = st.items.filter(function (n) { return !fetchedItem(n) || n.bm || n.trusted || gateOK(n); });
  st.items.sort(function (a, b) { return b.ts - a.ts; });
  var kept = [];
  st.items = st.items.filter(function (n) {   // 新しい順に見て、同じニュースは先に残ったものへまとめる（ブックマーク済みは別のまま残す）
    if (!fetchedItem(n)) return true;
    if (!n.bm) { var tw = findTwin(n, kept); if (tw) { mergeInto(tw, n); return false; } }
    kept.push(n); return true;
  });
  st.items.forEach(function (n) { if (fetchedItem(n)) n.category = classify2(n); });
  return before - st.items.length;
}

/* ---------- 設定 ---------- */
var cfg = Object.assign({ theme: 'auto', interval: 30, notify: true, removedSrc: [], updateUrl: '', autoUpdate: true, maxItems: 100, titleScreen: true, blockWords: '', season: 'auto' }, ld(KEY_C, {}) || {});
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
if (!st.rej) st.rej = [];   // 判定で見送った記事の記録（同じ記事を毎回ダウンロードしないため）
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
  return (n.title + ' ' + n.summary + ' ' + n.detail + ' ' + n.source + ' ' + (n.srcs || []).map(function (x) { return x.source; }).join(' ')).toLowerCase().indexOf(q) > -1;
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
      '<div class="meta" style="margin-top:4px"><span class="note">' + srcLine(n) + '</span></div></div></article>';
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
    '<div class="note">' + esc(n.label || '') + '　／　情報元：' + srcLine(n) + '</div><p class="tx">' + esc(n.detail || n.summary) + '</p>' + link +
    (n.srcs && n.srcs.length ? '<div class="note" style="margin-top:12px">同じニュースを伝えているほかの情報源（' + n.srcs.length + '）</div>' + n.srcs.map(function (x) { return /^https?:/.test(x.url || '') ? '<a class="lk" style="display:block;margin:4px 0" href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.source) + '：' + esc(x.title) + ' →</a>' : ''; }).join('') : '') +
    '<div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap"><button class="btn" id="cl">閉じる</button><button class="btn2" id="bmb">' + (n.bm ? '★ ブックマーク済み' : '☆ ブックマークする') + '</button></div>';
  var im = $('sheet').querySelector('img'); if (im) im.onerror = function () { im.remove(); };
  $('md').className = 'md'; $('cl').onclick = closeD;
  if (n.srcs && n.srcs.length) {   // 間違ってまとまっていたとき用
    var sp = document.createElement('button'); sp.className = 'lnk'; sp.textContent = '別々のニュースに分ける'; sp.style.marginTop = '10px'; sp.style.display = 'block';
    sp.onclick = function () {
      n.srcs.forEach(function (x) { st.items.push({ id: x.id, ts: x.ts, dateKind: x.dateKind, category: n.category, title: x.title, source: x.source, label: n.label, summary: x.summary, detail: x.detail, url: x.url, image: x.image, seed: false, nm: true }); });
      n.srcs = []; n.nm = true; trim(); save(); closeD();
    };
    $('sheet').appendChild(sp);
  }
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
function ago(t) {
  var m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'たったいま'; if (m < 60) return m + '分前';
  var h = Math.round(m / 60); return h < 24 ? h + '時間前' : Math.round(h / 24) + '日前';
}
function explainErr(e) {   // エラーの文言を、わかる言葉と対処に言い換える → [何が起きたか, どうすればいいか]
  e = String(e || ''); var m = /HTTP (\d{3})/.exec(e);
  if (m) {
    var c = +m[1];
    if (c === 404 || c === 410) return ['ページが見つかりません', 'アドレスが変わったか、なくなった可能性があります。'];
    if (c === 401 || c === 403) return ['アクセスを断られました', 'サイト側が自動での取得を制限しています。'];
    if (c === 429) return ['アクセスが多すぎて断られました', 'しばらく待つと直ります。'];
    if (c >= 500) return ['サイト側の不具合のようです', '時間をおくと直ることが多いです。'];
    return ['取得できませんでした', 'HTTP ' + c];
  }
  if (/RSS/.test(e)) return ['ニュースの形式（RSS）ではありません', 'アドレスが違うか、このサイトはRSSを出していません。'];
  if (/timeout|abort|timed|時間/i.test(e)) return ['応答がありませんでした', '通信が遅いか、サイトが混んでいます。'];
  if (/ENOTFOUND|ECONN|ERR_|fetch failed|net::|network|通信/i.test(e)) return ['通信できませんでした', 'ネットワークの接続を確認してください。'];
  return ['取得できませんでした', e.slice(0, 60)];
}
function hostOf(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; } }
var sFilter = 'all';
function srcState(s) {   // off 停止中 / new 未確認 / ok 正常 / zero 接続OKだが該当なし / ng 失敗
  if (s.enabled === false) return 'off';
  var ss = st.ss[s.id]; if (!ss) return 'new';
  return ss.ok ? (ss.n > 0 ? 'ok' : 'zero') : 'ng';
}
function renderSources() {
  var cnt = { ok: 0, ng: 0, off: 0 };
  sources.forEach(function (s) { var k = srcState(s); if (k === 'ok' || k === 'zero') cnt.ok++; else if (k === 'ng') cnt.ng++; else if (k === 'off') cnt.off++; });
  var F = [['all', 'すべて（' + sources.length + '）'], ['ng', '失敗（' + cnt.ng + '）'], ['off', '停止中（' + cnt.off + '）']];
  $('sbar').innerHTML = '<div class="sum"><span class="ok"><b>' + cnt.ok + '</b>正常</span><span class="ng"><b>' + cnt.ng + '</b>失敗</span><span class="off"><b>' + cnt.off + '</b>停止中</span></div><div class="chips">' + F.map(function (f) { return '<button data-f="' + f[0] + '"' + (sFilter === f[0] ? ' class="on"' : '') + '>' + f[1] + '</button>'; }).join('') + '</div>';
  [].forEach.call(document.querySelectorAll('#sbar [data-f]'), function (b) { b.onclick = function () { sFilter = b.dataset.f; renderSources(); }; });
  var rows = sources.map(function (s, i) { return { s: s, i: i, k: srcState(s) }; }).filter(function (r) { return sFilter === 'all' || (sFilter === 'ng' && r.k === 'ng') || (sFilter === 'off' && r.k === 'off'); });
  rows.sort(function (a, b) { return (b.k === 'ng') - (a.k === 'ng'); });   // 失敗しているものを上に
  $('slist').innerHTML = rows.map(function (r) {
    var s = r.s, ss = st.ss[s.id], k = r.k, line = '', hint = '';
    if (k === 'off') line = '停止中（取得しません）';
    else if (k === 'new') line = 'まだ確認していません';
    else if (k === 'ok') line = '取得できました。ゴジラ関連 ' + ss.n + ' 件（' + ago(ss.t) + '）';
    else if (k === 'zero') line = '接続はOK。いまはゴジラ関連の記事がありません（' + ago(ss.t) + '）';
    else { var ex = explainErr(ss.err); line = ex[0] + '（' + ago(ss.t) + '）'; hint = ex[1]; }
    return '<div class="sc ' + k + '"><div class="sc-top"><label class="sw"><input type="checkbox" data-i="' + r.i + '"' + (s.enabled !== false ? ' checked' : '') + '><span></span></label><div class="sc-nm">' + esc(s.name) + (s.type === 'html' ? '<i class="tp">ページ読み取り</i>' : '') + (s.filter === false ? '<i class="tp">ゴジラ専用</i>' : '') + '</div>' + (s.enabled !== false ? '<button class="lnk" data-t="' + r.i + '">いま確認</button>' : '') + '</div>' +
      '<div class="sc-st"><i class="dot"></i>' + esc(line) + '</div>' + (hint ? '<div class="note sc-hint">' + esc(hint) + '</div>' : '') +
      '<details class="sc-more"><summary>くわしく</summary><div class="ur">' + esc(hostOf(s.url)) + '<br>' + esc(s.url) + '</div>' + (ss && !ss.ok && ss.err ? '<div class="ur">記録：' + esc(ss.err) + '</div>' : '') + '<button class="lnk" data-d="' + r.i + '">この情報源を削除</button></details></div>';
  }).join('') || '<div class="empty">' + (sources.length ? 'ありません' : '情報源がありません。') + '</div>';
  [].forEach.call(document.querySelectorAll('#slist input'), function (c) { c.onchange = function () { sources[+c.dataset.i].enabled = c.checked; saveSources(); renderSources(); }; });
  [].forEach.call(document.querySelectorAll('#slist [data-t]'), function (b) { b.onclick = function () { doRefresh(false, sources[+b.dataset.t].id); }; });
  [].forEach.call(document.querySelectorAll('#slist [data-d]'), function (b) {
    b.onclick = function () {
      var s0 = sources[+b.dataset.d]; if (!s0 || !confirm('「' + s0.name + '」を削除しますか？')) return;
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
async function doRefresh(auto, onlyId) {
  if (busy) return; busy = true;
  var btn = $('reload'); btn.disabled = true; btn.textContent = '更新中…'; $('status').textContent = '更新中…';
  try {
    var known = { ids: st.items.map(function (n) { return n.id; }).concat(st.gone, st.rej), titles: st.items.map(function (n) { return n.title; }) };
    var r = await window.gj.refresh({ sources: onlyId ? sources.filter(function (x) { return x.id === onlyId; }) : sources, known: known });
    if (!r || !r.ok) { $('status').textContent = '更新に失敗しました：' + ((r && r.error) || '不明なエラー'); return; }
    var added = 0, skipped = 0, merged = 0, recent = st.items.filter(fetchedItem).slice(0, 400);
    r.items.forEach(function (it) {
      if (st.gone.indexOf(it.id) > -1) return;
      if (st.items.some(function (n) { return n.id === it.id; })) return;
      if (!gateOK(it)) { skipped++; st.rej.push(it.id); return; }
      var tw = findTwin(it, recent); if (tw) { mergeInto(tw, it); merged++; st.rej.push(it.id); return; }
      it.category = classify2(it);
      st.items.push({ id: it.id, ts: it.ts, dateKind: it.dateKind, category: it.category, title: it.title, source: it.source, label: it.label, summary: it.summary, detail: it.detail, url: it.url, image: it.image, seed: false, unread: true, trusted: !!it.trusted });
      recent.push(st.items[st.items.length - 1]); added++;
    });
    (r.perSource || []).forEach(function (p) { st.ss[p.id] = { t: Date.now(), ok: p.ok, n: p.count || 0, err: p.error || '' }; });
    st.rej = st.rej.slice(-1500);
    st.last = Date.now(); trim(); save(); renderNews(); renderSources();
    var failed = r.errors.length, total = r.checked; $('st_go').className = failed ? 'lnk' : 'lnk hide';
    var msg = '最終更新 ' + new Date(st.last).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) + '　新着 ' + added + ' 件' + (merged ? '　複合 ' + merged + ' 件' : '') + (skipped ? '　除外 ' + skipped + ' 件' : '');
    if (failed) msg += '　（' + failed + '件の情報源でつながりませんでした）';
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
if (!L.lib || typeof L.lib !== 'object') L.lib = {};
if (typeof L.zx !== 'number') L.zx = 0;   // 双六で開いた図鑑の数
if (!L.cp || typeof L.cp !== 'object') L.cp = { m: '', u: 0 };   // チェックポイント：月ごとの使用回数
if (!Array.isArray(L.cpAll)) L.cpAll = [];
if (!L.qz || typeof L.qz !== 'object') L.qz = { d: '', n: 0, gp: 0 };   // クイズ：その日の回数とGP
if (!L.gm || typeof L.gm !== 'object') L.gm = { pos: 0, d: '', lap: 0, bm: '', bn: 0, last: '' };   // 双六
var CP_MAX = 3;
function monthKey() { return today().slice(0, 7); }
function cpLeft() { return L.cp.m === monthKey() ? Math.max(0, CP_MAX - L.cp.u) : CP_MAX; }
function missedDays() { return L.last ? Math.max(0, dayDiff(L.last, today()) - 1) : 0; }
function checkBreak() {   // 休んだ日数が、チェックポイントの残りより多いときだけ連続が途切れる
  var m = missedDays();
  if (m > 0 && L.streak !== 0 && m > cpLeft()) { L.streak = 0; L.bsc = 0; sv(KEY_L, L); }
}
function renderCp() {
  var left = cpLeft(), h = '<span>チェックポイント</span><span class="cps">';
  for (var i = 0; i < CP_MAX; i++) h += '<i class="' + (i < left ? '' : 'off') + '"></i>';
  $('cpbar').innerHTML = h + '</span><span>今月あと ' + left + ' 回</span>';
}

function loginDays() {   // 記録のある日（v1.3より前の連続分も、連続ログイン日数から復元する）
  var set = {}; L.days.forEach(function (d) { set[d] = 1; });
  if (L.last && L.streak > 0) { var cps = {}; L.cpAll.forEach(function (x) { cps[x] = 1; }); for (var i = 0; i < L.streak - (L.bsc || 0) && i < 60; i++) { var dd = addDays(L.last, -i); if (!cps[dd]) set[dd] = 1; } }
  return set;
}
var calY = 0, calM = 0;
function renderCal() {
  if (!calY) { var t = today().split('-'); calY = +t[0]; calM = +t[1] - 1; }
  var set = loginDays(), td = today(), cpSet = {}; L.cpAll.forEach(function (x) { cpSet[x] = 1; });
  var first = new Date(Date.UTC(calY, calM, 1)).getUTCDay(), len = new Date(Date.UTC(calY, calM + 1, 0)).getUTCDate();
  var h = '<div class="calh"><button class="lnk" id="cal_p">◀ 前の月</button><span>' + calY + '年' + (calM + 1) + '月</span><button class="lnk" id="cal_n">次の月 ▶</button></div><div class="cal">';
  ['日', '月', '火', '水', '木', '金', '土'].forEach(function (w) { h += '<div class="wd">' + w + '</div>'; });
  for (var i = 0; i < first; i++) h += '<div></div>';
  var cnt = 0;
  for (var d = 1; d <= len; d++) {
    var ymd = calY + '-' + ('0' + (calM + 1)).slice(-2) + '-' + ('0' + d).slice(-2), on = !!set[ymd]; if (on) cnt++;
    var isCp = !on && cpSet[ymd]; if (isCp) cnt++;
    h += '<div class="dy' + (on ? ' on' : '') + (isCp ? ' cp' : '') + (ymd === td ? ' td' : '') + '">' + d + '</div>';
  }
  h += '</div><div class="note" style="margin-top:6px">この月のログイン：' + cnt + ' 日（○印はチェックポイントで守った日）</div>';
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
  var ln = L.limNew && L.limNew.d === today() ? '<div class="gpx"><div class="bh">限定図鑑をもらいました</div><div class="bt" style="font-size:16px;font-weight:700">' + L.limNew.names.map(esc).join('、') + '</div></div>' : '';
  var h = ln + (L.gpDay === today() ? '<div class="gpx"><div class="bh">Godzilla Point</div><b>+' + L.gpGain + ' GP</b></div>' : '') + '<div class="bx"><div class="bh">今日の豆知識</div><div class="bt">' + esc(triviaToday()) + '</div></div>';
  if (L.total >= 1 && L.total <= Z.length) { var z = Z[L.total - 1]; h += '<div class="bx"><div class="bh">図鑑に追加</div><div class="bt"><b>' + esc(z[0]) + '</b>　' + esc(z[1]) + '（' + z[2] + '年）</div></div>'; }
  else if (L.total > Z.length) h += '<div class="bx"><div class="bh">図鑑</div><div class="bt">図鑑コンプリート！</div></div>';
  el.innerHTML = h;
}

function renderGpLog() {
  var h = L.gpLog.slice(-20).reverse().map(function (g) { return '<div class="glog"><span>' + esc(g.d.replace(/-/g, '.')) + '　' + esc(GP_KIND[g.k || 'l'] || '') + '</span><b>+' + g.n + ' GP</b></div>'; }).join('');
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
  renderCp();
  $('msg').textContent = got ? '明日もまた来てね。' : (L.streak > 0 && missedDays() > 0 ? 'チェックポイントで連続が守られています。押すと ' + missedDays() + ' 回使います。' : L.streak === 0 ? '今日が1日目。ここから始めよう。' : 'あと一歩。今日押して連続記録を伸ばそう。');
}
var GP_KIND = { l: 'ログイン', q: 'クイズ', g: '双六' };
function addGP(n, kind) {
  n = Math.max(0, Math.floor(n)); if (!n) return 0;
  L.gp += n; L.gpTotal += n; L.gpLog.push({ d: today(), n: n, k: kind || 'l' }); L.gpLog = L.gpLog.slice(-150);
  return n;
}
function rollGP() {   // 1〜100 のどれか（同じ確率）
  var a = new Uint32Array(1);
  try { crypto.getRandomValues(a); } catch (e) { a[0] = Math.floor(Math.random() * 4294967296); }
  return a[0] % 100 + 1;
}
$('go').onclick = function () {
  checkBreak(); if (L.last === today()) return;
  var used = 0, mm = missedDays();
  if (L.streak > 0 && mm > 0) {   // 休んだ日をチェックポイントで埋めて、連続を守る
    if (L.cp.m !== monthKey()) L.cp = { m: monthKey(), u: 0 };
    used = mm; L.cp.u += mm;
    for (var ci = 1; ci <= mm; ci++) L.cpAll.push(addDays(L.last, ci)); L.cpAll = L.cpAll.slice(-120);
  }
  L.streak += 1; L.last = today(); if (L.streak > L.best) L.best = L.streak;
  if (L.streak % 7 === 0) L.done += 1;
  L.total += 1; L.days.push(L.last); L.days = L.days.slice(-400);
  var gain = addGP(rollGP(), 'l'); L.gpDay = L.last; L.gpGain = gain;
  grantLogin(); sv(KEY_L, L); renderLogin();
  if (used) $('msg').textContent = 'チェックポイントを ' + used + ' 回使って、連続を守りました。（今月あと ' + cpLeft() + ' 回）';
  if (L.streak % 7 === 0) $('msg').textContent = 'カード満願！称号「' + titleOf(L.done) + '」を獲得しました。';
  updateBadges();
};

/* ---------- 図鑑 ---------- */
var ERAS = [['all', 'すべて'], ['sho', '昭和'], ['hei', '平成'], ['mil', 'ミレニアム'], ['now', '近年']], zEra = 'all';
function eraOf(y) { return y <= 1975 ? 'sho' : (y <= 1995 ? 'hei' : (y <= 2004 ? 'mil' : 'now')); }
function eraName(k) { return ({ sho: '昭和（〜1975）', hei: '平成（1984〜1995）', mil: 'ミレニアム（1999〜2004）', now: '近年（2014〜）' })[k] || ''; }
function openZ(i) {
  var Z = window.ZUKAN || [], z = Z[i]; if (!z) return;
  var same = Z.filter(function (o, j) { return j !== i && j < unlockedN() && o[1] === z[1] && o[2] === z[2]; });
  $('sheet').innerHTML = '<div class="meta"><span class="cat">No.' + ('0' + (i + 1)).slice(-2) + '</span><span class="dt">' + esc(eraName(eraOf(z[2]))) + '</span></div><h2>' + esc(z[0]) + '</h2><div class="note">' + esc(z[1]) + '（' + z[2] + '年）</div><p class="tx">' + esc(z[3]) + '</p>' +
    (same.length ? '<div class="note">同じ作品に登場：' + same.map(function (o) { return esc(o[0]); }).join('、') + '</div>' : '') +
    '<div style="margin-top:18px"><button class="btn" id="cl">閉じる</button></div>';
  $('md').className = 'md'; $('cl').onclick = closeD;
}
function unlockedN() { return Math.min((L.total || 0) + (L.zx || 0), (window.ZUKAN || []).length); }
function renderZukan() {
  var Z = window.ZUKAN || [], u = unlockedN(), justNow = L.last === today();
  var ar = renderArchive();
  $('zkn').textContent = '図鑑 ' + u + ' / ' + Z.length + (ar.n ? '　限定 ' + ar.n : '');
  $('zf').innerHTML = ERAS.map(function (e) { return '<button data-e="' + e[0] + '"' + (zEra === e[0] ? ' class="on"' : '') + '>' + e[1] + '</button>'; }).join('');
  [].forEach.call(document.querySelectorAll('#zf [data-e]'), function (b) { b.onclick = function () { zEra = b.dataset.e; renderZukan(); }; });
  var h = u === Z.length && zEra === 'all' ? '<div class="zdone" style="grid-column:1/-1">コンプリート！</div>' : '', shown = 0;
  Z.forEach(function (z, i) {
    var no = 'No.' + ('0' + (i + 1)).slice(-2);
    if (i < u) {
      if (zEra !== 'all' && eraOf(z[2]) !== zEra) return;
      shown++;
      h += '<div class="zc tap' + (justNow && i === u - 1 ? ' new' : '') + '" data-z="' + i + '">' + (justNow && i === u - 1 ? '<span class="newb zb">NEW</span>' : '') + '<div class="zn">' + no + '</div><div class="zt">' + esc(z[0]) + '</div><div class="zs">' + esc(z[1]) + '（' + z[2] + '）</div><div class="zd">' + esc(z[3]) + '</div></div>';
    } else if (zEra === 'all') h += '<div class="zc lock"><div class="zn">' + no + '</div><div class="zt">？？？</div><div class="zd">あと ' + (i - u + 1) + ' 日</div></div>';
  });
  if (zEra !== 'all' && !shown) h = '<div class="empty" style="grid-column:1/-1">この時代の怪獣は、まだ開いていません</div>';
  $('zgrid').innerHTML = h;
  $('zarc').innerHTML = ar.html;
  [].forEach.call(document.querySelectorAll('#zgrid [data-z]'), function (c) { c.onclick = function () { openZ(+c.dataset.z); }; });
}

/* ---------- 期間限定図鑑（Godzilla Point で解放） ---------- */
// 入手したものは内容ごと端末に保存（L.lib）。終わった特別編をデータから消しても、手元には残る。
function limOf(id) { return (window.LIMITED || []).filter(function (e) { return e[0] === id; })[0]; }
function grpOf(gid) { return (window.LIM_GROUPS || []).filter(function (g) { return g.id === gid; })[0]; }
function ownedLim(id) { return L.owned.indexOf(id) > -1; }
function keepLim(e, g) { L.lib[e[0]] = { g: g.id, gt: g.title, tg: g.tag || g.title, f: g.from, u: g.until, n: e[2], s: e[3], y: e[4], b: e[5] }; }
function syncLib() {
  var ch = false;
  L.owned.forEach(function (id) { if (!L.lib[id]) { var e = limOf(id), g = e && grpOf(e[1]); if (e && g) { keepLim(e, g); ch = true; } } });
  if (ch) sv(KEY_L, L);
}
function grpState(g, t) { return t < g.from ? 0 : (t > g.until ? 2 : 1); }   // 0 開催前 / 1 開催中 / 2 終了
function md(ymd) { return ymd.slice(5).replace('-', '/'); }
function grantLogin() {   // 「ログインでもらえる」項目（必要GPが0）は、期間中にスタンプを押した人に自動で渡す
  if (L.last !== today()) return [];
  var t = today(), got = [];
  (window.LIMITED || []).forEach(function (e) {
    if (e[6] !== 0 || ownedLim(e[0])) return;
    var g = grpOf(e[1]); if (!g || grpState(g, t) !== 1) return;
    L.owned.push(e[0]); keepLim(e, g); got.push(e);
  });
  if (got.length) { L.limNew = { d: t, names: got.map(function (e) { return e[2]; }) }; sv(KEY_L, L); }
  return got;
}
function limCard(e, g) {
  if (ownedLim(e[0])) return '<div class="zc lim"><span class="newb zb">限定</span><div class="zn">' + esc(g.tag || g.title) + '限定</div><div class="zt">' + esc(e[2]) + '</div><div class="zs">' + esc(e[3]) + '（' + e[4] + '）</div><div class="zd">' + esc(e[5]) + '</div></div>';
  if (e[6] === 0) return '<div class="zc lock"><div class="zn">限定</div><div class="zt">？？？</div><div class="zd">期間中にスタンプを押すともらえます</div></div>';
  return '<div class="zc lock"><div class="zn">限定</div><div class="zt">' + esc(e[2]) + '</div><div class="zd">？？？</div><button class="btn buy" data-lim="' + esc(e[0]) + '"' + (L.gp < e[6] ? ' disabled' : '') + '>' + (L.gp < e[6] ? 'あと ' + (e[6] - L.gp) + ' GP' : e[6] + ' GP で解放') + '</button></div>';
}
function renderLimited() {   // ここに出るのは「開催中」だけ。終わったものは図鑑へ移り、開催前は日付だけ出す
  var t = today(), G = window.LIM_GROUPS || [], I = window.LIMITED || [], act = [], soon = [], h = '';
  grantLogin(); $('gp2').textContent = L.gp;
  G.forEach(function (g) { var k = grpState(g, t); if (k === 1) act.push(g); else if (k === 0) soon.push(g); });
  act.sort(function (a, b) { return a.until < b.until ? -1 : (a.until > b.until ? 1 : 0); });
  soon.sort(function (a, b) { return a.from < b.from ? -1 : (a.from > b.from ? 1 : 0); });
  act.forEach(function (g, k) {
    var items = I.filter(function (e) { return e[1] === g.id; }), mine = items.filter(function (e) { return ownedLim(e[0]); }).length, left = dayDiff(t, g.until) + 1;
    h += '<details class="lgrp"' + (k < 2 || left <= 3 ? ' open' : '') + '><summary><span>' + esc(g.title) + '</span><small>' + (g.from === g.until ? '本日限り' : '残り ' + left + ' 日') + '（' + mine + ' / ' + items.length + '）</small></summary><div class="zgrid">' + items.map(function (e) { return limCard(e, g); }).join('') + '</div></details>';
  });
  if (soon.length) {
    h += '<div class="lg"><span>近日</span></div>' + soon.slice(0, 3).map(function (g) { return '<div class="note" style="margin:4px 0">' + esc(g.title) + '　' + md(g.from) + (g.until !== g.from ? ' 〜 ' + md(g.until) : '') + '</div>'; }).join('');
    if (soon.length > 3) h += '<div class="note">ほか ' + (soon.length - 3) + ' 件</div>';
  }
  $('zlh').textContent = act.length ? '開催中 ' + act.length + ' 件。終わると、入手したものは「図鑑」に移ります。' : '開催中の期間限定図鑑はありません。';
  $('zlim').innerHTML = h || '<div class="empty">いまはありません</div>';
  [].forEach.call(document.querySelectorAll('#zlim .buy'), function (b) { b.onclick = function () { buyLim(b.dataset.lim); }; });
}
function buyLim(id) {
  var e = limOf(id); if (!e || ownedLim(id) || e[6] === 0) return;
  var g = grpOf(e[1]), t = today();
  if (!g || grpState(g, t) !== 1) { renderLimited(); return; }
  if (L.gp < e[6]) return;
  if (!confirm('「' + e[2] + '」を ' + e[6] + ' GP で解放しますか？')) return;
  L.gp -= e[6]; L.owned.push(id); keepLim(e, g); sv(KEY_L, L); renderLimited(); renderLogin();
}
function archivedLim() {   // 終わった特別編のうち、入手したもの（グループごと・新しい順）
  var t = today(), by = {};
  L.owned.forEach(function (id) {
    var x = L.lib[id]; if (!x || !(x.u < t)) return;
    (by[x.g] = by[x.g] || { g: x.g, tg: x.tg, u: x.u, items: [] }).items.push(x);
  });
  return Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return a.u < b.u ? 1 : (a.u > b.u ? -1 : 0); });
}
function renderArchive() {
  var A = archivedLim(), n = 0; A.forEach(function (g) { n += g.items.length; });
  if (!A.length) return { n: 0, html: '' };
  var h = '<div class="lg"><span>限定図鑑</span><small>' + n + ' 体</small></div>' + A.map(function (g, k) {
    return '<details class="lgrp"' + (k === 0 ? ' open' : '') + '><summary><span>' + esc(g.tg) + '限定</span><small>' + g.items.length + ' 体</small></summary><div class="zgrid">' + g.items.map(function (x) {
      return '<div class="zc lim"><div class="zn">' + esc(g.tg) + '限定</div><div class="zt">' + esc(x.n) + '</div><div class="zs">' + esc(x.s) + '（' + x.y + '）</div><div class="zd">' + esc(x.b) + '</div></div>';
    }).join('') + '</div></details>';
  }).join('');
  return { n: n, html: h };
}
var zTab = 'a';
function zukanTab(k) {
  zTab = k; $('zpa').className = k === 'a' ? '' : 'hide'; $('zpb').className = k === 'b' ? '' : 'hide';
  $('zt_a').className = k === 'a' ? 'on' : ''; $('zt_b').className = k === 'b' ? 'on' : '';
  if (k === 'b') renderLimited(); else renderZukan();
}
$('zt_a').onclick = function () { zukanTab('a'); }; $('zt_b').onclick = function () { zukanTab('b'); };


/* ---------- あそぶ：Godzilla Quiz / Godzilla Game（v1.6.0） ---------- */
function rand1(n) {   // 1〜n
  var a = new Uint32Array(1);
  try { crypto.getRandomValues(a); } catch (e) { a[0] = Math.floor(Math.random() * 4294967296); }
  return a[0] % n + 1;
}
function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function dayNum() { return Math.floor(Date.parse(today() + 'T00:00:00Z') / 86400000); }

/* クイズ：1日3回まで。正解 60GP／不正解 10〜30GP。1日の上限は 150GP */
var QZ_MAX = 3, QZ_CAP = 150, QZ_OK = 60, qzShown = null;
function qzDay() { if (L.qz.d !== today()) L.qz = { d: today(), n: 0, gp: 0 }; return L.qz; }
function qzCurrent() {
  var Q = window.QUIZ || [], q = qzDay(); if (!Q.length || q.n >= QZ_MAX || q.gp >= QZ_CAP) return null;
  var item = Q[(dayNum() * QZ_MAX + q.n) % Q.length], order = [0, 1, 2, 3].sort(function (a, b) { return hash(item[0] + today() + a) - hash(item[0] + today() + b); });
  return { q: item, order: order };
}
function renderQuiz() {
  var q = qzDay(), cur = qzCurrent(), h = '<div class="qz"><div class="qz-h"><span>今日 ' + q.n + ' / ' + QZ_MAX + ' 問</span><span>もらったGP ' + q.gp + ' / ' + QZ_CAP + '</span></div>';
  if (qzShown && qzShown.d === today()) {   // 直前の答えの結果
    var r = qzShown;
    h += '<div class="qz-q">' + esc(r.q[1]) + '</div>' + r.order.map(function (oi) { var cls = oi === 0 ? ' ok' : (oi === r.pick ? ' ng' : ''); return '<button class="qz-c' + cls + '" disabled>' + esc(r.q[2][oi]) + '</button>'; }).join('') +
      '<div class="qz-r"><div>' + (r.ok ? '正解！' : '残念…') + '　<b>+' + r.gp + ' GP</b>' + (r.capped ? '<span class="note">（今日の上限に達しました）</span>' : '') + '</div><div class="note" style="margin-top:4px">' + esc(r.q[4]) + '</div></div>';
    h += (cur ? '<p><button class="btn" id="qz_next">次の問題へ</button></p>' : '<div class="note" style="margin-top:10px">' + (q.gp >= QZ_CAP ? '今日の上限（' + QZ_CAP + ' GP）に達しました。また明日！' : '今日は3問すべて答えました。また明日！') + '</div>');
  } else if (cur) {
    h += '<div class="qz-q">' + esc(cur.q[1]) + '</div>' + cur.order.map(function (oi, k) { return '<button class="qz-c" data-o="' + oi + '">' + esc(cur.q[2][oi]) + '</button>'; }).join('') +
      '<div class="note">正解 ' + QZ_OK + ' GP ／ 不正解でも 10〜30 GP</div>';
  } else h += '<div class="note" style="padding:8px 0">' + (q.gp >= QZ_CAP ? '今日の上限（' + QZ_CAP + ' GP）に達しました。また明日！' : '今日は3問すべて答えました。また明日！') + '</div>';
  $('pq').innerHTML = h + '</div>';
  [].forEach.call(document.querySelectorAll('#pq .qz-c[data-o]'), function (b) { b.onclick = function () { answerQuiz(+b.dataset.o, cur); }; });
  if ($('qz_next')) $('qz_next').onclick = function () { qzShown = null; renderQuiz(); };
}
function answerQuiz(pick, cur) {
  var q = qzDay(); if (!cur || q.n >= QZ_MAX || q.gp >= QZ_CAP) return;
  var ok = pick === 0, raw = ok ? QZ_OK : 9 + rand1(21);   // 不正解は 10〜30
  var gp = Math.min(raw, QZ_CAP - q.gp);
  q.n += 1; q.gp += gp; addGP(gp, 'q'); sv(KEY_L, L);
  qzShown = { d: today(), q: cur.q, order: cur.order, pick: pick, ok: ok, gp: gp, capped: gp < raw };
  renderQuiz(); renderLogin(); updateBadges();
}

/* 双六：1日1回。スタンプを押したあとに、サイコロを振る */
var GM = window.GAME || { size: 30, board: {} };
function gmCell(n) { return GM.board[n] || ['none']; }
function gmLabel(c) { return ({ gp: '+' + c[1], zk: '図鑑', st: 'スタンプ', fwd: c[1] + 'つ進む', back: c[1] + 'つ戻る', none: '', goal: 'GOAL' })[c[0]] || ''; }
function gmDone() { return L.gm.d === today(); }
function renderGame() {
  var g = L.gm, got = L.last === today(), done = gmDone(), cells = '';
  for (var n = 1; n <= GM.size; n++) { var c = gmCell(n); cells += '<div class="bc ' + c[0] + (g.pos === n ? ' here' : '') + '"><i>' + n + '</i><b>' + esc(gmLabel(c)) + '</b></div>'; }
  var h = '<div class="gm-info"><div><span class="gm-start' + (g.pos === 0 ? ' here' : '') + '">START</span>　<span class="note">いま ' + g.pos + ' / ' + GM.size + ' マス　（' + g.lap + ' 周）</span></div><div><button class="btn" id="gm_roll"' + (done || !got ? ' disabled' : '') + '>' + (done ? '今日はもう振りました' : 'サイコロを振る') + '</button></div></div>';
  if (!got && !done) h += '<div class="note">先に「スタンプ」で、今日のスタンプを押してください。</div>';
  h += '<div class="board">' + cells + '</div>';
  if (g.last && g.d === today()) h += '<div class="gm-res">' + esc(g.last) + '</div>';
  h += '<div class="note" style="margin-top:8px">ゴールで ' + GM.goalGP + ' GP。スタンプのマスは月' + GM.stampMonthMax + '回まで（それ以上は ' + GM.stampFallbackGP + ' GP）。</div>';
  $('pg').innerHTML = h;
  if ($('gm_roll')) $('gm_roll').onclick = rollGame;
}
function giveStamp() {   // 双六のスタンプ。今日のスタンプを押した後だけ来るので、日付による途切れとは重ならない
  var card = false;
  L.streak += 1; L.bsc = (L.bsc || 0) + 1; if (L.streak > L.best) L.best = L.streak;
  if (L.streak % 7 === 0) { L.done += 1; card = true; }
  return card;
}
function rollGame() {
  if (L.last !== today() || gmDone()) return;
  var g = L.gm, r = rand1(6), from = g.pos, to = Math.min(GM.size, from + r), lines = ['サイコロの目は ' + r + '。 ' + from + ' → ' + to + ' マス'];
  var c = gmCell(to);
  if (c[0] === 'gp') { addGP(c[1], 'g'); lines.push('+' + c[1] + ' GP'); }
  else if (c[0] === 'zk') {
    var Z = window.ZUKAN || [];
    if (unlockedN() < Z.length) { L.zx += 1; var z = Z[unlockedN() - 1]; lines.push('図鑑がひとつ開きました：' + z[0]); }
    else { addGP(GM.zukanFallbackGP, 'g'); lines.push('図鑑はコンプリート済み。かわりに +' + GM.zukanFallbackGP + ' GP'); }
  } else if (c[0] === 'st') {
    if (g.bm !== monthKey()) { g.bm = monthKey(); g.bn = 0; }
    if (g.bn < GM.stampMonthMax) { g.bn += 1; var cd = giveStamp(); lines.push('スタンプを1つもらいました（今月 ' + g.bn + ' / ' + GM.stampMonthMax + '）'); if (cd) lines.push('カード満願！称号「' + titleOf(L.done) + '」を獲得'); }
    else { addGP(GM.stampFallbackGP, 'g'); lines.push('今月のスタンプは上限です。かわりに +' + GM.stampFallbackGP + ' GP'); }
  } else if (c[0] === 'fwd' || c[0] === 'back') {
    var to2 = c[0] === 'fwd' ? Math.min(GM.size, to + c[1]) : Math.max(0, to - c[1]);
    lines.push(c[0] === 'fwd' ? c[1] + ' マス進みました → ' + to2 : c[1] + ' マス戻されました → ' + to2); to = to2;
    if (to === GM.size) c = ['goal'];
  }
  if (to === GM.size) { addGP(GM.goalGP, 'g'); g.lap += 1; lines.push('ゴール！ +' + GM.goalGP + ' GP　つぎは START から'); to = 0; }
  g.pos = to; g.d = today(); g.last = lines.join('\n');
  sv(KEY_L, L); renderGame(); renderLogin(); updateBadges();
}

var pTab = 'q';
function playTab(k) {
  pTab = k; $('pq').className = k === 'q' ? '' : 'hide'; $('pg').className = k === 'g' ? '' : 'hide';
  $('p_q').className = k === 'q' ? 'on' : ''; $('p_g').className = k === 'g' ? 'on' : '';
  if (k === 'q') renderQuiz(); else renderGame();
}
$('p_q').onclick = function () { playTab('q'); }; $('p_g').onclick = function () { playTab('g'); };

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
  $('s_season').innerHTML = '<option value="auto">自動（季節に合わせる）</option><option value="normal">通常</option>' + (window.SEASONS || []).map(function (x) { return '<option value="' + esc(x.id) + '">' + esc(x.name) + '</option>'; }).join('');
  $('s_season').value = cfg.season || 'auto';
  $('s_season').onchange = function () { cfg.season = this.value; saveCfg(); showTitle(); };   // 選ぶとすぐ見られます
  $('s_max').value = String(maxN()); $('s_title').checked = cfg.titleScreen !== false;
  $('s_title').onchange = function () { cfg.titleScreen = this.checked; saveCfg(); };
  $('s_block').value = cfg.blockWords || '';
  $('s_block').onchange = function () {
    cfg.blockWords = this.value.trim(); saveCfg();
    var n = tidyStored(); if (n) { save(); renderNews(); }
    $('s_bmsg').textContent = cfg.blockWords ? (n ? n + ' 件を整理しました。今後も取り込みません。' : '今後、この言葉を含む記事は取り込みません。') : '除外するワードを解除しました。';
  };
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
function cmpV(a, b) {
  var x = String(a || '0').split('.'), y = String(b || '0').split('.');
  for (var i = 0; i < Math.max(x.length, y.length); i++) { var d = (parseInt(x[i], 10) || 0) - (parseInt(y[i], 10) || 0); if (d) return d; }
  return 0;
}
async function loadInfo() {
  try {
    var inf = await window.gj.info(), top = inf.base;
    (inf.packs || []).forEach(function (p) { if (p.version && cmpV(p.version, top) > 0) top = p.version; });
    $('ver').textContent = 'v' + top;
    $('about').textContent = 'GODZILLA 通信 v' + top;
    $('d_bk').textContent = inf.backup && inf.backup.path ? inf.backup.path + (inf.backup.time ? '　（最終保存 ' + fmtTime(inf.backup.time) + '）' : '　（まだ作られていません。少し操作すると作られます）') : 'このパソコンでは使えません';
  } catch (e) { }
}

/* ---------- タブ ---------- */
var SECS = ['news', 'login', 'zk', 'play', 'more'], mTab = 'set';
function moreTab(k) {
  mTab = k; $('src').className = k === 'src' ? '' : 'hide'; $('set').className = k === 'set' ? '' : 'hide';
  $('m_src').className = k === 'src' ? 'on' : ''; $('m_set').className = k === 'set' ? 'on' : '';
  if (k === 'src') renderSources(); else loadInfo();
}
$('m_src').onclick = function () { moreTab('src'); }; $('m_set').onclick = function () { moreTab('set'); };
function updateBadges() {   // 今日まだやっていないことがある場所に、小さな赤い点
  var q = qzDay(), play = (q.n < QZ_MAX && q.gp < QZ_CAP) || (L.last === today() && !gmDone());
  $('t2').classList.toggle('has', L.last !== today()); $('t4').classList.toggle('has', !!play);
}
function tab(n) {
  SECS.forEach(function (id, i) { $(id).className = (i + 1 === n) ? '' : 'hide'; var b = $('t' + (i + 1)); b.classList.toggle('on', i + 1 === n); });
  if (n === 2) renderLogin(); if (n === 3) zukanTab(zTab); if (n === 4) playTab(pTab); if (n === 5) moreTab(mTab);
  updateBadges();
}
[1, 2, 3, 4, 5].forEach(function (n) { $('t' + n).onclick = function () { tab(n); }; });
$('st_go').onclick = function () { tab(5); moreTab('src'); };

/* ---------- タイトル画面 ---------- */
function seasonNow() {
  var S = window.SEASONS || [], pick = cfg.season || 'auto';
  if (pick === 'normal') return null;
  if (pick !== 'auto') return S.filter(function (x) { return x.id === pick; })[0] || null;
  var md = today().slice(5);
  for (var i = 0; i < S.length; i++) { var x = S[i]; if (x.from <= x.to ? (md >= x.from && md <= x.to) : (md >= x.from || md <= x.to)) return x; }
  return null;
}
function showTitle() {
  var got = L.last === today(), t = today(), se = seasonNow(), D = window.DECO || {};
  checkBreak();
  if (se) { $('title').setAttribute('data-season', se.id); $('ts_season').textContent = se.msg || ''; }
  else { $('title').removeAttribute('data-season'); $('ts_season').textContent = ''; }
  $('ts_deco').innerHTML = se ? (se.deco || []).map(function (d) { return D[d[0]] ? '<div style="position:absolute;left:' + d[1] + '%;top:' + d[2] + '%;width:' + d[3] + 'px;transform:rotate(' + d[4] + 'deg)">' + D[d[0]] + '</div>' : ''; }).join('') : '';
  $('ts_stats').innerHTML = '<div>スタンプ<b>' + L.streak + '</b></div><div>Godzilla Point<b>' + L.gp + '</b></div><div>未読<b>' + unreadCount() + '</b></div>';
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
  if ((cfg.gate || 0) < ruleVer()) { tidied = tidyStored(); st.rej = []; cfg.gate = ruleVer(); saveCfg(); save(); }
  syncLib(); grantLogin();
  initSettings(); schedule(); loadInfo();
  var skipTitle = false; try { skipTitle = !!sessionStorage.getItem('gj_notitle'); sessionStorage.removeItem('gj_notitle'); } catch (e) { }
  if (cfg.titleScreen !== false && !skipTitle) showTitle();
  renderCountdown(); renderNews(); renderLogin(); renderSources(); updateBadges();
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
