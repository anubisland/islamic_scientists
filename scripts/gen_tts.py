#!/usr/bin/env python3
"""Generate static neural narration MP3s for the Islamic Scientists site.

The site does not use live browser TTS. It plays committed MP3 files from:

    site/audio/<slot>/<field_id>_<section_index>_<ar|en>.mp3
    site/audio/<slot>/intro_<ar|en>.mp3

Requires:
    python -m pip install edge-tts
"""

import argparse
import asyncio
import json
import os
import re
import subprocess
import sys

import edge_tts

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE_DIR = os.path.join(ROOT, "site")
AUDIO_DIR = os.path.join(SITE_DIR, "audio")

SLOTS = {
    "classic": {
        "ar": "ar-SA-HamedNeural",
        "en": "en-US-GuyNeural",
        "labelAr": "حامد",
        "labelEn": "Hamed",
        "descAr": "صوت فصيح",
        "descEn": "Classic male",
    },
    "gentle": {
        "ar": "ar-SA-ZariyahNeural",
        "en": "en-US-AriaNeural",
        "labelAr": "زارية",
        "labelEn": "Zariyah",
        "descAr": "صوت هادئ",
        "descEn": "Gentle female",
    },
    "story": {
        "ar": "ar-EG-SalmaNeural",
        "en": "en-US-JennyNeural",
        "labelAr": "سلمى",
        "labelEn": "Salma",
        "descAr": "حكواتية",
        "descEn": "Storyteller female",
    },
    "warm": {
        "ar": "ar-OM-AbdullahNeural",
        "en": "en-GB-RyanNeural",
        "labelAr": "عبدالله",
        "labelEn": "Ryan",
        "descAr": "صوت ودود",
        "descEn": "Warm male",
    },
    "shakir": {
        "ar": "ar-EG-ShakirNeural",
        "en": "en-US-BrianNeural",
        "labelAr": "شاكر",
        "labelEn": "Brian",
        "descAr": "صوت مصري",
        "descEn": "Egyptian male",
    },
}

INTRO = {
    "ar": (
        "هَذَا المَشْرُوعُ يُوَثِّقُ جُهُودَ العُلَمَاءِ المُسْلِمِينَ "
        "وَإِسْهَامَاتِهِمْ فِي الرِّيَاضِيَّاتِ، وَالطِّبِّ، وَالفَلَكِ، "
        "وَالهَنْدَسَةِ، وَالكِيمْيَاءِ، وَالجُغْرَافِيَا، وَالعُلُومِ التَّجْرِيبِيَّةِ. "
        "وَتَظْهَرُ أَهَمِّيَّتُهُ فِي رَبْطِ تِلْكَ الجُهُودِ بِمَا وَصَلَ إِلَيْهِ "
        "العَالَمُ اليَوْمَ مِنْ تَقَدُّمٍ عِلْمِيٍّ وَتِكْنُولُوجِيٍّ. "
        "وَفِي عُصُورٍ كَانَتْ فِيهَا مَنَاطِقُ وَاسِعَةٌ مِنَ العَالَمِ تَمُرُّ "
        "بِتَرَاجُعٍ فِي مُؤَسَّسَاتِ العِلْمِ وَالمَعْرِفَةِ، كَانَتِ الحَوَاضِرُ "
        "العَرَبِيَّةُ وَالإِسْلَامِيَّةُ تَزْدَهِرُ بِمَرَاكِزِ التَّرْجَمَةِ "
        "وَالبَحْثِ وَالتَّجْرِيبِ."
    ),
    "en": (
        "This project documents the scientific legacy of Muslim scholars and connects "
        "their discoveries in mathematics, medicine, astronomy, engineering, chemistry, "
        "geography, and experimental science to the modern world. At a time when many "
        "regions were experiencing a decline in formal institutions of learning, Arab "
        "and Islamic cities flourished as centers of translation, research, experimentation, "
        "and knowledge."
    ),
}

RATE = "-8%"
VOLUME = "+0%"
CONCURRENCY = 6

ARABIC_RE = re.compile(r"[\u0600-\u06ff]+")
EN_PARENS_RE = re.compile(r"\([^)]*[A-Za-z][^)]*\)")


def load_data():
    shim = "global.window={};require('./site/scripts/data.js');process.stdout.write(JSON.stringify(window.ISLAMIC_SCIENCE_DATA));"
    out = subprocess.check_output(["node", "-e", shim], cwd=ROOT)
    return json.loads(out)


def prepare_arabic(text):
    return EN_PARENS_RE.sub("", text).replace("هـ", "هجرية").replace("م)", "ميلادية)").strip()


def prepare_english(text):
    return re.sub(r"\s+", " ", ARABIC_RE.sub("", text)).strip()


def text_for(section, lang):
    if lang == "ar":
        return prepare_arabic(section.get("ar", ""))
    return prepare_english(section.get("en", ""))


async def synth_one(sem, voice, text, out_path, force):
    if not text.strip():
        return ("skip-empty", out_path)
    if os.path.exists(out_path) and not force:
        return ("exists", out_path)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    async with sem:
        try:
            await edge_tts.Communicate(text, voice, rate=RATE, volume=VOLUME).save(out_path)
            return ("ok", out_path)
        except Exception as exc:
            return (f"error: {exc}", out_path)


def selected_fields(fields, ids):
    if not ids:
        return fields
    wanted = set(ids)
    return [field for field in fields if field["id"] in wanted or str(field["sourceIndex"]) in wanted]


def write_manifest(data, slots):
    manifest = {
        "rate": RATE,
        "slots": {slot: SLOTS[slot] for slot in slots},
        "fields": len(data["fields"]),
    }
    os.makedirs(AUDIO_DIR, exist_ok=True)
    with open(os.path.join(AUDIO_DIR, "manifest.json"), "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, ensure_ascii=False, indent=2)


async def main_async(args):
    data = load_data()
    slots = args.slots or list(SLOTS)
    langs = args.langs or ["ar", "en"]
    fields = selected_fields(data["fields"], args.fields)
    sem = asyncio.Semaphore(CONCURRENCY)
    tasks = []

    for slot in slots:
        for lang in langs:
            tasks.append(
                synth_one(
                    sem,
                    SLOTS[slot][lang],
                    INTRO[lang],
                    os.path.join(AUDIO_DIR, slot, f"intro_{lang}.mp3"),
                    args.force,
                )
            )

        for field in fields:
            for index, section in enumerate(field.get("sections", [])):
                for lang in langs:
                    tasks.append(
                        synth_one(
                            sem,
                            SLOTS[slot][lang],
                            text_for(section, lang),
                            os.path.join(AUDIO_DIR, slot, f"{field['id']}_{index}_{lang}.mp3"),
                            args.force,
                        )
                    )

    print(f"Generating {len(tasks)} clips: slots={slots}, fields={len(fields)}, langs={langs}")
    results = await asyncio.gather(*tasks)
    stats = {"ok": 0, "exists": 0, "skip-empty": 0, "error": 0}
    for status, path in results:
        if status in stats:
            stats[status] += 1
        else:
            stats["error"] += 1
            print(f"{status}: {os.path.relpath(path, ROOT)}", file=sys.stderr)
    write_manifest(data, slots)
    print(f"Done: {stats}")


def parse_args():
    parser = argparse.ArgumentParser(description="Generate neural narration MP3 files.")
    parser.add_argument("--fields", nargs="*", help="field ids or source numbers to generate")
    parser.add_argument("--slots", nargs="*", choices=list(SLOTS), help="voice slots to generate")
    parser.add_argument("--langs", nargs="*", choices=["ar", "en"], help="languages to generate")
    parser.add_argument("--force", action="store_true", help="regenerate existing MP3s")
    return parser.parse_args()


if __name__ == "__main__":
    asyncio.run(main_async(parse_args()))
