import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import {RNCamera} from 'react-native-camera';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import Geolocation from 'react-native-get-location';
import AsyncStorage, {
  useAsyncStorage,
} from '@react-native-async-storage/async-storage';
import {Dropdown} from 'react-native-element-dropdown';
import {ActivityIndicator} from 'react-native-paper';
import {useIsFocused} from '@react-navigation/native';

const PhotoScreen = ({route, navigation}) => {
  const [value, setValue] = useState(0);
  const readItemFromStorage = async () => {
    const user = JSON.parse(await AsyncStorage.getItem('user'));
    setValue(user.id);
    setIdjbm(user.idjbm);
    setStatus(user.status);
  };

  const [observation, setObservation] = useState('');
  const [showInputs, setShowInputs] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [confirmedPhotos, setConfirmedPhotos] = useState([]);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedExistingClient, setSelectedExistingClient] = useState(0);
  const cameraRef = useRef(null);
  const projectId = route.params?.projectId ?? 0;
  const [adresse, setAdresse] = useState('');
  const [action, setAction] = useState('');
  const [idjbm, setIdjbm] = useState('');
  const [villes, setVilles] = useState([]);
  const [ville, setVille] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const getData = async () => {
      await readItemFromStorage();
      await getVilles();
    };
    getData();
  }, []);

  const getVilles = async () => {
    try {
      const response = await fetch(
        'https://tbg.comarbois.ma/projet_api/api/projet/Villes.php',
      );

      const data = await response.json();
      setVilles(data);
    } catch (e) {
      console.log(e);
    }
  };

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

  useEffect(() => {
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
      });
  }, []);

  useEffect(() => {
    if (!latitude && !longitude) {
      setLoading(true);
    } else {
      setLoading(false);
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
    if (latitude == null || longitude == null) {
      Alert.alert('Erreur', 'Veuillez activer la localisation GPS');
      navigation.replace('Home');
      return;
    }

    if(ville == '' || ville == 0){
      Alert.alert('Erreur', 'Veuillez selectionner une ville');
      return;
    }

    if(selectedExistingClient == '' || selectedExistingClient == 0){
      Alert.alert('Erreur', 'Veuillez selectionner un client');
      return;
    }

    if (confirmedPhotos.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins une photo');
      return;
    }

    if (action === '') {
      Alert.alert('Erreur', 'Veuillez ajouter une action');
      return;
    }

    if(observation == ''){
      Alert.alert('Erreur', 'Veuillez ajouter une observation');
      return;
    }


    const data = {
      photos: confirmedPhotos,
      latitude,
      longitude,
      observation,
      action:action,
      adresse,
      idClient: selectedExistingClient,
      userId: value,
      idCommercial: idjbm,
      ville: ville,
      status:status
    };
    
    try {
      const response = await fetch(
        `https://tbg.comarbois.ma/projet_api/api/projet/GeolocationAction.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        },
      );
      const json = await response.json();
      console.log(json);

      if (json.status === 'success') {
        Alert.alert('Succès', 'Action ajoutée avec succès');
        navigation.replace('Home');
      } else {
        console.log(json.message);
        Alert.alert('Erreur', "Erreur lors de l'ajout de l'action");
      }
    } catch (e) {
      console.log(e);
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

        setClients(json);
        setLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="red" />
      ) : (
        <>
          {showInputs ? (
            <View style={styles.inputContainer}>
              <Text style={styles.title}>Details Action</Text>
              <Text style={styles.text}>{`${latitude}`}</Text>
              <Text style={styles.text}>{`${longitude}`}</Text>

              <Dropdown
                data={clients}
                labelField={'societe'}
                valueField={'id'}
                value={selectedExistingClient}
                onChange={item => setSelectedExistingClient(item.id.toString())}
                placeholder={'Selectioner un client'}
                style={styles.dropdown}
                search
                searchField="societe"
                searchPlaceholder="Chercher un client"
                inputSearchStyle={{color: 'black'}}
              />

              <Dropdown
                data={villes}
                valueField={'idVille'}
                labelField={'villeLabel'}
                value={ville}
                onChange={item => setVille(item.idVille)}
                placeholder={'Selectioner une ville'}
                search
                searchPlaceholder='Rechercher une ville'
                style={styles.dropdown}
                searchField="villeLabel"
                inputSearchStyle={{color: 'black'}}
              />

              <TextInput
                style={styles.textInput}
                placeholder="Observation"
                onChangeText={text => setObservation(text)}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Adresse"
                value={adresse}
                editable={false}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Action"
                onChangeText={text => setAction(text)}
              />

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
    width: '95%',
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
