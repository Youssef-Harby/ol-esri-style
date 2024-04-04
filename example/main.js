import './style.css';
import { initializeMap, updateMapLayers, setupFeatureClickListener } from './layerManager';

document.addEventListener('DOMContentLoaded', async () => {
  // Function to parse query parameters for the map service URL
  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  // Initialize the map
  const map = initializeMap();

  // Set up feature click listener to display information
  setupFeatureClickListener(map);

  // Default Map Service URL
  const defaultMapServiceUrl = 'https://services3.arcgis.com/GVgbJbqm8hXASVYi/ArcGIS/rest/services/2020_Earthquakes/FeatureServer';

  // Get the map service URL from query parameters or use the default
  let mapServiceUrl = getQueryParam('arcgis') || defaultMapServiceUrl;

  // Update the map service URL input field with the retrieved or default URL
  const mapServiceUrlInput = document.getElementById('mapServiceUrlInput');
  mapServiceUrlInput.value = mapServiceUrl;

  // Load the initial map layers based on the provided URL
  updateMapLayers(map, mapServiceUrl);

  // Setup the load map button click event
  const loadMapBtn = document.getElementById('loadMapBtn');
  loadMapBtn.addEventListener('click', () => {
    mapServiceUrl = mapServiceUrlInput.value;
    if (!mapServiceUrl) {
      alert('Please enter a Map Service URL.');
      return;
    }
    // Update the map layers based on the new URL
    updateMapLayers(map, mapServiceUrl);
  });
});
