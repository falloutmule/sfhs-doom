import importlib.util
from pathlib import Path
import json
import tempfile
import threading
import time
import unittest
import urllib.error

ROOT = Path(__file__).resolve().parents[1]
TEST_CACHE = ROOT / 'test-results' / 'forge-catalog' / 'tests'
TEST_CACHE.mkdir(parents=True, exist_ok=True)
SPEC = importlib.util.spec_from_file_location("forge_catalog", ROOT / "tools/update-forge-catalog.py")
catalog = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(catalog)


class CatalogTests(unittest.TestCase):
    def test_index_scopes_deduplicates_and_keeps_unknowns(self):
        rows = catalog.parse_index("\n".join([
            "2026/10/01 128 levels/doom/a-c/demo.zip",
            "2026/10/01 128 levels/doom/a-c/demo.zip",
            "2026/10/01 128 newstuff/demo.zip",
            "2026/10/01 128 incoming/demo.zip",
            "2026/10/01 128 levels/doom2/a-c/../../bad.zip",
            "2026/10/01 128 levels/doom2/a-c/demo.txt",
            "2026/10/01 128 levels/hexen/a-c/demo.zip",
        ]))
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["family"], "doom")
        self.assertIsNone(rows[0]["title"])
        self.assertIsNone(rows[0]["mapCount"])
        self.assertEqual(rows[0]["permission"], "unclear")

    def test_unsafe_paths_and_safe_capitalized_theme(self):
        for path in ("../x.zip", "/x.zip", "x/../x.zip", "x//x.zip", "x\\x.zip", "x/%2e.zip", "x/a?b.zip", "x/a b.zip"):
            self.assertFalse(catalog.safe_path(path), path)
        self.assertTrue(catalog.safe_path("themes/TeamTNT/icarus/icarus.zip"))

    def test_original_text_evidence_does_not_certify_compatibility(self):
        entry = {"path": "levels/doom2/a-c/test.zip", "mapCount": None, "family": "doom2", "permission": "unclear", "compatibility": "unknown"}
        text = "Title : Small Test\nAuthor : Mapper\nRelease date :\nAdvanced engine needed : Chocolate Doom\nNew levels : 1\nMap # : MAP01\n* Copyright / Permissions *\nYou MAY distribute this file, provided you include this text file, with no modifications.\n"
        result = catalog.enrich_entry(entry, text, "https://youfailit.net/pub/idgames/test.txt")
        self.assertEqual(result["title"], "Small Test")
        self.assertIsNone(result["releaseDateText"])
        self.assertEqual(result["mapCount"], 1)
        self.assertEqual(result["type"], "single-map")
        self.assertEqual(result["compatibility"], "likely-compatible")
        self.assertEqual(result["permission"], "redistributable")
        self.assertTrue(result["originalTextRequired"])

    def test_denial_wins_and_advanced_engine_rejected(self):
        entry = {"mapCount": None, "family": None, "compatibility": "unknown", "permission": "unclear"}
        text = "Advanced engine needed : GZDoom\nYou MAY distribute this file. You MAY NOT distribute this file in modified form."
        result = catalog.enrich_entry(entry, text, "https://example.invalid/text")
        self.assertEqual(result["permission"], "private")
        self.assertEqual(result["compatibility"], "unsupported")

    def test_late_map_title_is_not_package_title(self):
        result = catalog.enrich_entry({"mapCount": None}, "Introduction\n" * 300 + "Title: Map One\nAuthor: Map Author\n", "https://example.invalid/text")
        self.assertIsNone(result["title"])
        self.assertIsNone(result["author"])

    def test_sidecar_identity_is_taken_from_durable_index(self):
        result = catalog.parse_index('2026/10/01 128 levels/doom/a-c/demo.zip\n2026/10/02 64 levels/doom/a-c/demo.txt')[0]
        self.assertEqual(result['metadataDate'], '2026-10-02')
        self.assertEqual(result['metadataBytes'], 64)

    def test_resume_cache_verifies_identity_and_raw_bytes(self):
        calls = []
        def transport(url, limit, timeout):
            calls.append(url)
            return b'Title: Exact bytes\r\nAuthor: Mapper\r\n'
        entry = {'path': 'levels/doom2/a-c/example.zip', 'bytes': 20, 'date': '2026-10-01', 'mapCount': None}
        with tempfile.TemporaryDirectory(dir=TEST_CACHE) as folder:
            client = catalog.MetadataClient(catalog.MIRRORS['youfailit'], Path(folder), transport=transport)
            one = catalog.enrich_metadata(entry, client)
            two = catalog.enrich_metadata(entry, client)
            self.assertEqual(one, two)
            self.assertEqual(len(calls), 1)
            self.assertEqual(client.cached, 1)
            changed = dict(entry, metadataDate='2026-10-02')
            catalog.enrich_metadata(changed, client)
            self.assertEqual(len(calls), 2)
            cache_file = next(Path(folder).glob('*.json'))
            data = json.loads(cache_file.read_text())
            data['sha256'] = '0' * 64
            cache_file.write_text(json.dumps(data))
            catalog.enrich_metadata(changed, client)
            self.assertEqual(len(calls), 3)
            self.assertTrue(all(url.endswith('/example.txt') for url in calls))

    def test_full_enrichment_is_bounded_to_four_requests_and_reports_missing_txt(self):
        active = 0
        peak = 0
        lock = threading.Lock()
        def transport(url, limit, timeout):
            nonlocal active, peak
            with lock:
                active += 1
                peak = max(peak, active)
            time.sleep(.01)
            with lock:
                active -= 1
            if url.endswith('/3.txt'):
                raise urllib.error.HTTPError(url, 404, 'Not Found', {}, None)
            return b'Title: Bounded test\nAuthor: Mapper\n'
        entries = [{'path': f'levels/doom2/a-c/{i}.zip', 'bytes': 20, 'date': '2026-10-01', 'mapCount': None} for i in range(12)]
        with tempfile.TemporaryDirectory(dir=TEST_CACHE) as folder:
            client = catalog.MetadataClient(catalog.MIRRORS['youfailit'], Path(folder), transport=transport)
            errors = catalog.enrich_many(entries, [entry['path'] for entry in entries], client, 4)
            self.assertLessEqual(peak, 4)
            self.assertGreater(peak, 1)
            self.assertEqual(len(errors), 1)
            self.assertEqual(sum(bool(entry.get('metadataInspected')) for entry in entries), 11)
            self.assertFalse(entries[3].get('metadataInspected', False))

    def test_rate_limit_respects_retry_after_and_stops_persistent_refusal(self):
        elapsed = [0.0]
        sleeps = []
        def sleep(seconds):
            sleeps.append(seconds)
            elapsed[0] += seconds
        def transport(url, limit, timeout):
            raise urllib.error.HTTPError(url, 429, 'Too Many Requests', {'Retry-After': '3'}, None)
        entry = {'path': 'levels/doom2/a-c/example.zip', 'bytes': 20, 'date': '2026-10-01'}
        with tempfile.TemporaryDirectory(dir=TEST_CACHE) as folder:
            client = catalog.MetadataClient(catalog.MIRRORS['youfailit'], Path(folder), transport=transport, sleeper=sleep, clock=lambda: elapsed[0])
            with self.assertRaises(catalog.ArchiveRateLimit):
                client.fetch(entry)
            self.assertGreaterEqual(sum(sleeps), 6)
            self.assertTrue(client.stopped.is_set())
        self.assertEqual(catalog.retry_delay('60', 0), 60)

    def test_transport_refuses_payload_urls_and_unknown_origins(self):
        with self.assertRaisesRegex(ValueError, 'Only same-stem TXT'):
            catalog.retrieve(catalog.MIRRORS['youfailit'] + 'game.zip', 10)
        with self.assertRaisesRegex(ValueError, 'approved official mirror'):
            catalog.retrieve('https://example.invalid/game.txt', 10)

    def test_tracked_catalog_has_bounded_facts_and_cannot_close_json_script(self):
        result = catalog.enrich_entry({'mapCount': None}, 'Title: ' + 'A' * 600 + '\nAuthor: Mapper\nMap #: MAP01-MAP04, MAP31\n', 'https://example.invalid/example.txt')
        self.assertIsNone(result['title'])
        self.assertIsNone(result['mapCount'])
        serialized = catalog.catalog_json({'title': '</SCRIPT><script>bad()</script>'})
        self.assertNotIn('<', serialized)
        self.assertEqual(json.loads(serialized)['title'], '</SCRIPT><script>bad()</script>')
        unknown = catalog.enrich_entry({'mapCount': None}, 'Title: ???\nAuthor: Unknown\n', 'https://example.invalid/example.txt')
        self.assertIsNone(unknown['title'])
        self.assertIsNone(unknown['author'])

    def test_optional_and_conflicting_engine_mentions_are_not_false_requirements(self):
        entry = {'mapCount': None, 'compatibility': 'unknown'}
        optional = catalog.enrich_entry(entry, 'Advanced engine needed: None (tested on GZDoom)', 'https://example.invalid/a.txt')
        mixed = catalog.enrich_entry(entry, 'Advanced engine needed: ZDoom / Vanilla Doom', 'https://example.invalid/b.txt')
        required = catalog.enrich_entry(entry, 'Advanced engine needed: Limit-removing', 'https://example.invalid/c.txt')
        self.assertEqual(optional['compatibility'], 'likely-compatible')
        self.assertEqual(mixed['compatibility'], 'unknown')
        self.assertEqual(required['compatibility'], 'unsupported')

    def test_cache_only_cannot_make_a_network_request(self):
        def transport(*args):
            self.fail('Cache-only processing attempted a network request')
        with tempfile.TemporaryDirectory(dir=TEST_CACHE) as folder:
            client = catalog.MetadataClient(catalog.MIRRORS['youfailit'], Path(folder), cache_only=True, transport=transport)
            with self.assertRaisesRegex(ValueError, 'No valid cached TXT'):
                client.fetch({'path': 'levels/doom2/a-c/example.zip'})

    def test_explicit_game_and_package_facts_do_not_confuse_final_doom_with_doom_one(self):
        base = {'family': None, 'mapCount': None}
        final = catalog.enrich_entry(base, 'Game: Final Doom (TNT)\nOther files required: TNT.WAD\nNew levels: 1\n', 'https://example.invalid/a.txt')
        other = catalog.enrich_entry(base, 'Game: Doom 64\n', 'https://example.invalid/b.txt')
        tc = catalog.enrich_entry(base, 'Primary purpose: Total conversion\nNew levels: None\n', 'https://example.invalid/c.txt')
        self.assertEqual(final['family'], 'doom2')
        self.assertEqual(final['requiredFiles'], 'TNT.WAD')
        self.assertIsNone(other['family'])
        self.assertEqual(tc['mapCount'], 0)
        self.assertEqual(tc['type'], 'total-conversion')


if __name__ == "__main__":
    unittest.main()
