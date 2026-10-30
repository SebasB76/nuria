// Leaflet page that runs inside the WebView (native) or an iframe (web).
// The app sends a scene with window.setScene(json); the page answers with events through send().
// The script avoids backticks and ${} so it can live inside this template string unchanged.
const SCRIPT = String.raw`
var send = function(e){
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(e));
  else window.parent.postMessage({nuria: e}, '*');
};
var map = L.map('map', {zoomControl:false, attributionControl:true, minZoom:5, maxZoom:17, zoomSnap:.25}).setView([-2.17,-79.9], 12);
map.attributionControl.setPrefix('');
map.createPane('sat').style.zIndex = 350;
map.createPane('labels').style.zIndex = 380;
map.getPane('labels').style.pointerEvents = 'none';
var ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas';
L.tileLayer(ESRI + '/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {maxNativeZoom:16, attribution:'© Esri, OpenStreetMap'}).addTo(map);
L.tileLayer(ESRI + '/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {maxNativeZoom:16, pane:'labels'}).addTo(map);

var groups = {};
['routes','sectors','reports','marks','family','me'].forEach(function(k){ groups[k] = L.layerGroup().addTo(map); });
var last = {};
var scene = {};
var uid = 0;
var DROP = 'M20 2C20 2 4 19 4 30a16 16 0 0 0 32 0C36 19 20 2 20 2Z';
function drop(color, fill, size){
  var id = 'dc' + (++uid), y = 46 - 44*fill;
  return '<svg width="' + Math.round(size*40/48) + '" height="' + size + '" viewBox="0 0 40 48"><defs><clipPath id="' + id + '"><path d="' + DROP + '"/></clipPath></defs><path d="' + DROP + '" fill="#0b131a"/><g clip-path="url(#' + id + ')"><path d="M-2 ' + y + ' q5.5 -3.5 11 0 t11 0 t11 0 t11 0 V50 H-2Z" fill="' + color + '"/></g><path d="' + DROP + '" fill="none" stroke="' + color + '" stroke-width="2.8"/></svg>';
}
function esc(t){ return String(t).replace(/[<>&"]/g, function(c){ return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }
function icon(html, w, h){ return L.divIcon({className:'', html:html, iconSize:[w,h], iconAnchor:[w/2,h/2]}); }

var draw = {
  sectors: function(list){
    (list||[]).forEach(function(s){
      var html = '<span class="bm' + (s.selected?' on':'') + '">' + drop(s.color, s.fill, s.selected?32:24) + '<span class="bn">' + esc(s.short) + (s.selected?' · ' + esc(s.levelName):'') + '</span></span>';
      L.marker([s.lat,s.lon], {icon:L.divIcon({className:'', html:html, iconSize:[0,0]}), zIndexOffset:s.selected?1000:0})
        .on('click', function(){ send({type:'sector', id:s.id}); }).addTo(groups.sectors);
    });
  },
  reports: function(list){
    (list||[]).forEach(function(r){
      L.marker([r.lat,r.lon], {icon:icon('<div class="rep' + (r.hit?' hit':'') + (r.mine?' mine':'') + '">' + r.icon + '</div>', 32, 32), zIndexOffset:r.hit?1500:500})
        .bindPopup('<b>' + esc(r.text) + '</b><br><span class="mut">' + esc(r.sub) + '</span>').addTo(groups.reports);
    });
  },
  routes: function(list){
    (list||[]).slice().sort(function(a,b){ return (a.best?1:0) - (b.best?1:0); }).forEach(function(r){
      if (r.best){
        L.polyline(r.coords, {color:'#04211f', weight:12, opacity:.7}).addTo(groups.routes);
        L.polyline(r.coords, {color:'#2fd3c6', weight:r.selected?7:5}).on('click', function(){ send({type:'route', i:r.i}); }).addTo(groups.routes);
      } else {
        L.polyline(r.coords, {color:r.selected?'#c7d3db':'#8a96a0', weight:r.selected?6:4, opacity:.95, dashArray:r.selected?null:'8 8'})
          .on('click', function(){ send({type:'route', i:r.i}); }).addTo(groups.routes);
      }
    });
  },
  marks: function(list){
    (list||[]).forEach(function(m){
      L.marker([m.lat,m.lon], {icon:icon('<div class="abm" style="background:' + m.bg + ';color:' + m.fg + '">' + esc(m.label) + '</div>', 32, 32), zIndexOffset:2000})
        .bindTooltip(esc(m.name)).addTo(groups.marks);
    });
  },
  family: function(list){
    (list||[]).forEach(function(m){
      var html = '<div class="fm' + (m.sos?' sos':'') + '" style="--c:' + m.ring + ';background:' + m.color + '">' + esc(m.initials) + (m.moving?'<i>🚗</i>':'') + '</div>';
      L.marker([m.lat,m.lon], {icon:icon(html, 40, 40), zIndexOffset:m.sos?3000:1000})
        .on('click', function(){ send({type:'member', id:m.id}); }).addTo(groups.family);
    });
  },
  me: function(p){
    if (p) L.marker([p.lat,p.lon], {icon:icon('<div class="me"></div>', 22, 22), zIndexOffset:2500}).addTo(groups.me);
  }
};

function view(v){
  if (!v) return;
  if (v.points && v.points.length > 1) map.fitBounds(L.latLngBounds(v.points), {paddingTopLeft:[v.pad||40, v.padTop||v.pad||40], paddingBottomRight:[v.pad||40, v.padBottom||v.pad||40], animate:!!v.animate, maxZoom:v.maxZoom||15});
  else if (v.points && v.points.length === 1) map.flyTo(v.points[0], v.zoom||15, {duration:.8});
}

window.setScene = function(next){
  scene = next;
  Object.keys(draw).forEach(function(k){
    var s = JSON.stringify(next[k] || null);
    if (s === last[k]) return;
    last[k] = s;
    groups[k].clearLayers();
    draw[k](next[k]);
  });
  // a view with a key moves the map only when the key changes, so live updates do not fight the user's panning
  var vs = next.view ? (next.view.key || JSON.stringify(next.view)) : 'null';
  if (vs !== last.view){ last.view = vs; view(next.view); }
  if (!!next.clouds !== sat.on){ sat.on = !!next.clouds; if (sat.on && !sat.layers.length) initSat(); else showFrame(sat.i); }
  if (next.cloudsPlaying !== undefined && next.cloudsPlaying !== sat.playing) playSat(next.cloudsPlaying);
  document.getElementById('map').style.cursor = next.picking ? 'crosshair' : '';
};
map.on('click', function(e){ if (scene.picking) send({type:'pick', lat:e.latlng.lat, lon:e.latlng.lng}); });

var GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';
var sat = {layers:[], times:[], i:0, timer:null, playing:true, on:false};
function iso(d){ return d.toISOString().slice(0,19) + 'Z'; }
function clock(d){ var l = new Date(d.getTime() - 5*3600e3), h = l.getUTCHours(), m = String(l.getUTCMinutes()).padStart(2,'0'); return (h%12||12) + ':' + m + ' ' + (h<12?'am':'pm'); }
function gibsTimes(layer, tms, hoursBack){
  var end = new Date(), start = new Date(end - hoursBack*3600e3);
  return fetch(GIBS + '/1.0.0/' + layer + '/default/' + tms + '/all/' + iso(start) + '--' + iso(end) + '.xml').then(function(r){ return r.text(); }).then(function(txt){
    var dom = (txt.match(/<Domain>([^<]+)<\/Domain>/)||[])[1];
    if (!dom) throw new Error('no domain');
    var out = [];
    // GeoColor has gaps, so expand the published ranges instead of assuming every 10 minutes exists
    dom.split(',').forEach(function(r){ var ab = r.split('/'); for (var t = new Date(ab[0]); t <= new Date(ab[1]||ab[0]); t = new Date(t.getTime()+600e3)) out.push(t); });
    return out;
  });
}
function initSat(){
  var hour = new Date(Date.now() - 5*3600e3).getUTCHours(), day = hour >= 6 && hour < 18;
  var layer = day ? 'GOES-East_ABI_Band2_Red_Visible_1km' : 'GOES-East_ABI_GeoColor', tms = 'GoogleMapsCompatible_Level7';
  gibsTimes(layer, tms, 3).then(function(times){
    // the newest visible-band times are listed before all of their tiles exist
    var t = (day ? times.slice(0,-2) : times).slice(-12);
    if (!t.length) throw new Error('no times');
    return t;
  }).catch(function(){
    layer = 'GOES-East_ABI_Band13_Clean_Infrared'; tms = 'GoogleMapsCompatible_Level6';
    var lastT = Math.floor((Date.now()-50*60e3)/600e3)*600e3;
    return Array.from({length:12}, function(_,k){ return new Date(lastT-(11-k)*600e3); });
  }).then(function(times){
    sat.times = times;
    // "screen" drops the dark ground of the satellite image so only the white clouds show over the map
    map.getPane('sat').style.mixBlendMode = 'screen';
    sat.layers = times.map(function(t){ return L.tileLayer(GIBS + '/' + layer + '/default/' + iso(t) + '/' + tms + '/{z}/{y}/{x}.png', {pane:'sat', opacity:0, maxNativeZoom:tms.slice(-1)==='6'?6:7, maxZoom:17, attribution:'Nubes: NOAA GOES-19 · NASA GIBS'}).addTo(map); });
    showFrame(times.length-1); playSat(sat.playing);
  });
}
function showFrame(i){
  sat.i = i;
  sat.layers.forEach(function(l,k){ l.setOpacity(sat.on && k===i ? .65 : 0); });
  var t = sat.times[i]; if (!t) return;
  var mins = Math.round((Date.now()-t)/60e3);
  send({type:'clouds', label:'Nubes de las ' + clock(t) + ' · hace ' + (mins<60 ? mins + ' min' : (mins/60).toFixed(1).replace('.',',') + ' h'), frame:i, frames:sat.times.length});
}
function playSat(on){
  sat.playing = on; clearInterval(sat.timer);
  if (on) sat.timer = setInterval(function(){ if (sat.layers.length) showFrame(sat.i >= sat.layers.length-1 ? 0 : sat.i+1); }, 700);
}
send({type:'ready'});
`;

// user-scalable=no is on purpose: Leaflet owns pinch-zoom on this canvas, and page zoom would fight it
export const MAP_HTML = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>
html,body,#map{margin:0;height:100%;background:#1b2229;font-family:-apple-system,system-ui,Roboto,sans-serif}
html{-webkit-tap-highlight-color:transparent;-webkit-text-size-adjust:100%}
html,body{overscroll-behavior:none}
.leaflet-marker-icon,.bm,.rep,.abm,.fm{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.leaflet-container{background:#1b2229}
.leaflet-control-attribution{font-size:9px;background:rgba(11,19,26,.6)!important;color:#9aa7b1}
.leaflet-control-attribution a{color:#9aa7b1}
.bm{display:inline-flex;align-items:center;gap:4px;transform:translate(-12px,-14px);white-space:nowrap;filter:drop-shadow(0 2px 3px rgba(0,0,0,.6))}
.bm.on{transform:translate(-14px,-16px)}
.bn{font-size:11px;font-weight:700;color:#eef3f6;background:rgba(11,19,26,.78);padding:2px 6px;border-radius:7px}
.bm.on .bn{font-size:12.5px;background:#fff;color:#10283a}
.rep{width:30px;height:30px;border-radius:50%;background:#fff;display:grid;place-items:center;font-size:15px;border:2px solid #ec835a;box-shadow:0 2px 6px rgba(0,0,0,.5)}
.rep.hit{border:3px solid #d03b3b;box-shadow:0 0 0 4px rgba(208,59,59,.35)}
.rep.mine{border-color:#3BA7DE}
.abm{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:14px;border:2px solid #0b131a;box-shadow:0 2px 6px rgba(0,0,0,.5)}
.fm{position:relative;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:800;font-size:13px;border:3px solid var(--c);box-shadow:0 2px 8px rgba(0,0,0,.6)}
.fm i{position:absolute;right:-10px;bottom:-6px;font-style:normal;font-size:14px}
.fm.sos{animation:pulse 1s infinite}
@media (prefers-reduced-motion:reduce){.fm.sos{animation:none;box-shadow:0 0 0 5px rgba(208,59,59,.55)}}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(208,59,59,.8)}100%{box-shadow:0 0 0 16px rgba(208,59,59,0)}}
.me{width:16px;height:16px;border-radius:50%;background:#3BA7DE;border:3px solid #fff;box-shadow:0 0 0 6px rgba(59,167,222,.3)}
.mut{color:#6b7882}
.leaflet-popup-content{font-size:13px;line-height:1.35}
</style></head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>${SCRIPT}</script></body></html>`;
