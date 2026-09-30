// bar.js — mean energy consumption by screen technology, 55-inch TVs only.

(function () {
  const el = document.getElementById("bar");

  const cfg = DATA.bar;   // file path + column names live in loaded.js

  Viz.loadCSV(cfg.file, d => ({
    tech: d[cfg.columns.tech],
    value: +d[cfg.columns.value]
  })).then(data => {
    data.sort((a, b) => Viz.TECH_ORDER.indexOf(a.tech) - Viz.TECH_ORDER.indexOf(b.tech));

    function draw() {
      el.innerHTML = "";
      const W = el.clientWidth;
      const H = Math.min(340, Math.max(240, W * 0.7));
      const m = { top: 28, right: 8, bottom: 36, left: 52 };

      const svg = d3.select(el).append("svg")
        .attr("width", W).attr("height", H)
        .attr("role", "img")
        .attr("aria-label", "Bar chart of average energy use of 55-inch TVs: " +
          data.map(d => `${d.tech} ${Viz.fmt(d.value)} kWh per year`).join(", "));

      const x = d3.scaleBand().domain(data.map(d => d.tech))
        .range([m.left, W - m.right]).padding(0.35);
      const y = d3.scaleLinear().domain([0, d3.max(data, d => d.value) * 1.1]).nice()
        .range([H - m.bottom, m.top]);   // bars always start at zero

      // Recessive gridlines
      svg.append("g").attr("class", "grid")
        .attr("transform", `translate(${m.left},0)`)
        .call(d3.axisLeft(y).ticks(5).tickSize(-(W - m.left - m.right)).tickFormat(""));

      svg.append("g").attr("class", "axis")
        .attr("transform", `translate(${m.left},0)`)
        .call(d3.axisLeft(y).ticks(5).tickSizeOuter(0))
        .call(g => g.select(".domain").remove());

      svg.append("text").attr("class", "axis-label")
        .attr("x", m.left).attr("y", 12).attr("text-anchor", "end")
        .attr("dx", "-6").text("kWh/yr");

      // Bars — rounded at the data end only
      svg.selectAll("path.bar").data(data).join("path")
        .attr("class", "bar")
        .attr("d", d => Viz.topRoundedRect(x(d.tech), y(d.value), x.bandwidth(), y(0) - y(d.value), 4))
        .style("fill", d => Viz.TECH_COLOR[d.tech])
        .on("mouseenter", function (event, d) {
          d3.select(this).style("opacity", 0.85);
          const lcd = data.find(v => v.tech === "LCD").value;
          const diff = d.tech === "LCD" ? "" :
            `<div class="t-row"><span>vs LCD</span><span>${d3.format("+.0%")(d.value / lcd - 1)}</span></div>`;
          Viz.showTip(event,
            `<div class="t-title">${d.tech} · 55″</div>
             <div class="t-row"><span>Average use</span><span>${Viz.fmt(d.value)} kWh/yr</span></div>${diff}`);
        })
        .on("mousemove", Viz.moveTip)
        .on("mouseleave", function () { d3.select(this).style("opacity", 1); Viz.hideTip(); });

      // Value labels (only 3 bars, so labelling each is fine)
      svg.selectAll("text.value-label").data(data).join("text")
        .attr("class", "value-label")
        .attr("x", d => x(d.tech) + x.bandwidth() / 2)
        .attr("y", d => y(d.value) - 8)
        .attr("text-anchor", "middle")
        .text(d => Viz.fmt(d.value));

      // Baseline + category axis
      svg.append("g").attr("class", "axis")
        .attr("transform", `translate(0,${H - m.bottom})`)
        .call(d3.axisBottom(x).tickSize(0).tickPadding(10));
    }

    draw();
    Viz.onResize(el, draw);
  }).catch(err => { el.textContent = "Could not load data: " + err; });
})();