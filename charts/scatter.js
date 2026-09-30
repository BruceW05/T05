// scatter.js — energy consumption vs star rating, one dot per brand/technology/size group.

(function () {
  const el = document.getElementById("scatter");
  const legendEl = document.getElementById("scatter-legend");
  const hidden = new Set();   // technologies toggled off via the legend

  const cap = s => s.replace(/\b\w/g, c => c.toUpperCase());

  const cfg = DATA.scatter;   // file path + column names live in loaded.js
  const col = cfg.columns;

  Viz.loadCSV(cfg.file, d => ({
    brand: cap(d[col.brand]),
    tech: Viz.techName(d[col.tech]),
    size: +d[col.size],
    energy: +d[col.energy],
    stars: +d[col.stars],
    count: +d[col.count]
  })).then(data => {
    // Draw the rarer OLED dots last so they are not buried under LED dots
    data.sort((a, b) => Viz.TECH_ORDER.indexOf(a.tech) - Viz.TECH_ORDER.indexOf(b.tech))
        .sort((a, b) => (a.tech === "OLED") - (b.tech === "OLED"));

    // Legend doubles as a filter
    const counts = d3.rollup(data, v => v.length, d => d.tech);
    const legend = d3.select(legendEl);
    legend.append("span").attr("class", "legend-title").text("Screen technology:");
    legend.selectAll("button").data(Viz.TECH_ORDER).join("button")
      .attr("type", "button")
      .attr("aria-pressed", "true")
      .html(t => `<span class="swatch" style="background:${Viz.TECH_COLOR[t]}"></span>${t} <span style="color:var(--text-muted)">(${counts.get(t)})</span>`)
      .on("click", function (event, t) {
        hidden.has(t) ? hidden.delete(t) : hidden.add(t);
        d3.select(this).attr("aria-pressed", !hidden.has(t));
        draw();
      });

    function draw() {
      el.innerHTML = "";
      const W = el.clientWidth;
      const H = Math.min(480, Math.max(300, W * 0.55));
      const m = { top: 12, right: 12, bottom: 46, left: 60 };
      const visible = data.filter(d => !hidden.has(d.tech));

      const svg = d3.select(el).append("svg")
        .attr("width", W).attr("height", H)
        .attr("role", "img")
        .attr("aria-label", "Scatter plot of annual energy consumption against energy star rating for TVs. Higher star ratings tend to use less energy.");

      // Fixed domains so toggling a technology doesn't rescale the axes
      const x = d3.scaleLinear().domain([1.5, 8.5]).range([m.left, W - m.right]);
      const y = d3.scaleLinear().domain([0, d3.max(data, d => d.energy)]).nice()
        .range([H - m.bottom, m.top]);

      svg.append("g").attr("class", "grid")
        .attr("transform", `translate(${m.left},0)`)
        .call(d3.axisLeft(y).ticks(6).tickSize(-(W - m.left - m.right)).tickFormat(""));

      svg.append("g").attr("class", "axis")
        .attr("transform", `translate(${m.left},0)`)
        .call(d3.axisLeft(y).ticks(6).tickFormat(d3.format(",")))
        .call(g => g.select(".domain").remove());

      svg.append("g").attr("class", "axis")
        .attr("transform", `translate(0,${H - m.bottom})`)
        .call(d3.axisBottom(x).ticks(7).tickFormat(d => d + "★"));

      svg.append("text").attr("class", "axis-label")
        .attr("x", (m.left + W - m.right) / 2).attr("y", H - 6)
        .attr("text-anchor", "middle").text("Energy star rating (more stars = more efficient)");

      svg.append("text").attr("class", "axis-label")
        .attr("transform", `translate(14,${(m.top + H - m.bottom) / 2}) rotate(-90)`)
        .attr("text-anchor", "middle").text("Energy use (kWh/year)");

      const r = W < 500 ? 3.5 : 4.5;
      svg.append("g").selectAll("circle").data(visible).join("circle")
        .attr("cx", d => x(d.stars))
        .attr("cy", d => y(d.energy))
        .attr("r", r)
        .style("fill", d => Viz.TECH_COLOR[d.tech])
        .style("fill-opacity", 0.75)
        .style("stroke", "var(--surface-1)").style("stroke-width", 1)
        .on("mouseenter", function (event, d) {
          d3.select(this).raise().attr("r", r + 2.5).style("fill-opacity", 1);
          Viz.showTip(event,
            `<div class="t-title">${d.brand} · ${d.size}″ ${d.tech}</div>
             <div class="t-row"><span>Energy use</span><span>${Viz.fmt(d.energy)} kWh/yr</span></div>
             <div class="t-row"><span>Star rating</span><span>${d3.format(".2~f")(d.stars)}★</span></div>
             <div class="t-row"><span>Models averaged</span><span>${d.count}</span></div>`);
        })
        .on("mousemove", Viz.moveTip)
        .on("mouseleave", function () {
          d3.select(this).attr("r", r).style("fill-opacity", 0.75);
          Viz.hideTip();
        });
    }

    draw();
    Viz.onResize(el, draw);
  }).catch(err => { el.textContent = "Could not load data: " + err; });
})();