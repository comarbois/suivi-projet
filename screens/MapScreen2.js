import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Image,
  TextInput,
} from 'react-native';
import {WebView} from 'react-native-webview';
import html_script from './html_script';
import {useAsyncStorage} from '@react-native-async-storage/async-storage';
import {Picker} from '@react-native-picker/picker';
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
  const handleSearch = () => {
    fetchProjects();
  };

  useEffect(() => {
      showLocations(data);
  }
  , [data]);

  const showLocations = async (_data) => {
    try {

      const locations = _data
  .filter(item => item.latitude != null && item.longitude != null)
  .map(item => ({
    name: item.projet,
    client: item.idClient > 0 ? item.rs + ' (C)' : item.nouveau + ' (P)',
    lat: parseFloat(item.latitude),
    lon: parseFloat(item.longitude),
  }));

      

      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
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
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; 
    return distance;
  };
  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  const handleNearbyProjects = () => {
    if (!latitude || !longitude) {
      Alert.alert('Erreur', 'La récupération de la position n\'est pas disponible');
      navigation.navigate('Home');
      return;
    }

    const nearbyProjects = data.filter((project) => {
      const distance = calculateDistance(latitude, longitude, project.latitude, project.longitude);
      return distance <= 1; 
    });
    

    setData(nearbyProjects);
  };




  const fetchProjects = () => {
    if(latitude === null || longitude === null) {
      Alert.alert('Erreur', 'La récupération de la position n\'est pas disponible')
      navigation.navigate('Home');
      return;
    }
    
    setLoading(true);
    getItem().then((userId) => {
      if (!userId) {
        setLoading(false);
        return;
      }

      
      fetch(`https://tbg.comarbois.ma/projet_api/api/projet/listprojet.php?userId=${userId}&q=${searchText}&type=${searchField}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then((json) => {
          console.log(json[0].adresse);
          
          if (!Array.isArray(json)) {
            throw new Error("Invalid data format");
          }
          setData(json);
          setLoading(false);
        })
        .catch((error) => {
          setError(error.message);
          setLoading(false);
        });
    });
  };


  useEffect(() => {
    const readItemFromStorage = async () => {
      const item = await getItem();
      setValue(item);
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
    if (latitude !== null && longitude !== null) {
      fetchProjects();
    }
  }, [latitude, longitude]);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.Container}>
        {/* <View style={styles.searchContainer}>
          <Picker
            selectedValue={searchField}
            style={{height: 50, width: 130}}
            onValueChange={itemValue => setSearchField(itemValue)}>
            <Picker.Item label="Projet" value="projet" />
            <Picker.Item label="Client" value="rs" />
            <Picker.Item label="Prospect" value="nouveau" />
          </Picker>
          <TextInput
            style={styles.searchInput}
            placeholder=""
            value={searchText}
            onChangeText={text => setSearchText(text)}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Image
              source={require('../assets/rechercher.png')}
              style={styles.logo}
            />
          </TouchableOpacity>
        </View> */}
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
        <TouchableOpacity style={styles.nearbyButton} onPress={handleNearbyProjects}>
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
});

export default MapScreen2;
