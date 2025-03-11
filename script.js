let map; // Declare map variable in a broader scope
let rasterLayer, vectorLayer; // Declare layer variables in a broader scope

// Custom style function for vector layer with different styles for cities, streets, and POIs
const vectorStyleFunction = function(feature) {
    const geometryType = feature.getGeometry().getType();
    const properties = feature.getProperties();
    const label = properties.name || '';
    let style;

    // Define text styles
    const textStyle = new ol.style.Text({
        font: '12px Calibri,sans-serif',
        overflow: true,
        fill: new ol.style.Fill({
            color: '#000000'
        }),
        stroke: new ol.style.Stroke({
            color: '#ffffff',
            width: 5
        }),
        text: label,
        declutterMode: 'declutter'
    });

    // Define specific styles for cities, streets, and POIs
    if (properties.layer === 'pois') {
        style = new ol.style.Style({
            text: new ol.style.Text({
                font: '10px Calibri,sans-serif',
                overflow: true,
                fill: new ol.style.Fill({
                    color: '#000000'
                }),
                stroke: new ol.style.Stroke({
                    color: '#ffffff',
                    width: 5
                }),
                text: label,
                declutterMode: 'declutter'
            })
        });
    } else if (properties.layer === 'roads') {
        style = new ol.style.Style({
            //stroke: new ol.style.Stroke({
            //    color: 'rgba(0, 0, 0, 0.5)',
            //    width: 4,
            //}),
            text: new ol.style.Text({
                font: '12px Calibri,sans-serif',
                overflow: true,
                fill: new ol.style.Fill({
                    color: '#000000'
                }),
                stroke: new ol.style.Stroke({
                    color: '#ffffff',
                    width: 5
                }),
                text: label,
                declutterMode: 'declutter'
            })
        });
    } else if ((properties.layer === 'places') && (properties.kind === 'neighbourhood')) {
        style = new ol.style.Style({
            text: new ol.style.Text({
                font: '14px Calibri,sans-serif',
                overflow: true,
                fill: new ol.style.Fill({
                    color: '#000000'
                }),
                stroke: new ol.style.Stroke({
                    color: '#ffffff',
                    width: 6
                }),
                text: label,
                declutterMode: 'declutter'
            })
        });
    } else if (properties.layer === 'places') {
        style = new ol.style.Style({
            text: new ol.style.Text({
                font: '18px Calibri,sans-serif',
                overflow: true,
                fill: new ol.style.Fill({
                    color: '#000000'
                }),
                stroke: new ol.style.Stroke({
                    color: '#ffffff',
                    width: 7
                }),
                text: label,
                declutterMode: 'declutter'
            })
        });
    } else {
        // Default style for other features
        style = new ol.style.Style({
            text: textStyle
        });
    }

    return style;
};


function openMapPopup(rasterAttribution, rasterPmtilesUrl, vectorPmtilesUrl, centerCoordinates, extentCoordinates, zoomLevel) {
    document.getElementById('mapPopup').style.display = 'block';

    // Initialize raster layer
    rasterLayer = new ol.layer.WebGLTile({
        source: new olpmtiles.PMTilesRasterSource({
            url: rasterPmtilesUrl,
            attributions: [rasterAttribution],
            tileSize: [512, 512]
        })
    });

    vectorLayer = new ol.layer.VectorTile({
    declutter: true,
    source: new olpmtiles.PMTilesVectorSource({
        url: vectorPmtilesUrl,
        attributions: [' + <a href="https://github.com/protomaps/basemaps">Protomaps</a> + <a href="https://openstreetmap.org">OpenStreetMap</a>']
    }),
    style: vectorStyleFunction
    });

    ol.proj.useGeographic();

    try {
        map = new ol.Map({
            layers: [rasterLayer, vectorLayer], // Add raster layer first, then pmtiles layer
            target: 'map',
            view: new ol.View({
                center: centerCoordinates,
                zoom: zoomLevel,
                maxZoom: 18,
                extent: extentCoordinates,
                multiWorld: false // Ensure only one world is displayed
            }),
        });
        console.log("Map initialized successfully");
    } catch (error) {
        console.error("Error initializing map:", error);
    }
}

function closeMapPopup() {
    document.getElementById('mapPopup').style.display = 'none';
    if (map) {
        map.setTarget(null); // Properly dispose of the map instance
        map = null; // Clear the map variable
        console.log("Map closed and disposed");
    }
}

document.getElementById('vectorLayerCheckbox').addEventListener('change', function() {
    vectorLayer.setVisible(this.checked);
});

function toggleLayer(layerName) {
    let layer;
    if (layerName === 'pmtiles') {
        layer = pmtilesLayer;
    }

    if (layer) {
        const visible = layer.getVisible();
        layer.setVisible(!visible);
        console.log(`${layerName} layer visibility: ${!visible}`);
    }
}