(() => {
  const TOOL_OBJECT_NAMES = {
    calculator: "Desk calculator",
    timer: "Pocket timer",
    date: "Flip calendar",
    converter: "Ruler & tape",
    currency: "Travel wallet",
    pdf: "Document folder",
    media: "Cassette player",
    "spin-wheel": "Decision wheel",
    "mini-games": "Pocket console"
  };

  let weatherView = "today";

  function decorateToolbox(panel) {
    if (!(panel instanceof HTMLElement)) return;
    const slots = panel.querySelectorAll(".toolbox-slot[data-tool]");
    panel.classList.toggle("world-toolbox-root", slots.length > 0);
    panel.classList.toggle("world-toolbox-tool", slots.length === 0);

    slots.forEach((slot) => {
      const tool = slot.getAttribute("data-tool") || "";
      slot.setAttribute("data-world-object", TOOL_OBJECT_NAMES[tool] || tool);
      const icon = slot.querySelector(".toolbox-slot-icon");
      if (icon && !icon.querySelector(".world-tool-object")) {
        const object = document.createElement("span");
        object.className = `world-tool-object world-tool-object-${tool}`;
        object.setAttribute("aria-hidden", "true");
        icon.textContent = "";
        icon.append(object);
      }
    });

    const toolBody = panel.querySelector(".toolbox-tool-body");
    if (toolBody instanceof HTMLElement) {
      const utility = toolBody.firstElementChild;
      const selected = inferSelectedTool(utility);
      if (selected) panel.dataset.worldTool = selected;
      if (!toolBody.querySelector(":scope > .world-tool-workbench-label")) {
        const label = document.createElement("div");
        label.className = "world-tool-workbench-label";
        label.innerHTML = `<span>${escapeHtml(TOOL_OBJECT_NAMES[selected] || "MUJI utility")}</span><small>picked from the toolbox</small>`;
        toolBody.prepend(label);
      }
    }
  }

  function inferSelectedTool(node) {
    if (!(node instanceof HTMLElement)) return "";
    if (node.classList.contains("spin-wheel-tool")) return "spin-wheel";
    if (node.classList.contains("calculator-tool")) return "calculator";
    if (node.classList.contains("currency-tool")) return "currency";
    if (node.classList.contains("timer-tool")) return "timer";
    if (node.classList.contains("date-tool")) return "date";
    if (node.classList.contains("media-tool")) return "media";
    if (node.querySelector("[data-action='converter-swap']")) return "converter";
    if (node.querySelector("[data-toolbox-field^='pdf-']")) return "pdf";
    if (node.querySelector("[data-action^='mini-game'], .mini-games")) return "mini-games";
    return "";
  }

  function decorateWeather(panel) {
    if (!(panel instanceof HTMLElement)) return;
    panel.classList.add("world-weather-display");
    const main = panel.querySelector(".window-main-view");
    if (!(main instanceof HTMLElement)) return;

    const reading = main.querySelector(".window-current-reading");
    if (reading instanceof HTMLElement) {
      reading.classList.add("world-weather-station");
      if (!reading.querySelector(".weather-device-brand")) {
        const brand = document.createElement("span");
        brand.className = "weather-device-brand";
        brand.textContent = "WEATHER STATION";
        reading.prepend(brand);
        const controls = document.createElement("div");
        controls.className = "weather-device-controls";
        controls.setAttribute("aria-hidden", "true");
        controls.innerHTML = "<i>‹</i><i>●</i><i>›</i>";
        reading.append(controls);
      }
      const text = reading.textContent?.toLowerCase() || "";
      const condition = text.includes("storm") ? "storm" : text.includes("rain") || text.includes("drizzle") ? "rain" : text.includes("clear") || text.includes("sun") ? "clear" : text.includes("fog") ? "fog" : "cloud";
      panel.dataset.weatherCondition = condition;
    }

    const primary = main.querySelector(".window-weather-primary");
    const hourly = main.querySelector(".window-hourly-card");
    const forecast = main.querySelector(".window-forecast");
    const moon = main.querySelector(".window-moon-card");
    if (primary instanceof HTMLElement) primary.dataset.weatherSection = "today";
    if (hourly instanceof HTMLElement) hourly.dataset.weatherSection = "hourly";
    if (forecast instanceof HTMLElement) forecast.dataset.weatherSection = "weekly";
    if (moon instanceof HTMLElement) moon.dataset.weatherSection = "moon";

    if (!main.querySelector(".world-weather-tabs")) {
      const tabs = document.createElement("nav");
      tabs.className = "world-weather-tabs";
      tabs.setAttribute("aria-label", "Weather views");
      tabs.innerHTML = [
        ["today", "Today"],
        ["hourly", "Hourly"],
        ["weekly", "This week"]
      ].map(([id, label]) => `<button type="button" data-weather-view="${id}">${label}</button>`).join("");
      main.prepend(tabs);
    }

    if (!main.querySelector(".world-weather-note")) {
      const note = document.createElement("aside");
      note.className = "world-weather-note";
      note.innerHTML = `<strong>${weatherMemo(panel.dataset.weatherCondition || "cloud")}</strong><span>— Muji</span>`;
      main.append(note);
    }

    applyWeatherView(panel);
  }

  function weatherMemo(condition) {
    if (condition === "rain" || condition === "storm") return "出门记得带伞。";
    if (condition === "clear") return "今天的光很好。";
    if (condition === "fog") return "外面有点朦朦的。";
    return "今天看起来会凉一点。";
  }

  function applyWeatherView(panel) {
    panel.dataset.weatherView = weatherView;
    panel.querySelectorAll("[data-weather-view]").forEach((button) => {
      if (button instanceof HTMLButtonElement) button.classList.toggle("selected", button.dataset.weatherView === weatherView);
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
  }

  function decorate() {
    document.querySelectorAll(".toolbox-panel").forEach(decorateToolbox);
    document.querySelectorAll(".living-window-panel").forEach(decorateWeather);
  }

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("[data-weather-view]") : null;
    if (!(target instanceof HTMLButtonElement)) return;
    weatherView = target.dataset.weatherView || "today";
    const panel = target.closest(".living-window-panel");
    if (panel instanceof HTMLElement) applyWeatherView(panel);
  });

  const observer = new MutationObserver(() => queueMicrotask(decorate));
  const start = () => {
    decorate();
    observer.observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
