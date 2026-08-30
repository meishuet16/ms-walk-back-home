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

  const WEATHER_MEMOS = {
    storm: [
      "雷声靠近的时候，就晚一点再出门。",
      "今天的云有点凶。伞要带，脚步也慢一点。",
      "如果外面开始轰隆隆，就先陪我待一会儿。",
      "会打雷。不要为了赶路把自己淋湿。"
    ],
    rain: [
      "出门记得带伞。",
      "今天适合把伞塞进包里。",
      "路会湿。走慢一点，不用赶。",
      "雨大概会来。鞋子别挑太容易进水的。",
      "回来以后，记得把伞晾开。"
    ],
    clear: [
      "今天的光很好。",
      "太阳出来了。窗边应该会暖暖的。",
      "天气很好，适合绕一点远路回家。",
      "今天应该晒得干衣服。",
      "外面很亮。记得喝水。"
    ],
    fog: [
      "外面有点朦朦的。",
      "今天看不太远，走路慢一点。",
      "雾把远处藏起来了。等它散一点也没关系。",
      "空气白白的。过马路要看清楚一点。"
    ],
    snow: [
      "外面很冷。把自己包暖一点。",
      "今天地上可能会滑，慢慢走。",
      "如果真的下雪了，回来告诉我是什么样子。"
    ],
    cloud: [
      "今天的天有点安静。",
      "云很多，不过也不一定是坏天气。",
      "今天没有很晒，走出去应该刚刚好。",
      "天空灰灰的。带件薄外套也不错。",
      "这种天气，很适合慢慢走回家。"
    ]
  };

  let weatherView = "today";
  const lastMemoByCondition = new Map();

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
      const condition = text.includes("storm") || text.includes("thunder") ? "storm"
        : text.includes("snow") ? "snow"
          : text.includes("rain") || text.includes("drizzle") || text.includes("shower") ? "rain"
            : text.includes("clear") || text.includes("sun") ? "clear"
              : text.includes("fog") || text.includes("mist") ? "fog"
                : "cloud";
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

    const memoCondition = panel.dataset.weatherCondition || "cloud";
    let note = main.querySelector(".world-weather-note");
    if (!(note instanceof HTMLElement)) {
      note = document.createElement("aside");
      note.className = "world-weather-note";
      main.append(note);
    }
    if (note.dataset.weatherCondition !== memoCondition || !note.querySelector("strong")) {
      note.dataset.weatherCondition = memoCondition;
      note.innerHTML = `<strong>${escapeHtml(weatherMemo(memoCondition))}</strong><span>— Muji</span>`;
    }

    applyWeatherView(panel);
  }

  function weatherMemo(condition) {
    const options = WEATHER_MEMOS[condition] || WEATHER_MEMOS.cloud;
    const previous = lastMemoByCondition.get(condition);
    const candidates = options.length > 1 ? options.filter((memo) => memo !== previous) : options;
    const memo = candidates[Math.floor(Math.random() * candidates.length)] || options[0];
    lastMemoByCondition.set(condition, memo);
    return memo;
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
