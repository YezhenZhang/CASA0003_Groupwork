// ✅ 初始化地图
const map1 = L.map('map1_main', { zoomControl: false }).setView([23.1, 113.3], 8);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap contributors, &copy; CartoDB'
}).addTo(map1);

const fillColors1 = { '15': '#66c2a5', '20': '#fc8d62', '30': '#8da0cb' };
let boundaryLayer1, stationLayer1;
let activeStationMarker1 = null;
let activeFileId1 = null;
const isochroneLayers1 = {};
const mergedLayers1 = { '15': null, '20': null, '30': null };
const stationMarkers1 = [];

function bringToFront1() {
  ['30', '20', '15'].forEach(m => {
    if (mergedLayers1[m]) mergedLayers1[m].bringToFront();
    if (isochroneLayers1[m]) isochroneLayers1[m].bringToFront();
  });
  if (boundaryLayer1) boundaryLayer1.bringToFront();
  if (stationLayer1) stationLayer1.bringToFront();
}

function clearIsochroneLayers1() {
  Object.values(isochroneLayers1).forEach(l => map1.removeLayer(l));
  Object.keys(isochroneLayers1).forEach(k => delete isochroneLayers1[k]);
}

function loadBoundaryLayer1() {
  fetch('geojson/county_only.geojson')
    .then(res => res.json())
    .then(data => {
      boundaryLayer1 = L.geoJSON(data, {
        style: { color: '#a2aab2', weight: 1.5, fillOpacity: 0 },
        onEachFeature: (feature, layer) => {
          const name = feature.properties.county_name || "Unnamed";
          layer.bindTooltip(t(name), {
            sticky: true, className: 'custom-tooltip', direction: 'center'
          });
          layer.on('click', e => {
            e.originalEvent.preventDefault();
            e.originalEvent.stopPropagation();
          });
          layer.on('add', () => {
            if (layer._path) {
              layer._path.setAttribute('tabindex', '-1');
            }
          });
          layer.on('mouseover', function () {
            boundaryLayer1.eachLayer(l => boundaryLayer1.resetStyle(l));
            this.setStyle({ color: '#00ffff', weight: 3 });
            this.openTooltip();
            if (stationLayer1) stationLayer1.bringToFront();
          });
          layer.on('mouseout', function () {
            boundaryLayer1.resetStyle(this);
            this.closeTooltip();
          });
        }
      }).addTo(map1);
    });
}

function loadStationIsochrones1(fileId) {
  clearIsochroneLayers1();
  activeFileId1 = fileId;
  ['15', '20', '30'].forEach(mins => {
    fetch(`geojson/isochrones_${mins}min/${fileId}_${mins}min.geojson`)
      .then(res => res.json())
      .then(data => {
        const layer = L.geoJSON(data, {
          style: {
            color: '#666', weight: 1,
            fillColor: fillColors1[mins], fillOpacity: 0.3
          }
        });
        isochroneLayers1[mins] = layer;
        const cb = document.getElementById(`checkbox-${mins}`);
        if (cb) cb.checked = true;
        if (cb && cb.checked) {
          layer.addTo(map1);
        }
        bringToFront1();
      });
  });
}

function loadMergedLayerFiltered1(mins, excludeFileId = null) {
  fetch(`geojson/merged_isochrones_${mins}min_with_id.geojson`)
    .then(res => res.json())
    .then(data => {
      const filtered = {
        ...data,
        features: data.features.filter(f => f.properties.file_id !== excludeFileId)
      };
      const layer = L.geoJSON(filtered, {
        style: {
          color: '#666', weight: 1,
          fillColor: fillColors1[mins], fillOpacity: 0.3
        }
      }).addTo(map1);
      mergedLayers1[mins] = layer;
      bringToFront1();
    });
}

function loadStationLayer1() {
  fetch('geojson/railway_station_with_hk_and_fileid.geojson')
    .then(res => res.json())
    .then(data => {
      stationLayer1 = L.geoJSON(data, {
        pointToLayer: (f, latlng) => {
          const zoom = map1.getZoom();
          const marker = L.circleMarker(latlng, {
            radius: zoom,
            fillColor: '#ff8ec6',
            color: 'rgba(100, 100, 100, 0.8)',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.6
          });
          stationMarkers1.push(marker);
          return marker;
        },
        onEachFeature: (feature, layer) => {
          const name = feature.properties.站名;
          const fileId = feature.properties.file_id;
          layer.bindTooltip(t(name), { direction: 'top' });
          layer.bindPopup(`<b>${t(name)}</b>`, { className: 'popup-dark' });
          layer.on('click', () => {
            loadStationIsochrones1(fileId);
            if (activeStationMarker1) {
              activeStationMarker1.setStyle({
                fillColor: '#dbdbae',
                color: 'rgba(100, 100, 100, 0.8)',
                weight: 1, fillOpacity: 0.7
              });
            }
            layer.setStyle({
              fillColor: '#00ffff',
              color: '#ffffff',
              weight: 2, fillOpacity: 1
            });
            activeStationMarker1 = layer;
            layer.openPopup();
          });
        }
      }).addTo(map1);
      stationLayer1.bringToFront();
    });
}

map1.on('zoomend', () => {
  const zoom = map1.getZoom();
  const scaledRadius = Math.max(4, Math.min(14, 2 + zoom));
  stationMarkers1.forEach(marker => marker.setRadius(scaledRadius));
});

function bindIsochroneCheckbox1(mins) {
  const cb = document.getElementById(`checkbox-${mins}`);
  const mergedCb = document.getElementById(`merged-${mins}`);
  if (cb) cb.checked = true;

  cb.addEventListener('change', e => {
    const layer = isochroneLayers1[mins];
    if (!layer) return;
    if (e.target.checked) {
      layer.addTo(map1);
    } else {
      map1.removeLayer(layer);
    }
    bringToFront1();
  });

  if (mergedCb) mergedCb.checked = true;
  mergedCb.addEventListener('change', e => {
    if (e.target.checked && !mergedLayers1[mins]) {
      loadMergedLayerFiltered1(mins, activeFileId1);
    } else if (!e.target.checked && mergedLayers1[mins]) {
      map1.removeLayer(mergedLayers1[mins]);
      mergedLayers1[mins] = null;
    }
  });
}

['15', '20', '30'].forEach(bindIsochroneCheckbox1);

document.getElementById('clear-btn').addEventListener('click', () => {
  // 1. 移除当前点击站点的等时圈图层
  Object.values(isochroneLayers1).forEach(layer => {
    if (layer) map1.removeLayer(layer);
  });
  Object.keys(isochroneLayers1).forEach(k => delete isochroneLayers1[k]);

  // 2. 移除所有 merged 合并图层
  Object.entries(mergedLayers1).forEach(([mins, layer]) => {
    if (layer) {
      map1.removeLayer(layer);
      mergedLayers1[mins] = null;
    }
  });

  // 3. 重置所有 checkbox 状态
  ['15', '20', '30'].forEach(mins => {
    const cb = document.getElementById(`checkbox-${mins}`);
    const mergedCb = document.getElementById(`merged-${mins}`);
    if (cb) cb.checked = false;
    if (mergedCb) mergedCb.checked = false;
  });

  // 4. 重置选中站点 marker
  if (activeStationMarker1) {
    activeStationMarker1.setStyle({
      fillColor: '#5a6ea0',
      color: 'rgba(100, 100, 100, 0.8)',
      weight: 1,
      fillOpacity: 0.85
    });
    activeStationMarker1 = null;
  }

  // 5. 清空当前文件 ID
  activeFileId1 = null;
});


loadBoundaryLayer1();
loadStationLayer1();
['15', '20', '30'].forEach(mins => {
  fetch(`geojson/merged_isochrones_${mins}min_with_id.geojson`)
    .then(res => res.json())
    .then(data => {
      mergedLayers1[mins] = L.geoJSON(data, {
        style: {
          color: '#666', weight: 1,
          fillColor: fillColors1[mins], fillOpacity: 0.2
        }
      }).addTo(map1);
      bringToFront1();
    });
});
