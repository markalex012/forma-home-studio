"""Read original creator titles via public oEmbed and prepare compact review files."""
import concurrent.futures
import json
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

def probe(video_id):
 url="https://www.youtube.com/oembed?"+urllib.parse.urlencode({"url":"https://www.youtube.com/watch?v="+video_id,"format":"json"})
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"LK-Studio-Catalog/1.0"}),timeout=10) as response:
   data=json.load(response)
  return video_id,{"originalName":data["title"],"coach":data.get("author_name",""),"channelUrl":data.get("author_url",""),"available":True}
 except Exception as error:
  return video_id,{"available":False,"error":str(error)[:80]}

data=json.loads(Path("catalog-candidates.json").read_text(encoding="utf-8"))
ids=list(dict.fromkeys(e["id"] for b in data["buckets"] for e in b["entries"]))
print("Checking",len(ids),"unique videos",flush=True)
metadata={}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
 for i,(video_id,item) in enumerate(pool.map(probe,ids)):
  metadata[video_id]=item
  if i%100==0: print("Checked",i,flush=True)
for lang in ["ru","he","en"]:
 buckets=[]
 for b in data["buckets"]:
  if b["lang"]!=lang: continue
  entries=[]
  for entry in b["entries"]:
   e={k:v for k,v in entry.items() if k not in ["description","url","query"]}
   e.update(metadata[e["id"]])
   entries.append(e)
  buckets.append({k:v for k,v in b.items() if k!="entries"}|{"entries":entries})
 Path("research-"+lang+".json").write_text(json.dumps({"buckets":buckets},ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
print("Available",sum(bool(x.get("available")) for x in metadata.values()),"of",len(ids),flush=True)
