from pathlib import Path
import importlib.util
import unittest


ROOT = Path(__file__).resolve().parents[1]
BUILDER_PATH = ROOT / "tools" / "worldbook" / "high_density_worldbook.py"

SPEC = importlib.util.spec_from_file_location("high_density_worldbook", BUILDER_PATH)
BUILDER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILDER)


class HighDensityWorldbookTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.book = BUILDER.build_high_density_worldbook()
        cls.entries = cls.book["entries"]
        cls.original_entries = cls.book["originalData"]["entries"]

        expected_ids = set()
        for world_id, prefix in (("vielsaen", "V-G"), ("modern", "U-G")):
            map_data = BUILDER.load_json(ROOT / "data" / "dual-world" / f"{world_id}-map.json")
            expected_ids.update(node["id"] for node in map_data["nodes"])
        for world_id, prefix in (("vielsaen", "V-C"), ("modern", "U-C")):
            roles = BUILDER.load_json(
                ROOT / "data" / "dual-world" / f"companions-{world_id}.roles.json"
            )
            expected_ids.update(role["id"] for role in roles)
        monster_lore = BUILDER.load_json(
            ROOT / "data" / "dual-world" / "modern-monster-integration.json"
        )
        expected_ids.update(entry["id"] for entry in monster_lore["entries"])
        cls.expected_ids = expected_ids

    def test_every_generated_entry_has_runtime_trigger_keywords(self):
        generated = {
            entry["extensions"]["worldbook_meta"]["id"]: entry
            for entry in self.entries.values()
            if entry.get("extensions", {}).get("worldbook_meta", {}).get("id")
            in self.expected_ids
        }
        self.assertEqual(set(generated), self.expected_ids)
        for entry_id, entry in generated.items():
            with self.subTest(entry_id=entry_id):
                self.assertTrue(entry.get("key"), "top-level key is what SillyTavern scans")
                self.assertIn(entry_id, entry["key"])
                self.assertFalse(entry.get("constant", False))
                self.assertFalse(entry.get("disable", False))
                self.assertEqual(
                    entry["extensions"]["worldbook_meta"].get("keywords"),
                    entry["key"],
                )

    def test_generated_entries_are_mirrored_in_original_data(self):
        originals = {entry["id"]: entry for entry in self.original_entries}
        generated_uids = [
            entry["uid"]
            for entry in self.entries.values()
            if entry.get("extensions", {}).get("worldbook_meta", {}).get("id")
            in self.expected_ids
        ]
        for uid in generated_uids:
            with self.subTest(uid=uid):
                self.assertIn(uid, originals)
                self.assertTrue(originals[uid].get("keys"))
                self.assertTrue(originals[uid].get("enabled"))


if __name__ == "__main__":
    unittest.main()
