import Geolocation from 'react-native-get-location';
import {Picker} from '@react-native-picker/picker';
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Linking,
  Alert,
  ToastAndroid,
} from 'react-native';
import AsyncStorage, { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { set } from 'date-fns';
import { se } from 'date-fns/locale';

const ItinirairesScreen = () => {
  const [value, setValue] = useState(0);
  const {getItem, setItem} = useAsyncStorage('@storage_key');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const openInMaps = (latitude, longitude) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [numRows, setNumRows] = useState(0);

  const openInWaze = (latitude, longitude) => {
    const url = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
    Linking.openURL(url);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1); // deg2rad below
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  };

  const deg2rad = deg => {
    return deg * (Math.PI / 180);
  };

  const handleNearbyProjects = () => {
    if (!latitude || !longitude) {
      Alert.alert(
        'Location Error',
        'Cannot fetch nearby projects. Please enable location services.',
      );
      return;
    }

    const nearbyProjects = data.filter(project => {
      const distance = calculateDistance(
        latitude,
        longitude,
        project.latitude,
        project.longitude,
      );
      return distance <= 1; 
    });

    setNumRows(nearbyProjects.length);
    setData(nearbyProjects);
  };

  const fetchClients = () => {
    setLoading(true);
   
    fetch(
      `https://tbg.comarbois.ma/projet_api/api/projet/Itiniraire.php?q=${encodeURIComponent(searchText)}&userId=${value}`,
    )
      .then(response => {
        if (!response.ok) {
          ToastAndroid.show('Erreur de system', ToastAndroid.SHORT);
        }
        return response.json();
      })
      .then(json => {
       
    
        if (!Array.isArray(json)) {
          throw new Error('Invalid data format');
        }
        setData(json);
        
        setLoading(false);
      })
      .catch(error => {
        ToastAndroid.show('Erreur de system', ToastAndroid.SHORT);
        console.log(error);
        setLoading(false);
      });
  };
  const getFormattedDate = date => {
    if (date === '0000-00-00') {
      return date;
    } else {
      const options = {year: 'numeric', month: 'long', day: 'numeric'};
      const dateObject = new Date(date);
      dateObject.setHours(0, 0, 0, 0); // set hours, minutes, seconds, and milliseconds to 0
      return dateObject.toLocaleDateString('fr-FR', options);
    }
  };

  const [searchText, setSearchText] = useState('');
  const handleSearch = () => {
    fetchClients();
  };

  useEffect(() => {
    const readItemFromStorage = async () => {
      const user = JSON.parse(await AsyncStorage.getItem('user'));
      setValue(user.id);
    };
    readItemFromStorage();
  
  }, []);

  useEffect(() => {
    if(value > 0){
      Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 15000,
      })
        .then((location) => {
          setLatitude(location.latitude);
          setLongitude(location.longitude);
        })
        .catch((error) => {
          console.error(error);
          // Handle error if location fetching fails
        });
  
      fetchClients();
    }
  }, [value]);

  const renderClientItem = ({item, index}) => {
   
      

      

      return (
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.projectCard}
            onPress={() => handleProjectPress(item)}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.rs}</Text>
              <Text style={item.type == 'chantier' ? styles.rsText : styles.nouveauText}>{item.type?.toUpperCase()}</Text>

              <Text style={styles.cardText}>
                {item.adresse?.slice(0, 100)}...
              </Text>
              <Text style={styles.cardText}>
                {getFormattedDate(item.dateAction)}
              </Text>
            </View>
          
           <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.cardButton}
                onPress={() => openInMaps(item.latitude, item.longitude)}>
                <Image
                  source={require('../assets/maps.png')}
                  style={styles.logo}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cardButton}
                onPress={() => openInWaze(item.latitude, item.longitude)}>
                <Image
                  source={require('../assets/waze.png')}
                  style={styles.logo}
                />
              </TouchableOpacity>
            </View>
          
          </TouchableOpacity>
        </View>
      );
    
    
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>LISTE DES CLIENTS</Text>
      </View>
      <View style={styles.searchContainer}>
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
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>Nombre de Clients: {data.length}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="black" />
      ) : data.length > 0 ? (
        <>
          <FlatList
            data={data}
            renderItem={renderClientItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
          <TouchableOpacity
            style={styles.nearbyButton}
            onPress={handleNearbyProjects}>
            <Text style={styles.nearbyButtonText}>A proximité</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text>Aucun client trouvé</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  rsText: {
    color: 'green',
  },
  nouveauText: {
    color: 'orange',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
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
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 16,
    color: 'black',
  },
  createButton: {
    padding: 8,
    backgroundColor: 'green',
    borderRadius: 4,
  },
  nearbyButton: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  nearbyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  projectCard: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: 'white',
    elevation: 10,
    marginHorizontal: 5,
  },
  cardContent: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 3,
    color: 'black',
  },
  cardText: {
    fontSize: 12,
    marginBottom: 3,
    color: 'black',
  },
  cardActions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    
  },
  cardButton: {
  
    padding: 5,
  },
  listContent: {
    paddingBottom: 16,
  },
  separator: {
    height: 10,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 1,
    right: 1,
    padding: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    padding: 20,
    color: 'black',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 6,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  modalButton: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    color: 'black',
    fontSize: 25,
  },
  labelContainer: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    width: 130,
  },
  logo: {
    width: 30,
    height: 30,
  },
});

export default ItinirairesScreen;
