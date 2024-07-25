import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Pressable,
} from 'react-native';
import {WebView} from 'react-native-webview';
import html_script from './html_script';
import AsyncStorage, {
  useAsyncStorage,
} from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-get-location';

const MapScreen2 = () => {
  const [value, setValue] = useState(0);
  const {getItem, setItem} = useAsyncStorage('@storage_key');
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchField, setSearchField] = useState('projet');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [data, setData] = useState([]);
  const [selectedSrc, setSelectedSrc] = useState('client');
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    console.log(selectedSrc);
    if (selectedSrc === 'projet') {
      showLocations(projects, 'projet');
    } else {
      showLocations(clients, 'clients');
    }
  }, [selectedSrc, projects, clients]);

  const showLocations = async (_data, src) => {
    try {
      let locations = [];
      if (src === 'projet') {
        console.log(_data);
        locations = _data
        .filter(item => item.latitude != null && item.longitude != null)
        .map(item => ({
          name: item.projet,
          client: item.idClient > 0 ? item.rs + ' (C)' : item.nouveau + ' (P)',
          type: item.idClient > 0 ? 'Client' : 'Prospect',
          lat: parseFloat(item.latitude),
          lon: parseFloat(item.longitude),
        }));
      }else{
        console.log(_data);
       locations =  _data
        .filter(item => item.latitude != null && item.longitude != null)
        .map(item => ({
          name: item.rs,
          client: item.type,
          type: item.type == 'depot' ? 'Client' : 'Prospect',
          lat: parseFloat(item.latitude),
          lon: parseFloat(item.longitude),
        }));
      }

      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
        window.setMapView(${latitude}, ${longitude}, 15);
          window.addMarkers(${JSON.stringify(locations)});
          true;
        `);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };
  const deg2rad = deg => {
    return deg * (Math.PI / 180);
  };

  const handleNearbyProjects = (selected) => {
    if (!latitude || !longitude) {
      Alert.alert(
        'Location Error',
        'Cannot fetch nearby projects. Please enable location services.',
      );
      return;
    }

    if(selectedSrc === 'projet'){
      const nearbyProjects = projects.filter(project => {
        const distance = calculateDistance(
          latitude,
          longitude,
          parseFloat(project.latitude),
          parseFloat(project.longitude),
        );
        return distance <= 1;
      });
      showLocations(nearbyProjects, 'projet');
    }
    if(selectedSrc === 'client'){
      const nearbyClients = clients.filter(client => {
        const distance = calculateDistance(
          latitude,
          longitude,
          parseFloat(client.latitude),
          parseFloat(client.longitude),
        );
        return distance <= 1;
      });
      showLocations(nearbyClients, 'clients');
    }
  };


  const fetchClients = async () => {
    setLoading(true);
    const user = JSON.parse(await AsyncStorage.getItem('user'));
    const userId = user.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    fetch(
      `https://tbg.comarbois.ma/projet_api/api/projet/ClientsMap.php?q=${encodeURIComponent(
        searchText,
      )}&userId=${userId}`,
    )
      .then(response => {
        if (!response.ok) {
          ToastAndroid.show('Erreur de system', ToastAndroid.SHORT);
        }
        return response.json();
      })
      .then(json => {
        console.log(json);
        if (!Array.isArray(json)) {
          throw new Error('Invalid data format');
        }

        
        
        setClients(json);

        setLoading(false);
      })
      .catch(error => {
        ToastAndroid.show('Erreur de system', ToastAndroid.SHORT);
        console.log(error);
        setLoading(false);
      });
  };

  const fetchProjects = async () => {
    if (latitude === null || longitude === null) {
      Alert.alert(
        'Erreur',
        "La récupération de la position n'est pas disponible",
      );
      navigation.navigate('Home');
      return;
    }

    setLoading(true);
    const user = JSON.parse(await AsyncStorage.getItem('user'));
    const userId = user.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    fetch(
      `https://tbg.comarbois.ma/projet_api/api/projet/listprojet.php?userId=${userId}&q=${searchText}&type=${searchField}`,
    )
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(json => {

        if (!Array.isArray(json)) {
          throw new Error('Invalid data format');
        }
        setProjects(json);
        console.log(json);
        setLoading(false);
      })
      .catch(error => {
        console.error(error);
        //setError(error.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    const readItemFromStorage = async () => {
      
      const user = JSON.parse(await AsyncStorage.getItem('user'));
      console.log('user est ' + user.status);
      setValue(user.id);
      setStatus(user.status);
      
    };

    const getLocation = async () => {
      Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
      })
        .then(location => {
          setLatitude(location.latitude);
          setLongitude(location.longitude);
          
        })
        .catch(error => {
          console.error(error);
          // Handle error if location fetching fails
        })
        .finally(() => {
          readItemFromStorage();
          setLoading(false);
        });
    };
    readItemFromStorage();
    getLocation();
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      if (latitude !== null && longitude !== null) {

        if(status !== 'CC'){
          await fetchProjects();
        }
        await fetchClients();
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            window.setMapView(${latitude}, ${longitude}, 13);
            true;
          `);
        }
      }
    };
    fetchData();
  }, [latitude, longitude]);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.Container}>
        <View style={styles.flex}>
         
          <Pressable
            style={[
              styles.select,
              selectedSrc === 'client' ? {backgroundColor: '#b5e8ff'} : '',
            ]}
            onPress={() => {
              setSelectedSrc('client');
            }}>
            <Text> Client</Text>
          </Pressable>
          {status !== 'CC' && (
            <Pressable
            style={[
              styles.select,
              selectedSrc === 'projet' ? {backgroundColor: '#b5e8ff'} : '',
            ]}
            disabled={status == 'CC'}
            onPress={() => {
              setSelectedSrc('projet');
            }}>
            <Text> Projet</Text>
          </Pressable>
          )}
        </View>
        <WebView
          ref={webViewRef}
          source={{html: html_script}}
          style={styles.Webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onError={syntheticEvent => {
            const {nativeEvent} = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
          }}
          onMessage={event => {
            console.log(event.nativeEvent.data);
          }}
        />
        <TouchableOpacity
          style={styles.nearbyButton}
          onPress={handleNearbyProjects}>
          <Text style={styles.nearbyButtonText}>A proximité</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  Container: {
    flex: 1,
    padding: 10,
    backgroundColor: 'grey',
  },
  Webview: {
    height: '80%',
  },
  ButtonArea: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  select: {
    borderColor: 'gray',
    borderWidth: 1,
    padding: 8,
    borderRadius: 5,
    textAlign: 'center',
    backgroundColor: 'white',
  },
  Button: {
    width: 150,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'black',
    alignItems: 'center',
  },
  ButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 2,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: 40,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginRight: 16,
  },
  searchButton: {
    marginLeft: 8,
    padding: 8,
  },
  logo: {
    width: 30,
    height: 30,
  },
  nearbyButton: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  nearbyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  flex: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
});

export default MapScreen2;
