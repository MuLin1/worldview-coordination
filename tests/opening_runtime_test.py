from pathlib import Path
import json
import unittest
from urllib.parse import urljoin, urlparse


ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "dist" / "V20260728" / "build.html"
OPENING_REGEX = ROOT.parent / "正则" / "regex-开局.json"
CDN_BASE = "https://cdn.jsdelivr.net/gh/MuLin1/worldview-coordination@main/dist/V20260728/"


class OpeningRuntimeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.build = BUILD.read_text(encoding="utf-8")
        cls.loader = json.loads(OPENING_REGEX.read_text(encoding="utf-8"))["replaceString"]

    def test_loader_establishes_remote_base_before_document_write(self):
        self.assertIn(f"var baseUrl = '{CDN_BASE}';", self.loader)
        self.assertIn("var head = '<base href=\"' + baseUrl + '\">", self.loader)
        self.assertLess(self.loader.index("var head = '<base href="), self.loader.index("document.write"))

    def test_build_uses_embedded_document_base_and_imported_species(self):
        self.assertNotIn("window.location.href", self.build)
        self.assertNotIn("vielsaenSpecies", self.build)
        self.assertIn("Object.values(NORMAL_SPECIES)", self.build)
        self.assertIn("Object.values(MYTHIC_SPECIES)", self.build)

    def test_local_startup_resources_resolve_to_existing_files(self):
        self.assertNotIn("url('bg.png')", self.build)
        relative_path = "../../start_equipment_shop.json"
        self.assertIn(f"'{relative_path}'", self.build)
        resolved = urlparse(urljoin(CDN_BASE, relative_path)).path
        repository_relative = resolved.split("/worldview-coordination@main/", 1)[1]
        self.assertTrue((ROOT / repository_relative).is_file())


if __name__ == "__main__":
    unittest.main()
