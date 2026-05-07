"""Config flow for Recipe Box."""
from __future__ import annotations

from pathlib import Path
from typing import Any

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.data_entry_flow import FlowResult

from .const import (
    CONF_DEFAULT_TODO,
    CONF_FUZZY_THRESHOLD,
    CONF_RECIPES_PATH,
    DEFAULT_FUZZY_THRESHOLD,
    DOMAIN,
)


class RecipeBoxConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Recipe Box."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Handle the initial step."""
        errors: dict[str, str] = {}

        if user_input is not None:
            recipes_path = Path(user_input[CONF_RECIPES_PATH])
            if not recipes_path.is_absolute():
                errors[CONF_RECIPES_PATH] = "must_be_absolute"
            elif recipes_path.exists() and not recipes_path.is_dir():
                errors[CONF_RECIPES_PATH] = "not_a_directory"
            else:
                try:
                    await self.hass.async_add_executor_job(
                        recipes_path.mkdir, 0o755, True, True
                    )
                except OSError:
                    errors[CONF_RECIPES_PATH] = "cannot_create"
                else:
                    await self.async_set_unique_id(str(recipes_path))
                    self._abort_if_unique_id_configured()
                    return self.async_create_entry(
                        title=f"Recipe Box ({recipes_path.name})",
                        data=user_input,
                    )

        schema = vol.Schema(
            {
                vol.Required(
                    CONF_RECIPES_PATH, default="/media/recipes"
                ): str,
                vol.Optional(CONF_DEFAULT_TODO, default=""): str,
                vol.Optional(
                    CONF_FUZZY_THRESHOLD, default=DEFAULT_FUZZY_THRESHOLD
                ): vol.All(vol.Coerce(int), vol.Range(min=50, max=100)),
            }
        )

        return self.async_show_form(
            step_id="user", data_schema=schema, errors=errors
        )
