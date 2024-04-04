import { Map, View } from 'ol';
import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON';
import VectorSource from 'ol/source/Vector.js';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js';
import { createStyleFunctionFromUrl } from '../src/index.js';
import { extend as extendExtent, createEmpty as createEmptyExtent } from 'ol/extent';

export function initializeMap() {
    return new Map({
        target: 'map',
        view: new View({
            center: [0, 0], // Center of the world
            zoom: 2, // Initial zoom level
        }),
        layers: [
            new TileLayer({ // Add the OSM base layer
                source: new OSM(),
            }),
        ],
    });
}

export async function updateMapLayers(map, serviceUrl) {
    const legend = document.getElementById('legend-items');
    map.getLayers().getArray().slice(1).forEach(layer => map.removeLayer(layer)); // Remove all layers except the base layer
    legend.innerHTML = ''; // Clear legend

    const allExtents = createEmptyExtent(); // To accumulate layer extents

    const response = await fetch(`${serviceUrl}?f=json`);
    const mapServiceDefinition = await response.json();
    const layerDefinitions = mapServiceDefinition.layers.map(l => ({
        ...l,
        url: `${serviceUrl}/${l.id}`,
    }));

    let vectorLayerPromises = layerDefinitions.map(layerDefinition => {
        const vectorSource = new VectorSource({
            format: new GeoJSON(),
            url: `${layerDefinition.url}/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson`,
        });
        const vectorLayer = new VectorLayer({
            source: vectorSource,
            visible: layerDefinition.defaultVisibility,
        });

        vectorLayer.setProperties({ layerDefinition });

        let stylePromise = createStyleFunctionFromUrl(layerDefinition.url, map.getView().getProjection()).then(styleFunction => {
            vectorLayer.setStyle(styleFunction);
            return vectorSource.once('change', () => {
                const sourceExtent = vectorSource.getExtent();
                extendExtent(allExtents, sourceExtent);
            });
        });

        map.addLayer(vectorLayer);
        return stylePromise;
    });

    await Promise.all(vectorLayerPromises);

    // if (!isEmptyExtent(allExtents)) {
    //     map.getView().fit(allExtents, {
    //         duration: 1000,
    //         padding: [50, 50, 50, 50]
    //     });
    // }

    updateLegend(layerDefinitions, legend, map);
}

function updateLegend(layerDefinitions, legend, map) {
    legend.innerHTML = ''; // Clear existing items
    layerDefinitions.forEach((layerDefinition, index) => {
        // Assuming layerDefinitions align with the layers added to the map, skipping the first (base) layer
        const vectorLayer = map.getLayers().getArray()[index + 1];

        const listItem = document.createElement('li');

        const layerCheckbox = document.createElement('input');
        layerCheckbox.type = 'checkbox';
        layerCheckbox.checked = vectorLayer.getVisible();
        layerCheckbox.addEventListener('change', () => {
            // Directly use the visibility toggle without accessing layerDefinition
            vectorLayer.setVisible(layerCheckbox.checked);
        });

        const layerLabel = document.createElement('label');
        layerLabel.textContent = layerDefinition.name;

        const zoomButton = document.createElement('button');
        zoomButton.textContent = 'Zoom';
        zoomButton.onclick = function () {
            const source = vectorLayer.getSource();
            const extent = source.getExtent();
            if (extent && !isEmptyExtent(extent)) {
                map.getView().fit(extent, { size: map.getSize(), duration: 1000, nearest: true });
            }
        };

        listItem.appendChild(layerCheckbox);
        listItem.appendChild(layerLabel);
        listItem.appendChild(zoomButton);

        legend.appendChild(listItem);
    });
}

function isEmptyExtent(extent) {
    return extent[0] === Infinity || extent[1] === Infinity || extent[2] === -Infinity || extent[3] === -Infinity;
}


export function setupFeatureClickListener(map) {
    map.on('singleclick', function (evt) {
        const features = map.getFeaturesAtPixel(evt.pixel);

        if (features.length > 0) {
            const properties = features[0].getProperties();

            // Create a table element
            const table = document.createElement('table');
            table.style.width = '100%';
            table.setAttribute('border', '1');
            let tableHTML = '<tr><th>Property</th><th>Value</th></tr>';

            // Exclude the geometry property and iterate over the remaining properties
            delete properties.geometry; // Remove geometry property
            for (const [key, value] of Object.entries(properties)) {
                tableHTML += `<tr><td>${key}</td><td>${value}</td></tr>`;
            }

            table.innerHTML = tableHTML;

            const contentElement = document.getElementById('popup-content');
            contentElement.innerHTML = ''; // Clear previous content
            contentElement.appendChild(table); // Add the table to the popup content

            const popupElement = document.getElementById('popup');
            popupElement.style.display = 'block';

            // Adjust the popup position
            const overlayPositioning = map.getPixelFromCoordinate(evt.coordinate);
            popupElement.style.left = overlayPositioning[0] + 'px';
            popupElement.style.top = (overlayPositioning[1] - popupElement.offsetHeight) + 'px'; // Adjust so the popup appears above the click
        } else {
            // No features found under the click, hide the popup.
            document.getElementById('popup').style.display = 'none';
        }
    });
}
