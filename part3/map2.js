const maps2 = [0, 1, 2].map(id =>
  L.map(`map2_${id}`, { zoomControl: false }).setView([23.0, 113.5], 9)
);

const colorScales2 = [
  chroma.scale(['#efd2da', '#c64172']),
  chroma.scale(['#ddd0af', '#f7b334']),
  chroma.scale(['#e4daf4', '#9779d0'])
];

const fields2 = [
  'county_accessibility_index_cleaned_total_pop',
  'county_accessibility_index_cleaned_population_in_iso',
  'county_accessibility_index_cleaned_accessibility_index'
];

const labels2 = ['Total Population', 'Accessible Population', 'Accessibility Index'];
const layerRefs2 = [[], [], []];
let geoData2 = null;
let selectedLayer2 = null;

maps2.forEach(map => {
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; Carto'
  }).addTo(map);
});

function activateMap(index) {
  document.querySelectorAll('.map').forEach((el, i) => {
    el.classList.toggle('active', i === index);
  });
  requestAnimationFrame(() => maps2[index].invalidateSize());
}

function switchMap(index) {
  activateMap(index);
  // 强制重置地图位置和缩放
  maps2[index].setView([23.0, 113.5], 9);
  updateLegend(index);
  updateBarChart(index);
  updateDescription(index);
  
    // ✅ 新增：按钮高亮控制
document.querySelectorAll('.map-btn').forEach((btn, i) => {
  if (i === index) {
    btn.classList.add('active');
    btn.style.backgroundColor = colorScales2[index](0.8).hex();
    btn.style.color = 'black';
    btn.style.fontWeight = 'bold';
  } else {
    btn.classList.remove('active');
    btn.style.backgroundColor = '#555';
    btn.style.color = 'white';
    btn.style.fontWeight = 'normal';
  }
});


  // 解决图表在重新切换后部分文字消失的问题
  setTimeout(() => {
    if (window.barChartInstance) {
      window.barChartInstance.resize();
      window.barChartInstance.update();
    }
  }, 100);
}

function updateDescription(index) {
  const text = {
    0: 'Total population in each district of the GBA.',
    1: 'District-level population covered by 20-minute drive-time zones from train stations.',
    2: 'Proportion of district population reachable by rail within 20 minutes.'
  };
  document.getElementById('description').textContent = text[index];
}

function updateLegend(index) {
  const container = document.getElementById('legend');
  container.innerHTML = '';
  const scale = colorScales2[index];
  const values = geoData2.features.map(f => f.properties[fields2[index]]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const steps = 5;

  for (let i = 0; i < steps; i++) {
    const start = min + (i / steps) * (max - min);
    const end = min + ((i + 1) / steps) * (max - min);
    const ratio = (i + 0.5) / steps;
    const color = scale(ratio).hex();
    let label = '';
    if (index === 2) {
      label = (start * 100).toFixed(0) + ' to ' + (end * 100).toFixed(0) + ' percent';
    } else {
      label = Math.round(start).toLocaleString() + ' – ' + Math.round(end).toLocaleString();
    }

    container.innerHTML += `
      <div class="legend-dot">
        <div style="width: 12px; height: 12px; background: ${color}; border-radius: 50%; margin-right: 8px;"></div>
        <span>${label}</span>
      </div>`;
  }
}

function updateBarChart(index) {
  const sorted = geoData2.features
    .map(f => ({ name: f.properties.县名, value: f.properties[fields2[index]] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const ctx = document.getElementById('barChart').getContext('2d');
  if (window.barChartInstance) {
    window.barChartInstance.destroy();
  }

  window.barChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sorted.map(d => t(d.name)),
      datasets: [{
        label: labels2[index],
        data: sorted.map(d => index === 2 ? (d.value * 100).toFixed(2) : Math.round(d.value)),
        backgroundColor: colorScales2[index](0.8).hex()
      }]
    },
    options: {
      indexAxis: 'y',
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          bodyFont: { family: 'Arial', size: 11 },
          titleFont: { family: 'Arial', size: 11 }
        }
      },
      onClick: function(evt, elements) {
        if (elements.length > 0) {
          const labelIndex = elements[0].index;
          const name = this.data.labels[labelIndex];
          console.log('[Chart Click]', name);

          const translated = typeof t === 'function' ? t(name) : name;
          const match = layerRefs2[index].find(l => {
            const countyName = l.feature.properties.县名;
            return t(countyName) === name || countyName === name || translated === countyName;
          });

          if (match) {
            if (selectedLayer2) {
              selectedLayer2.setStyle({ color: '#333', weight: 1, opacity: 0.6 });
              selectedLayer2.closePopup();
            }
            match.layer.setStyle({ color: '#66ccff', weight: 4, opacity: 0.9 });
            match.layer.openPopup();
            selectedLayer2 = match.layer;
          } else {
            console.warn('No matching feature found for:', name);
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#ccc',
            font: { family: 'Arial', size: 11 }
          }
        },
        y: {
          ticks: {
            color: '#ccc',
            font: { family: 'Arial', size: 11 }
          }
        }
      },
      animation: false
    }
  });
}

function generatePopupHTML(props) {
  return `
    Region: ${t(props.县名)}<br>
    Total Population: ${Math.round(props.county_accessibility_index_cleaned_total_pop).toLocaleString()}<br>
    Accessible Population: ${Math.round(props.county_accessibility_index_cleaned_population_in_iso).toLocaleString()}<br>
    Accessibility Index: ${(props.county_accessibility_index_cleaned_accessibility_index * 100).toFixed(2)}%
  `;
}

function renderMapLayers(data) {
  geoData2 = data;
  data.features.forEach(f => {
    f.properties.__popup = generatePopupHTML(f.properties);
  });

  fields2.forEach((field, i) => {
    const values = data.features.map(f => f.properties[field]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const scale = colorScales2[i];

    L.geoJSON(data, {
      style: function(feature) {
        const ratio = (feature.properties[field] - min) / (max - min);
        return {
          fillColor: scale(ratio).hex(),
          color: '#333',
          weight: 1,
          opacity: 0.6,
          fillOpacity: 0.7
        };
      },
      onEachFeature: function(feature, layer) {
        layer.on('click', function() {
          if (selectedLayer2 && selectedLayer2 !== layer) {
            selectedLayer2.setStyle({ color: '#333', weight: 1, opacity: 0.6 });
            selectedLayer2.closePopup();
          }
          layer.setStyle({ color: '#66ccff', weight: 4, opacity: 0.9 });
          layer.bindPopup(feature.properties.__popup).openPopup();
          selectedLayer2 = layer;
        });
        layerRefs2[i].push({ feature: feature, layer: layer });
      }
    }).addTo(maps2[i]);
  });
}

fetch('geojson/index_pop_districts.geojson')
  .then(response => response.json())
  .then(data => {
    renderMapLayers(data);
    switchMap(0);
  });
