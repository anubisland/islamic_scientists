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
  voice: "islamicScientists.voiceSlot",
};

const VOICE_SLOTS = {
  classic: { labelAr: "حامد", labelEn: "Hamed", descAr: "صوت فصيح", descEn: "Classic male" },
  gentle: { labelAr: "زارية", labelEn: "Zariyah", descAr: "صوت هادئ", descEn: "Gentle female" },
  story: { labelAr: "سلمى", labelEn: "Salma", descAr: "حكواتية", descEn: "Storyteller female" },
  warm: { labelAr: "عبدالله", labelEn: "Ryan", descAr: "صوت ودود", descEn: "Warm male" },
  shakir: { labelAr: "شاكر", labelEn: "Brian", descAr: "صوت مصري", descEn: "Egyptian male" },
};

let currentView = "categories";
let activeCategory = "";
let activeField = "";
let query = "";
let narratorLanguage = localStorage.getItem(STORAGE.narrator) || "ar";
let narratorVoice = VOICE_SLOTS[localStorage.getItem(STORAGE.voice)] ? localStorage.getItem(STORAGE.voice) : "warm";
let narrationQueue = [];
let currentAudio = null;
let playToken = 0;

const categoryGrid = document.querySelector("#categoryGrid");
const heroScreen = document.querySelector(".hero");
const introBand = document.querySelector(".intro-band");
const viewToolbar = document.querySelector(".view-toolbar");
const subfieldScreen = document.querySelector("#subfieldScreen");
const subfieldHead = document.querySelector("#subfieldHead");
const fieldList = document.querySelector("#fieldList");
const detailPanel = document.querySelector("#detailPanel");
const searchControls = document.querySelector("#searchControls");
const searchBox = document.querySelector("#searchBox");
const backButton = document.querySelector("#backButton");
const stopNarration = document.querySelector("#stopNarration");
const narratorButtons = document.querySelectorAll("[data-narrator-lang]");
const voiceButton = document.querySelector("#voiceButton");
const voiceCurrent = document.querySelector("#voiceCurrent");
const voiceMenu = document.querySelector("#voiceMenu");
const startIntroAudio = document.querySelector("#startIntroAudio");

document.querySelector("#fieldCount").textContent = data.stats.fields;
document.querySelector("#scientistCount").textContent = data.stats.uniqueScientists;

function narratorMeta() {
  return narratorLanguage === "ar"
    ? {
        button: "الراوي: عربي / Arabic narrator",
        listen: "استمع / Listen",
        listenFull: "استماع للمجال كاملًا / Full field audio",
        pause: "إيقاف مؤقت / متابعة · Pause / Resume",
        back: "عودة / Back",
      }
    : {
        button: "Narrator: English",
        listen: "Listen",
        listenFull: "Listen to full field",
        pause: "Pause / Resume",
        back: "Back",
      };
}

function stopSpeech() {
  narrationQueue = [];
  playToken += 1;
  document.body.classList.remove("is-speaking", "is-paused");
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.removeAttribute("src");
    currentAudio.load();
    currentAudio = null;
  }
}

function setNarratorLanguage(language) {
  narratorLanguage = language === "en" ? "en" : "ar";
  localStorage.setItem(STORAGE.narrator, narratorLanguage);
  stopSpeech();
  updateNarratorButtons();
  renderVoiceMenu();
  render();
}

function updateNarratorButtons() {
  narratorButtons.forEach((button) => {
    const active = button.dataset.narratorLang === narratorLanguage;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function voiceLabel(slot = narratorVoice) {
  const voice = VOICE_SLOTS[slot] || VOICE_SLOTS.warm;
  return narratorLanguage === "ar" ? `${voice.labelAr} / ${voice.labelEn}` : voice.labelEn;
}

function renderVoiceMenu() {
  voiceCurrent.textContent = voiceLabel();
  voiceMenu.innerHTML = Object.entries(VOICE_SLOTS)
    .map(([slot, voice]) => {
      const label = narratorLanguage === "ar" ? `${voice.labelAr} / ${voice.labelEn}` : voice.labelEn;
      const desc = narratorLanguage === "ar" ? `${voice.descAr} / ${voice.descEn}` : voice.descEn;
      return `
        <button class="voice-option${slot === narratorVoice ? " is-active" : ""}" type="button" data-voice-slot="${slot}" role="menuitem">
          <span>${label}<small>${desc}</small></span>
          <strong>${slot === narratorVoice ? "✓" : ""}</strong>
        </button>
      `;
    })
    .join("");
}

function setNarratorVoice(slot) {
  if (!VOICE_SLOTS[slot]) return;
  narratorVoice = slot;
  localStorage.setItem(STORAGE.voice, narratorVoice);
  stopSpeech();
  renderVoiceMenu();
  render();
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
          <span class="category-desc category-desc-en">${category.descEn}</span>
        </button>
      `;
    })
    .join("");
}

function warmImageCache() {
  const images = [...new Set(data.fields.map((field) => field.image).filter(Boolean))];
  const loadImages = () => {
    images.forEach((src, index) => {
      window.setTimeout(() => {
        const image = new Image();
        image.decoding = "async";
        image.src = src;
      }, index * 180);
    });
  };
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(loadImages, { timeout: 2500 });
    return;
  }
  window.setTimeout(loadImages, 1200);
}

function renderSubfields() {
  const category = categories.find((item) => item.id === activeCategory) || categories[0];
  const fields = categoryFields();
  subfieldHead.innerHTML = `
    <p class="section-kicker">المجالات الفرعية <span class="section-kicker__en">Subfields</span></p>
    <h2>${category.ar}</h2>
    <span>${category.en}</span>
    <p>${category.descAr}</p>
    <p class="subfield-head__en" dir="ltr">${category.descEn}</p>
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
            <span class="field-scientist field-scientist-en">${scientist.en}</span>
          </span>
        </button>
      `;
    })
    .join("");

  if (!fields.length) {
    fieldList.innerHTML = `<div class="empty">لا توجد نتائج مطابقة.<span>No matching results.</span></div>`;
  }
}

function narrationUrl(fieldId, sectionIndex, language = narratorLanguage) {
  return `audio/${narratorVoice}/${fieldId}_${sectionIndex}_${language}.mp3`;
}

function introUrl(language = narratorLanguage) {
  return `audio/${narratorVoice}/intro_${language}.mp3`;
}

function showAudioNotice() {
  const message =
    narratorLanguage === "ar"
      ? "لم يتم العثور على الملف الصوتي لهذا الاختيار. شغّل: python scripts/gen_tts.py / Audio is not generated for this selection yet."
      : "Audio is not generated for this selection yet. Run: python scripts/gen_tts.py";
  const notice = document.createElement("div");
  notice.className = "audio-notice";
  notice.textContent = message;
  document.body.appendChild(notice);
  window.setTimeout(() => notice.remove(), 3600);
}

function playAudioQueue(urls) {
  stopSpeech();
  narrationQueue = urls.filter(Boolean);
  const token = ++playToken;
  playNextAudio(token);
}

function playNextAudio(token) {
  const next = narrationQueue.shift();
  if (!next || token !== playToken) {
    document.body.classList.remove("is-speaking", "is-paused");
    return;
  }

  currentAudio = new Audio(next);
  currentAudio.preload = "auto";
  currentAudio.onended = () => playNextAudio(token);
  currentAudio.onerror = () => {
    showAudioNotice();
    playNextAudio(token);
  };
  currentAudio.onplay = () => {
    document.body.classList.add("is-speaking");
    document.body.classList.remove("is-paused");
  };
  currentAudio.play().catch(() => {
    showAudioNotice();
    document.body.classList.remove("is-speaking", "is-paused");
  });
}

function playField(field) {
  playAudioQueue(field.sections.map((_, index) => narrationUrl(field.id, index)));
}

function playSection(field, sectionIndex) {
  playAudioQueue([narrationUrl(field.id, sectionIndex)]);
}

function speakIntro() {
  playAudioQueue([introUrl()]);
}

function pauseOrResumeSpeech() {
  if (!currentAudio) return;
  if (!currentAudio.paused) {
    currentAudio.pause();
    document.body.classList.add("is-paused");
    return;
  }
  currentAudio.play();
  document.body.classList.remove("is-paused");
}

function renderDetail() {
  const field = data.fields.find((item) => item.id === activeField);
  if (!field) {
    detailPanel.innerHTML = `<div class="empty">لا توجد نتائج مطابقة.<span>No matching results.</span></div>`;
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
          <p class="section-kicker">المجال رقم ${String(field.sourceIndex).padStart(2, "0")} <span class="section-kicker__en">Field ${String(field.sourceIndex).padStart(2, "0")} · ${category.en}</span></p>
          <h2>${title.ar}</h2>
          <span class="detail-title-en">${title.en}</span>
          <div class="detail-meta">
            <span>${scientist.ar}</span>
            <span dir="ltr">${scientist.en}</span>
            <span>${category.ar}</span>
            <span dir="ltr">${category.en}</span>
          </div>
        </div>
        <figure class="innovation-figure">
          <img src="${field.image}" alt="صورة توضيحية لابتكارات ${title.ar}" loading="eager" decoding="async">
          <figcaption>${title.en || category.en}</figcaption>
        </figure>
      </header>

      <div class="narrator-panel">
        <button class="listen primary" type="button" data-speak-field="${field.id}">
          <span>${meta.listenFull}</span><small>${meta.button} · ${voiceLabel()}</small>
        </button>
        <button class="listen secondary" type="button" data-pause>${meta.pause}</button>
        <div class="audio-wave" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
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
                    <h4>العَرَبِيَّةُ المُشَكَّلَةُ <small>Vocalized Arabic</small></h4>
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
  document.body.classList.remove("view-categories", "view-fields", "view-detail");
  document.body.classList.add(`view-${view}`);
  heroScreen.hidden = view !== "categories";
  introBand.hidden = view !== "categories";
  categoryGrid.hidden = view !== "categories";
  subfieldScreen.hidden = view !== "fields";
  detailPanel.hidden = view !== "detail";
  searchControls.hidden = view !== "fields";
  viewToolbar.hidden = view === "categories";
  backButton.hidden = view === "categories";
  backButton.textContent = narratorMeta().back;
}

function resetScroll() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
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
  resetScroll();
});

fieldList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-field]");
  if (!button) return;
  activeField = button.dataset.field;
  renderDetail();
  setView("detail");
  resetScroll();
});

detailPanel.addEventListener("click", (event) => {
  const field = data.fields.find((item) => item.id === activeField);
  if (!field) return;

  if (event.target.closest("[data-pause]")) {
    pauseOrResumeSpeech();
    return;
  }

  if (event.target.closest("[data-speak-field]")) {
    playField(field);
    return;
  }

  const sectionButton = event.target.closest("[data-speak-section]");
  if (sectionButton) {
    playSection(field, Number(sectionButton.dataset.speakSection));
  }
});

backButton.addEventListener("click", () => {
  stopSpeech();
  if (currentView === "detail") {
    renderSubfields();
    setView("fields");
    resetScroll();
    return;
  }
  setView("categories");
  resetScroll();
});

searchBox.addEventListener("input", (event) => {
  query = event.target.value;
  if (currentView === "fields") renderSubfields();
});

narratorButtons.forEach((button) => {
  button.addEventListener("click", () => setNarratorLanguage(button.dataset.narratorLang));
});

voiceButton.addEventListener("click", () => {
  const expanded = voiceButton.getAttribute("aria-expanded") === "true";
  voiceButton.setAttribute("aria-expanded", String(!expanded));
  voiceMenu.hidden = expanded;
});

voiceMenu.addEventListener("click", (event) => {
  const option = event.target.closest("[data-voice-slot]");
  if (!option) return;
  setNarratorVoice(option.dataset.voiceSlot);
  voiceButton.setAttribute("aria-expanded", "false");
  voiceMenu.hidden = true;
});

document.addEventListener("click", (event) => {
  if (event.target.closest(".voice-pick")) return;
  voiceButton.setAttribute("aria-expanded", "false");
  voiceMenu.hidden = true;
});

startIntroAudio.addEventListener("click", speakIntro);

stopNarration.addEventListener("click", stopSpeech);
window.addEventListener("beforeunload", stopSpeech);

document.documentElement.lang = "ar";
document.documentElement.dir = "rtl";
updateNarratorButtons();
renderVoiceMenu();
render();
warmImageCache();
