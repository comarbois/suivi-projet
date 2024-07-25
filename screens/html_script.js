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
    const map = L.map('map').setView([31.791702, -7.092620], 6); // Latitude and Longitude for Morocco with zoom level 6

    // Add OpenStreetMap tiles to the map
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Initialize a LayerGroup to manage markers
    let markersLayer = L.layerGroup().addTo(map);

    const projectIcon = L.icon({
      iconUrl: 'https://tbg.comarbois.ma/images/appel-marker.png',
      iconSize: [20, 20],
      iconAnchor: [20, 20],
      popupAnchor: [1, -34],
    });

    const clientIcon = L.icon({
      iconUrl: 'https://tbg.comarbois.ma/images/projet-marker.png',
      iconSize: [20, 20],
      iconAnchor: [20, 20],
      popupAnchor: [1, -34],
    });

    // Function to add multiple markers
    function addMarkers(locations) {
      console.log("Adding markers:", locations);
      markersLayer.clearLayers();

      locations.forEach(location => {
        if (location.lat != null && location.lon != null) {
          const wazeUrl = \`https://www.waze.com/ul?ll=\${location.lat},\${location.lon}&navigate=yes\`;
          const googleMapsUrl = \`https://www.google.com/maps/search/?api=1&query=\${location.lat},\${location.lon}\`;
          const icon = location.type == 'Client' ? clientIcon : projectIcon;

          const marker = L.marker([location.lat, location.lon], { icon: icon })
            .bindPopup(\`<b>\${location.name}</b><br>\${location.client}<br><a href="\${wazeUrl}" target="_blank">Waze</a> 
            <a href="\${googleMapsUrl}" style="margin-left:50px" target="_blank">Google Maps</a>\`)
            .openPopup();
          markersLayer.addLayer(marker);
        }
      });
    }

    // Function to set map view to user's location
    function setMapView(lat, lon, zoom) {
      console.log("Setting map view to:", lat, lon, zoom);
      map.setView([lat, lon], zoom);
    }

    // Expose functions to be called from React Native
    window.addMarkers = addMarkers;
    window.setMapView = setMapView;
  </script>
</body>
</html>
`;

export default html_script;
