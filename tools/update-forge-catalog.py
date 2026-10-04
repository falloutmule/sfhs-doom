#!/usr/bin/env python3
"""Build a versioned /idgames metadata catalog; never download WAD/ZIP payloads.

The durable fullsort.gz supplies paths, archive dates and package sizes. Original
same-stem TXT records enrich either a representative selection or the full
catalog with --enrich-all. Unknown facts remain unknown. At most four concurrent
requests read metadata; ignored local cache files make interrupted runs resumable.
This tool never downloads WAD/ZIP payloads and is not an end-user prerequisite.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
import gzip
import hashlib
import json
from pathlib import Path
import re
import threading
import time
import urllib.error
import urllib.request

MIRRORS = {
    "youfailit": "https://youfailit.net/pub/idgames/",
    "infania": "https://ftpmirror.infania.net/pub/idgames/",
    "mtu": "https://mirrors.lug.mtu.edu/idgames/",
    "fu-berlin": "https://ftp.fu-berlin.de/pc/games/idgames/",
}
ENRICH = (
    "levels/doom/megawads/dtwid.zip",
    "levels/doom2/megawads/d2twid.zip",
    "levels/doom2/megawads/scythe.zip",
    "levels/doom2/megawads/av.zip",
    "levels/doom2/megawads/btsx_e1.zip",
    "levels/doom2/megawads/btsx_e2.zip",
    "levels/doom/megawads/njdoom.zip",
    "levels/doom2/megawads/njdoom2.zip",
    "levels/doom2/megawads/requiem.zip",
    "levels/doom/s-u/uac_dead.zip",
    "themes/TeamTNT/icarus/icarus.zip",
    "themes/mm/mm2.zip",
)
SCHEMA = "sfhs.doom-archive-catalog@1"
ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CACHE = ROOT / "test-results" / "forge-catalog" / "metadata-cache"


def safe_path(value: str) -> bool:
    return (len(value) <= 512 and not re.search(r"[\\\x00-\x20?#%]", value)
            and all(part not in ("", ".", "..") for part in value.split("/")))


def parse_index(text: str) -> list[dict]:
    entries = {}
    metadata = {}
    for line in text.splitlines():
        match = re.fullmatch(r"(\d{4}/\d{2}/\d{2})\s+(\d+)\s+(\S+)", line)
        if not match:
            continue
        date, size, path = match.groups()
        if safe_path(path) and path.lower().endswith('.txt'):
            metadata[path] = {"date": date.replace("/", "-"), "bytes": int(size)}
        if (not safe_path(path) or not path.lower().endswith(".zip")
                or not re.match(r"^(levels/(doom|doom2)/|themes/)", path)):
            continue
        family = "doom2" if path.startswith("levels/doom2/") else "doom" if path.startswith("levels/doom/") else None
        entries[path] = {"path": path, "filename": path.rsplit("/", 1)[-1],
                         "bytes": int(size), "date": date.replace("/", "-"),
                         "title": None, "author": None, "family": family,
                         "mapCount": None, "type": None,
                         "compatibility": "unknown", "permission": "unclear"}
    for entry in entries.values():
        sidecar = metadata.get(entry["path"][:-4] + ".txt")
        if sidecar:
            entry["metadataDate"] = sidecar["date"]
            entry["metadataBytes"] = sidecar["bytes"]
    return sorted(entries.values(), key=lambda entry: entry["path"])


def field(text: str, names: str) -> str | None:
    match = re.search(r"(?im)^[ \t]*(?:" + names + r")[ \t]*:[ \t]*([^\r\n]+)", text)
    value = match.group(1).strip() if match else None
    return value if value and len(value) <= 512 else None


def enrich_entry(entry: dict, text: str, source_url: str) -> dict:
    result = dict(entry)
    # Late Title/Author records can describe individual maps in long megawad
    # manuals. Without a package header, keep those fields unknown.
    result.update({"title": field(text[:2048], "Title"), "author": field(text[:2048], r"Author(?:\(s\))?"),
                   "readmeUrl": source_url, "readmeSha256": hashlib.sha256(text.encode("utf-8")).hexdigest(),
                   "engineRequirement": field(text, "Advanced engine needed|Required engine"),
                   "testedWith": field(text, "Tested With"), "maps": field(text, r"Map\s*#|Episode and Level\s*#|Map Number|Level\(s\) replaced"),
                   "releaseDateText": field(text, "Release date"), "primaryPurpose": field(text, "Primary purpose"),
                   "requiredFiles": field(text, "Other files required"), "metadataInspected": True})
    for key in ("title", "author"):
        if re.fullmatch(r"unknown|not known|not specified|n/?a|none|\?+", result[key] or "", re.I):
            result[key] = None
    game = field(text, "Game")
    if game:
        result["gameText"] = game
        if re.search(r"DOOM\s*(?:2|II)|DOOM2|Final Doom|TNT|Plutonia", game, re.I):
            result["family"] = "doom2"
        elif re.search(r"Heretic|Hexen|Strife|DOOM\s*64", game, re.I):
            result["family"] = None
        elif re.search(r"DOOM|ULTIMATE", game, re.I):
            result["family"] = "doom"
    levels = field(text, "New levels")
    if levels:
        count = re.match(r"(\d+)(?:\b|\s)", levels)
        if count:
            result["mapCount"] = int(count[1])
        elif re.fullmatch(r"none|no", levels, re.I):
            result["mapCount"] = 0
    maps = result["maps"] or ""
    if result["mapCount"] is None:
        span = re.fullmatch(r"MAP\s*(\d{1,2})\s*(?:-|to|through)\s*(?:MAP\s*)?(\d{1,2})", maps, re.I)
        single = re.fullmatch(r"(?:MAP\d{1,2}|E\dM\d)", maps, re.I)
        if span and int(span[2]) >= int(span[1]):
            result["mapCount"] = int(span[2]) - int(span[1]) + 1
        elif single:
            result["mapCount"] = 1
    count = result["mapCount"]
    if count is not None:
        result["type"] = "no-levels" if count == 0 else "single-map" if count == 1 else "megawad" if count >= 15 else "episode" if count >= 6 else "map-pack"
    if re.search(r"\btotal conversion\b", result["primaryPurpose"] or "", re.I):
        result["type"] = "total-conversion"
    requirements = " ".join(str(result[key] or "") for key in ("engineRequirement", "testedWith"))
    requirement = result["engineRequirement"] or ""
    advanced = re.search(r"\b(G?ZDoom|Boom|MBF\d*|UDMF|Hexen format|limit[ -]remov(?:er|ing))\b", requirement, re.I)
    no_advanced = re.match(r"(?:none\b|no advanced engine\b|not required\b)", requirement, re.I)
    conflicting = advanced and re.search(r"\b(?:vanilla|Chocolate)\b", requirement, re.I)
    if advanced and not no_advanced and not conflicting:
        result["compatibility"] = "unsupported"
        result["compatibilityReason"] = "Original TXT requires: " + result["engineRequirement"]
    elif not conflicting and (no_advanced or re.search(r"vanilla|Chocolate|Doom2?\.exe|Doom II v?1\.9|Doom v?1\.9", requirements, re.I)):
        result["compatibility"] = "likely-compatible"
        result["compatibilityReason"] = "Original TXT reports a vanilla/Chocolate target; payload analysis and play test are still required."
    # A download's presence in /idgames is not a blanket permission grant.
    permission_section = re.search(r"(?:Copyright\s*/?\s*Permissions|Copyrights? and Permissions|Legal Stuff)[\s\S]*", text, re.I)
    permission_text = permission_section[0] if permission_section else text
    normalized = re.sub(r"\s+", " ", permission_text)
    grant = re.search(r"You MAY distribute (?:this file|this WAD|these files|this level)[^.]*\.(?:[^.*]*\.){0,3}", normalized, re.I)
    denial = re.search(r"(?:You (?:MAY NOT|may not|must not)|Do not) distribute|distribution (?:is )?(?:not permitted|prohibited)", normalized, re.I)
    if denial:
        result["permission"] = "private"
        result["permissionEvidence"] = denial[0]
    elif grant:
        result["permission"] = "redistributable"
        result["permissionEvidence"] = grant[0][:1200]
        result["permissionConditions"] = "Author TXT distribution grant; preserve original files and complete original TXT. Review the full conditions before sharing."
        result["originalTextRequired"] = True
    return result


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, response, code, message, headers, newurl):
        return None


def retrieve(url: str, limit: int, timeout: float = 30) -> bytes:
    if not any(url.startswith(root) for root in MIRRORS.values()):
        raise ValueError("Metadata URL is not an approved official mirror")
    if not (url.endswith('.txt') or url.endswith('/fullsort.gz')):
        raise ValueError("Only same-stem TXT metadata and the durable index may be fetched")
    opener = urllib.request.build_opener(NoRedirect())
    with opener.open(urllib.request.Request(url, headers={"User-Agent": "SFHS-Doom-Forge-Metadata/1.1"}, method="GET"), timeout=timeout) as response:
        value = response.read(limit + 1)
    if len(value) > limit:
        raise ValueError(f"Metadata exceeds {limit} bytes: {url}")
    return value


class ArchiveRateLimit(RuntimeError):
    """The origin has refused this run; do not switch mirrors to evade it."""


def retry_delay(value: str | None, attempt: int, now: datetime | None = None) -> float:
    if value:
        try:
            return max(0.0, float(value))
        except ValueError:
            try:
                date = parsedate_to_datetime(value)
                return max(0.0, (date - (now or datetime.now(timezone.utc))).total_seconds())
            except (TypeError, ValueError):
                pass
    return min(60.0, 2.0 ** (attempt + 1))


class MetadataClient:
    def __init__(self, root: str, cache: Path, *, timeout: float = 30, refresh: bool = False, cache_only: bool = False,
                 transport=retrieve, sleeper=time.sleep, clock=time.monotonic):
        self.root, self.cache, self.timeout, self.refresh = root, cache, timeout, refresh
        self.cache_only = cache_only
        self.transport, self.sleeper, self.clock = transport, sleeper, clock
        self.lock = threading.Lock()
        self.resume_at = 0.0
        self.stopped = threading.Event()
        self.cached = 0
        self.fetched = 0
        self.cache.mkdir(parents=True, exist_ok=True)

    def await_permission(self):
        while True:
            if self.stopped.is_set():
                raise ArchiveRateLimit("The origin stopped the metadata run; cache is preserved for a later retry.")
            with self.lock:
                delay = self.resume_at - self.clock()
            if delay <= 0:
                return
            self.sleeper(min(delay, 1.0))

    def fetch(self, entry: dict) -> tuple[bytes, str]:
        path = entry['path']
        if not safe_path(path) or not path.lower().endswith('.zip'):
            raise ValueError("Invalid catalog package path")
        url = self.root + path[:-4] + '.txt'
        identity = [entry.get('date'), entry.get('bytes'), entry.get('metadataDate'), entry.get('metadataBytes')]
        cache_path = self.cache / (hashlib.sha256(url.encode()).hexdigest() + '.json')
        if not self.refresh and cache_path.exists():
            try:
                import base64
                cached = json.loads(cache_path.read_text(encoding='utf-8'))
                raw = base64.b64decode(cached['bytes'], validate=True)
                if (cached['url'] == url and cached['identity'] == identity and len(raw) <= 1024 * 1024
                        and hashlib.sha256(raw).hexdigest() == cached['sha256']):
                    with self.lock:
                        self.cached += 1
                    return raw, url
            except (OSError, ValueError, KeyError, TypeError):
                pass
        if self.cache_only:
            raise ValueError('No valid cached TXT for this archive identity; no network request made')
        for attempt in range(3):
            self.await_permission()
            try:
                raw = self.transport(url, 1024 * 1024, self.timeout)
                import base64
                record = {'url': url, 'identity': identity, 'sha256': hashlib.sha256(raw).hexdigest(),
                          'bytes': base64.b64encode(raw).decode(), 'fetchedAt': datetime.now(timezone.utc).isoformat()}
                temporary = cache_path.with_suffix('.tmp')
                temporary.write_text(json.dumps(record, separators=(',', ':')), encoding='utf-8')
                temporary.replace(cache_path)
                with self.lock:
                    self.fetched += 1
                return raw, url
            except urllib.error.HTTPError as error:
                if error.code in (401, 403):
                    error.close()
                    self.stopped.set()
                    raise ArchiveRateLimit(f"Origin refused metadata requests with HTTP {error.code}; no alternate mirror was tried.") from error
                if error.code not in (429, 503) and error.code < 500:
                    error.close()
                    raise
                delay = retry_delay(error.headers.get('Retry-After'), attempt)
                error.close()
                if error.code in (429, 503) and (attempt == 2 or delay > 300):
                    self.stopped.set()
                    raise ArchiveRateLimit(f"Origin rate limit/unavailability requires stopping: HTTP {error.code}, retry after {delay:.0f}s. Resume later from cache.") from error
                if attempt == 2:
                    raise
                with self.lock:
                    self.resume_at = max(self.resume_at, self.clock() + delay)
                print(json.dumps({'event': 'metadata-backoff', 'status': error.code, 'seconds': delay, 'url': url}), flush=True)
            except (TimeoutError, urllib.error.URLError):
                if attempt == 2:
                    raise
                self.sleeper(2 ** (attempt + 1))
        raise RuntimeError("Unreachable metadata retry state")


def enrich_metadata(entry: dict, client: MetadataClient) -> dict:
    raw, url = client.fetch(entry)
    try:
        text, encoding = raw.decode('utf-8'), 'utf-8'
    except UnicodeError:
        text, encoding = raw.decode('cp1252', errors='replace'), 'windows-1252'
    result = enrich_entry(entry, text, url)
    result.update(readmeSha256=hashlib.sha256(raw).hexdigest(), readmeEncoding=encoding, readmeBytes=len(raw))
    return result


def enrich_many(entries: list[dict], paths, client: MetadataClient, workers: int = 4) -> list[dict]:
    if workers not in range(1, 5):
        raise ValueError('Metadata concurrency must be between one and four')
    indices = {entry['path']: index for index, entry in enumerate(entries)}
    errors, tasks = [], []
    for path in dict.fromkeys(paths):
        if path in indices:
            tasks.append(entries[indices[path]])
        else:
            errors.append({'path': path, 'error': 'not in durable index'})
    started, completed = time.monotonic(), 0
    iterator = iter(tasks)
    print(json.dumps({'event': 'metadata-start', 'total': len(tasks), 'workers': workers, 'cache': str(client.cache)}), flush=True)
    with ThreadPoolExecutor(max_workers=workers) as pool:
        active = {pool.submit(enrich_metadata, entry, client): entry for entry in [next(iterator, None) for _ in range(workers)] if entry}
        while active:
            done, _ = wait(active, return_when=FIRST_COMPLETED)
            for future in done:
                entry = active.pop(future)
                try:
                    entries[indices[entry['path']]] = future.result()
                except ArchiveRateLimit:
                    client.stopped.set()
                    for pending in active:
                        pending.cancel()
                    raise
                except (OSError, ValueError) as error:
                    errors.append({'path': entry['path'], 'error': str(error)})
                completed += 1
                if completed % 100 == 0 or completed == len(tasks):
                    print(json.dumps({'event': 'metadata-progress', 'completed': completed, 'total': len(tasks), 'cached': client.cached,
                                      'fetched': client.fetched, 'errors': len(errors), 'elapsedSeconds': round(time.monotonic() - started, 1)}), flush=True)
                following = next(iterator, None)
                if following:
                    active[pool.submit(enrich_metadata, following, client)] = following
    return sorted(errors, key=lambda error: error['path'])


def catalog_json(catalog: dict) -> str:
    # Metadata is untrusted and is embedded into application/json in one-file
    # capsules. Escape '<' regardless of case so no TXT fact can end that script.
    return json.dumps(catalog, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029') + '\n'


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--mirror", choices=MIRRORS, default="youfailit")
    parser.add_argument("--index", type=Path, help="Use an already downloaded fullsort.gz")
    parser.add_argument("--no-enrich", action="store_true")
    parser.add_argument("--enrich-all", action="store_true", help="Read every catalog entry's same-stem TXT; resumable from ignored cache")
    parser.add_argument("--cache-dir", type=Path, default=DEFAULT_CACHE)
    parser.add_argument("--workers", type=int, choices=range(1, 5), default=4)
    parser.add_argument("--timeout", type=float, default=30)
    parser.add_argument("--refresh-cache", action="store_true", help="Refetch TXT even when its archive identity has not changed")
    parser.add_argument("--cache-only", action="store_true", help="Reparse only verified cached index/TXT bytes without any network")
    parser.add_argument("--enrich-path", action="append", default=[], help="Additional exact catalog ZIP path; downloads only its TXT")
    args = parser.parse_args()
    if args.no_enrich and args.enrich_all:
        parser.error('--no-enrich and --enrich-all are mutually exclusive')
    if args.refresh_cache and args.cache_only:
        parser.error('--refresh-cache cannot be used with --cache-only')
    if not 1 <= args.timeout <= 120:
        parser.error('--timeout must be between 1 and 120 seconds')
    if not args.cache_dir.resolve().is_relative_to((ROOT / 'test-results').resolve()):
        parser.error('--cache-dir must remain under ignored test-results; raw TXT is never tracked')
    root = MIRRORS[args.mirror]
    args.cache_dir.mkdir(parents=True, exist_ok=True)
    cached_index = args.cache_dir / ('index-' + args.mirror + '.gz')
    compressed = args.index.read_bytes() if args.index else cached_index.read_bytes() if args.cache_only else retrieve(root + "fullsort.gz", 2 * 1024 * 1024)
    if not args.cache_only:
        cached_index.write_bytes(compressed)
    with gzip.GzipFile(fileobj=__import__('io').BytesIO(compressed)) as stream:
        expanded = stream.read(32 * 1024 * 1024 + 1)
    if len(expanded) > 32 * 1024 * 1024:
        raise ValueError("Expanded fullsort index exceeds 32 MiB")
    entries = parse_index(expanded.decode("latin1"))
    paths = [] if args.no_enrich else [entry['path'] for entry in entries] if args.enrich_all else [*ENRICH, *args.enrich_path]
    client = MetadataClient(root, args.cache_dir, timeout=args.timeout, refresh=args.refresh_cache, cache_only=args.cache_only)
    try:
        errors = enrich_many(entries, paths, client, args.workers)
    except ArchiveRateLimit as error:
        print(json.dumps({'status': 'BLOCKED', 'reason': str(error), 'cache': str(args.cache_dir), 'fetched': client.fetched, 'cached': client.cached}), flush=True)
        return 2
    catalog = {"schema": SCHEMA, "generatedAt": datetime.now(timezone.utc).isoformat(),
               "source": {"kind": "idgames-fullsort", "url": root + "fullsort.gz", "sha256": hashlib.sha256(compressed).hexdigest(), "bytes": len(compressed),
                          "officialMirrorList": "https://www.gamers.org/pub/idgames/README",
                          "metadataTemplate": "https://www.gamers.org/pub/idgames/UPLTEMPL.TXT",
                          "scope": "Doom and Doom II levels plus themes; incoming and newstuff duplicates excluded"},
               "notes": ["Archive date is not necessarily the original release date.", "Unknown fields are null or explicitly unknown; the catalog does not certify compatibility or permission.", "Current official mirrors do not advertise CORS; normal download followed by local import remains available.", "Only metadata is included; game payloads are downloaded only when selected."],
               "enrichment": {"mode": 'all' if args.enrich_all else 'none' if args.no_enrich else 'representative',
                              "requested": len(set(paths)), "inspected": sum(bool(item.get('metadataInspected')) for item in entries),
                              "knownTitles": sum(bool(item.get('title')) for item in entries), "knownAuthors": sum(bool(item.get('author')) for item in entries)},
               "enrichmentErrors": errors, "entries": entries}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(catalog_json(catalog), encoding="utf-8", newline="\n")
    print(json.dumps({"entries": len(entries), "enriched": sum(bool(item.get("metadataInspected")) for item in entries), "errors": errors,
                      "bytes": args.output.stat().st_size, "output": str(args.output)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
