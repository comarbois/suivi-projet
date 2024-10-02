import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
  Linking,
} from 'react-native';
import {RNCamera} from 'react-native-camera';
import {Picker} from '@react-native-picker/picker';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import Geolocation from 'react-native-get-location';
import AsyncStorage, {
  useAsyncStorage,
} from '@react-native-async-storage/async-storage';
import {Dropdown} from 'react-native-element-dropdown';
import {ActivityIndicator} from 'react-native-paper';
import {set} from 'date-fns';

const SearchablePicker = ({data, selectedValue, onValueChange}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState(data);

  const openModal = () => {
    setSearchText('');
    setFilteredData(data);
    setModalVisible(true);
  };

  const filterData = text => {
    const filtered = data.filter(item =>
      item.societe.toLowerCase().includes(text.toLowerCase()),
    );
    setFilteredData(filtered);
    setSearchText(text);
  };

  const selectItem = item => {
    onValueChange(item.client);
    setModalVisible(false);
  };

  return (
    <View style={styles.pickerContainer}>
      <TouchableOpacity style={styles.pickerTouchable} onPress={openModal}>
        <Text style={styles.pickerText}>
          {selectedValue
            ? data.find(item => item.client === selectedValue)?.societe
            : 'Choisir Client'}
        </Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            value={searchText}
            onChangeText={filterData}
          />
          <FlatList
            data={filteredData}
            keyExtractor={item => item.client.toString()}
            renderItem={({item}) => (
              <TouchableOpacity
                onPress={() => selectItem(item)}
                style={styles.item}>
                <Text>{item.societe}</Text>
              </TouchableOpacity>
            )}
          />
          <Button title="Fermer" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>
    </View>
  );
};

const PhotoScreen = ({route, navigation}) => {
  const [value, setValue] = useState(0);
  const readItemFromStorage = async () => {
    const user = JSON.parse(await AsyncStorage.getItem('user'));
    setValue(user.id);
  };

  const [selectedLieu, setSelectedLieu] = useState('');

  const [showInputs, setShowInputs] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [confirmedPhotos, setConfirmedPhotos] = useState([]);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [loading, setLoading] = useState(true);
  const cameraRef = useRef(null);
  const projetId = route.params?.projetId ?? 0;
  const actionId = route.params?.actionId ?? 0;
  const [selectedSrc, setSelectedSrc] = useState('projet');

  const [adresse, setAdresse] = useState('');

  const [existingProjects, setExistingProjects] = useState([]);
  const [selectedExistingProject, setSelectedExistingProject] = useState(0);
  const [existingActions, setExistingActions] = useState([]);
  const [selectedExistingAction, setSelectedExistingAction] = useState(0);
  const [existingClients, setExistingClients] = useState([]);
  const [selectedExistingClient, setSelectedExistingClient] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (projetId > 0) {
      setSelectedSrc('projet');
      setSelectedExistingProject(projetId);
    }
    if (actionId > 0) {
      setSelectedSrc('action');
      setSelectedExistingAction(actionId);
    }

    readItemFromStorage();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchExistingActions();
      await fetchExistingProjects();
      await fetchExistingClients();
      setLoading(false);
    };
    if (value > 0) {
      fetchData();
    }
  }, [value]);

  useEffect(() => {
    const requestCameraPermission = async () => {
      try {
        let result = await check(PERMISSIONS.ANDROID.CAMERA);
        if (result === RESULTS.DENIED) {
          result = await request(PERMISSIONS.ANDROID.CAMERA);
        }
        setHasCameraPermission(result === RESULTS.GRANTED);
      } catch (error) {
        console.error('Failed to request camera permission:', error);
        setHasCameraPermission(false);
      }
    };
    requestCameraPermission();
  }, []);

  const fetchExistingProjects = async () => {
    try {
      const response = await fetch(
        'https://tbg.comarbois.ma/projet_api/api/projet/listprojet.php?userId=' +
          value,
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setExistingProjects(data);
    } catch (error) {
      console.error('Error fetching existing projects:', error);
    }
  };

  const fetchExistingActions = async () => {
    try {
      const response = await fetch(
        'https://tbg.comarbois.ma/projet_api/api/projet/GetAllActions.php?userId=' +
          value,
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();

      setExistingActions(data);
    } catch (error) {
      console.error('Error fetching existing actions:', error);
    }
  };

  const fetchExistingClients = async () => {
    try {
      const response = await fetch(
        'https://tbg.comarbois.ma/projet_api/api/projet/Getclients.php?userId=' +
          value,
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setExistingClients(data);
    } catch (error) {
      console.error('Error fetching existing clients:', error);
    }
  };

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
      });
  }, []);

  useEffect(() => {
    if (!latitude && !longitude) {
      setLoading(true);
    } else {
      setLoading(false);
      console.log('latitude:', latitude, 'longitude:', longitude);
      fetch(
        `https://nominatim.openstreetmap.org/search.php?q=${latitude},${longitude}&polygon_geojson=1&format=json&accept-language=fr`,
      )
        .then(response => response.json())
        .then(data => {
          setAdresse(data[0]?.display_name);
        })
        .catch(error => {
          console.error('Error:', error);
        });
    }
  }, [latitude, longitude]);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const options = {quality: 0.5, base64: true};
        const data = await cameraRef.current.takePictureAsync(options);
        setPhoto(data.uri);
      } catch (error) {
        console.error('Failed to take picture:', error);
      }
    } else {
      console.error('Camera reference is not available');
    }
  };

  const cancelPicture = () => {
    setPhoto(null);
  };

  const confirmPhoto = async () => {
    if (photo) {
      try {
        const response = await fetch(photo);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result;
          setConfirmedPhotos([...confirmedPhotos, base64data]);
          setPhoto(null);
          setShowInputs(true);
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error('Failed to convert photo to base64:', error);
      }
    }
  };

  const deletePhoto = uri => {
    setConfirmedPhotos(confirmedPhotos.filter(photo => photo !== uri));
  };

  const handleSubmit = async () => {
    if (selectedSrc === 'projet' && selectedExistingProject === 0) {
      Alert.alert('Erreur', 'Veuillez choisir un projet', [
        {
          text: 'OK',
        },
      ]);
      return;
    }

    if (selectedSrc === 'action' && selectedExistingAction === 0) {
      Alert.alert('Erreur', 'Veuillez choisir une action', [
        {
          text: 'OK',
        },
      ]);
      return;
    }

    if (selectedSrc === 'client' && selectedExistingClient === 0) {
      Alert.alert('Erreur', 'Veuillez choisir un client', [
        {
          text: 'OK',
        },
      ]);
      return;
    }

    if (selectedSrc === 'client' && selectedLieu === '') {
      Alert.alert('Erreur', 'Veuillez choisir un lieu', [
        {
          text: 'OK',
        },
      ]);
      return;
    }

    if (confirmedPhotos.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter des photos', [
        {
          text: 'OK',
        },
      ]);
      return;
    }

    const data = {
      projetId: selectedExistingProject,
      actionId: selectedExistingAction,
      clientId: selectedExistingClient,
      source: selectedSrc,
      latitude,
      longitude,
      adresse,
      photos: confirmedPhotos,
      userId: value,
      lieu: selectedLieu,
    };

    console.log('Data:', data.source);

    try {
      setSubmitting(true);
      const response = await fetch(
        'https://tbg.comarbois.ma/projet_api/api/projet/GeolocalisationCOM.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        },
      );

      console.log('Response:', response);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const result = await response.json();
      console.log('Result:', result);
      Alert.alert('Succès', 'Photos enregistrées avec succès', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('Home');
          },
        },
      ]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="red" />
      ) : (
        <>
          {showInputs ? (
            <View style={styles.inputContainer}>
              <Text style={styles.title}>Details Projet</Text>
              <Text style={styles.text}>{`${latitude}`}</Text>
              <Text style={styles.text}>{`${longitude}`}</Text>

              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  disabled={projetId > 0 || actionId > 0}
                  style={[
                    styles.pickerButton,
                    selectedSrc === 'projet' && styles.selectedPickerButton,
                  ]}
                  onPress={() => {
                    setSelectedSrc('projet');
                    setSelectedExistingAction(0);
                    setSelectedExistingClient(0);
                    setSelectedExistingProject(0);
                  }}>
                  <Text style={styles.pickerButtonText}>Projet / Chantier</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.pickerButton,
                    selectedSrc === 'action' && styles.selectedPickerButton,
                  ]}
                  disabled={projetId > 0 || actionId > 0}
                  onPress={() => {
                    setSelectedSrc('action');
                    setSelectedExistingAction(0);
                    setSelectedExistingClient(0);
                    setSelectedExistingProject(0);
                  }}>
                  <Text style={styles.pickerButtonText}>Action</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.pickerButton,
                    selectedSrc === 'client' && styles.selectedPickerButton,
                  ]}
                  disabled={projetId > 0 || actionId > 0}
                  onPress={() => {
                    setSelectedSrc('client');
                    setSelectedExistingAction(0);
                    setSelectedExistingClient(0);
                    setSelectedExistingProject(0);
                  }}>
                  <Text style={styles.pickerButtonText}>Client</Text>
                </TouchableOpacity>
              </View>

              {selectedSrc === 'projet' && (
                <Dropdown
                  data={existingProjects}
                  valueField={'id'}
                  labelField={'designation'}
                  placeholder="Choisir Projet"
                  search
                  value={selectedExistingProject}
                  searchField={['designation']}
                  style={styles.dropdown}
                  onChange={value => {
                    setSelectedExistingProject(value.id);
                    console.log(value.id);
                  }}
                  disable={projetId > 0 || actionId > 0}
                />
              )}
              {selectedSrc === 'action' && (
                <Dropdown
                  data={existingActions}
                  valueField={'id'}
                  labelField={'designation_act'}
                  placeholder="Choisir Action"
                  value={selectedExistingAction}
                  search
                  searchField={['designation_act']}
                  style={styles.dropdown}
                  onChange={value => {
                    setSelectedExistingAction(value.id);
                    console.log(value.id);
                  }}
                  disable={projetId > 0 || actionId > 0}
                />
              )}
              {selectedSrc === 'client' && (
                <>
                  <Dropdown
                    data={existingClients}
                    valueField={'id'}
                    labelField={'societe'}
                    placeholder="Choisir Client"
                    search
                    searchField={['societe']}
                    style={styles.dropdown}
                    value={selectedExistingClient}
                    onChange={value => {
                      setSelectedExistingClient(value.id);
                      console.log(value.id);
                    }}
                    disable={projetId > 0 || actionId > 0}
                  />
                  <View style={styles.pickerContainer}>
                    <TouchableOpacity
                      style={[
                        styles.pickerButton,
                        selectedLieu === 'Depot Principale' &&
                          styles.selectedPickerButton,
                      ]}
                      onPress={() => {
                        setSelectedLieu('Depot Principale');
                      }}>
                      <Text style={styles.pickerButtonText}>
                        Dépôt Principale
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.pickerButton,
                        selectedLieu === 'Autre Lieu' &&
                          styles.selectedPickerButton,
                      ]}
                      onPress={() => {
                        setSelectedLieu('Autre Lieu');
                      }}>
                      <Text style={styles.pickerButtonText}>Autre Lieu</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              <ScrollView style={styles.photoContainer}>
                {confirmedPhotos.map((uri, index) => (
                  <View key={index} style={styles.photoWrapper}>
                    <Image source={{uri}} style={styles.confirmedPhoto} />
                    <TouchableOpacity
                      onPress={() => deletePhoto(uri)}
                      style={styles.deleteButton}>
                      <Text style={styles.deleteButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.buttonContainerr}>
                <TouchableOpacity
                  onPress={() => setShowInputs(false)}
                  style={[styles.button]}>
                  <Text style={styles.buttonText}>Ajouter Photos</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={submitting}
                  onPress={handleSubmit}
                  style={[styles.buttonConfirm]}>
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Enregistrer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.cameraContainer}>
              {photo ? (
                <Image source={{uri: photo}} style={styles.preview} />
              ) : (
                <RNCamera
                  ref={cameraRef}
                  style={styles.camera}
                  type={RNCamera.Constants.Type.back}
                  flashMode={RNCamera.Constants.FlashMode.auto}
                  androidCameraPermissionOptions={{
                    title: 'Permission to use camera',
                    message: 'We need your permission to use your camera',
                    buttonPositive: 'Ok',
                    buttonNegative: 'Cancel',
                  }}
                  captureAudio={false}
                />
              )}
              <View style={styles.buttonContainer}>
                {photo ? (
                  <>
                    <TouchableOpacity
                      onPress={cancelPicture}
                      style={styles.button}>
                      <Text style={styles.buttonText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={confirmPhoto}
                      style={styles.buttonConfirm}>
                      <Text style={styles.buttonText}>Confirmer Photo</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    onPress={takePicture}
                    style={styles.circularButton}>
                    <Text style={styles.circularButtonText}></Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  preview: {
    flex: 1,
  },
  photoContainer: {
    width: '100%',
    paddingHorizontal: 5,
  },
  photoWrapper: {
    position: 'relative',
    width: '100%',
    marginVertical: 5,
  },
  dropdown: {
    width: '95%',
    height: 50,
    backgroundColor: 'transparent',
    borderColor: 'gray',
    borderWidth: 0.5,
    borderRadius: 5,
    marginBottom: 10,
    padding: 5,
    color: 'black',
  },
  confirmedPhoto: {
    width: '100%',
    height: 300,
    borderRadius: 1,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'red',
    borderRadius: 5,
    padding: 5,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  buttonContainer: {
    flex: 0.2,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
  },
  buttonContainerr: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
  },
  button: {
    backgroundColor: 'red',
    borderRadius: 5,
    padding: 15,
    margin: 10,
    alignItems: 'center',
  },
  buttonConfirm: {
    backgroundColor: 'green',
    borderRadius: 5,
    padding: 15,
    margin: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  circularButton: {
    width: 60,
    height: 60,
    backgroundColor: '#000',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
    color: 'black',
  },
  textInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    width: '80%',
    borderRadius: 5,
  },
  pickerContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  pickerButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedPickerButton: {
    backgroundColor: 'green',
  },
  pickerButtonText: {
    fontSize: 14,
  },

  pickerTouchable: {
    paddingVertical: 12,
  },
  pickerText: {
    fontSize: 13,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  item: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});

export default PhotoScreen;
