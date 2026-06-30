const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const fieldsDir = path.join(root, "fields");
const outDir = path.join(root, "site", "scripts");
const outFile = path.join(outDir, "data.js");

function textAfter(lines, marker, nextMarkers) {
  const start = lines.findIndex((line) => line.trim() === marker);
  if (start === -1) return "";
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (nextMarkers.some((prefix) => lines[i].startsWith(prefix))) {
      end = i;
      break;
    }
  }
  return lines.slice(start + 1, end).join("\n").trim();
}

function textAfterFirstLocalizedBlock(lines) {
  const start = lines.findIndex((line) => line.startsWith("#### ") && !line.includes("English"));
  if (start === -1) return "";
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (lines[i].startsWith("#### English") || lines[i].startsWith("### ")) {
      end = i;
      break;
    }
  }
  return lines.slice(start + 1, end).join("\n").trim();
}

function classify(field) {
  const lower = field.toLowerCase();
  if (/طب|جراح|تشريح|صيدلة|medicine|surgery|pharmacy|anatomy|botany|clinical/.test(lower)) {
    return "medicine";
  }
  if (/هندس|ميكانيك|آلات|هيدر|مياه|عمارة|engineering|mechanic|hydraulic|architecture|automata|gearing/.test(lower)) {
    return "engineering";
  }
  if (/رياض|جبر|حساب|مثلث|هندسة كروية|mathematics|algebra|arithmetic|trigonometry|combinatorics|geometry/.test(lower)) {
    return "mathematics";
  }
  if (/فلك|مرصد|نجوم|astronomy|astrometry|celestial|observational/.test(lower)) {
    return "astronomy";
  }
  if (/كيمياء|معادن|سموم|chemistry|mineralogy|toxicology|metallurgy/.test(lower)) {
    return "natural";
  }
  if (/جغراف|خرائط|ملاحة|بحار|geography|cartography|navigation|marine/.test(lower)) {
    return "earth";
  }
  if (/فلسفة|اجتماع|تاريخ|anthropology|philosophy|sociology|historiography/.test(lower)) {
    return "humanities";
  }
  return "science";
}

function imageFor(field) {
  const lower = field.toLowerCase();
  if (/طيران|هواء|مواد|aero|materials/.test(lower)) {
    return "assets/innovations/aerodynamics-materials.webp";
  }
  if (/عمارة|معمار|مدني|زلازل|architecture|civil|seismic|bridge/.test(lower)) {
    return "assets/innovations/architecture-civil.webp";
  }
  if (/نبات|صيدلة|عقاقير|botany|pharmacy|pharmacology|pharmacognosy|medicinal/.test(lower)) {
    return "assets/innovations/botany-pharmacy.webp";
  }
  if (/جغراف|خرائط|ملاحة|بحار|geography|cartography|navigation|marine/.test(lower)) {
    return "assets/innovations/cartography-navigation.webp";
  }
  if (/كيمياء|معادن|سموم|تعدين|chemistry|mineralogy|toxicology|metallurgy/.test(lower)) {
    return "assets/innovations/chemistry-distillation.webp";
  }
  if (/جراح|طب|تشريح|دورة|medicine|surgery|anatomy|clinical|pathology|orthopedics|traumatology/.test(lower)) {
    return "assets/innovations/medicine-surgery.webp";
  }
  if (/بصر|ضوء|optics|light|ray|photophysics/.test(lower)) {
    return "assets/innovations/optics-light.webp";
  }
  if (/ميكانيك|آلات|هيدر|مياه|ترس|ساعة|mechanic|hydraulic|automata|instrument|gearing|pump|clock/.test(lower)) {
    return "assets/innovations/mechanical-automata.webp";
  }
  if (/فلك|مرصد|نجوم|رياض|جبر|حساب|مثلث|astronomy|mathematics|algebra|arithmetic|trigonometry|geometry|astrometry/.test(lower)) {
    return "assets/innovations/algebra-astronomy.webp";
  }
  return "assets/innovations/algebra-astronomy.webp";
}

function parseField(file) {
  const raw = fs.readFileSync(path.join(fieldsDir, file), "utf8");
  const lines = raw.split(/\r?\n/);
  const title = lines[0].replace(/^\uFEFF?#+\s*/, "").trim();
  const sourceIndex = Number((raw.match(/رقم المدخل في المصدر:\s*(\d+)/) || [])[1] || file.slice(0, 2));
  const scientistLine = lines.find((line) => line.startsWith("- ") && !line.includes("رقم المدخل") && !line.includes("المصدر"));
  const scientist = scientistLine ? scientistLine.replace(/^-\s*/, "").trim() : "";
  const sections = [];
  const headingIndexes = lines
    .map((line, index) => ({ line, index }))
    .filter((item) => item.line.startsWith("### ") && !item.line.startsWith("#### "));

  headingIndexes.forEach((heading, idx) => {
    const end = headingIndexes[idx + 1]?.index ?? lines.length;
    const chunk = lines.slice(heading.index, end);
    sections.push({
      title: heading.line.replace(/^###\s*/, "").trim(),
      ar: textAfterFirstLocalizedBlock(chunk),
      en: textAfter(chunk, "#### English", ["### "]),
    });
  });

  return {
    id: file.replace(/\.md$/, ""),
    sourceIndex,
    title,
    scientist,
    category: classify(title),
    image: imageFor(title),
    sections,
  };
}

fs.mkdirSync(outDir, { recursive: true });

const files = fs
  .readdirSync(fieldsDir)
  .filter((file) => /^\d{2}-.+\.md$/.test(file))
  .sort();

const fields = files.map(parseField);
const uniqueScientists = new Set(fields.map((field) => field.scientist.replace(/\s*\([^)]*\)\s*$/, ""))).size;
const payload = {
  generatedAt: new Date().toISOString(),
  stats: {
    fields: fields.length,
    uniqueScientists,
  },
  fields,
};

fs.writeFileSync(
  outFile,
  `window.ISLAMIC_SCIENCE_DATA = ${JSON.stringify(payload, null, 2)};\n`,
  "utf8",
);

console.log(`Wrote ${fields.length} fields to ${path.relative(root, outFile)}`);
