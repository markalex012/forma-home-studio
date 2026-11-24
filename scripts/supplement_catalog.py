"""Collect extra Hebrew-source sessions where broad search returned translated titles."""
import concurrent.futures
import json
from pathlib import Path
from research_catalog import search

jobs=[
 ("mobility","he","advanced","מוביליטי ג'ני קפלן אימון זרימה"),
 ("mobility","he","advanced","מוביליטי תנועתיות אימון עברית"),
 ("mobility","he","advanced","אימון מוביליטי מובמנט תנועה"),
 ("warmup","he","advanced","חימום דינמי קליסטניקס"),
 ("warmup","he","advanced","חימום אימון כוח מתקדם"),
 ("dance","he","beginner","שיעור זומבה מלא בעברית"),
 ("dance","he","beginner","אירובי דאנס למתחילים בעברית"),
 ("dance","he","advanced","אירובי דאנס שיעור מלא בעברית"),
 ("dance","he","advanced","אימון זומבה מלא ישראל"),
 ("dance","he","advanced","ריקוד כושר ישראל אימון מלא"),
]
data=json.loads(Path("catalog-candidates.json").read_text(encoding="utf-8"))
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 for b in pool.map(search,jobs):
  print(b["cat"],b["lang"],b["level"],len(b["entries"]),flush=True)
  target=next(x for x in data["buckets"] if (x["cat"],x["lang"],x["level"])==(b["cat"],b["lang"],b["level"]))
  ids={e["id"] for e in target["entries"]}
  target["entries"].extend(e for e in b["entries"] if e["id"] not in ids)
Path("catalog-candidates.json").write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
import enrich_candidates
