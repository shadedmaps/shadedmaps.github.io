// Use geographic coordinates (lon/lat) instead of Web Mercator
ol.proj.useGeographic();

// Register proj4 definitions with OpenLayers so that any native CRS
// (e.g. UTM zones) added later via proj4.defs() is recognised by ol.proj.
ol.proj.proj4.register(proj4);

function isCoarsePointer() {
  return window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
}

function getMarkerRadius() {
  return isCoarsePointer() ? 18 : 10;
}

function getClusterRadius() {
  return isCoarsePointer() ? 24 : 15;
}

function getPixelRatio() {
  return isCoarsePointer() ? 1 : window.devicePixelRatio || 1;
}

function getHitTolerance() {
  return isCoarsePointer() ? 18 : 0;
}

// Marker default style
const markerDefaultStyle = new ol.style.Style({
  image: new ol.style.Circle({
    radius: getMarkerRadius(),
    fill: new ol.style.Fill({
      color: '#ff660000'}),
    stroke: new ol.style.Stroke({
      color: '#00000080',
      width: 2})
  })
});

// Marker hover style
const markerHoverStyle = new ol.style.Style({
  image: new ol.style.Circle({
    radius: getMarkerRadius(),
    fill: new ol.style.Fill({
      color: '#dddddd'}), // blue on hover
    stroke: new ol.style.Stroke({
      color: '#000000',
      width: 2 })
  })
});

fetch('maps_dict.json')
  .then(response => response.json())
  .then(data => {
  const locations = data.locations;
  const basemapPMTilesUrl = data.basemapPMTilesUrl;

// Marker features
const markerFeatures = locations.map((loc) =>
  new ol.Feature({
    geometry: new ol.geom.Point(loc.centerCoords),
    name: loc.cityName,
    city_id: loc.city_id
  })
);

// Define clusted features
const clusterSource = new ol.source.Cluster({
  distance: 20, // pixel distance for clustering
  source: new ol.source.Vector({ features: markerFeatures })
});

// Cluster style
const clusterStyle = function(feature) {
  const size = feature.get('features').length;
  if (size === 1) {
    // Single marker, use normal style
    const single = feature.get('features')[0];
    return single.get('hover') ? markerHoverStyle : markerDefaultStyle;
  } else {
    // Clustered marker
    return new ol.style.Style({
      image: new ol.style.Circle({
        radius: getClusterRadius(),
        fill: new ol.style.Fill({ color: '#88888880' }),
        stroke: new ol.style.Stroke({ color: '#000000', width: 2 })
      }),
      text: new ol.style.Text({
        text: size.toString(),
        fill: new ol.style.Fill({ color: '#fff' }),
        font: 'bold 12px sans-serif'
      })
    });
  }
};

// Cluster layer
const markerLayer = new ol.layer.Vector({
  source: clusterSource,
  style: clusterStyle
});


// Vector layer visibility checkbox and opacity slider logic
function setupVectorLayerControls() {
  const visCheckbox = document.getElementById('vectorLayerVisibleCheckbox');
  const slider = document.getElementById('opacitySlider');
  const valueLabel = document.getElementById('opacityValue');
  if (slider && valueLabel) {
    slider.value = window.vectorLayer ? window.vectorLayer.getOpacity() : 0.0;
    valueLabel.textContent = slider.value;
    slider.disabled = visCheckbox ? !visCheckbox.checked : false;
    // Replace handler each time to avoid accumulation
    slider.oninput = function() {
      valueLabel.textContent = slider.value;
      if (window.vectorLayer) window.vectorLayer.setOpacity(parseFloat(slider.value));
    };
  }
  if (visCheckbox) {
    visCheckbox.checked = window.vectorLayer ? window.vectorLayer.getVisible() : false;
    if (slider) slider.disabled = !visCheckbox.checked;
    // Replace handler each time to avoid accumulation
    visCheckbox.onchange = function() {
      if (window.vectorLayer) window.vectorLayer.setVisible(visCheckbox.checked);
      if (slider) slider.disabled = !visCheckbox.checked;
    };
  }
}

// Call setupVectorLayerControls when popup is shown
const origShowPopup = window.showPopup;
window.showPopup = function() {
  if (typeof origShowPopup === 'function') origShowPopup.apply(this, arguments);
  setupVectorLayerControls();
};

// If popup is shown by other means, also call setupVectorLayerControls after DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  setupVectorLayerControls();
});

// White Flavor style for basemap
const basemapWhiteFlavorStyle = function(feature, resolution) {
  const layer = feature.get('layer') || feature.get('layer_name'); // Adjust property as needed
  const kind = feature.get('kind');
  const styles = [];
  // Water
  if (layer === 'water') {
    styles.push(new ol.style.Style({
      fill: new ol.style.Fill({ color: '#dddddd' }) // very light blue
    }));
  }
  // Landuse (parks, forests, etc.)
  if (layer === 'landuse') {
    styles.push(new ol.style.Style({
      fill: new ol.style.Fill({ color: '#fff' }) // almost white-grey
    }));
  }
  // Boundaries
  if (layer === 'boundaries') {
    styles.push(new ol.style.Style({
      stroke: new ol.style.Stroke({ color: '#d6c4d8ff', width: 1 })
    }));
  }
  // Roads
  if (layer === 'roads') {
    styles.push(new ol.style.Style({
      stroke: new ol.style.Stroke({ color: '#eaeaea', width: 1 })
    }));
  }
  // Buildings
  if (layer === 'buildings') {
    styles.push(new ol.style.Style({
      fill: new ol.style.Fill({ color: '#ecececff' }),
      stroke: new ol.style.Stroke({ color: '#ecececff', width: 1 })
    }));
  }
  // Place labels (cities, towns)
  if (layer === 'places' && feature.get('name')) {
    styles.push(new ol.style.Style({
      text: new ol.style.Text({
        text: feature.get('name'),
        font: '12px "Roboto", "Arial", sans-serif',
        fill: new ol.style.Fill({ color: '#999' }),
        stroke: new ol.style.Stroke({ color: '#fff', width: 3 }),
        overflow: true
      })
    }));
  }
  // Default fallback (optional)
  if (styles.length === 0) {
    styles.push(new ol.style.Style({
      stroke: new ol.style.Stroke({ color: '#fff', width: 1 }),
      fill: new ol.style.Fill({ color: '#fff' })
    }));
  }
  return styles;
};

// White Flavor style for places only
const placesWhiteFlavorStyle = function(feature, resolution) {
  const layer = feature.get('layer') || feature.get('layer_name'); // Adjust property as needed
  const kind = feature.get('kind');
  const styles = [];
  // Place labels (cities, towns)
  if (layer === 'places' && feature.get('name')) {
    styles.push(new ol.style.Style({
      text: new ol.style.Text({
        text: feature.get('name'),
        font: '12px "Roboto", "Arial", sans-serif',
        fill: new ol.style.Fill({ color: '#999' }),
        stroke: new ol.style.Stroke({ color: '#fff', width: 3 }),
        overflow: true
      })
    }));
  }
  return styles;
};

// Basemap layer
const basemapLayer = new ol.layer.VectorTile({
  //background: '#ffffff',
  source: new olpmtiles.PMTilesVectorSource({
    url: basemapPMTilesUrl,
    //url: "https://shaded-maps-dzi.s3.amazonaws.com/vector_pmtiles/basemap_z7.pmtiles",
  }),
  style: basemapWhiteFlavorStyle
});

// Places layer (optional, can be commented out if not needed)
const placesLayer = new ol.layer.VectorTile({
  source: new olpmtiles.PMTilesVectorSource({
    url: basemapPMTilesUrl,
    //url: "https://shaded-maps-dzi.s3.amazonaws.com/vector_pmtiles/basemap_z7.pmtiles",
  }),
  style: placesWhiteFlavorStyle
});

// Main map
const mainMap = new ol.Map({
  target: 'map',
  layers: [basemapLayer,
           markerLayer,
           //placesLayer
  ],
  view: new ol.View({
    center: [10, 10],
    zoom: 2,
    extent: [-180, -65, 200, 75]
  }),
  pixelRatio: getPixelRatio(),
controls: new ol.control.defaults.defaults({
  zoom: false,
  rotate: false,
  attribution: false
})
});

function disablePageGestureZoom(mapInstance) {
  if (!mapInstance || !mapInstance.getViewport) return;
  const viewport = mapInstance.getViewport();
  const targetElement = mapInstance.getTargetElement ? mapInstance.getTargetElement() : null;
  viewport.style.touchAction = 'none';
  if (targetElement) {
    targetElement.style.touchAction = 'none';
  }
  const events = ['gesturestart', 'gesturechange', 'gestureend'];
  events.forEach(function(eventName) {
    viewport.addEventListener(eventName, function(evt) {
      evt.preventDefault();
    }, { passive: false });
    if (targetElement) {
      targetElement.addEventListener(eventName, function(evt) {
        evt.preventDefault();
      }, { passive: false });
    }
  });
  const touchHandler = function(evt) {
    if (evt.touches && evt.touches.length > 1) {
      evt.preventDefault();
    }
  };
  viewport.addEventListener('touchmove', touchHandler, { passive: false });
  if (targetElement) {
    targetElement.addEventListener('touchmove', touchHandler, { passive: false });
  }
}

function disableRotationInteractions(mapInstance) {
  if (!mapInstance || !mapInstance.getInteractions) return;
  if (!ol || !ol.interaction) return;
  mapInstance.getInteractions().forEach(function(interaction) {
    const isDragRotate = ol.interaction.DragRotate && interaction instanceof ol.interaction.DragRotate;
    const isPinchRotate = ol.interaction.PinchRotate && interaction instanceof ol.interaction.PinchRotate;
    if (isDragRotate || isPinchRotate) {
      mapInstance.removeInteraction(interaction);
    }
  });
}

// Prevent the page from handling pinch/scroll gestures over the map
disablePageGestureZoom(mainMap);
disableRotationInteractions(mainMap);

// Tooltip overlay displaying the name of the location on hover
const tooltip = document.createElement('div');
tooltip.className = 'ol-tooltip';
tooltip.style.position = 'absolute';
tooltip.style.background = 'rgba(255,255,255,0.9)';
tooltip.style.border = '1px solid #888';
tooltip.style.padding = '3px 8px';
tooltip.style.borderRadius = '6px';
tooltip.style.pointerEvents = 'none';
tooltip.style.whiteSpace = 'nowrap';
tooltip.style.fontSize = '0.75em';
tooltip.style.display = 'none';
document.body.appendChild(tooltip);

// Tooltip logic (desktop only)
let lastHoveredFeature = null;
if (!isCoarsePointer()) {
  mainMap.on('pointermove', function (evt) {
    const pixel = evt.pixel;
    // Only consider features from markerLayer
    const feature = mainMap.forEachFeatureAtPixel(pixel, function (feature, layer) {
      if (layer === markerLayer) return feature;
    });
    if (feature) {
      const features = feature.get('features');
      if (features.length === 1) {
        const name = features[0].get('name');
        tooltip.textContent = name;
      } else {
        tooltip.textContent = features.length + ' locations';
      }
      tooltip.style.display = 'block';
      tooltip.style.left = (evt.originalEvent.clientX + 15) + 'px';
      tooltip.style.top = (evt.originalEvent.clientY + 5) + 'px';
    } else {
      tooltip.style.display = 'none';
    }
    // Hover style logic (only for single features)
    if (feature !== lastHoveredFeature) {
      // Remove hover from last feature
      if (lastHoveredFeature) {
        const lastFeatures = lastHoveredFeature.get('features');
        if (lastFeatures.length === 1) {
          lastFeatures[0].set('hover', false);
          markerLayer.changed();
        }
      }
      // Set hover on new feature
      if (feature) {
        const features = feature.get('features');
        if (features.length === 1) {
          features[0].set('hover', true);
          markerLayer.changed();
        }
      }
      lastHoveredFeature = feature;
    }
  });
}

// Popup logic
let popupMap = null;
mainMap.on('singleclick', function(evt) {
  mainMap.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
    if (layer !== markerLayer) return;
    const features = feature.get('features');
    if (!features || features.length !== 1) return;
    const name = features[0].get('name');
    const city_id = features[0].get('city_id');
    const loc = locations.find(l => l.cityName === name && l.city_id === city_id);
    if (loc) {
      openMapPopup(loc);
    }
  }, { hitTolerance: getHitTolerance() });
});

// Function to open popup with map
function openMapPopup(loc) {
  // Hide the main map tooltip when popup appears
  if (typeof tooltip !== 'undefined') {
    tooltip.style.display = 'none';
  }
  // Show modal
  document.getElementById('mapPopup').style.display = 'block';
  // Combine raster and vector attributions for popup
  const rasterAttr = loc.attribution || '';
  const vectorAttr = '<a target="_blank" href="https://github.com/protomaps/basemaps">Protomaps</a> | <a target="_blank" href="https://openstreetmap.org">OpenStreetMap</a>';
  document.getElementById('popupAttribution').innerHTML = `${rasterAttr} &nbsp; | &nbsp; ${vectorAttr}`;
  // Clean up previous popup map
  if (popupMap) {
    popupMap.setTarget(null);
    popupMap = null;
    document.getElementById('popupInner').innerHTML = '';
  }

  const opacity = parseFloat(document.getElementById('opacitySlider')?.value) || 0.0;
  const visible = document.getElementById('vectorLayerVisibleCheckbox')?.checked ?? false;

  if (loc.cogUrl) {
    // --- COG path: native projection, GeoJSON vector overlay ---
    // Register native CRS with proj4 so OL can interpret the GeoTIFF's CRS.
    // nativeEPSG may be null for CRS without a clean EPSG code; use a
    // city-specific synthetic code in that case.
    const nativeProjCode = loc.nativeEPSG ? ('EPSG:' + loc.nativeEPSG) : ('PROJ:' + loc.city_id);
    if (loc.nativeProj4) {
      proj4.defs(nativeProjCode, loc.nativeProj4);
      ol.proj.proj4.register(proj4);
    }

    // GeoJSON vector overlay is created AFTER the native-CRS view is set (see
    // cogSource.getView().then below). Creating it here with the EPSG:4326 temp
    // view active would cause OL to store feature coordinates in EPSG:4326 —
    // they would then render kilometres off-screen once the view switches to UTM.
    vectorLayer = null;
    window.vectorLayer = null;

    const cogSource = new ol.source.GeoTIFF({ sources: [{ url: loc.cogUrl }], projection: nativeProjCode });
    rasterLayer = new ol.layer.WebGLTile({ source: cogSource });

    const containerEl = document.getElementById('popupInner');
    const containerSize = [containerEl.clientWidth || 800, containerEl.clientHeight || 600];

    // Temporary geographic view while COG headers are fetched asynchronously
    popupMap = new ol.Map({
      target: 'popupInner',
      layers: [rasterLayer],
      view: new ol.View({
        projection: 'EPSG:4326',
        center: loc.centerCoords,
        zoom: loc.zoomLevel,
        multiWorld: false
      }),
      pixelRatio: getPixelRatio(),
      controls: new ol.control.defaults.defaults({ zoom: false, rotate: false, attribution: false })
    });

    // GeoJSON vector overlay: created after the native-CRS view is active so
    // OL reprojects EPSG:4326 coordinates into the correct UTM CRS.
    // We use fetch() directly (instead of ol.source.Vector URL loader) to have
    // full explicit control over dataProjection and featureProjection.
    cogSource.getView().then(function(viewOptions) {
      if (!popupMap) return; // popup was closed before COG loaded
      const nativeView = new ol.View(Object.assign({}, viewOptions, { multiWorld: false }));
      nativeView.fit(viewOptions.extent, { size: containerSize });
      popupMap.setView(nativeView);

      if (loc.vectorGeoJsonUrl) {
        // ol.proj.useGeographic() (called at the top of this file) sets the OL
        // "user projection" to EPSG:4326.  Under this regime the canvas vector
        // renderer expects ol.source.Vector features to be in EPSG:4326 and
        // automatically applies an EPSG:4326 → view-CRS transform when drawing.
        // We must therefore store features in EPSG:4326, regardless of the view's
        // native projection (e.g. UTM).  If features were stored in the native CRS,
        // OL would interpret those UTM easting/northing values as lon/lat degrees
        // and project them completely off-screen.
        //
        // The GeoJSON file has a `crs` member (e.g. EPSG:25832) that declares the
        // native projection.  We pass dataProjection explicitly (same value as the
        // crs member) to be unambiguous, and featureProjection='EPSG:4326' so that
        // OL reprojects native-CRS coordinates into geographic during readFeatures().
        //
        // Z-order: declutter:true on a single ol.layer.Vector does not guarantee
        // that text styles render after geometry styles in OL's pipeline — the order
        // is implementation-defined.  The only reliable approach is two separate
        // layers added to the map in order: a geometry layer (water + roads) below,
        // a labels layer (places text, declutter:true) above.  OL always composites
        // map layers in the order they were added, so labels are guaranteed on top.
        // Both layers are wrapped in an ol.layer.Group so that the opacity/visibility
        // controls (which call group.setOpacity / group.setVisible) affect them both.
        const overlayGeomSource = new ol.source.Vector();
        const overlayLabelSource = new ol.source.Vector();
        fetch(loc.vectorGeoJsonUrl)
          .then(function(response) {
            const ds = new DecompressionStream('gzip');
            return new Response(response.body.pipeThrough(ds)).json();
          })
          .then(function(geojsonData) {
            if (!popupMap) return; // popup closed while fetching
            const features = new ol.format.GeoJSON().readFeatures(geojsonData, {
              dataProjection: nativeProjCode,
              featureProjection: 'EPSG:4326'
            });
            features.forEach(function(f) {
              if (f.get('layer') === 'places') {
                overlayLabelSource.addFeature(f);
              } else {
                overlayGeomSource.addFeature(f);
              }
            });
          })
          .catch(function(err) { console.error('GeoJSON overlay load failed:', err); });

        // Geometry layer (water + roads) — rendered first (bottom).
        // The prerender white fill is attached here so that the background
        // is part of the same layer canvas and scales uniformly with opacity.
        const overlayGeomLayer = new ol.layer.Vector({
          source: overlayGeomSource,
          style: basemapWhiteFlavorStyle
        });
        overlayGeomLayer.on('prerender', function(event) {
          const ctx = event.context;
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          ctx.restore();
        });

        // Labels layer (places text) — rendered last (top), with declutter.
        const overlayLabelLayer = new ol.layer.Vector({
          declutter: true,
          source: overlayLabelSource,
          style: basemapWhiteFlavorStyle
        });

        // Group exposes getOpacity/setOpacity/getVisible/setVisible so that
        // setupVectorLayerControls works without any changes.
        vectorLayer = new ol.layer.Group({
          layers: [overlayGeomLayer, overlayLabelLayer],
          visible: visible,
          opacity: opacity
        });
        window.vectorLayer = vectorLayer;
        popupMap.addLayer(vectorLayer);
        setupVectorLayerControls();
      }
    }).catch(function(err) {
      console.error('COG view initialization failed:', err);
    });

  } else if (loc.rasterPMTilesUrl) {
    // --- PMTiles fallback: country-level entries (EPSG:3857 raster, EPSG:4326 view) ---
    // VectorTile is fine here because the view stays in EPSG:4326.
    vectorSource = new olpmtiles.PMTilesVectorSource({
      url: loc.vectorPMTilesUrl,
      attributions: [' + <a target="_blank" href="https://github.com/protomaps/basemaps">Protomaps</a> | <a target="_blank" href="https://openstreetmap.org">OpenStreetMap</a>']
    });
    vectorLayer = new ol.layer.VectorTile({
      declutter: true,
      visible: visible,
      opacity: opacity,
      source: vectorSource,
      style: basemapWhiteFlavorStyle
    });
    window.vectorLayer = vectorLayer;

    rasterLayer = new ol.layer.WebGLTile({
      source: new olpmtiles.PMTilesRasterSource({
        url: loc.rasterPMTilesUrl,
        attributions: [loc.attribution],
        tileSize: [512, 512]
      })
    });

    popupMap = new ol.Map({
      target: 'popupInner',
      layers: [rasterLayer, vectorLayer],
      view: new ol.View({
        center: loc.centerCoords,
        zoom: loc.zoomLevel,
        maxZoom: loc.maxZoomLevel,
        extent: loc.extentCoords,
        multiWorld: false
      }),
      pixelRatio: getPixelRatio(),
      controls: new ol.control.defaults.defaults({ zoom: false, rotate: false, attribution: false })
    });
    setupVectorLayerControls();
  }

  disablePageGestureZoom(popupMap);
  disableRotationInteractions(popupMap);
}

// Close popup logic
document.getElementById('popupClose').onclick = function() {
  if (popupMap) {
    popupMap.setTarget(null);
    popupMap = null;
    document.getElementById('popupInner').innerHTML = '';
  }
  document.getElementById('mapPopup').style.display = 'none';
};
})
.catch(err => console.error('Failed to load maps_dict.json:', err));
