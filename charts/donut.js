// donut.js — mean energy consumption by screen technology, all TV sizes.

(function () {
  const el = document.getElementById("donut");

  const cfg = DATA.donut;   // file path + column names live in loaded.js

  Viz.loadCSV(cfg.file, d => ({
    tech: d[cfg.columns.tech],
    value: +d[cfg.columns.value]
  })).then(data => {
    data.sort((a, b) => Viz.TECH_ORDER.indexOf(a.tech) - Viz.TECH_ORDER.indexOf(b.tech));

    function draw() {
      el.innerHTML = "";
      const W = el.clientWidth;
      const H = Math.min(340, Math.max(240, W * 0.7));
      const labelSpace = W < 380 ? 70 : 90;       // room for outside labels
      const radius = Math.min((W - labelSpace * 2) / 2, (H - 40) / 2);
      const inner = radius * 0.58;

      const svg = d3.select(el).append("svg")
        .attr("width", W).attr("height", H)
        .attr("role", "img")
        .attr("aria-label", "Donut chart of average energy use by screen technology: " +
          data.map(d => `${d.tech} ${Viz.fmt(d.value)} kWh per year`).join(", "));

      const g = svg.append("g").attr("transform", `translate(${W / 2},${H / 2})`);

      const pie = d3.pie().value(d => d.value).sort(null).padAngle(0.012);
      const arc = d3.arc().innerRadius(inner).outerRadius(radius).cornerRadius(3);
      const hoverArc = d3.arc().innerRadius(inner).outerRadius(radius + 6).cornerRadius(3);
      const labelArc = d3.arc().innerRadius(radius + 18).outerRadius(radius + 18);
      const arcs = pie(data);

      // Slices
      g.selectAll("path.slice").data(arcs).join("path")
        .attr("class", "slice")
        .attr("d", arc)
        .style("fill", d => Viz.TECH_COLOR[d.data.tech])
        .style("stroke", "var(--surface-1)").style("stroke-width", 2)
        .on("mouseenter", function (event, d) {
          d3.select(this).transition().duration(120).attr("d", hoverArc);
          Viz.showTip(event,
            `<div class="t-title">${d.data.tech}</div>
             <div class="t-row"><span>Average use</span><span>${Viz.fmt(d.data.value)} kWh/yr</span></div>`);
        })
        .on("mousemove", Viz.moveTip)
        .on("mouseleave", function () {
          d3.select(this).transition().duration(120).attr("d", arc);
          Viz.hideTip();
        });

      // Leader lines + outside labels (text in ink colour, not series colour)
      const labels = g.selectAll("g.lbl").data(arcs).join("g").attr("class", "lbl");
      labels.append("polyline")
        .attr("points", d => {
          const mid = (d.startAngle + d.endAngle) / 2;
          const p = d3.arc().innerRadius(radius + 4).outerRadius(radius + 4).centroid(d);
          const q = labelArc.centroid(d);
          q[0] = (radius + 26) * (mid < Math.PI ? 1 : -1);
          return [p, labelArc.centroid(d), q].map(pt => pt.join(",")).join(" ");
        })
        .style("fill", "none").style("stroke", "var(--axis)").style("stroke-width", 1);

      const text = labels.append("text")
        .attr("transform", d => {
          const mid = (d.startAngle + d.endAngle) / 2;
          const c = labelArc.centroid(d);
          return `translate(${(radius + 30) * (mid < Math.PI ? 1 : -1)},${c[1]})`;
        })
        .attr("text-anchor", d => ((d.startAngle + d.endAngle) / 2 < Math.PI ? "start" : "end"));
      text.append("tspan").attr("class", "value-label").attr("x", 0).attr("dy", "-0.2em")
        .text(d => Viz.fmt(d.data.value));
      text.append("tspan").attr("class", "cat-label").attr("x", 0).attr("dy", "1.2em")
        .text(d => d.data.tech);

      // Centre caption
      const c = g.append("text").attr("text-anchor", "middle");
      c.append("tspan").attr("class", "cat-label").attr("x", 0).attr("dy", "-0.3em").text("kWh / year");
      c.append("tspan").attr("class", "cat-label").attr("x", 0).attr("dy", "1.3em").text("(average)");
    }

    draw();
    Viz.onResize(el, draw);
  }).catch(err => { el.textContent = "Could not load data: " + err; });
})();