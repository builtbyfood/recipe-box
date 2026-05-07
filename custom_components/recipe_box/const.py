"""Constants for the Recipe Box integration."""
from __future__ import annotations

DOMAIN = "recipe_box"

# Config keys
CONF_RECIPES_PATH = "recipes_path"
CONF_DEFAULT_TODO = "default_todo_entity"
CONF_FUZZY_THRESHOLD = "fuzzy_threshold"

DEFAULT_FUZZY_THRESHOLD = 85

# Storage layout
RECIPE_FILENAME = "recipe.json"
HERO_FILENAME = "hero.jpg"
NOTES_FILENAME = "notes.md"

# Custom namespace prefix inside schema.org Recipe JSON for our metadata.
# Underscore prefix keeps it out of schema.org's namespace forever.
META_NAMESPACE = "_recipebox"

# Service names
SERVICE_ADD_FROM_URL = "add_from_url"
SERVICE_ADD_TO_LIST = "add_to_list"
SERVICE_DELETE = "delete"
SERVICE_REFRESH = "refresh"
SERVICE_MARK_COOKED = "mark_cooked"

# Conflict resolution strategies
CONFLICT_ERROR = "error"
CONFLICT_OVERWRITE = "overwrite"
CONFLICT_NEW_COPY = "new_copy"
CONFLICT_SKIP = "skip"
CONFLICT_OPTIONS = [CONFLICT_ERROR, CONFLICT_OVERWRITE, CONFLICT_NEW_COPY, CONFLICT_SKIP]

# HTTP API
API_BASE = "/api/recipe_box"

# Schema version for migrations
SCHEMA_VERSION = 1
