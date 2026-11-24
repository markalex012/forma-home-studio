"""Collect public YouTube search metadata for editorial review; no media downloads."""
import concurrent.futures
import json
import re
from pathlib import Path
import yt_dlp

QUERIES = {
 "yoga": {
  "ru": ["йога для начинающих занятие", "йога для продвинутых силовая виньяса"],
  "he": ["יוגה למתחילים שיעור מלא", "יוגה למתקדמים ויניאסה שיעור מלא"],
  "en": ["beginner yoga full class", "advanced power vinyasa yoga full class"]},
 "pilates": {
  "ru": ["пилатес для начинающих тренировка", "пилатес для продвинутых тренировка"],
  "he": ["פילאטיס למתחילים אימון מלא", "פילאטיס למתקדמים אימון מלא"],
  "en": ["beginner mat pilates full workout", "advanced mat pilates full workout"]},
 "stretch": {
  "ru": ["растяжка для начинающих все тело", "растяжка для продвинутых шпагат"],
  "he": ["מתיחות למתחילים גמישות כל הגוף", "גמישות מתיחות למתקדמים שפגט"],
  "en": ["beginner full body stretching routine", "advanced full body flexibility splits stretch"]},
 "dance": {
  "ru": ["танцевальная тренировка для начинающих", "танцевальная тренировка продвинутый уровень"],
  "he": ["אימון ריקוד למתחילים זומבה", "אימון ריקוד למתקדמים זומבה"],
  "en": ["beginner dance workout follow along", "advanced dance cardio workout follow along"]},
 "strength": {
  "ru": ["силовая тренировка для начинающих дома", "силовая тренировка для продвинутых дома"],
  "he": ["אימון כוח למתחילים בבית", "אימון כוח למתקדמים בבית"],
  "en": ["beginner full body strength workout at home", "advanced full body strength dumbbell workout"]},
 "cardio": {
  "ru": ["кардио для начинающих без прыжков", "кардио интенсивная тренировка для продвинутых"],
  "he": ["אימון אירובי למתחילים ללא קפיצות", "אימון אירובי עצים למתקדמים"],
  "en": ["beginner low impact cardio workout", "advanced intense cardio HIIT workout"]},
 "mobility": {
  "ru": ["мобилити суставная гимнастика для начинающих", "мобильность суставов продвинутые упражнения тренировка"],
  "he": ["מוביליטי תנועתיות מפרקים אימון למתחילים", "מוביליטי מתקדם תנועתיות מפרקים"],
  "en": ["beginner full body mobility routine", "advanced full body mobility routine"]},
 "warmup": {
  "ru": ["разминка для начинающих перед тренировкой", "динамическая разминка перед интенсивной тренировкой заминка"],
  "he": ["חימום לפני אימון למתחילים", "חימום דינמי לפני אימון עצים שחרור"],
  "en": ["beginner warm up cool down routine", "dynamic warm up intense workout cool down"]},
}

class Quiet:
 def debug(self, msg): pass
 def warning(self, msg): pass
 def error(self, msg): pass

def search(job):
 cat, lang, level, query = job
 opts = {"quiet": True, "no_warnings": True, "logger": Quiet(), "extract_flat": True,
         "skip_download": True, "socket_timeout": 12, "retries": 1, "extractor_retries": 1}
 try:
  with yt_dlp.YoutubeDL(opts) as ydl:
   data = ydl.extract_info("ytsearch60:" + query, download=False)
  entries = []
  for entry in (data or {}).get("entries", []):
   if not entry or not re.fullmatch(r"[A-Za-z0-9_-]{11}", entry.get("id", "")): continue
   name = entry.get("title", "")
   he = len(re.findall(r"[\u0590-\u05ff]", name))
   ru = len(re.findall(r"[\u0400-\u04ff]", name))
   if lang == "he" and he < 3: continue
   if lang == "ru" and ru < 3: continue
   if lang == "en" and (he or ru): continue
   duration = entry.get("duration")
   if not duration or not 180 <= duration <= 7200: continue
   entries.append({"id":entry["id"], "name": name, "cat":cat, "lang":lang,
    "suggestedLevel":level, "seconds":duration, "coach":entry.get("channel") or entry.get("uploader") or "",
    "description":entry.get("description") or "", "query":query, "url":"https://www.youtube.com/watch?v="+entry["id"]})
  return {"cat":cat,"lang":lang,"level":level,"query":query,"entries":entries}
 except Exception as error:
  return {"cat":cat,"lang":lang,"level":level,"query":query,"entries":[],"error":str(error)[:400]}

def main():
 jobs=[(cat,lang,level,q) for cat,langs in QUERIES.items() for lang,qs in langs.items()
       for level,q in zip(["beginner","advanced"],qs)]
 results=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
  for result in pool.map(search,jobs):
   results.append(result)
   print(result["cat"],result["lang"],result["level"],len(result["entries"]), result.get("error",""),flush=True)
 Path("catalog-candidates.json").write_text(json.dumps({"buckets":results},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

if __name__ == "__main__": main()
