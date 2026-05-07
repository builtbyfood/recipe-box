"""Recipe Box: a recipe ingester for Home Assistant.

Recipes live as schema.org Recipe JSON-LD files on a folder you control
(typically an SMB share so other tools can read them). This integration
parses recipe URLs, manages the cache, and exposes services + an HTTP API
for the Lovelace card.
"""
from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryNotReady

from .const import CONF_RECIPES_PATH, DOMAIN
from .http_api import async_register_http_views
from .services import async_register_services
from .storage import RecipeStorage

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Recipe Box from a config entry."""
    recipes_path = Path(entry.data[CONF_RECIPES_PATH])

    try:
        await hass.async_add_executor_job(recipes_path.mkdir, 0o755, True, True)
    except OSError as err:
        raise ConfigEntryNotReady(
            f"Cannot access recipes_path {recipes_path}: {err}"
        ) from err

    storage = RecipeStorage(hass, recipes_path, entry)
    await storage.async_load()
    await storage.async_start_watcher()

    domain_data = hass.data.setdefault(DOMAIN, {})
    domain_data[entry.entry_id] = storage

    async_register_http_views(hass, storage)

    # Services are domain-scoped, register only once
    if len(domain_data) == 1:
        await async_register_services(hass, storage)

    _LOGGER.info(
        "Recipe Box loaded with %d recipes from %s",
        len(storage.recipes),
        recipes_path,
    )
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    storage: RecipeStorage = hass.data[DOMAIN].pop(entry.entry_id)
    await storage.async_stop_watcher()
    return True
