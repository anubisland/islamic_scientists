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

function classify(field) {
  const lower = field.toLowerCase();
  if (/Ø·Ø¨|Ø¬Ø±Ø§Ø­|ØªØ´Ø±ÙŠØ­|ØµÙŠØ¯Ù„Ø©|medicine|surgery|pharmacy|anatomy|botany|clinical/.test(lower)) {
    return "medicine";
  }
  if (/Ù‡Ù†Ø¯Ø³|Ù…ÙŠÙƒØ§Ù†ÙŠÙƒ|Ø¢Ù„Ø§Øª|Ù‡ÙŠØ¯Ø±|Ù…ÙŠØ§Ù‡|Ø¹Ù…Ø§Ø±Ø©|engineering|mechanic|hydraulic|architecture|automata|gearing/.test(lower)) {
    return "engineering";
  }
  if (/Ø±ÙŠØ§Ø¶|Ø¬Ø¨Ø±|Ø­Ø³Ø§Ø¨|Ù…Ø«Ù„Ø«|Ù‡Ù†Ø¯Ø³Ø© ÙƒØ±ÙˆÙŠØ©|mathematics|algebra|arithmetic|trigonometry|combinatorics|geometry/.test(lower)) {
    return "mathematics";
  }
  if (/ÙÙ„Ùƒ|Ù…Ø±ØµØ¯|Ù†Ø¬ÙˆÙ…|astronomy|astrometry|celestial|observational/.test(lower)) {
    return "astronomy";
  }
  if (/ÙƒÙŠÙ…ÙŠØ§Ø¡|Ù…Ø¹Ø§Ø¯Ù†|Ø³Ù…ÙˆÙ…|chemistry|mineralogy|toxicology|metallurgy/.test(lower)) {
    return "natural";
  }
  if (/Ø¬ØºØ±Ø§Ù|Ø®Ø±Ø§Ø¦Ø·|Ù…Ù„Ø§Ø­Ø©|Ø¨Ø­Ø§Ø±|geography|cartography|navigation|marine/.test(lower)) {
    return "earth";
  }
  if (/ÙÙ„Ø³ÙØ©|Ø§Ø¬ØªÙ…Ø§Ø¹|ØªØ§Ø±ÙŠØ®|anthropology|philosophy|sociology|historiography/.test(lower)) {
    return "humanities";
  }
  return "science";
}

function imageFor(field) {
  const lower = field.toLowerCase();
  if (/Ø·ÙŠØ±Ø§Ù†|Ù‡ÙˆØ§Ø¡|Ù…ÙˆØ§Ø¯|aero|materials/.test(lower)) {
    return "assets/innovations/aerodynamics-materials.webp";
  }
  if (/Ø¹Ù…Ø§Ø±Ø©|Ù…Ø¹Ù…Ø§Ø±|Ù…Ø¯Ù†ÙŠ|Ø²Ù„Ø§Ø²Ù„|architecture|civil|seismic|bridge/.test(lower)) {
    return "assets/innovations/architecture-civil.webp";
  }
  if (/Ù†Ø¨Ø§Øª|ØµÙŠØ¯Ù„Ø©|Ø¹Ù‚Ø§Ù‚ÙŠØ±|botany|pharmacy|pharmacology|pharmacognosy|medicinal/.test(lower)) {
    return "assets/innovations/botany-pharmacy.webp";
  }
  if (/Ø¬ØºØ±Ø§Ù|Ø®Ø±Ø§Ø¦Ø·|Ù…Ù„Ø§Ø­Ø©|Ø¨Ø­Ø§Ø±|geography|cartography|navigation|marine/.test(lower)) {
    return "assets/innovations/cartography-navigation.webp";
  }
  if (/ÙƒÙŠÙ…ÙŠØ§Ø¡|Ù…Ø¹Ø§Ø¯Ù†|Ø³Ù…ÙˆÙ…|ØªØ¹Ø¯ÙŠÙ†|chemistry|mineralogy|toxicology|metallurgy/.test(lower)) {
    return "assets/innovations/chemistry-distillation.webp";
  }
  if (/Ø¬Ø±Ø§Ø­|Ø·Ø¨|ØªØ´Ø±ÙŠØ­|Ø¯ÙˆØ±Ø©|medicine|surgery|anatomy|clinical|pathology|orthopedics|traumatology/.test(lower)) {
    return "assets/innovations/medicine-surgery.webp";
  }
  if (/Ø¨ØµØ±|Ø¶ÙˆØ¡|optics|light|ray|photophysics/.test(lower)) {
    return "assets/innovations/optics-light.webp";
  }
  if (/Ù…ÙŠÙƒØ§Ù†ÙŠÙƒ|Ø¢Ù„Ø§Øª|Ù‡ÙŠØ¯Ø±|Ù…ÙŠØ§Ù‡|ØªØ±Ø³|Ø³Ø§Ø¹Ø©|mechanic|hydraulic|automata|instrument|gearing|pump|clock/.test(lower)) {
    return "assets/innovations/mechanical-automata.webp";
  }
  if (/ÙÙ„Ùƒ|Ù…Ø±ØµØ¯|Ù†Ø¬ÙˆÙ…|Ø±ÙŠØ§Ø¶|Ø¬Ø¨Ø±|Ø­Ø³Ø§Ø¨|Ù…Ø«Ù„Ø«|astronomy|mathematics|algebra|arithmetic|trigonometry|geometry|astrometry/.test(lower)) {
    return "assets/innovations/algebra-astronomy.webp";
  }
  return "assets/innovations/algebra-astronomy.webp";
}

function parseField(file) {
  const raw = fs.readFileSync(path.join(fieldsDir, file), "utf8");
  const lines = raw.split(/\r?\n/);
  const title = lines[0].replace(/^\uFEFF?#+\s*/, "").trim();
  const sourceIndex = Number((raw.match(/Ø±Ù‚Ù… Ø§Ù„Ù…Ø¯Ø®Ù„ ÙÙŠ Ø§Ù„Ù…ØµØ¯Ø±:\s*(\d+)/) || [])[1] || file.slice(0, 2));
  const scientistLine = lines.find((line) => line.startsWith("- ") && !line.includes("Ø±Ù‚Ù… Ø§Ù„Ù…Ø¯Ø®Ù„") && !line.includes("Ø§Ù„Ù…ØµØ¯Ø±"));
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
      ar: textAfter(chunk, "#### Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© Ø§Ù„Ù…Ø´ÙƒÙ„Ø©", ["#### English", "### "]),
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
