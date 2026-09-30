// common.js — small helpers shared by every chart (tooltip, resize, colours).
// Each chart still lives in its own file; this just avoids repeating boilerplate.

const Viz = (() => {
  // Screen technology -> colour. Colour follows the entity, so LCD / LED / OLED
  // keep the same colour in every chart on the page.
  const TECH_ORDER = ["LCD", "LED", "OLED"];
  const TECH_COLOR = { LCD: "var(--series-1)", LED: "var(--series-2)", OLED: "var(--series-3)" };

  // The raw TV file says "LCD (LED)"; the summary files say "LED". Normalise.
  function techName(raw) {
    return raw === "LCD (LED)" ? "LED" : raw;
  }

  const fmt = d3.format(",.0f");

  // ---- Tooltip ----
  const tip = d3.select("#tooltip");
  function showTip(event, html) {
    tip.html(html).style("opacity", 1);
    moveTip(event);
  }
  function moveTip(event) {
    const pad = 14;
    const box = tip.node().getBoundingClientRect();
    let x = event.clientX + pad;
    let y = event.clientY + pad;
    if (x + box.width > window.innerWidth - 8) x = event.clientX - box.width - pad;
    if (y + box.height > window.innerHeight - 8) y = event.clientY - box.height - pad;
    tip.style("left", Math.max(8, x) + "px").style("top", Math.max(8, y) + "px");
  }
  function hideTip() { tip.style("opacity", 0); }

  // ---- Responsive redraw: call fn whenever the container width changes ----
  function onResize(el, fn) {
    let last = el.clientWidth;
    let timer;
    window.addEventListener("resize", () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (el.clientWidth !== last) { last = el.clientWidth; fn(); }
      }, 120);
    });
  }

  // Bar with only the top corners rounded (data end rounded, baseline square).
  function topRoundedRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h);
    return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
  }

  // Load a CSV. Over http(s) this uses d3.csv as normal. When the page is opened
  // straight from disk (file://) the browser blocks fetch, so fall back to the
  // copy of the data in data/embedded-data.js.
  function loadCSV(path, row) {
    if (location.protocol.startsWith("http") || !window.EMBEDDED_CSV || !window.EMBEDDED_CSV[path]) {
      return d3.csv(path, row);
    }
    return Promise.resolve(d3.csvParse(window.EMBEDDED_CSV[path], row));
  }

  return { loadCSV, TECH_ORDER, TECH_COLOR, techName, fmt, showTip, moveTip, hideTip, onResize, topRoundedRect };
})();