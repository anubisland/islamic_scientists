const data = window.ISLAMIC_SCIENCE_DATA;

const categories = [
  { id: "all", ar: "كُلُّ المَجَالَاتِ", en: "All Fields" },
  { id: "mathematics", ar: "الرِّيَاضِيَّاتُ", en: "Mathematics" },
  { id: "astronomy", ar: "الفَلَكُ", en: "Astronomy" },
  { id: "medicine", ar: "الطِّبُّ وَالصَّيْدَلَةُ", en: "Medicine" },
  { id: "science", ar: "الفِيزْيَاءُ وَالعُلُومُ التَّجْرِيبِيَّةُ", en: "Physics & Experimental Science" },
  { id: "engineering", ar: "الهَنْدَسَةُ وَالآلَاتُ", en: "Engineering" },
  { id: "natural", ar: "العُلُومُ الطَّبِيعِيَّةُ", en: "Natural Sciences" },
  { id: "earth", ar: "الأَرْضُ وَالمِلَاحَةُ", en: "Earth & Navigation" },
  { id: "humanities", ar: "الفِكْرُ وَالمُجْتَمَعُ", en: "Thought & Society" },
];

const STORAGE = {
  narrator: "islamicScientists.narratorLanguage",
};

let activeCategory = "all";
let activeField = data.fields[0]?.id || "";
let query = "";
let narratorLanguage = localStorage.getItem(STORAGE.narrator) || "ar";
let narrationQueue = [];
let narrationPaused = false;

const fieldList = document.querySelector("#fieldList");
const detailPanel = document.querySelector("#detailPanel");
const categoryChips = document.querySelector("#categoryChips");
const searchBox = document.querySelector("#searchBox");
const stopNarration = document.querySelector("#stopNarration");
const narratorButtons = document.querySelectorAll("[data-narrator-lang]");

document.querySelector("#fieldCount").textContent = data.stats.fields;
document.querySelector("#scientistCount").textContent = data.stats.uniqueScientists;

function narratorMeta() {
  return narratorLanguage === "ar"
    ? { code: "ar-SA", label: "العربية", button: "الراوي: عربي" }
    : { code: "en-US", label: "English", button: "Narrator: English" };
}

function stopSpeech() {
  narrationQueue = [];
  narrationPaused = false;
  document.body.classList.remove("is-speaking", "is-paused");
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

function setNarratorLanguage(language) {
  narratorLanguage = language === "en" ? "en" : "ar";
  localStorage.setItem(STORAGE.narrator, narratorLanguage);
  stopSpeech();
  updateNarratorButtons();
  renderDetail();
}

function updateNarratorButtons() {
  narratorButtons.forEach((button) => {
    const active = button.dataset.narratorLang === narratorLanguage;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ابن/g, "بن");
}

function displayParts(value) {
  const text = String(value || "");
  const match = text.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
  return {
    ar: (match ? match[1] : text).trim(),
    en: (match ? match[2] : "").trim(),
  };
}

function filteredFields() {
  return data.fields.filter((field) => {
    const inCategory = activeCategory === "all" || field.category === activeCategory;
    const haystack = normalize(`${field.title} ${field.scientist} ${field.sections.map((s) => `${s.title} ${s.ar} ${s.en}`).join(" ")}`);
    return inCategory && haystack.includes(normalize(query));
  });
}

function renderCategories() {
  categoryChips.innerHTML = categories
    .map((category) => {
      const active = category.id === activeCategory ? " is-active" : "";
      return `<button class="chip${active}" type="button" data-category="${category.id}">
        <span>${category.ar}</span><small>${category.en}</small>
      </button>`;
    })
    .join("");
}

function renderList() {
  const fields = filteredFields();
  if (!fields.some((field) => field.id === activeField)) {
    activeField = fields[0]?.id || "";
  }

  fieldList.innerHTML = fields
    .map((field) => {
      const title = displayParts(field.title);
      const scientist = displayParts(field.scientist);
      const active = field.id === activeField ? " is-active" : "";
      return `
        <button class="field-button${active}" type="button" data-field="${field.id}">
          <span class="field-number">${String(field.sourceIndex).padStart(2, "0")}</span>
          <span class="field-card-copy">
            <span class="field-title">${title.ar}</span>
            <span class="field-title-en">${title.en}</span>
            <span class="field-scientist">${scientist.ar}</span>
          </span>
        </button>
      `;
    })
    .join("");
}

function getPreferredVoice(language) {
  const voices = window.speechSynthesis.getVoices();
  const prefix = language.split("-")[0];
  const preferredNames = language.startsWith("ar")
    ? ["hoda", "naayf", "tarik", "maged", "microsoft", "google"]
    : ["aria", "guy", "jenny", "ryan", "zira", "david", "google", "microsoft"];

  return voices
    .filter((voice) => voice.lang && voice.lang.toLowerCase().startsWith(prefix))
    .sort((a, b) => voiceScore(b, language, preferredNames) - voiceScore(a, language, preferredNames))[0];
}

function voiceScore(voice, language, preferredNames) {
  const name = voice.name.toLowerCase();
  const exact = voice.lang.toLowerCase() === language.toLowerCase() ? 20 : 0;
  const preferred = preferredNames.findIndex((item) => name.includes(item));
  return exact + (voice.localService ? 4 : 0) + (preferred === -1 ? 0 : 12 - preferred);
}

function splitNarration(text) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const sentences = cleaned.match(/[^.!؟?؛،]+[.!؟?؛،]?/g) || [cleaned];
  const chunks = [];
  let current = "";

  sentences.forEach((sentence) => {
    if ((current + " " + sentence).trim().length > 240 && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = `${current} ${sentence}`.trim();
    }
  });
  if (current) chunks.push(current.trim());
  return chunks;
}

function speak(text) {
  if (!("speechSynthesis" in window)) {
    alert("المتصفح الحالي لا يدعم الراوي الصوتي.");
    return;
  }
  stopSpeech();
  narrationQueue = splitNarration(text);
  speakNext();
}

function speakNext() {
  const next = narrationQueue.shift();
  if (!next) {
    document.body.classList.remove("is-speaking", "is-paused");
    return;
  }

  const meta = narratorMeta();
  const utterance = new SpeechSynthesisUtterance(next);
  utterance.lang = meta.code;
  utterance.voice = getPreferredVoice(meta.code) || null;
  utterance.rate = narratorLanguage === "ar" ? 0.82 : 0.9;
  utterance.pitch = narratorLanguage === "ar" ? 0.96 : 1;
  utterance.volume = 1;
  utterance.onend = () => speakNext();
  utterance.onerror = () => speakNext();
  document.body.classList.add("is-speaking");
  window.speechSynthesis.speak(utterance);
}

function pauseOrResumeSpeech() {
  if (!("speechSynthesis" in window)) return;
  if (speechSynthesis.speaking && !speechSynthesis.paused) {
    speechSynthesis.pause();
    narrationPaused = true;
    document.body.classList.add("is-paused");
    return;
  }
  if (speechSynthesis.paused) {
    speechSynthesis.resume();
    narrationPaused = false;
    document.body.classList.remove("is-paused");
  }
}

function prepareArabicNarration(text) {
  return text
    .replace(/\([^)]*[A-Za-z][^)]*\)/g, "")
    .replace(/\b[A-Za-z][A-Za-z\s-]{2,}\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function prepareEnglishNarration(text) {
  return text
    .replace(/[\u0600-\u06FF]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sectionText(section) {
  return narratorLanguage === "ar" ? prepareArabicNarration(section.ar) : prepareEnglishNarration(section.en);
}

function renderDetail() {
  const field = data.fields.find((item) => item.id === activeField);
  if (!field) {
    detailPanel.innerHTML = `<div class="empty">لا توجد نتائج مطابقة.</div>`;
    return;
  }

  const title = displayParts(field.title);
  const scientist = displayParts(field.scientist);
  const category = categories.find((item) => item.id === field.category) || categories[0];
  const meta = narratorMeta();

  detailPanel.innerHTML = `
    <article class="science-detail">
      <header class="detail-hero">
        <div class="detail-copy">
          <p class="section-kicker">المجال رقم ${String(field.sourceIndex).padStart(2, "0")} · ${category.en}</p>
          <h2>${title.ar}</h2>
          <span class="detail-title-en">${title.en}</span>
          <div class="detail-meta">
            <span>${scientist.ar}</span>
            <span dir="ltr">${scientist.en}</span>
            <span>${category.ar}</span>
          </div>
        </div>
        <figure class="innovation-figure">
          <img src="${field.image}" alt="صورة توضيحية لابتكارات ${title.ar}" loading="lazy">
          <figcaption>${title.en || category.en}</figcaption>
        </figure>
      </header>

      <div class="narrator-panel">
        <button class="listen primary" type="button" data-speak-field="${field.id}">
          <span>استماع للمجال كاملًا</span><small>${meta.button}</small>
        </button>
        <button class="listen secondary" type="button" data-pause>إيقاف مؤقت / متابعة</button>
        <div class="audio-wave" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
      </div>

      <div class="innovation-strip">
        <strong>الابتكار في سياقه العلمي</strong>
        <p>تعرض كل بطاقة النص العربي المشكّل والنص الإنجليزي معًا، بينما يقرأ الراوي اللغة المختارة فقط دون خلط بين اللغتين.</p>
      </div>

      <div class="sections">
        ${field.sections
          .map((section, index) => {
            const sectionTitle = displayParts(section.title);
            return `
              <section class="science-section">
                <div class="section-head">
                  <div>
                    <h3>${sectionTitle.ar}</h3>
                    <span>${sectionTitle.en}</span>
                  </div>
                  <button class="listen" type="button" data-speak-section="${index}">استمع</button>
                </div>
                <div class="columns">
                  <div class="text-panel ar-text">
                    <h4>العَرَبِيَّةُ المُشَكَّلَةُ</h4>
                    <p>${section.ar}</p>
                  </div>
                  <div class="text-panel en-text" dir="ltr">
                    <h4>English</h4>
                    <p>${section.en}</p>
                  </div>
                </div>
              </section>
            `;
          })
          .join("")}
      </div>
    </article>
  `;
}

function render() {
  renderCategories();
  renderList();
  renderDetail();
}

categoryChips.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  render();
});

fieldList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-field]");
  if (!button) return;
  activeField = button.dataset.field;
  render();
  detailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
});

detailPanel.addEventListener("click", (event) => {
  const field = data.fields.find((item) => item.id === activeField);
  if (!field) return;

  if (event.target.closest("[data-pause]")) {
    pauseOrResumeSpeech();
    return;
  }

  const fieldButton = event.target.closest("[data-speak-field]");
  if (fieldButton) {
    speak(field.sections.map(sectionText).join("\n\n"));
    return;
  }

  const sectionButton = event.target.closest("[data-speak-section]");
  if (sectionButton) {
    const section = field.sections[Number(sectionButton.dataset.speakSection)];
    speak(sectionText(section));
  }
});

searchBox.addEventListener("input", (event) => {
  query = event.target.value;
  render();
});

narratorButtons.forEach((button) => {
  button.addEventListener("click", () => setNarratorLanguage(button.dataset.narratorLang));
});

stopNarration.addEventListener("click", stopSpeech);
window.addEventListener("beforeunload", stopSpeech);

if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

document.documentElement.lang = "ar";
document.documentElement.dir = "rtl";
updateNarratorButtons();
render();
