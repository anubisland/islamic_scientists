const data = window.ISLAMIC_SCIENCE_DATA;

const categories = [
  { id: "all", ar: "كُلُّ المَجَالَاتِ", en: "All Fields" },
  { id: "mathematics", ar: "الرِّيَاضِيَّاتُ", en: "Mathematics" },
  { id: "astronomy", ar: "الفَلَكُ", en: "Astronomy" },
  { id: "medicine", ar: "الطِّبُّ وَالصَّيْدَلَةُ", en: "Medicine" },
  { id: "engineering", ar: "الهَنْدَسَةُ وَالآلَاتُ", en: "Engineering" },
  { id: "natural", ar: "العُلُومُ الطَّبِيعِيَّةُ", en: "Natural Sciences" },
  { id: "earth", ar: "الأَرْضُ وَالمِلَاحَةُ", en: "Earth & Navigation" },
  { id: "humanities", ar: "الفِكْرُ وَالمُجْتَمَعُ", en: "Thought & Society" },
];

let activeCategory = "all";
let activeField = data.fields[0]?.id;
let query = "";
let lang = "both";

const fieldList = document.querySelector("#fieldList");
const detailPanel = document.querySelector("#detailPanel");
const categoryChips = document.querySelector("#categoryChips");
const searchBox = document.querySelector("#searchBox");
const toggleLang = document.querySelector("#toggleLang");
const stopNarration = document.querySelector("#stopNarration");

document.querySelector("#fieldCount").textContent = data.stats.fields;
document.querySelector("#scientistCount").textContent = data.stats.uniqueScientists;

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
      return `<button class="chip${active}" type="button" data-category="${category.id}">${category.ar}<br><small>${category.en}</small></button>`;
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
      const active = field.id === activeField ? " is-active" : "";
      return `
        <button class="field-button${active}" type="button" data-field="${field.id}">
          <span class="field-number">${String(field.sourceIndex).padStart(2, "0")}</span>
          <span>
            <span class="field-title">${field.title}</span>
            <span class="field-scientist">${field.scientist}</span>
          </span>
        </button>
      `;
    })
    .join("");
}

function speak(text, language) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = language === "ar-SA" ? 0.82 : 0.9;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function sectionText(section) {
  if (lang === "en") return section.en;
  if (lang === "ar") return section.ar;
  return `${section.ar}\n\n${section.en}`;
}

function renderDetail() {
  const field = data.fields.find((item) => item.id === activeField);
  if (!field) {
    detailPanel.innerHTML = `<div class="empty">لا توجد نتائج مطابقة.</div>`;
    return;
  }

  detailPanel.innerHTML = `
    <article>
      <header class="detail-hero">
        <div class="detail-copy">
          <p class="section-kicker">المجال رقم ${String(field.sourceIndex).padStart(2, "0")}</p>
          <h2>${field.title}</h2>
          <div class="detail-meta">
            <span>${field.scientist}</span>
            <span>${categories.find((category) => category.id === field.category)?.ar || "عِلْمٌ"}</span>
            <button class="listen" type="button" data-speak-field="${field.id}">استماع للمجال</button>
          </div>
        </div>
        <figure class="innovation-figure">
          <img src="${field.image}" alt="صورة توضيحية لابتكارات ${field.title}" loading="lazy">
          <figcaption>صورة توضيحية لابتكارات المجال</figcaption>
        </figure>
      </header>
      <div class="innovation-strip">
        <div>
          <strong>الابتكار في سياقه العلمي</strong>
          <p>الصورة تساعد القارئ على ربط المجال بأدواته وأثره العملي قبل قراءة التفاصيل.</p>
        </div>
      </div>
      <div class="sections">
        ${field.sections
          .map(
            (section, index) => `
              <section class="science-section">
                <div class="section-head">
                  <h3>${section.title}</h3>
                  <button class="listen" type="button" data-speak-section="${index}">استمع</button>
                </div>
                <div class="columns">
                  <div class="text-panel ar-text" ${lang === "en" ? "hidden" : ""}>
                    <h4>العربية المشكلة</h4>
                    <p>${section.ar}</p>
                  </div>
                  <div class="text-panel en-text" ${lang === "ar" ? "hidden" : ""}>
                    <h4>English</h4>
                    <p>${section.en}</p>
                  </div>
                </div>
              </section>
            `,
          )
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
});

detailPanel.addEventListener("click", (event) => {
  const field = data.fields.find((item) => item.id === activeField);
  if (!field) return;

  const fieldButton = event.target.closest("[data-speak-field]");
  if (fieldButton) {
    const text = field.sections.map(sectionText).join("\n\n");
    speak(text, lang === "en" ? "en-US" : "ar-SA");
    return;
  }

  const sectionButton = event.target.closest("[data-speak-section]");
  if (sectionButton) {
    const section = field.sections[Number(sectionButton.dataset.speakSection)];
    speak(sectionText(section), lang === "en" ? "en-US" : "ar-SA");
  }
});

searchBox.addEventListener("input", (event) => {
  query = event.target.value;
  render();
});

toggleLang.addEventListener("click", () => {
  lang = lang === "both" ? "ar" : lang === "ar" ? "en" : "both";
  toggleLang.textContent = lang === "both" ? "ع / En" : lang === "ar" ? "ع" : "En";
  renderDetail();
});

stopNarration.addEventListener("click", () => {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
});

render();
