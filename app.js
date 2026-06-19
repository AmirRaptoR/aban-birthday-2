import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ---- config (from config.js -> window.ABAN_CONFIG) ----
const CFG = window.ABAN_CONFIG || {};
const supabase = createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);

// ---- static UI copy (per language) ----
const L = {
  en: {
    brand: "Aban turns 2", invited: "You're invited", heroTitle: "Aban is 2!",
    directions: "Get directions", wishTitle: "Gift wishlist",
    wishHint: "Tap a gift to claim it — or tap again to release it. No login needed.",
    taken: "Taken", partyTitle: "The party",
    footer: "Can't wait to celebrate with you! 💛",
    loading: "Loading…", error: "Couldn't load. Please refresh.",
  },
  nl: {
    brand: "Aban wordt 2", invited: "Je bent uitgenodigd", heroTitle: "Aban is 2!",
    directions: "Routebeschrijving", wishTitle: "Verlanglijst",
    wishHint: "Tik op een cadeau om te kiezen — of tik weer om los te laten. Geen login nodig.",
    taken: "Gekozen", partyTitle: "Het feest",
    footer: "We kunnen niet wachten om te vieren! 💛",
    loading: "Laden…", error: "Kon niet laden. Ververs de pagina.",
  },
  fa: {
    brand: "آبان ۲ ساله می‌شود", invited: "تو دعوتی", heroTitle: "آبان ۲ ساله شد!",
    directions: "مسیر را ببین", wishTitle: "لیست کادوها",
    wishHint: "روی یک کادو بزن تا انتخابش کنی — یا دوباره بزن تا آزاد شود. نیازی به ورود نیست.",
    taken: "انتخاب شد", partyTitle: "جشن",
    footer: "بی‌صبرانه منتظر جشن گرفتن با شما هستیم! 💛",
    loading: "در حال بارگذاری…", error: "بارگذاری نشد. صفحه را تازه کن.",
  },
};

const LANGS = [
  { code: "en", label: "EN" },
  { code: "nl", label: "NL" },
  { code: "fa", label: "فا" },
];

// ---- state ----
let lang = localStorage.getItem("aban-lang") || "en";
if (!L[lang]) lang = "en";
let event = null;   // { address, en_date, nl_date, fa_date }
let party = [];     // [{ emoji, en_title, en_desc, ... }]
let gifts = [];     // [{ id, emoji, en_name, ..., reserved }]

const $ = (sel, root = document) => root.querySelector(sel);

// ---- rendering ----
function applyStaticText() {
  const t = L[lang];
  document.querySelectorAll("[data-t]").forEach((el) => {
    el.textContent = t[el.dataset.t] ?? "";
  });
  document.documentElement.lang = lang;
  $("#page").dir = lang === "fa" ? "rtl" : "ltr";
}

function renderLangs() {
  const box = $("#langs");
  box.innerHTML = "";
  LANGS.forEach((l) => {
    const pill = document.createElement("div");
    pill.className = "lang-pill" + (l.code === lang ? " active" : "");
    pill.textContent = l.label;
    pill.onclick = () => {
      lang = l.code;
      localStorage.setItem("aban-lang", lang);
      renderAll();
    };
    box.appendChild(pill);
  });
}

function renderEvent() {
  if (!event) return;
  $("#dateLine").textContent = event[`${lang}_date`] || "";
  $("#address").textContent = event.address || "";
  $("#directions").href =
    "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(event.address || "");
}

function renderParty() {
  const box = $("#party");
  if (!party.length) {
    box.innerHTML = `<div class="loading">${L[lang].loading}</div>`;
    return;
  }
  box.innerHTML = "";
  party.forEach((p) => {
    const row = document.createElement("div");
    row.className = "party-row";
    const emoji = document.createElement("span");
    emoji.className = "emoji";
    emoji.textContent = p.emoji;
    const block = document.createElement("div");
    block.style.flex = "1";
    const title = document.createElement("div");
    title.className = "p-title";
    title.textContent = p[`${lang}_title`] || "";
    const desc = document.createElement("div");
    desc.className = "p-desc";
    desc.textContent = p[`${lang}_desc`] || "";
    block.append(title, desc);
    row.append(emoji, block);
    box.appendChild(row);
  });
}

function renderWishlist() {
  const box = $("#wishlist");
  if (!gifts.length) {
    box.innerHTML = `<div class="loading">${L[lang].loading}</div>`;
    return;
  }
  box.innerHTML = "";
  gifts.forEach((g) => {
    const row = document.createElement("div");
    row.className = "gift" + (g.reserved ? " taken" : "");
    row.dataset.id = g.id;
    row.innerHTML = `
      <div class="check"></div>
      <div class="emoji">${g.emoji}</div>
      <div class="name"></div>
      <div class="taken-badge"></div>`;
    $(".name", row).textContent = g[`${lang}_name`] || "";
    $(".taken-badge", row).textContent = L[lang].taken;
    row.onclick = () => toggleGift(g, row);
    box.appendChild(row);
  });
}

function renderAll() {
  applyStaticText();
  renderLangs();
  renderEvent();
  renderParty();
  renderWishlist();
}

// ---- reserve / release ----
async function toggleGift(g, row) {
  const next = !g.reserved;
  row.classList.add("busy");
  const { error } = await supabase
    .from("wishlist")
    .update({ reserved: next })
    .eq("id", g.id);
  row.classList.remove("busy");
  if (error) {
    console.error(error);
    alert(L[lang].error);
    return;
  }
  g.reserved = next;
  row.classList.toggle("taken", next);
}

// ---- data load ----
async function loadData() {
  const [ev, pt, gf] = await Promise.all([
    supabase.from("event_info").select("*").single(),
    supabase.from("party_info").select("*").order("position"),
    supabase.from("wishlist").select("*").order("position"),
  ]);
  if (ev.error) console.error("event_info", ev.error);
  if (pt.error) console.error("party_info", pt.error);
  if (gf.error) console.error("wishlist", gf.error);

  event = ev.data || null;
  party = pt.data || [];
  gifts = gf.data || [];
  renderAll();
}

// ---- realtime: keep reservations in sync across visitors ----
function subscribeRealtime() {
  supabase
    .channel("wishlist-changes")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "wishlist" },
      (payload) => {
        const updated = payload.new;
        const g = gifts.find((x) => x.id === updated.id);
        if (!g || g.reserved === updated.reserved) return;
        g.reserved = updated.reserved;
        const row = document.querySelector(`.gift[data-id="${CSS.escape(g.id)}"]`);
        if (row) row.classList.toggle("taken", g.reserved);
      }
    )
    .subscribe();
}

// ---- boot ----
applyStaticText();
renderLangs();
loadData().then(subscribeRealtime);
