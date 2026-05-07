/**
 * Cook view — distraction-free step-by-step UI.
 *
 * Designed for greasy-fingers use on a phone or wall-mounted tablet:
 * - Big text
 * - Wake lock keeps the screen on while cooking
 * - Auto-detects step durations ("bake 25 min") and offers timer.start
 * - Ingredient checklist visible at top
 */
import { LitElement, css, html, type TemplateResult, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { HomeAssistant, Recipe } from "../types.js";
import type { RecipeBoxApi } from "../utils/api.js";
import { extractStepDuration } from "../utils/format.js";

@customElement("recipe-box-cook-view")
export class CookView extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) recipe?: Recipe;
  @property() slug = "";
  @property({ attribute: false }) api?: RecipeBoxApi;

  @state() private _stepIndex = 0;
  @state() private _checked: Set<number> = new Set();
  @state() private _wakeLockHeld = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _wakeLock: any = null;

  connectedCallback(): void {
    super.connectedCallback();
    void this._acquireWakeLock();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._releaseWakeLock();
  }

  private async _acquireWakeLock(): Promise<void> {
    try {
      const nav = navigator as Navigator & {
        wakeLock?: { request(type: "screen"): Promise<unknown> };
      };
      if (nav.wakeLock?.request) {
        this._wakeLock = await nav.wakeLock.request("screen");
        this._wakeLockHeld = true;
      }
    } catch (err) {
      console.warn("Could not acquire wake lock:", err);
    }
  }

  private _releaseWakeLock(): void {
    if (this._wakeLock) {
      void this._wakeLock.release?.();
      this._wakeLock = null;
      this._wakeLockHeld = false;
    }
  }

  private _toggleIngredient(i: number): void {
    if (this._checked.has(i)) this._checked.delete(i);
    else this._checked.add(i);
    this._checked = new Set(this._checked);
  }

  private _next(): void {
    if (!this.recipe) return;
    if (this._stepIndex < this.recipe.recipeInstructions.length - 1) {
      this._stepIndex++;
    } else {
      // Last step → mark cooked
      void this._finish();
    }
  }

  private _prev(): void {
    if (this._stepIndex > 0) this._stepIndex--;
  }

  private async _finish(): Promise<void> {
    if (this.api) {
      try {
        await this.api.markCooked(this.slug);
      } catch (err) {
        console.warn(err);
      }
    }
    this.dispatchEvent(
      new CustomEvent("cooking-finished", { bubbles: true, composed: true })
    );
  }

  private _startTimer(minutes: number, name: string): void {
    // Find a timer.* entity to use, or fire a notify
    const timerEntities = Object.keys(this.hass.states).filter((id) =>
      id.startsWith("timer.")
    );
    if (timerEntities.length > 0) {
      // Use the first timer (user can configure a dedicated kitchen timer)
      void this.hass.callService(
        "timer",
        "start",
        { duration: `00:${String(minutes).padStart(2, "0")}:00` },
        { entity_id: timerEntities[0] }
      );
    } else {
      // Fallback: persistent_notification with the duration
      void this.hass.callService("persistent_notification", "create", {
        title: "Recipe timer",
        message: `${name}: ${minutes} minutes`,
      });
    }
  }

  protected render(): TemplateResult {
    if (!this.recipe) return html`<div class="loading">Loading...</div>`;
    const r = this.recipe;
    const total = r.recipeInstructions.length;
    const step = r.recipeInstructions[this._stepIndex];
    const duration = extractStepDuration(step?.text ?? "");
    const isLast = this._stepIndex === total - 1;

    return html`
      <div class="cook">
        <div class="ingredients-strip">
          <details>
            <summary>
              Ingredients
              <span class="counter">
                ${this._checked.size}/${r.recipeIngredient.length}
              </span>
            </summary>
            <ul>
              ${r.recipeIngredient.map(
                (i, idx) => html`<li
                  class=${this._checked.has(idx) ? "checked" : ""}
                  @click=${() => this._toggleIngredient(idx)}
                >
                  <ha-icon
                    icon=${this._checked.has(idx)
                      ? "mdi:checkbox-marked-circle"
                      : "mdi:checkbox-blank-circle-outline"}
                  ></ha-icon>
                  <span>${i}</span>
                </li>`
              )}
            </ul>
          </details>
        </div>

        <div class="step">
          <div class="step-meta">
            Step ${this._stepIndex + 1} of ${total}
          </div>
          <div class="step-text">${step?.text}</div>
          ${duration
            ? html`<button class="timer-btn" @click=${() => this._startTimer(duration, `Step ${this._stepIndex + 1}`)}>
                <ha-icon icon="mdi:timer-outline"></ha-icon>
                Start ${duration}-minute timer
              </button>`
            : nothing}
        </div>

        <div class="progress">
          <div class="bar" style="width: ${((this._stepIndex + 1) / total) * 100}%"></div>
        </div>

        <div class="nav">
          <button
            class="nav-btn"
            ?disabled=${this._stepIndex === 0}
            @click=${this._prev}
          >
            <ha-icon icon="mdi:chevron-left"></ha-icon> Previous
          </button>
          <button class="nav-btn primary" @click=${this._next}>
            ${isLast ? "Finish" : "Next"}
            <ha-icon icon=${isLast ? "mdi:check" : "mdi:chevron-right"}></ha-icon>
          </button>
        </div>

        ${this._wakeLockHeld
          ? html`<div class="wake-indicator" title="Screen will stay on">
              <ha-icon icon="mdi:lightbulb-on-outline"></ha-icon>
            </div>`
          : nothing}
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }
    .cook {
      padding: 16px;
      min-height: 60vh;
      display: flex;
      flex-direction: column;
    }
    .ingredients-strip {
      margin-bottom: 16px;
    }
    .ingredients-strip details {
      background: var(--secondary-background-color);
      border-radius: 12px;
      padding: 12px 16px;
    }
    .ingredients-strip summary {
      cursor: pointer;
      font-weight: 500;
      display: flex;
      justify-content: space-between;
    }
    .counter {
      color: var(--secondary-text-color);
      font-weight: 400;
      font-size: 0.9em;
    }
    .ingredients-strip ul {
      list-style: none;
      padding: 0;
      margin: 12px 0 0;
    }
    .ingredients-strip li {
      padding: 8px 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ingredients-strip li.checked {
      text-decoration: line-through;
      color: var(--secondary-text-color);
    }
    .ingredients-strip li ha-icon {
      color: var(--primary-color);
    }
    .step {
      flex: 1;
      padding: 24px 8px;
    }
    .step-meta {
      font-size: 0.9em;
      color: var(--secondary-text-color);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 16px;
    }
    .step-text {
      font-size: 1.5em;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    @media (max-width: 600px) {
      .step-text {
        font-size: 1.25em;
      }
    }
    .timer-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--primary-color);
      color: var(--text-primary-color);
      border: 0;
      border-radius: 12px;
      padding: 12px 20px;
      cursor: pointer;
      font-family: inherit;
      font-size: 1em;
    }
    .progress {
      height: 4px;
      background: var(--divider-color);
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 16px;
    }
    .progress .bar {
      height: 100%;
      background: var(--primary-color);
      transition: width 0.3s;
    }
    .nav {
      display: flex;
      gap: 12px;
    }
    .nav-btn {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 16px;
      border-radius: 12px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
      font-family: inherit;
      font-size: 1.1em;
    }
    .nav-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .nav-btn.primary {
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-color: var(--primary-color);
    }
    .wake-indicator {
      position: absolute;
      top: 8px;
      right: 8px;
      color: var(--accent-color, var(--primary-color));
      opacity: 0.6;
      pointer-events: none;
    }
    .loading {
      padding: 48px;
      text-align: center;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "recipe-box-cook-view": CookView;
  }
}
