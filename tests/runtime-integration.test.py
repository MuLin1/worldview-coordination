from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist" / "V20260728"
ACTIVE = [
    DIST / "build.html",
    DIST / "helper-calculator.js",
    DIST / "external-status-bar.js",
    DIST / "mobile-phone.js",
    DIST / "bootom-status-bar.html",
    DIST / "auto-fix.js",
    ROOT / "vielsaen_map.html",
    ROOT / "vielsaen_mapdata.js",
    ROOT / "modern_map.html",
    ROOT / "modern_mapdata.js",
]


class RuntimeIntegrationTests(unittest.TestCase):
    def test_active_runtime_has_no_retired_world_names_or_ids(self):
        retired_names = ("琥珀之剑", "屠龙与都市日常", "屠龙与惊悚都市日常", "惊悚乐园")
        retired_ids = re.compile(r"""(?<![\w-])(?:amber|dragon)(?![\w-])""", re.I)
        for path in ACTIVE:
            text = path.read_text(encoding="utf-8")
            for name in retired_names:
                self.assertNotIn(name, text, f"{name} remains in {path}")
            self.assertIsNone(retired_ids.search(text), f"retired ID remains in {path}")

    def test_ui_consumes_shared_runtime_and_exact_worlds(self):
        build = (DIST / "build.html").read_text(encoding="utf-8")
        mobile = (DIST / "mobile-phone.js").read_text(encoding="utf-8")
        calculator = (DIST / "helper-calculator.js").read_text(encoding="utf-8")
        status = (DIST / "external-status-bar.js").read_text(encoding="utf-8")
        self.assertIn("REPLACEMENT_BONDS", build)
        self.assertIn("NORMAL_SPECIES", build)
        self.assertIn("id: 'vielsaen'", mobile)
        self.assertIn("id: 'modern'", mobile)
        self.assertIn("DNFFiveWorldMvu.advanceMvuState", calculator)
        self.assertIn("renderPhysiologySummary", status)
        self.assertIn("renderPhysiologySummary(friendData.生理档案)", mobile)
        self.assertIn("consumeReproductionRequests(statData)", calculator)
        self.assertIn("settlePendingBirths(statData)", calculator)
        self.assertLess(
            calculator.index("consumeReproductionRequests(statData)"),
            calculator.index("advanceMvuState(statData, fiveWorldDate)"),
        )
        self.assertLess(
            calculator.index("advanceMvuState(statData, fiveWorldDate)"),
            calculator.index("settlePendingBirths(statData)"),
        )

    def test_runtime_imports_event_bridge(self):
        calculator = (DIST / "helper-calculator.js").read_text(encoding="utf-8")
        self.assertIn("from './five-world-event-bridge.js'", calculator)
        self.assertIn("consumeReproductionRequests", calculator)
        self.assertIn("settlePendingBirths", calculator)

    def test_new_maps_replace_old_files(self):
        for name in ("amber_sword_worldmap.html", "amber_sword_mapdata.js", "dragon_map.html", "dragon_mapdata.js"):
            self.assertFalse((ROOT / name).exists())
        self.assertIn("vielsaen_map.html", (DIST / "build.html").read_text(encoding="utf-8"))
        self.assertIn("modern_map.html", (DIST / "build.html").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
