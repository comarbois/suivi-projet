import React, { Component } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  StatusBar,
} from 'react-native';

import {
  WebView
} from 'react-native-webview'

import html_script from './html_script';

class MapScreen extends Component {
  constructor(props) {
    super(props);
    this.mapRef = React.createRef();
  }

  _goToMyPosition = (lat, lon) => {
    this.mapRef.current.injectJavaScript(`
      map.setView([${lat}, ${lon}], 10)
      L.marker([${lat}, ${lon}]).addTo(map)
    `)
  }

  render() {
    return (
      <>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.Container}>
          <WebView ref={this.mapRef}  source={{html: html_script }} style={styles.Webview} originWhitelist={['*']} />
        </SafeAreaView>
      </>
    );
  }
  
};

const styles = StyleSheet.create({
  Container: {
    flex:1,
    padding: 10,
    backgroundColor: 'grey'
  
  },
  Webview: {
    flex: 2,
    
  },
  ButtonArea: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },

  ButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  }
});

export default MapScreen;

// import React, { Component } from 'react';
// import {
//   View,
//   Text,
//   SafeAreaView,
//   StyleSheet,
//   StatusBar,
// } from 'react-native';
// import { WebView } from 'react-native-webview';
// import { request, PERMISSIONS } from 'react-native-permissions';
// import Geolocation from 'react-native-geolocation-service';

// import html_script from './html_script';

// class MapScreen extends Component {
//   constructor(props) {
//     super(props);
//     this.mapRef = React.createRef();
//   }

//   _goToMyPosition = (lat, lon) => {
//     this.mapRef.current.injectJavaScript(`
//       mymap.setView([${lat}, ${lon}], 10)
//       L.marker([${lat}, ${lon}]).addTo(mymap)
//     `)
//   }

//   componentDidMount() {
//     this.requestLocationPermission();
//   }

//   requestLocationPermission = async () => {
//     const permission = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
//     if (permission === 'granted') {
//       Geolocation.getCurrentPosition(
//         (position) => {
//           const { latitude, longitude } = position.coords;
//           this._goToMyPosition(latitude, longitude);
//         },
//         (error) => console.log(error),
//         { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
//       );
//     } else {
//       console.log('Location permission denied');
//     }
//   }

//   render() {
//     return (
//       <>
//         <StatusBar barStyle="dark-content" />
//         <SafeAreaView style={styles.Container}>
//           <WebView ref={this.mapRef}  source={{html: html_script }} style={styles.Webview} originWhitelist={['*']} />
//         </SafeAreaView>
//       </>
//     );
//   }
  
// };

// const styles = StyleSheet.create({
//   Container: {
//     flex:1,
//     padding: 10,
//     backgroundColor: 'grey'
  
//   },
//   Webview: {
//     flex: 2,
    
//   },
//   ButtonArea: {
//     flex: 1,
//     flexDirection: 'row',
//     justifyContent: 'pace-around',
//     alignItems: 'center'
//   },
//   Button: {
//     width: 80,
//     padding: 10,
//     borderRadius: 10,
//     backgroundColor: 'black',
//     alignItems: 'center'
//   },
//   ButtonText: {
//     color: 'white',
//     fontWeight: 'bold',
//     fontSize: 14,
//   }
// });

// export default MapScreen;

//--------------


// import React, { useEffect, useState } from 'react';
// import { View, StyleSheet, PermissionsAndroid, Alert, Text } from 'react-native';
// import MapView, { Marker, Circle } from 'react-native-maps';
// import Geolocation from '@react-native-community/geolocation';

// const MapScreen = () => {
//   const [location, setLocation] = useState(null);

//   useEffect(() => {
//     const requestLocationPermission = async () => {
//       try {
//         const granted = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//           {
//             title: 'Location Permission',
//             message: 'This app needs access to your location',
//             buttonNeutral: 'Ask Me Later',
//             buttonNegative: 'Cancel',
//             buttonPositive: 'OK',
//           }
//         );
//         if (granted === PermissionsAndroid.RESULTS.GRANTED) {
//           console.log('You can use the location');
//           getLocation();
//         } else {
//           console.log('Location permission denied');
//         }
//       } catch (err) {
//         console.warn(err);
//       }
//     };

//     requestLocationPermission();
//   }, []);

//   const getLocation = () => {
//     Geolocation.watchPosition(
//       (position) => {
//         const { latitude, longitude, accuracy } = position.coords;
//         setLocation({
//           latitude,
//           longitude,
//           latitudeDelta: 0.01,
//           longitudeDelta: 0.01,
//           accuracy
//         });
//       },
//       (error) => {
//         Alert.alert('Error', JSON.stringify(error));
//       },
//       {
//         enableHighAccuracy: true,
//         timeout: 20000,
//         maximumAge: 1000,
//         distanceFilter: 10,
//       }
//     );
//   };

//   return (
//     <View style={styles.container}>
//       {location ? (
//         <MapView
//           style={styles.map}
//           initialRegion={{
//             latitude: location.latitude,
//             longitude: location.longitude,
//             latitudeDelta: 0.01,
//             longitudeDelta: 0.01,
//           }}
//           showsUserLocation={true}
//         >
//           <Marker coordinate={location} />
//           <Circle
//             center={location}
//             radius={location.accuracy}
//             strokeColor="rgba(158, 158, 255, 1)"
//             fillColor="rgba(158, 158, 255, 0.3)"
//           />
//         </MapView>
//       ) : (
//         <View style={styles.loading}>
//           <Text>Loading...</Text>
//         </View>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'flex-end',
//     alignItems: 'center',
//   },
//   map: {
//     ...StyleSheet.absoluteFillObject,
//   },
//   loading: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });

// export default MapScreen;
