// chart.js

const FRAME_DELAY = 500;
const cityNamesEn = {
  "广州市": "Guangzhou", "深圳市": "Shenzhen", "佛山市": "Foshan", "东莞市": "Dongguan",
  "中山市": "Zhongshan", "珠海市": "Zhuhai", "江门市": "Jiangmen",
  "惠州市": "Huizhou", "肇庆市": "Zhaoqing"
};

const chartStates = {};
const chartConfigs = [];

function drawChart({svgId, geojsonPath, yearStart, yearEnd, unitLabel = "Volume", divideBy100 = true}) {
  const svg = d3.select(svgId);
  const width = 900;
  const height = 540;
  const margin = { top: 30, right: 200, bottom: 50, left: 80 };
  const x = d3.scaleLinear().range([margin.left, width]);
  const y = d3.scaleSqrt().range([height, margin.top]);
  const color = d3.scaleOrdinal(d3.schemeTableau10);
  const line = d3.line()
    .x((d, i) => x(i + yearStart))
    .y(d => y(d))
    .curve(d3.curveMonotoneX);
  const years = Array.from({ length: yearEnd - yearStart + 1 }, (_, i) => yearStart + i);

  d3.json(geojsonPath).then(geoData => {
    const raw = geoData.features.map(f => {
      const city = f.properties.CITY;
      const values = years.map(y => {
        const rawValue = +f.properties[y] || 0;
        return divideBy100 ? rawValue / 100 : rawValue;
      });
      return { city, values };
    });

    const data = raw.filter(d => d.city);
    x.domain(d3.extent(years));
    y.domain([0, d3.max(data.flatMap(d => d.values)) * 1.05]);

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")))
      .selectAll("text").style("font-size", "12px");

    svg.append("text")
      .attr("class", "axis-label")
      .attr("x", (margin.left + width) / 2)
      .attr("y", height + 50)
      .attr("text-anchor", "middle")
      .text("Year");

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .selectAll("text").style("font-size", "12px");

    svg.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", margin.left - 60)
      .attr("text-anchor", "middle")
      .text(unitLabel);

    const pathGroup = svg.append("g");
    const labelGroup = svg.append("g").attr("class", "labels");

    const paths = pathGroup.selectAll("path")
      .data(data)
      .enter().append("path")
      .attr("class", "line")
      .attr("stroke", d => color(d.city))
      .attr("d", d => line(d.values.map(() => 0)));

    data.sort((a, b) => b.values[0] - a.values[0]);

    const labels = labelGroup.selectAll(".label")
      .data(data)
      .enter().append("text")
      .attr("class", "label")
      .attr("x", width + 50)
      .attr("y", (d, i) => margin.top + i * 22)
      .text(d => `${cityNamesEn[d.city] || d.city} ${d.values[0].toFixed(2)}`)
      .style("fill", d => color(d.city));

    const state = {
      paused: false,
      yearIndex: 1,
      years,
      update: function update() {
        if (state.paused) return;
        paths.transition().duration(FRAME_DELAY * 0.9)
          .attr("d", d => line(d.values.slice(0, state.yearIndex + 1)));
        const currentYearData = data.map(d => ({ city: d.city, value: d.values[state.yearIndex] }))
          .sort((a, b) => b.value - a.value);
        labels.data(currentYearData, d => d.city)
          .transition().duration(FRAME_DELAY * 0.9)
          .attr("y", (d, i) => margin.top + i * 22)
          .text(d => `${cityNamesEn[d.city] || d.city} ${d.value.toFixed(2)}`);
        state.yearIndex++;
        if (state.yearIndex < years.length) {
          setTimeout(state.update, FRAME_DELAY);
        }
      }
    };
    chartStates[svgId] = state;
    setTimeout(state.update, FRAME_DELAY);

    // === HOVER TOOLTIP ===
    const tooltipGroup = svg.append("g").attr("class", "city-tooltip-group").style("display", "none");
    const tooltipBg = tooltipGroup.append("rect")
      .attr("fill", "#444")
      .attr("stroke", "#888")
      .attr("rx", 6)
      .attr("ry", 6)
      .attr("opacity", 0.9);
    const tooltipEntryGroup = tooltipGroup.append("g");

    const hoverLine = svg.append("line")
      .attr("stroke", "#888")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4 2")
      .attr("opacity", 0.6)
      .style("display", "none");

    const labelBox = svg.append("g").style("display", "none");
    const labelBg = labelBox.append("rect")
      .attr("class", "hover-label-bg")
      .attr("width", 60)
      .attr("height", 20);
    const labelText = labelBox.append("text")
      .attr("class", "hover-label")
      .attr("x", 6)
      .attr("y", 14);

    const vLine = svg.append("line")
      .attr("stroke", "#bbb")
      .attr("stroke-dasharray", "4 2")
      .attr("y1", margin.top)
      .attr("y2", height)
      .style("display", "none");

    const yearGroup = svg.append("g").style("display", "none");
    const yearBg = yearGroup.append("rect")
      .attr("class", "year-box")
      .attr("width", 80)
      .attr("height", 20);
    const yearText = yearGroup.append("text")
      .attr("class", "year-text")
      .attr("x", 6)
      .attr("y", 14);

    svg.on("mousemove", function (event) {
      const [mouseX, mouseY] = d3.pointer(event);
      if (mouseY < margin.top || mouseY > height || mouseX < margin.left || mouseX > width) {
        hoverLine.style("display", "none");
        labelBox.style("display", "none");
        vLine.style("display", "none");
        yearGroup.style("display", "none");
        tooltipGroup.style("display", "none");
        return;
      }

      const yVal = y.invert(mouseY);
      const yLine = y(yVal);
      labelText.text(yVal.toFixed(2));
      const labelWidth = labelText.node().getComputedTextLength();
      labelBg.attr("width", labelWidth + 12);
      hoverLine.attr("x1", margin.left).attr("x2", width).attr("y1", yLine).attr("y2", yLine).style("display", null);
      labelBox.attr("transform", `translate(${margin.left}, ${yLine - 10})`).style("display", null);

      const yearVal = Math.round(x.invert(mouseX));
      const yearIndex = years.indexOf(yearVal);
      if (yearIndex >= 0) {
        const xLine = x(yearVal);
        vLine.attr("x1", xLine).attr("x2", xLine).style("display", null);
        yearText.text(yearVal);
        yearBg.attr("width", yearText.node().getComputedTextLength() + 12);
        yearGroup.attr("transform", `translate(${xLine - 40}, ${margin.top})`).style("display", null);

        const sorted = data.map(d => ({ city: d.city, value: d.values[yearIndex] }))
          .sort((a, b) => b.value - a.value);
        tooltipEntryGroup.selectAll("*").remove();

        sorted.forEach((d, i) => {
          tooltipEntryGroup.append("circle")
            .attr("cx", 8)
            .attr("cy", 20 + i * 20)
            .attr("r", 4)
            .attr("fill", color(d.city));
          tooltipEntryGroup.append("text")
            .attr("x", 18)
            .attr("y", 24 + i * 20)
            .text(`${cityNamesEn[d.city] || d.city}: ${d.value.toFixed(2)}`)
            .attr("font-size", "12px")
            .attr("fill", "#fff");
        });

        const boxWidth = 180;
        const boxHeight = sorted.length * 20 + 16;
        tooltipBg.attr("width", boxWidth).attr("height", boxHeight);
        tooltipGroup.attr("transform", `translate(${x(yearVal) + 15}, ${margin.top + 10})`).style("display", null);
      }
    });

    svg.on("mouseleave", () => {
      hoverLine.style("display", "none");
      labelBox.style("display", "none");
      vLine.style("display", "none");
      yearGroup.style("display", "none");
      tooltipGroup.style("display", "none");
    });
  });
}

function updateVisibility(containerId, type, current) {
  document.querySelectorAll(`#${containerId} .chart`).forEach(div => div.classList.remove('active-chart'));
  const target = document.getElementById(`${type}-${current}`);
  if (target) {
    target.classList.add('active-chart');
    const svgId = target.querySelector("svg").id;
    replayChart(`#${svgId}`);
  }
}

function replayChart(id) {
  const svg = d3.select(id);
  svg.selectAll("*").remove();
  const config = chartConfigs.find(c => c.svgId === id);
  if (config) {
    chartStates[id] = null;
    drawChart(config);
    const pauseBtn = document.querySelector(`.pauseBtn[data-target='${id}']`);
    if (pauseBtn) pauseBtn.textContent = "Pause";
  }
}

document.querySelectorAll(".modeBtn").forEach(btn => {
  btn.onclick = () => updateVisibility("passengerContainer", "passenger", btn.dataset.mode);
});
document.querySelectorAll(".cargoBtn").forEach(btn => {
  btn.onclick = () => updateVisibility("cargoContainer", "cargo", btn.dataset.mode);
});

document.addEventListener("click", function (e) {
  const target = e.target;
  const svgId = target.dataset.target;
  const state = chartStates[svgId];
  if (!state) return;
  if (target.classList.contains("pauseBtn")) {
    state.paused = !state.paused;
    target.textContent = state.paused ? "Play" : "Pause";
    if (!state.paused) setTimeout(() => state.update(), FRAME_DELAY);
  } else if (target.classList.contains("replayBtn")) {
    replayChart(svgId);
  }
});

[
  ["#roadSvg", "GBA_passenger_road.geojson", 1999, 2022, "Passenger Volume (Million)", true],
  ["#railSvg", "GBA_passenger_railway.geojson", 1999, 2014, "Passenger Volume (Million)", true],
  ["#waterSvg", "GBA_passenger_waterway.geojson", 2001, 2019, "Passenger Volume (Ten Thousand)", false],
  ["#airSvg", "GBA_passenger_air.geojson", 2001, 2019, "Passenger Volume (Ten Thousand)", false],
  ["#cargoRoadSvg", "GBA_cargo_road.geojson", 1999, 2022, "Cargo Volume (Million Tons)", true],
  ["#cargoRailSvg", "GBA_cargo_railway.geojson", 1999, 2014, "Cargo Volume (Million Tons)", true],
  ["#cargoWaterSvg", "GBA_cargo_waterway.geojson", 2001, 2019, "Cargo Volume (Million Tons)", true],
  ["#cargoAirSvg", "GBA_cargo_air.geojson", 2001, 2019, "Cargo Volume (Million Tons)", true]
].forEach(([id, path, y1, y2, unit, div100]) => {
  const config = { svgId: id, geojsonPath: path, yearStart: y1, yearEnd: y2, unitLabel: unit, divideBy100: div100 };
  chartConfigs.push(config);
  drawChart(config);
});
