const data = window.ISLAMIC_SCIENCE_DATA;

const categories = [
  {
    id: "all",
    ar: "كُلُّ المَجَالَاتِ",
    en: "All Fields",
    descAr: "استعراض كامل للمجالات العلمية والرواد المرتبطين بها.",
    descEn: "A complete view of all scientific fields and their scholars.",
  },
  {
    id: "mathematics",
    ar: "الرِّيَاضِيَّاتُ",
    en: "Mathematics",
    descAr: "الجبر والحساب والهندسة العددية والطرق الخوارزمية.",
    descEn: "Algebra, arithmetic, numerical geometry, and algorithmic methods.",
  },
  {
    id: "astronomy",
    ar: "الفَلَكُ",
    en: "Astronomy",
    descAr: "الرصد والزيجات والآلات الفلكية وحساب الأزمنة.",
    descEn: "Observation, astronomical tables, instruments, and timekeeping.",
  },
  {
    id: "medicine",
    ar: "الطِّبُّ وَالصَّيْدَلَةُ",
    en: "Medicine",
    descAr: "الطب السريري والجراحة والصيدلة والتشخيص.",
    descEn: "Clinical medicine, surgery, pharmacy, and diagnosis.",
  },
  {
    id: "science",
    ar: "الفِيزْيَاءُ وَالعُلُومُ التَّجْرِيبِيَّةُ",
    en: "Physics & Experimental Science",
    descAr: "البصريات والحركة والمنهج التجريبي ودراسة الظواهر.",
    descEn: "Optics, motion, experimental method, and natural phenomena.",
  },
  {
    id: "engineering",
    ar: "الهَنْدَسَةُ وَالآلَاتُ",
    en: "Engineering",
    descAr: "الحيل الميكانيكية والعمارة والري والابتكار التطبيقي.",
    descEn: "Machines, architecture, irrigation, and applied invention.",
  },
  {
    id: "natural",
    ar: "العُلُومُ الطَّبِيعِيَّةُ",
    en: "Natural Sciences",
    descAr: "النبات والحيوان والمعادن والكيمياء والبيئة.",
    descEn: "Botany, zoology, minerals, chemistry, and ecology.",
  },
  {
    id: "earth",
    ar: "الأَرْضُ وَالمِلَاحَةُ",
    en: "Earth & Navigation",
    descAr: "الجغرافيا والخرائط والملاحة وقياس الأرض.",
    descEn: "Geography, maps, navigation, and geodesy.",
  },
  {
    id: "humanities",
    ar: "الفِكْرُ وَالمُجْتَمَعُ",
    en: "Thought & Society",
    descAr: "المعرفة واللغة والاجتماع وأثر العلم في العمران.",
    descEn: "Knowledge, language, society, and civilization.",
  },
];

const STORAGE = {
  narrator: "islamicScientists.narratorLanguage",
  introPlayed: "islamicScientists.introPlayed",
};

let currentView = "categories";
let activeCategory = "";
let activeField = "";
let query = "";
let narratorLanguage = localStorage.getItem(STORAGE.narrator) || "ar";
let narrationQueue = [];

const categoryGrid = document.querySelector("#categoryGrid");
const subfieldScreen = document.querySelector("#subfieldScreen");
const subfieldHead = document.querySelector("#subfieldHead");
const fieldList = document.querySelector("#fieldList");
const detailPanel = document.querySelector("#detailPanel");
const searchControls = document.querySelector("#searchControls");
const searchBox = document.querySelector("#searchBox");
const backButton = document.querySelector("#backButton");
const breadcrumb = document.querySelector("#breadcrumb");
const stopNarration = document.querySelector("#stopNarration");
const narratorButtons = document.querySelectorAll("[data-narrator-lang]");
const startOverlay = document.querySelector("#startOverlay");
const startApp = document.querySelector("#startApp");

document.querySelector("#fieldCount").textContent = data.stats.fields;
document.querySelector("#scientistCount").textContent = data.stats.uniqueScientists;

function narratorMeta() {
  return narratorLanguage === "ar"
    ? {
        code: "ar-SA",
        button: "الراوي: عربي",
        listen: "استمع",
        listenFull: "استماع للمجال كاملًا",
        pause: "إيقاف مؤقت / متابعة",
        back: "عودة",
      }
    : {
        code: "en-US",
        button: "Narrator: English",
        listen: "Listen",
        listenFull: "Listen to full field",
        pause: "Pause / Resume",
        back: "Back",
      };
}

function projectIntroText() {
  if (narratorLanguage === "en") {
    return "This project documents the scientific legacy of Muslim scholars and connects their discoveries in mathematics, medicine, astronomy, engineering, chemistry, geography, and experimental science to the modern world. It is designed as a bilingual archive that helps readers see how knowledge moved from observation and experiment to tools, institutions, and technologies we still use today.";
  }
  return "هَذَا المَشْرُوعُ يُوَثِّقُ جُهُودَ العُلَمَاءِ المُسْلِمِينَ وَإِسْهَامَاتِهِمْ فِي الرِّيَاضِيَّاتِ، وَالطِّبِّ، وَالفَلَكِ، وَالهَنْدَسَةِ، وَالكِيمْيَاءِ، وَالجُغْرَافِيَا، وَالعُلُومِ التَّجْرِيبِيَّةِ. وَتَظْهَرُ أَهَمِّيَّتُهُ فِي رَبْطِ تِلْكَ الجُهُودِ بِمَا وَصَلَ إِلَيْهِ العَالَمُ اليَوْمَ مِنْ تَقَدُّمٍ عِلْمِيٍّ وَتِكْنُولُوجِيٍّ.";
}

function stopSpeech() {
  narrationQueue = [];
  document.body.classList.remove("is-speaking", "is-paused");
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

function setNarratorLanguage(language) {
  narratorLanguage = language === "en" ? "en" : "ar";
  localStorage.setItem(STORAGE.narrator, narratorLanguage);
  stopSpeech();
  updateNarratorButtons();
  render();
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

function categoryFields(categoryId = activeCategory) {
  const selected = categoryId === "all" ? data.fields : data.fields.filter((field) => field.category === categoryId);
  const q = normalize(query);
  if (!q) return selected;
  return selected.filter((field) => {
    const haystack = normalize(`${field.title} ${field.scientist} ${field.sections.map((s) => `${s.title} ${s.ar} ${s.en}`).join(" ")}`);
    return haystack.includes(q);
  });
}

function categoryCount(categoryId) {
  return categoryId === "all" ? data.fields.length : data.fields.filter((field) => field.category === categoryId).length;
}

function renderCategoryGrid() {
  categoryGrid.innerHTML = categories
    .map((category) => {
      const count = categoryCount(category.id);
      return `
        <button class="category-card" type="button" data-category="${category.id}">
          <span class="category-count">${count}</span>
          <span class="category-title">${category.ar}</span>
          <span class="category-title-en">${category.en}</span>
          <span class="category-desc">${category.descAr}</span>
        </button>
      `;
    })
    .join("");
}

function renderSubfields() {
  const category = categories.find((item) => item.id === activeCategory) || categories[0];
  const fields = categoryFields();
  subfieldHead.innerHTML = `
    <p class="section-kicker">المجالات الفرعية</p>
    <h2>${category.ar}</h2>
    <span>${category.en}</span>
    <p>${category.descAr}</p>
  `;

  fieldList.innerHTML = fields
    .map((field) => {
      const title = displayParts(field.title);
      const scientist = displayParts(field.scientist);
      return `
        <button class="field-button" type="button" data-field="${field.id}">
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

  if (!fields.length) {
    fieldList.innerHTML = `<div class="empty">لا توجد نتائج مطابقة.</div>`;
  }
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
    document.body.classList.add("is-paused");
    return;
  }
  if (speechSynthesis.paused) {
    speechSynthesis.resume();
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
          <span>${meta.listenFull}</span><small>${meta.button}</small>
        </button>
        <button class="listen secondary" type="button" data-pause>${meta.pause}</button>
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
                  <button class="listen" type="button" data-speak-section="${index}">${meta.listen}</button>
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

function setView(view) {
  currentView = view;
  categoryGrid.hidden = view !== "categories";
  subfieldScreen.hidden = view !== "fields";
  detailPanel.hidden = view !== "detail";
  searchControls.hidden = view === "categories";
  backButton.hidden = view === "categories";
  backButton.textContent = narratorMeta().back;

  const category = categories.find((item) => item.id === activeCategory);
  if (view === "categories") breadcrumb.textContent = "المجالات الرئيسية";
  if (view === "fields") breadcrumb.textContent = category ? `${category.ar} · ${category.en}` : "المجالات الفرعية";
  if (view === "detail") breadcrumb.textContent = "تفاصيل المجال";
}

function render() {
  renderCategoryGrid();
  if (currentView === "fields") renderSubfields();
  if (currentView === "detail") renderDetail();
  setView(currentView);
}

categoryGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  query = "";
  searchBox.value = "";
  renderSubfields();
  setView("fields");
  subfieldScreen.scrollIntoView({ behavior: "smooth", block: "start" });
});

fieldList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-field]");
  if (!button) return;
  activeField = button.dataset.field;
  renderDetail();
  setView("detail");
  detailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
});

detailPanel.addEventListener("click", (event) => {
  const field = data.fields.find((item) => item.id === activeField);
  if (!field) return;

  if (event.target.closest("[data-pause]")) {
    pauseOrResumeSpeech();
    return;
  }

  if (event.target.closest("[data-speak-field]")) {
    speak(field.sections.map(sectionText).join("\n\n"));
    return;
  }

  const sectionButton = event.target.closest("[data-speak-section]");
  if (sectionButton) {
    const section = field.sections[Number(sectionButton.dataset.speakSection)];
    speak(sectionText(section));
  }
});

backButton.addEventListener("click", () => {
  stopSpeech();
  if (currentView === "detail") {
    renderSubfields();
    setView("fields");
    subfieldScreen.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  setView("categories");
  categoryGrid.scrollIntoView({ behavior: "smooth", block: "start" });
});

searchBox.addEventListener("input", (event) => {
  query = event.target.value;
  if (currentView === "fields") renderSubfields();
});

narratorButtons.forEach((button) => {
  button.addEventListener("click", () => setNarratorLanguage(button.dataset.narratorLang));
});

startApp.addEventListener("click", () => {
  startOverlay.hidden = true;
  localStorage.setItem(STORAGE.introPlayed, "1");
  speak(projectIntroText());
  categoryGrid.scrollIntoView({ behavior: "smooth", block: "start" });
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
