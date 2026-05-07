#!/usr/bin/env python3
"""Standalone parser test.

Validates the parser against real recipe URLs without needing Home Assistant.
Run from the repo root:

    pip install recipe-scrapers requests
    python tests/test_parser.py https://www.example.com/some/recipe

Or with the bundled sample list:

    python tests/test_parser.py --batch tests/sample_urls.txt
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Make the integration importable
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "custom_components"))

import requests  # noqa: E402

from recipe_box.parser import RecipeParseError, parse_recipe_html  # noqa: E402

USER_AGENT = "Mozilla/5.0 (compatible; HomeAssistant-RecipeBox/0.1)"


def parse_one(url: str, *, summary: bool = False) -> int:
    """Parse one URL. Returns 0 on success, 1 on failure."""
    try:
        resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=20)
        resp.raise_for_status()
    except requests.RequestException as err:
        print(f"FETCH FAIL  {url}\n            {err}", file=sys.stderr)
        return 1

    try:
        recipe = parse_recipe_html(resp.text, url)
    except RecipeParseError as err:
        print(f"PARSE FAIL  {url}\n            {err}", file=sys.stderr)
        return 1

    if summary:
        ingredients = recipe.get("recipeIngredient", [])
        steps = recipe.get("recipeInstructions", [])
        print(
            f"OK  {recipe['name'][:60]:<60} "
            f"({len(ingredients):>3} ing, {len(steps):>2} steps)  {url}"
        )
    else:
        print(json.dumps(recipe, indent=2, ensure_ascii=False))
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "url", nargs="?", help="Recipe URL to parse"
    )
    parser.add_argument(
        "--batch",
        type=Path,
        help="File with one URL per line (lines starting with # are skipped)",
    )
    args = parser.parse_args()

    if args.batch:
        urls = [
            line.strip()
            for line in args.batch.read_text().splitlines()
            if line.strip() and not line.startswith("#")
        ]
        failures = 0
        for url in urls:
            failures += parse_one(url, summary=True)
        print(f"\n{len(urls) - failures}/{len(urls)} succeeded")
        return 1 if failures else 0

    if not args.url:
        parser.print_help()
        return 2
    return parse_one(args.url)


if __name__ == "__main__":
    sys.exit(main())
