const html_script = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Map</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.2/dist/leaflet.css" integrity="sha256-sA+zWATbFveLLNqWO2gtiw3HL/lh1giY/Inf1BJ0z14=" crossorigin=""/>
  <style>
    #map { height: 350px; }
    @media (min-height: 500px) {
      #map { height: 100vh; }
    }
  </style>
</head>
<body data-rsssl=1>
  <main>
    <div id="map"></div>
  </main>
  <script src="https://unpkg.com/leaflet@1.9.2/dist/leaflet.js" integrity="sha256-o9N1jGDZrf5tS+Ft4gbIK7mYMipq9lqpVJ91xHSyKhg=" crossorigin=""></script>
  <script>
    // Initialize the map with a default view
    const map = L.map('map').setView([33.589886, -7.603869], 10);

    // Add OpenStreetMap tiles to the map
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Initialize a LayerGroup to manage markers
    let markersLayer = L.layerGroup().addTo(map);

    // Function to add multiple markers
    function addMarkers(locations) {
      console.log("Adding markers:", locations);
      // Clear existing markers by removing the LayerGroup
      markersLayer.clearLayers();

      locations.forEach(location => {
        if (location.lat != null && location.lon != null) {
          const wazeUrl = \`https://www.waze.com/ul?ll=\${location.lat},\${location.lon}&navigate=yes\`;
          const googleMapsUrl = \`https://www.google.com/maps/search/?api=1&query=\${location.lat},\${location.lon}\`;
          const marker = L.marker([location.lat, location.lon])
            .bindPopup(\`<b>\${location.name}</b><br>\${location.client}<br><a href="\${wazeUrl}" target="_blank">Waze</a> 
            <a href="\${googleMapsUrl}" style="margin-left:50px" target="_blank">Google Maps</a>
            \`)
            .openPopup();
          markersLayer.addLayer(marker);
          console.log("Added marker:", marker);
        }
      });
      console.log("Markers added.");
    }

    // Expose addMarkers function to be called from React Native
    window.addMarkers = addMarkers;
  </script>
</body>
</html>
`;

export default html_script;
