from pathlib import Path
import json
import unittest
from urllib.parse import urljoin, urlparse


ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "dist" / "V20260728" / "build.html"
OPENING_REGEX = ROOT.parent / "正则" / "regex-开局.json"
CDN_PATH = "/dist/V20260728/"


class OpeningRuntimeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.build = BUILD.read_text(encoding="utf-8")
        cls.loader = json.loads(OPENING_REGEX.read_text(encoding="utf-8"))["replaceString"]

    def test_loader_resolves_current_main_commit_before_document_write(self):
        self.assertIn(
            "https://api.github.com/repos/MuLin1/worldview-coordination/commits/main",
            self.loader,
        )
        self.assertIn("commit.sha", self.loader)
        self.assertIn("var head = '<base href=\"' + baseUrl + '\">", self.loader)
        self.assertLess(self.loader.index("var head = '<base href="), self.loader.index("document.write"))
        self.assertNotIn("worldview-coordination@main/dist", self.loader)

    def test_build_uses_embedded_document_base_and_imported_species(self):
        self.assertNotIn("window.location.href", self.build)
        self.assertNotIn("vielsaenSpecies", self.build)
        self.assertIn("Object.values(NORMAL_SPECIES)", self.build)
        self.assertIn("Object.values(MYTHIC_SPECIES)", self.build)

    def test_vielsaen_opening_exposes_level_1_through_60(self):
        self.assertIn("QUICK_START_LEVELS", self.build)
        self.assertIn('type="range" min="1" :max="VIELSAEN_MAX_START_LEVEL"', self.build)
        self.assertIn("Math.min(VIELSAEN_MAX_START_LEVEL", self.build)
        self.assertNotIn("levels.add(Math.max(1, Number(race.startLevel)", self.build)

    def test_vielsaen_species_cost_is_deducted_from_rp(self):
        self.assertIn("const selectedRaceForCost = availableRaces.value.find", self.build)
        self.assertIn("rp -= Number(selectedRaceForCost.cost) || 0", self.build)
        self.assertNotIn(
            "if (!isVielsaenWorldview.value) {\n"
            "                        const r = availableRaces.value.find",
            self.build,
        )

    def test_build_uses_tested_species_adapter_and_numeric_state_effects(self):
        self.assertIn(
            "import { NORMAL_SPECIES, MYTHIC_SPECIES } from './generated/species-config.js';",
            self.build,
        )
        self.assertNotIn(
            "import { NORMAL_SPECIES, MYTHIC_SPECIES, REPLACEMENT_BONDS } from './five-world-config.js';",
            self.build,
        )
        self.assertIn("adaptSpeciesForOpening", self.build)
        self.assertIn("buildSpeciesAttributeTendencyEffect", self.build)
        self.assertIn("buildSpeciesTraitStateEffect", self.build)
        self.assertNotIn(
            "bonuses: { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 },\n"
            "                        buffs: [],",
            self.build,
        )

    def test_local_startup_resources_resolve_to_existing_files(self):
        self.assertNotIn("url('bg.png')", self.build)
        relative_path = "../../start_equipment_shop.json"
        self.assertIn(f"'{relative_path}'", self.build)
        commit_base = f"https://cdn.jsdelivr.net/gh/MuLin1/worldview-coordination@{'a' * 40}{CDN_PATH}"
        resolved = urlparse(urljoin(commit_base, relative_path)).path
        repository_relative = resolved.split(f"/worldview-coordination@{'a' * 40}/", 1)[1]
        self.assertTrue((ROOT / repository_relative).is_file())


if __name__ == "__main__":
    unittest.main()
