"""Check metadata; rate limits and network errors never count as removed videos."""
import argparse
import concurrent.futures
import datetime
import json
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

def next_state(previous, outcome, now):
    old = dict(previous or {})
    old["lastAttempt"] = now
    if outcome == "available":
        old.update(status="available", failureStreak=0, lastConfirmed=now)
    elif outcome == "missing":
        streak = int(old.get("failureStreak", 0)) + 1
        old.update(failureStreak=streak, lastConfirmed=now)
        old["status"] = "unavailable" if streak >= 3 else old.get("status", "pending")
    else:
        old["failureStreak"] = 0
        old.setdefault("status", "unknown")
    old["lastResult"] = outcome
    return old

def probe(video):
    query = urllib.parse.urlencode({"url": "https://www.youtube.com/watch?v=" + video["id"], "format": "json"})
    request = urllib.request.Request("https://www.youtube.com/oembed?" + query,
                                     headers={"User-Agent": "FORMA-Catalog/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            data = json.load(response)
            return video["id"], "available" if data.get("title") else "unknown"
    except urllib.error.HTTPError as error:
        return video["id"], "missing" if error.code in (404, 410) else "unknown"
    except (urllib.error.URLError, TimeoutError, ValueError, OSError):
        return video["id"], "unknown"

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--path", default="catalog.json")
    args = parser.parse_args()
    path = Path(args.path)
    data = json.loads(path.read_text(encoding="utf-8"))
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    availability = data.setdefault("availability", {})
    counts = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        for video_id, outcome in executor.map(probe, data["workouts"]):
            availability[video_id] = next_state(availability.get(video_id), outcome, now)
            counts[outcome] = counts.get(outcome, 0) + 1
    data["checkedAt"] = now
    data["checkSummary"] = counts
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(counts))

if __name__ == "__main__":
    main()
