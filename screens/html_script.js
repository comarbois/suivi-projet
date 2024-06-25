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
    const map = L.map('map').setView([33.589886, -7.603869], 13);

    // Add OpenStreetMap tiles to the map
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    let marker, circle;

    // Function to update the map with the user's current location
    function updateLocation(pos) {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const accuracy = pos.coords.accuracy;

      // Debugging logs
      console.log('Latitude:', lat);
      console.log('Longitude:', lng);
      console.log('Accuracy:', accuracy);

      // If markers already exist, remove them
      if (marker) {
        map.removeLayer(marker);
        map.removeLayer(circle);
      }

      // Add a new marker and circle to the map
      marker = L.marker([lat, lng]).addTo(map);
      circle = L.circle([lat, lng], { radius: accuracy }).addTo(map);

      // Set the view to the user's location
      map.setView([lat, lng], 13);
    }

    // Function to handle geolocation errors
    function error(err) {
      console.error('Geolocation error:', err);
      if (err.code === 1) {
        alert("Please allow geolocation access");
      } else if (err.code === 2) {
        alert("Position unavailable");
      } else if (err.code === 3) {
        alert("Timeout expired");
      } else {
        alert("An unknown error occurred");
      }
    }

    // Verify if geolocation is available
    if (navigator.geolocation) {
      console.log('Geolocation is supported');
      navigator.geolocation.watchPosition(updateLocation, error, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    } else {
      alert("Geolocation is not supported by your browser");
      console.error("Geolocation is not supported by your browser");
    }
  </script>
</body>
</html>


`

export default html_script