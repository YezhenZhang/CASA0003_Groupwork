const radarLabels = [
  'In Degree',
  'Out Degree',
  'Closeness (Flow)',
  'Closeness (Distance)',
  'Betweenness (Flow)',
  'Betweenness (Distance)'
];

const colorSet = [
  'rgba(102, 194, 165, 0.6)',
  'rgba(252, 141, 98, 0.6)',
  'rgba(141, 160, 203, 0.6)',
  'rgba(231, 138, 195, 0.6)',
  'rgba(166, 216, 84, 0.6)',
  'rgba(255, 217, 47, 0.6)'
];

const borderSet = [
  '#66c2a5',
  '#109221',
  '#fc8d62',
  '#bda219',
  '#8da0cb',
  '#156ba0'
];

let chartInstances = [];
let cityNames = [];

// Insert legend
const legend = document.createElement('div');
legend.className = 'legend-fixed';
legend.style.position = 'absolute';
legend.style.top = '16px';
legend.style.left = '16px';
legend.style.zIndex = '20';
legend.style.fontSize = '13px';
legend.style.color = '#eee';
legend.style.display = 'flex';
legend.style.flexWrap = 'wrap';
legend.style.gap = '12px';
legend.style.maxWidth = '320px';
legend.style.width = '100%';

legend.innerHTML = radarLabels.map((label, i) => {
  return `<span style="display:flex;align-items:center;gap:4px;"><span class="legend-color" style="background:${borderSet[i]};display:inline-block;width:12px;height:12px;border-radius:2px;"></span>${label}</span>`;
}).join(' ');
document.querySelector('#page4').insertBefore(legend, document.querySelector('#page4 #buttons'));

// Load and render radar charts
d3.csv('data/2_6_centrality/all_normalized_with_xy.csv').then(data => {
  data.sort((a, b) => a.city.localeCompare(b.city));
  cityNames = data.map(d => d.city);

  data.forEach((d, i) => {
    const metrics = [
      +d.in_degree,
      +d.out_degree,
      +d.closeness_flow,
      +d.closeness_distance,
      +d.betweenness_flow,
      +d.betweenness_distance
    ];

    const ctx = document.getElementById(`chart${i}`).getContext('2d');
    document.querySelector(`#container${i} .chart-label`).textContent = d.city;

    const chart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: radarLabels,
        datasets: [{
          label: undefined,
          data: metrics,
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderColor: 'rgba(255,255,255,0.8)',
          pointBackgroundColor: borderSet,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: borderSet
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0,0,0,0.7)',
            titleFont: { size: 12 },
            bodyFont: { size: 11 },
            padding: 8
          },
          legend: { display: false },
          title: { display: false }
        },
        scales: {
          r: {
            min: 0,
            max: 1,
            ticks: {
              stepSize: 0.2,
              color: '#999',
              backdropColor: 'transparent'
            },
            pointLabels: {
              color: '#ccc',
              font: { size: 11 }
            },
            grid: { color: '#444' },
            angleLines: { color: '#555' }
          }
        }
      }
    });

    chartInstances.push(chart);
  });

  // Reset zoom
  document.querySelector("#page4 #buttons button[data-index='all']").addEventListener("click", () => {
    // 显示所有图表，并清除放大状态
    document.querySelectorAll("#page4 .chart-container").forEach((div, i) => {
      div.classList.remove("fullscreen", "hidden");

      // 清除放大时设置的样式
      div.style.position = "";
      div.style.top = "";
      div.style.left = "";
      div.style.width = "";
      div.style.height = "";
      div.style.zIndex = "";
      div.style.paddingBottom = "";

      // 恢复城市名 label
      div.querySelector('.chart-label').textContent = cityNames[i];
    });

    // 所有按钮去掉 active，高亮 all 按钮
    document.querySelectorAll("#page4 #buttons button").forEach(b => b.classList.remove("active"));
    document.querySelector("#page4 #buttons button[data-index='all']").classList.add("active");
  });

  // Add city buttons in order
  cityNames.forEach((city, i) => {
    const btn = document.createElement("button");
    btn.textContent = city;
    btn.setAttribute("data-index", i);
    btn.addEventListener("click", () => {
      // 清除所有城市名标签
      document.querySelectorAll("#page4 .chart-label").forEach(label => {
        label.textContent = "";
      });
      // 隐藏所有图表
      document.querySelectorAll("#page4 .chart-container").forEach(div => {
        div.classList.add("hidden");
        div.classList.remove("fullscreen");
        div.style.position = "";
        div.style.top = "";
        div.style.left = "";
        div.style.width = "";
        div.style.height = "";
        div.style.zIndex = "";
        div.style.paddingBottom = "";
      });
      const selected = document.getElementById(`container${i}`);
      selected.classList.remove("hidden");
      selected.classList.add("fullscreen");
      selected.style.position = "absolute";
      selected.style.top = "120px";
      selected.style.left = "0";
      selected.style.width = "100vw";
      selected.style.height = "calc(100vh - 140px)";
      selected.style.zIndex = "10";
      selected.style.paddingBottom = "40px";
      selected.querySelector('.chart-label').textContent = city;


      document.querySelectorAll("#page4 #buttons button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
    document.querySelector("#page4 #buttons").appendChild(btn);
  });
});
