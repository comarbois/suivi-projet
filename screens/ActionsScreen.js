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
  Platform,
} from 'react-native';
import Geolocation from 'react-native-get-location';
import {Picker} from '@react-native-picker/picker';
import AsyncStorage, {
  useAsyncStorage,
} from '@react-native-async-storage/async-storage';
import {useIsFocused} from '@react-navigation/native';

const ListProjectScreen = ({route, navigation}) => {
  const [value, setValue] = useState(0);
  useEffect(() => console.log(' value est ' + value), [value]);
  const {getItem, setItem} = useAsyncStorage('@storage_key');
  const readItemFromStorage = async () => {
    const user = JSON.parse(await AsyncStorage.getItem('user'));
    setValue(user.id);
  };
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [searchField, setSearchField] = useState('projet');
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState({});
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    // Fetch location using Geolocation
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
  }, []);

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      fetchProjects();
    }
  }, [latitude, longitude]);

  const fetchProjects = async () => {
    setLoading(true);

    const user = JSON.parse(await AsyncStorage.getItem('user'));
    const userId = user.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    fetch(
      `https://tbg.comarbois.ma/projet_api/api/projet/GetAllActions.php?userId=${userId}&q=${searchText}`,
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
        console.log(json);
        setData(json);
        setLoading(false);
      })
      .catch(error => {
        console.error(error);
        setError(error.message);
        setLoading(false);
      });
  };

  const handleCreateProject = () => {
    navigation.navigate('AddAction');
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

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'white',
        }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const handleSearch = () => {
    fetchProjects();
  };

  const handleProjectPress = project => {
    setSelectedProject(project);
    setShowModal(true);
  };

  const handleEditProject = project => {
    navigation.replace('EditAction', {project});
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

  const handleNearbyProjects = () => {
    if (!latitude || !longitude) {
      Alert.alert(
        'Erreur',
        "La récupération de la position n'est pas disponible",
      );
      navigation.navigate('Home');
      return;
    }

    const nearbyProjects = data.filter(project => {
      const distance = calculateDistance(
        latitude,
        longitude,
        project.latitude,
        project.longitude,
      );
      return distance <= 1; // Filter projects within 1 km radius
    });

    setData(nearbyProjects);
  };

  const renderProjectItem = ({item, index}) => {
    if (index % 2 === 0) {
      const nextItem = data[index + 1];

      return (
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.projectCard}
            onPress={() => handleProjectPress(item)}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.action}</Text>
              <Text
                style={[
                  styles.cardText,
                  {
                    color:
                      item.idClient != 0
                        ? 'green'
                        : item.idProjet != 0
                        ? 'blue'
                        : 'orange',
                  },
                ]}>
                {item.action_src}
              </Text>

              <Text style={styles.cardText}>
                {getFormattedDate(item.datePrevue)}
              </Text>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.cardButton}
                  onPress={() => handleEditProject(item)}>
                  <Image
                    source={require('../assets/modifier.png')}
                    style={styles.logo}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cardButton}
                  onPress={() =>
                    navigation.navigate('IMG', {images: item.images, actionId : item.id})
                  }>
                  <Image
                    source={require('../assets/imagee.png')}
                    style={styles.logo}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
          {nextItem && (
            <TouchableOpacity
              style={styles.projectCard}
              onPress={() => handleProjectPress(nextItem)}>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{nextItem.action}</Text>
                <Text
                  style={[
                    styles.cardText,
                    {
                      color:
                        nextItem.idClient != 0
                          ? 'green'
                          : nextItem.idProjet != 0
                          ? 'blue'
                          : 'orange',
                    },
                  ]}>
                  {nextItem.action_src}
                </Text>

                <Text style={styles.cardText}>
                  {getFormattedDate(nextItem.datePrevue)}
                </Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.cardButton}
                    onPress={() => handleEditProject(nextItem)}>
                    <Image
                      source={require('../assets/modifier.png')}
                      style={styles.logo}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cardButton}
                    onPress={() =>
                      navigation.navigate('IMG', {images: nextItem.images, actionId : nextItem.id})
                    }>
                    <Image
                      source={require('../assets/imagee.png')}
                      style={styles.logo}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>LISTE DES ACTIONS</Text>
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>Nombre de actions: {data.length}</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateProject}>
          <Text style={styles.createButtonText}>Créer une action</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={data}
        renderItem={renderProjectItem}
        keyExtractor={item => item.id.toString()}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
      />
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}>
              <Text style={styles.modalButtonText}>X</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Details Action</Text>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>ID:</Text>
              <Text style={styles.modalText}>{selectedProject.id}</Text>
            </View>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Auteur:</Text>
              <Text style={styles.modalText}>{selectedProject.name}</Text>
            </View>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Action:</Text>
              <Text style={styles.modalText}>{selectedProject.action}</Text>
            </View>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Source:</Text>
              <Text style={styles.modalText}>{selectedProject.action_src}</Text>
            </View>

            <View style={styles.labelContainer}>
              <Text style={styles.label}>Date Prevue:</Text>
              <Text style={styles.modalText}>
                {getFormattedDate(selectedProject.datePrevue)}
              </Text>
            </View>
            {selectedProject.dateRealisee != '0000-00-00' && (
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Date Prevue:</Text>
                <Text style={styles.modalText}>
                  {getFormattedDate(selectedProject.dateRealisee)}
                </Text>
              </View>
            )}
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Observation:</Text>
              <Text style={styles.modalText}>
                {selectedProject.observation}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
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
    flexDirection: 'row',
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
    paddingHorizontal: 20,
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
    width: '65%',
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

export default ListProjectScreen;
