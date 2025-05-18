const map3 = L.map('map3', { zoomControl: false }).setView([23.2, 113.3], 8);

L.tileLayer('https://basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png').addTo(map3);

const breaks3 = { gdp: [5000, 8000], index: [0.3, 0.7] };
const colors3 = [
  ['#be64ac', '#8c62aa', '#3b4994'],
  ['#dfb0d6', '#a5add3', '#5698b9'],
  ['#e8e8e8', '#ace4e4', '#5ac8c8']
];


const getColor3 = (g, i) => {
  const gx = g < breaks3.gdp[0] ? 0 : g < breaks3.gdp[1] ? 1 : 2;
  const ix = i < breaks3.index[0] ? 0 : i < breaks3.index[1] ? 1 : 2;
  return colors3[ix][gx];
};

let geo3;
fetch('geojson/merged_bivariate_map.geojson')
  .then(r => r.json())
  .then(data => {
    geo3 = L.geoJson(data, {
      style: f => ({
        fillColor: getColor3(f.properties.gdp_per_capita || 0, f.properties.accessibility_index || 0),
        weight: 1,
        color: '#6f6d6d',
        fillOpacity: 0.85
      }),
      onEachFeature: (f, l) => {
        l.on({
          mouseover: e => {
            e.target.setStyle({ weight: 2, color: '#66ccff', fillOpacity: 1.0 });
          },
          mouseout: e => geo3.resetStyle(e.target),
          click: e => {
            const p = f.properties;
            const html = `
              Region: ${t(p.county_name)}<br>
              Per Capita GDP: ${Math.round(p.gdp_per_capita).toLocaleString()} dollar<br>
              Accessibility Index: ${(p.accessibility_index * 100).toFixed(2)}%
            `;
            L.popup({
              offset: [0, -10],
              closeButton: false,
              autoClose: true,
              maxWidth: 220
            })
              .setLatLng(e.latlng)
              .setContent(html)
              .openOn(map3);
          }

        });
      }
    }).addTo(map3);
  });
