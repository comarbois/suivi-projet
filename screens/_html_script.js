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
    const initialLat = 33.589886;
    const initialLon = -7.603869;

    // Initialize the map with a default view of Casablanca
    const map = L.map('map').setView([initialLat, initialLon], 13);

    // Add OpenStreetMap tiles to the map
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Function to add multiple markers
    function addMarkers(locations) {
      locations.forEach(location => {
        L.marker([location.lat, location.lon])
          .addTo(map)
          .bindPopup(location.name);
      });
    }

    // Expose addMarkers function to be called from React Native
    window.addMarkers = addMarkers;

    // Keep the map centered on Casablanca
    map.on('moveend', function() {
      map.setView([initialLat, initialLon], 13);
    });
  </script>
</body>
</html>
`;

export default html_script;
