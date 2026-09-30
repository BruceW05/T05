// line.js — annual average spot electricity prices, 1998–2024.
// The mainland average is the hero line; individual regions sit behind it in grey
// and one can be highlighted for comparison.

(function () {
  const el = document.getElementById("line");
  const controlsEl = document.getElementById("line-controls");

  const cfg = DATA.line;        // file path, column names and regions live in loaded.js
  const REGIONS = cfg.regions;
  let highlighted = null;   // region name or null

  const num = v => (v === "" || v == null ? null : +v);
  const money = d3.format("$,.0f");

  Viz.loadCSV(cfg.file, d => {
    const row = { year: +d[cfg.columns.year], avg: num(d[cfg.columns.average]) };
    REGIONS.forEach(r => { row[r.name] = num(d[r.column]); });
    return row;
  }).then(data => {

    // Controls: legend + region picker
    const ctl = d3.select(controlsEl);
    ctl.append("span").attr("class", "static")
      .html(`<span class="swatch line" style="background:var(--series-1)"></span>Mainland average`);
    ctl.append("span").attr("class", "static")
      .html(`<span class="swatch line" style="background:var(--context-line)"></span>Individual regions`);
    ctl.append("span").attr("class", "legend-title").style("margin-left", "8px").text("Highlight:");
    ctl.selectAll("button").data(REGIONS).join("button")
      .attr("type", "button")
      .attr("aria-pressed", "false")
      .attr("title", r => r.name)
      .text(r => r.short)
      .on("click", function (event, r) {
        highlighted = highlighted === r.name ? null : r.name;
        ctl.selectAll("button")
          .classed("active", d => d.name === highlighted)
          .attr("aria-pressed", d => d.name === highlighted);
        draw();
      });

    function draw() {
      el.innerHTML = "";
      const W = el.clientWidth;
      const narrow = W < 560;
      const H = Math.min(440, Math.max(280, W * 0.45));
      const m = { top: 24, right: narrow ? 58 : 110, bottom: 32, left: 48 };

      const svg = d3.select(el).append("svg")
        .attr("width", W).attr("height", H)
        .attr("role", "img")
        .attr("aria-label", "Line chart of annual average spot electricity prices from 1998 to 2024. " +
          "The mainland average rose from $42 per MWh in 1998 to a peak of $145 in 2022, and was $133 in 2024.");

      const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([m.left, W - m.right]);
      const yMax = d3.max(data, d => d3.max(REGIONS, r => d[r.name]));
      const y = d3.scaleLinear().domain([0, yMax]).nice().range([H - m.bottom, m.top]);

      svg.append("g").attr("class", "grid")
        .attr("transform", `translate(${m.left},0)`)
        .call(d3.axisLeft(y).ticks(5).tickSize(-(W - m.left - m.right)).tickFormat(""));

      svg.append("g").attr("class", "axis")
        .attr("transform", `translate(${m.left},0)`)
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => "$" + d))
        .call(g => g.select(".domain").remove());

      svg.append("g").attr("class", "axis")
        .attr("transform", `translate(0,${H - m.bottom})`)
        .call(d3.axisBottom(x).ticks(narrow ? 5 : 10).tickFormat(d3.format("d")));

      const lineFor = key => d3.line()
        .defined(d => d[key] != null)          // Tasmania starts in 2005 — leave the gap
        .x(d => x(d.year)).y(d => y(d[key]))
        .curve(d3.curveMonotoneX);

      // Context lines (regions)
      svg.append("g").selectAll("path").data(REGIONS.filter(r => r.name !== highlighted)).join("path")
        .attr("d", r => lineFor(r.name)(data))
        .style("fill", "none").style("stroke", "var(--context-line)").style("stroke-width", 1.25);

      // Hero line (average)
      svg.append("path").datum(data)
        .attr("d", lineFor("avg"))
        .style("fill", "none").style("stroke", "var(--series-1)").style("stroke-width", 2.75);

      // Highlighted region
      if (highlighted) {
        svg.append("path").datum(data)
          .attr("d", lineFor(highlighted))
          .style("fill", "none").style("stroke", "var(--series-2)").style("stroke-width", 2);
      }

      // Direct end labels in ink colour (value on top, name below)
      const last = data[data.length - 1];
      const ends = [{ label: narrow ? "Avg" : "Mainland avg", v: last.avg, color: "var(--series-1)" }];
      if (highlighted) {
        const r = REGIONS.find(r => r.name === highlighted);
        ends.push({ label: narrow ? r.short : r.name.replace("New South Wales", "NSW").replace("South Australia", "SA"),
                    v: last[highlighted], color: "var(--series-2)" });
      }
      // Nudge labels apart if they would overlap
      ends.forEach(e => (e.yPos = y(e.v)));
      if (ends.length === 2 && Math.abs(ends[0].yPos - ends[1].yPos) < 28) {
        const [a, b] = ends[0].yPos < ends[1].yPos ? [ends[0], ends[1]] : [ends[1], ends[0]];
        const mid = (a.yPos + b.yPos) / 2;
        a.yPos = mid - 14; b.yPos = mid + 14;
      }
      const endG = svg.append("g").selectAll("g").data(ends).join("g")
        .attr("transform", e => `translate(${W - m.right + 8},${e.yPos})`);
      endG.append("text").attr("class", "value-label").attr("dy", "-0.1em").text(e => money(e.v));
      endG.append("text").attr("class", "cat-label").attr("dy", "1.05em").text(e => e.label);

      // Annotation: the 2022 peak of the average
      const peak = data.reduce((a, b) => (b.avg > a.avg ? b : a));
      svg.append("circle").attr("cx", x(peak.year)).attr("cy", y(peak.avg)).attr("r", 4)
        .style("fill", "var(--series-1)").style("stroke", "var(--surface-1)").style("stroke-width", 2);
      // Label sits in the empty space to the left (pre-2020 prices were much lower),
      // joined to the point by a thin leader line so it doesn't collide with the lines.
      const labelX = x(peak.year - (narrow ? 4 : 2.6));
      svg.append("line")
        .attr("x1", labelX + 4).attr("x2", x(peak.year) - 7)
        .attr("y1", y(peak.avg)).attr("y2", y(peak.avg))
        .style("stroke", "var(--axis)").style("stroke-width", 1);
      svg.append("text").attr("class", "annot")
        .attr("x", labelX).attr("y", y(peak.avg)).attr("dy", "0.35em").attr("text-anchor", "end")
        .text(`${narrow ? "" : "Average peaked in "}${peak.year}: ${money(peak.avg)}`);

      // ---- Crosshair + tooltip ----
      const focus = svg.append("g").style("display", "none");
      focus.append("line").attr("y1", m.top).attr("y2", H - m.bottom)
        .style("stroke", "var(--axis)").style("stroke-dasharray", "3 3");
      const avgDot = focus.append("circle").attr("r", 4.5)
        .style("fill", "var(--series-1)").style("stroke", "var(--surface-1)").style("stroke-width", 2);
      const hiDot = focus.append("circle").attr("r", 4)
        .style("fill", "var(--series-2)").style("stroke", "var(--surface-1)").style("stroke-width", 2);

      svg.append("rect")
        .attr("x", m.left).attr("y", m.top)
        .attr("width", W - m.left - m.right).attr("height", H - m.top - m.bottom)
        .style("fill", "transparent")
        .on("mouseenter", () => focus.style("display", null))
        .on("mouseleave", () => { focus.style("display", "none"); Viz.hideTip(); })
        .on("mousemove", event => {
          const [mx] = d3.pointer(event);
          const yr = Math.round(x.invert(mx));
          const d = data.find(v => v.year === yr);
          if (!d) return;
          const px = x(d.year);
          focus.select("line").attr("x1", px).attr("x2", px);
          avgDot.attr("cx", px).attr("cy", y(d.avg));
          const hv = highlighted ? d[highlighted] : null;
          hiDot.style("display", hv == null ? "none" : null).attr("cx", px).attr("cy", hv == null ? 0 : y(hv));

          const rows = REGIONS
            .filter(r => d[r.name] != null)
            .sort((a, b) => d[b.name] - d[a.name])
            .map(r => {
              const isHi = r.name === highlighted;
              const sw = isHi ? `<span class="swatch" style="background:var(--series-2)"></span>` : "";
              return `<div class="t-row${isHi ? " strong" : ""}"><span>${sw}${r.name}</span><span>${money(d[r.name])}</span></div>`;
            }).join("");
          Viz.showTip(event,
            `<div class="t-title">${d.year}</div>
             <div class="t-row strong"><span><span class="swatch" style="background:var(--series-1)"></span>Mainland avg</span><span>${money(d.avg)}</span></div>
             ${rows}`);
        });
    }

    draw();
    Viz.onResize(el, draw);
  }).catch(err => { el.textContent = "Could not load data: " + err; });
})();