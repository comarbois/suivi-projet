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
import {useAsyncStorage} from '@react-native-async-storage/async-storage';
import {Dropdown} from 'react-native-element-dropdown';
import {ActivityIndicator} from 'react-native-paper';
import {set} from 'date-fns';
import {useIsFocused} from '@react-navigation/native';

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
  const {getItem, setItem} = useAsyncStorage('@storage_key');
  const readItemFromStorage = async () => {
    const item = await getItem();
    setValue(item);
  };

  const [client, setClient] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [projet, setProjet] = useState('');
  const [chantier, setChantier] = useState('');
  const [observation, setObservation] = useState('');
  const [showInputs, setShowInputs] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [confirmedPhotos, setConfirmedPhotos] = useState([]);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [projetType, setProjetType] = useState('');
  const [clientType, setClientType] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [existingProjects, setExistingProjects] = useState([]);
  const [selectedExistingProject, setSelectedExistingProject] = useState(0);
  const cameraRef = useRef(null);
  const projectId = route.params?.projectId ?? 0;
  const isFocused = useIsFocused();
  const [adresse, setAdresse] = useState('');

  useEffect(() => {
    console.log('projext', projectId);
    readItemFromStorage();
  }, []);

  useEffect(() => {
    if (value > 0 && projectId == 0) {
      fetchExistingProjects();
    } else {
      setProjetType('existing');
      setSelectedExistingProject(projectId);
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
      setLoading(true);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch location using Geolocation
    Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
    })
      .then((location) => {
        setLatitude(location.latitude);
        setLongitude(location.longitude);
      })
      .catch((error) => {
        console.error(error);
        // Handle error if location fetching fails
      })
  }, []);

  useEffect(() => {
    if (!latitude && !longitude) {
      setLoading(true);
     
    } else {
      setLoading(false);
      console.log('latitude:', latitude, 'longitude:', longitude);
      fetch(`https://nominatim.openstreetmap.org/search.php?q=${latitude},${longitude}&polygon_geojson=1&format=json&accept-language=fr`)
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

    if(latitude == null || longitude == null){
      Alert.alert('Erreur', 'Veuillez activer la localisation GPS');
      navigation.replace("Home")
      return;
    }

    const data = {
      value,
      client,
      nouveau,
      clientType,
      observation,
      latitude,
      longitude,
      photos: confirmedPhotos,
      projetType,
      projet: projetType === 'new' ? projet : '',
      chantier: projetType === 'new' ? chantier : '',
      selectedExistingProject:
        projetType === 'existing' ? selectedExistingProject : '',
      adresse,
    };

    try {
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(
        'https://tbg.comarbois.ma/projet_api/api/projet/ProjetDet.php',
        {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(data),
        },
      );

      const responseData = await response.json();
      

      if (responseData.status === 'success') {
        Alert.alert('Succès', 'Le projet a été enregistré avec succès');
        setClient('');
        setNouveau('');
        setProjet('');
        setClientType('');
        setProjetType('');
        setChantier('');
        setObservation('');
        setConfirmedPhotos([]);
        navigation.replace('List');
      } else {
        Alert.alert('Erreur', "Erreur lors de l'enregistrement du projet");
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Erreur', "Erreur lors de l'enregistrement du projet");
    }
  };

  useEffect(() => {
    fetch('https://tbg.comarbois.ma/projet_api/api/projet/Getclients.php')
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
        setData(json);
        setLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  const shouldShowOtherInputs = () => {
    return (projetType && clientType) || showInputs;
  };
  const handleClientTypeChange = type => {
    // Reset client and nouveau fields when switching client type
    setClient('');
    setNouveau('');
    setClientType(type);
  };
  const handleProjetTypeChange = type => {
    setProjet('');
    setChantier('');
    setObservation('');
    setSelectedExistingProject('');
    setProjetType(type);
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
                  style={[
                    styles.pickerButton,
                    projetType === 'existing' && styles.selectedPickerButton,
                  ]}
                  disabled={projectId > 0}
                  onPress={() => handleProjetTypeChange('existing')}>
                  <Text style={styles.pickerButtonText}>Projet Existant</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.pickerButton,
                    projetType === 'new' && styles.selectedPickerButton,
                  ]}
                  disabled={projectId > 0}
                  onPress={() => handleProjetTypeChange('new')}>
                  <Text style={styles.pickerButtonText}>Nouveau Projet</Text>
                </TouchableOpacity>
              </View>
              {projetType === 'existing' ? (
                projectId == 0 && (
                  <Dropdown
                    data={existingProjects}
                    labelField={'designation'}
                    valueField={'id'}
                    value={selectedExistingProject}
                    onChange={item =>
                      setSelectedExistingProject(item.id.toString())
                    }
                    placeholder={'Selectioner un projet'}
                    style={styles.dropdown}
                    search
                    searchField="designation"
                    searchPlaceholder="Chercher un projet"
                    inputSearchStyle={{color: 'black'}}
                  />
                )
              ) : (
                <>
                  <View style={styles.pickerContainer}>
                    <TouchableOpacity
                      style={[
                        styles.pickerButton,
                        clientType === 'client' && styles.selectedPickerButton,
                      ]}
                      onPress={() => handleClientTypeChange('client')}>
                      <Text style={styles.pickerButtonText}>Client</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.pickerButton,
                        clientType === 'prospect' &&
                          styles.selectedPickerButton,
                        clientType === 'prospect' && {
                          backgroundColor: 'orange',
                        },
                      ]}
                      onPress={() => handleClientTypeChange('prospect')}>
                      <Text style={styles.pickerButtonText}>Nouveau</Text>
                    </TouchableOpacity>
                  </View>
                  {clientType === 'client' && (
                    <>
                      <View style={styles.row}>
                        <Text style={styles.label}>Client/Prospect:</Text>
                        <SearchablePicker
                          data={data}
                          selectedValue={client}
                          onValueChange={value => {
                            console.log(`Selected client: ${value}`);
                            setClient(value);
                          }}
                        />
                      </View>
                    </>
                  )}
                  {clientType === 'prospect' && (
                    <TextInput
                      style={styles.textInput}
                      placeholder="Nouveau"
                      value={nouveau}
                      onChangeText={text => setNouveau(text)}
                    />
                  )}
                  <TextInput
                    style={styles.textInput}
                    placeholder="Projet"
                    onChangeText={setProjet}
                    value={projet}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Chantier"
                    onChangeText={text => setChantier(text)}
                    value={chantier}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Observation"
                    onChangeText={text => setObservation(text)}
                    value={observation}
                  />
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
                  onPress={handleSubmit}
                  style={[styles.buttonConfirm]}>
                  <Text style={styles.buttonText}>Enregistrer</Text>
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
