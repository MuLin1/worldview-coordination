import re
import unittest
from html.parser import HTMLParser
from pathlib import Path


BUILD = Path(__file__).parents[1] / "dist" / "V20260728" / "build.html"


class SkillGeneratorPlaceholderParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.placeholder_button_disabled = False

    def handle_starttag(self, tag, attrs):
        if tag != "button":
            return
        attributes = dict(attrs)
        if attributes.get("data-role") == "skill-tree-generator-placeholder":
            self.placeholder_button_disabled = "disabled" in attributes


class OpeningUiRegressionTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.build = BUILD.read_text(encoding="utf-8")

    def test_skill_generator_entry_remains_visible_before_branch_selection(self):
        parser = SkillGeneratorPlaceholderParser()
        parser.feed(self.build)
        self.assertTrue(parser.placeholder_button_disabled)

    def test_identity_gender_supports_custom_text(self):
        self.assertIn('v-model="character.customGender"', self.build)
        self.assertIn('<option>非二元</option>', self.build)
        self.assertIn('<option>无性别</option>', self.build)
        self.assertIn('<option>自定义</option>', self.build)
        self.assertIn("character.gender === '自定义'", self.build)

    def test_physiology_fields_are_independent_from_identity_gender(self):
        self.assertIn('v-model="character.biologicalSex"', self.build)
        self.assertIn('v-model="character.reproductiveCapability"', self.build)
        self.assertIn('sex: character.biologicalSex', self.build)
        self.assertIn('capability: character.reproductiveCapability', self.build)
        self.assertNotIn("String(character.gender || '').includes('男')", self.build)
        self.assertNotIn("String(character.gender || '').includes('女')", self.build)

    def test_invalid_companion_physiology_cannot_abort_player_save(self):
        self.assertIn('[RPG开局] 同伴生理配置无效', self.build)
        self.assertIn('const companionPhysiology =', self.build)

    def test_modern_map_selection_overrides_shanghai_default(self):
        effective_match = re.search(
            r"function getEffectiveModernSpawn\(\) \{(?P<body>.*?)\n\s*\}",
            self.build,
            re.S,
        )
        self.assertIsNotNone(effective_match)
        effective_body = effective_match.group('body')
        selected_index = effective_body.find('normalizeModernSpawnSelection(selectedModernSpawn.value)')
        forced_index = effective_body.find('isModernSpecialOrigin.value')
        self.assertGreaterEqual(selected_index, 0)
        self.assertGreater(forced_index, selected_index)
        self.assertIn('if (selectedSpawn) return selectedSpawn;', effective_body)

        apply_match = re.search(
            r"function applyModernSpawnSelection\(rawSpawn\) \{(?P<body>.*?)\n\s*\}",
            self.build,
            re.S,
        )
        self.assertIsNotNone(apply_match)
        apply_body = apply_match.group('body')
        self.assertIn("return trySetModernSpawnSelection(rawSpawn, { source: '地图' });", apply_body)
        self.assertNotIn('MODERN_SHILAN_SPAWN', apply_body)


if __name__ == "__main__":
    unittest.main()
