let currentTimeType = 'monthly';

const timeFiles = {
  monthly: 'data/2_3_twoway_flow/monthly_city_flow_summary.csv',
  weekly: 'data/2_3_twoway_flow/weekly_city_flow_summary.csv',
  holiday: 'data/2_3_twoway_flow/holiday_city_flow_summary.csv',
};

function loadDataAndRender(timeType) {
  d3.csv(timeFiles[timeType]).then(data => {
    data.forEach(d => {
      d.in_flow = +d.in_flow;
      d.out_flow = +d.out_flow;
      d.net_flow = +d.net_flow;
    });

    const cities = Array.from(new Set(data.map(d => d.city)));
    const groupedData = d3.group(data, d => d.city);

    const allValues = data.flatMap(d => [d.in_flow, d.out_flow, d.net_flow]);
    const yMin = Math.floor(Math.min(...allValues) / 50) * 50;
    const yMax = Math.ceil(Math.max(...allValues) / 50) * 50;

    const chartMap = new Map();
    const btnContainer = d3.select("#buttons");
    btnContainer.html("");

    btnContainer.append("button")
      .text("ALL")
      .attr("class", "active")
      .attr("data-city", "ALL")
      .on("click", () => showAll(chartMap));

    cities.forEach(city => {
      btnContainer.append("button")
        .text(city)
        .attr("data-city", city)
        .on("click", () => showCity(city, chartMap));
    });

    const chartDiv = d3.select("#charts");
    chartDiv.html("");

    cities.forEach(city => {
      const container = chartDiv.append("div")
        .attr("class", "chart-container")
        .attr("id", `chart-${city}`);

      container.append("div")
        .attr("class", "chart-label")
        .text(city);

      const canvas = container.append("canvas").node();
      const ctx = canvas.getContext("2d");

      const records = groupedData.get(city);
      const xLabels = records.map(d => d.date);

      const inFlow = records.map(d => d.in_flow);
      const outFlow = records.map(d => d.out_flow);
      const netFlow = records.map(d => d.net_flow);

      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: xLabels,
          datasets: [
            {
              type: 'line',
              label: 'In-Flow',
              data: inFlow,
              borderColor: '#66c2a5',
              backgroundColor: '#66c2a5',
              tension: 0.3,
              borderWidth: 1,
              yAxisID: 'y',
              pointRadius: 2,
              pointHoverRadius: 3,
            },
            {
              type: 'line',
              label: 'Out-Flow',
              data: outFlow,
              borderColor: '#fc8d62',
              backgroundColor: '#fc8d62',
              tension: 0.3,
              borderWidth: 1,
              yAxisID: 'y',
              pointRadius: 2,
              pointHoverRadius: 3,
            },
            {
              type: 'bar',
              label: 'Net Flow',
              data: netFlow,
              backgroundColor: netFlow.map(v => v >= 0 ? '#8da0cb' : '#e78ac3'),
              yAxisID: 'y'
            }
          ]
        },
        options: {
          scales: {
            y: {
              min: yMin,
              max: yMax,
              ticks: {
                stepSize: 100,
              }
            }
          },
          plugins: {
            tooltip: {
              enabled: true,
              mode: 'index',
              intersect: false,
              position: 'nearest',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              titleFont: { size: 12 },
              bodyFont: { size: 11 },
              padding: 8
            },
            legend: { display: false }
          },
          responsive: true,
          maintainAspectRatio: false
        }
      });

      chartMap.set(city, container);
    });

    showAll(chartMap);
  });
}

function showAll(chartMap) {
  d3.selectAll("#buttons button").classed("active", false);
  d3.select("#buttons button[data-city='ALL']").classed("active", true);
  d3.select("#charts")
    .style("display", "grid")
    .style("grid-template-columns", "repeat(3, 1fr)");
  chartMap.forEach(div => div.style("display", "block").classed("fullscreen", false));
}

function showCity(city, chartMap) {
  d3.selectAll("#buttons button").classed("active", false);
  d3.select(`#buttons button[data-city='${city}']`).classed("active", true);
  d3.select("#charts")
    .style("display", "flex")
    .style("flex-wrap", "nowrap")
    .style("justify-content", "center")
    .style("align-items", "center");
  chartMap.forEach((div, key) => {
    div.style("display", key === city ? "block" : "none")
      .classed("fullscreen", key === city);
  });
}

// 初始化加载
loadDataAndRender(currentTimeType);

// 监听时间维度按钮
d3.selectAll(".time-btn").on("click", function () {
  d3.selectAll(".time-btn").classed("active", false);
  d3.select(this).classed("active", true);
  currentTimeType = this.dataset.time;
  loadDataAndRender(currentTimeType);
});
