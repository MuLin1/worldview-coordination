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
    def test_skill_generator_entry_remains_visible_before_branch_selection(self):
        parser = SkillGeneratorPlaceholderParser()
        parser.feed(BUILD.read_text(encoding="utf-8"))
        self.assertTrue(parser.placeholder_button_disabled)


if __name__ == "__main__":
    unittest.main()
