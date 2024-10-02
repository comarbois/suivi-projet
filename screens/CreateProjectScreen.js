import React, {useState, useEffect} from 'react';
import {Picker} from '@react-native-picker/picker';
import {openCamera, openPicker} from 'react-native-image-crop-picker';
import RNFS from 'react-native-fs';

import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Pressable,
  ToastAndroid,
  Image,
  ImageBackground,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage, {
  useAsyncStorage,
} from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-get-location';
import {ActivityIndicator} from 'react-native-paper';
import {Dropdown} from 'react-native-element-dropdown';
import moment from 'moment';

const actions = [
  {nom: 'Prospecter'},
  {nom: 'Appeler'},
  {nom: 'Visiter'},
  {nom: 'Relancer Devis'},
  {nom: 'Demander Réglement'},
  {nom: 'Note'},
];

const CreateProjectScreen = props => {
  const [value, setValue] = useState(0);
  useEffect(() => console.log(' value est ' + value), [value]);
  const {getItem, setItem} = useAsyncStorage('@storage_key');
  const readItemFromStorage = async () => {
    const user = JSON.parse(await AsyncStorage.getItem('user'));
    setValue(user.id);
  };
  const [date, setDate] = useState(new Date());
  const [client, setClient] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [projet, setProjet] = useState('');
  const [adresse, setAdresse] = useState('');
  const [observation, setObservation] = useState('');
  const [contactville, setContactville] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [selectedType, setSelectedType] = useState('projet');
  const [selectedSrc, setSelectedSrc] = useState('client');
  const [selectedClient, setSelectedClient] = useState(null);
  const [villes, setVilles] = useState([]);
  const [selectedVille, setSelectedVille] = useState(null);
  const [action, setAction] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [idModif, setIdModif] = useState(0);
  const [images, setImages] = useState([]);

  useEffect(() => {
    readItemFromStorage();
  }, []);

  const handleOpenCamera = () => {
    console.log('open camera');
    openCamera({
      width: 1000,
      height: 1500,
      cropping: true,
    })
      .then(image => {
        setImages([...images, image]);
      })
      .catch(err => {
        console.log(err);
      });
  };

  const handleOpenGallery = () => {
    openPicker({
      width: 1000,
      height: 1500,
      cropping: true,
    })
      .then(image => {
        setImages([...images, image]);
      })
      .catch(err => {
        console.log(err);
      });
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
      })
      .finally(() => {
        readItemFromStorage();
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

  const fetchClients = async () => {
    try {
      const response = await fetch(
        'https://tbg.comarbois.ma/projet_api/api/projet/Getclients.php',
      );
      if (!response.ok) {
        ToastAndroid.show('Une erreur est survenue', ToastAndroid.SHORT);
        return;
      }
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchVilles = async () => {
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

  const toggelPicker = () => {
    console.log('show date picker');
    setShowDatePicker(!showDatePicker);
  };
  const hadleChangePicker = ({type}, date) => {
    if (type === 'set') {
      setDate(date);
    }
    toggelPicker();
  };
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchClients();
      await fetchVilles();
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    if (!projet) {
      Alert.alert('Erreur', 'Veuillez saisir le titre du projet');
      setSubmitting(false);
      return;
    }
    if (client == 0 && nouveau == '') {
      Alert.alert('Erreur', 'Veuillez saisir le client ou le prospect');
      setSubmitting(false);
      return;
    }

    const imagesData = [];
    for (const image of images) {
      const path = image.path;
      const imgData = await RNFS.readFile(
        path.replace('file://', ''),
        'base64',
      );
      imagesData.push({imgData});
    }
    const data = {
      images: imagesData,
      type: selectedType,
      titre: projet,
      client: client,
      prospect: nouveau,
      ville:
        selectedSrc === 'client'
          ? selectedClient?.ville
          : selectedVille?.villeLabel,
      region:
        selectedSrc === 'client'
          ? selectedClient?.region_n.slice(4)
          : selectedVille?.regionLabel,
      observation: observation,
      user: value,
      adresse: adresse,
      latitude: latitude,
      longitude: longitude,
    };
    

    try {
      const response = await fetch(
        'https://tbg.comarbois.ma/projet_api/api/projet/CreerProjet.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        },
      );

      if (response.ok) {
        const data = await response.json();
        console.log(data);
        setIdModif(data.id);

        Alert.alert('Succès', 'Projet créé avec succès');
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAction = async () => {
    if (action == '') {
      Alert.alert('Erreur', 'Veuillez selectionner une action');
      return;
    }

    const formData = {
      idProjet: idModif,
      action: action,
      datePrevue: moment(date).format('YYYY-MM-DD'),
      userId: value,
    };

    try {
      setSubmitting(true);
      const response = await fetch(
        'https://tbg.comarbois.ma/projet_api/api/projet/AddAction.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        },
      );
      if (response.ok) {
        Alert.alert('Succès', 'Action ajoutée avec succès');
        const data = await response.json();
        console.log(data);
        setAction('');
        setDate(new Date());
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
      console.error(error);
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
          <ScrollView style={{paddingBottom: 100}}>
            <Text style={styles.title}>CREATION DU PROJET / CHANTIER</Text>
            <View style={styles.flex}>
              <Pressable
                style={[
                  styles.select,
                  selectedType === 'projet' ? {backgroundColor: '#b5e8ff'} : '',
                ]}
                onPress={() => {
                  setSelectedType('projet');
                }}>
                <Text> Projet</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.select,
                  selectedType === 'chantier'
                    ? {backgroundColor: '#b5e8ff'}
                    : '',
                ]}
                onPress={() => {
                  setSelectedType('chantier');
                }}>
                <Text> Chantier</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Titre:</Text>
            <TextInput
              style={styles.input}
              placeholder="Titre"
              value={projet}
              onChangeText={text => setProjet(text)}
            />
            <View style={styles.flex}>
              <Pressable
                style={[
                  styles.select,
                  selectedSrc === 'client' ? {backgroundColor: '#b5e8ff'} : '',
                ]}
                onPress={() => {
                  setSelectedSrc('client');
                }}>
                <Text>Client</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.select,
                  selectedSrc === 'prospect'
                    ? {backgroundColor: '#b5e8ff'}
                    : '',
                ]}
                onPress={() => {
                  setSelectedSrc('prospect');
                }}>
                <Text>Prospect</Text>
              </Pressable>
            </View>
            {selectedSrc === 'client' ? (
              <>
                <Text style={styles.label}>Client :</Text>
                <Dropdown
                  data={data}
                  labelField="societe"
                  valueField="id"
                  value={client}
                  onChange={item => {
                    setClient(item.id);
                    setSelectedClient(item);
                  }}
                  placeholder="Client"
                  style={styles.dropdown}
                  search
                  searchField={['societe']}
                  searchPlaceholder="Rechercher un client"
                  clearButton
                />

                {selectedClient && (
                  <View style={{marginVertical: 15}}>
                    <Text style={styles.label}>
                      Ville :{' '}
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: 'normal',
                          marginLeft: 12,
                        }}>
                        {selectedClient?.ville}
                      </Text>
                    </Text>
                    <Text style={styles.label}>
                      Region :{' '}
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: 'normal',
                          marginLeft: 12,
                        }}>
                        {selectedClient?.region_n}
                      </Text>
                    </Text>
                    <Text style={styles.label}>
                      Commercial :{' '}
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: 'normal',
                          marginLeft: 12,
                        }}>
                        {selectedClient?.commerciale}
                      </Text>
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <Text style={styles.label}>Prospect:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Prospect"
                  value={nouveau}
                  onChangeText={text => setNouveau(text)}
                />
                <Text style={styles.label}>Ville:</Text>
                <Dropdown
                  data={villes}
                  labelField="villeLabel"
                  valueField="ville"
                  value={contactville}
                  onChange={item => {
                    setContactville(item.ville);
                    setSelectedVille(item);
                    console.log(item);
                  }}
                  placeholder="Ville"
                  style={styles.dropdown}
                  search
                  searchField={['villeLabel']}
                  searchPlaceholder="Rechercher une ville"
                  dropdownPosition="top"
                />

                {selectedVille && (
                  <View style={{marginVertical: 15}}>
                    <Text style={styles.label}>
                      Region :{' '}
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: 'normal',
                          marginLeft: 12,
                        }}>
                        {selectedVille?.regionLabel}
                      </Text>
                    </Text>
                  </View>
                )}
              </>
            )}

            {showDatePicker && (
              <DateTimePicker
                mode="date"
                value={date}
                display="default"
                onChange={hadleChangePicker}
              />
            )}

            <Text style={styles.label}>Observation:</Text>
            <TextInput
              style={[styles.input, {height: 55}]}
              multiline
              value={observation}
              onChangeText={text => setObservation(text)}
            />
            {idModif <= 0 && (
              <View style={{flexDirection: 'row', marginTop: 20}}>
                <TouchableOpacity style={styles.btn} onPress={handleOpenCamera}>
                  <Image
                    source={require('../assets/camera.png')}
                    style={styles.image}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btn}
                  onPress={handleOpenGallery}>
                  <Image
                    source={require('../assets/gallery.png')}
                    style={styles.image}
                  />
                </TouchableOpacity>
              </View>
            )}

            <View
              style={{flexDirection: 'row', flexWrap: 'wrap', marginTop: 20}}>
              {images.map((image, index) => (
                <View
                  key={index}
                  style={{
                    width: 100,
                    height: 100,
                    marginRight: 10,
                    marginBottom: 10,
                    position: 'relative',
                  }}>
                  <ImageBackground
                    source={{uri: image.path}}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 5,
                      overflow: 'hidden',
                    }}
                  />
                  <TouchableOpacity
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      padding: 5,
                      borderRadius: 5,
                    }}
                    onPress={() => {
                      setImages(images.filter(img => img.path !== image.path));
                    }}>
                    <Image
                      source={require('../assets/close.png')}
                      style={{
                        width: 20,
                        height: 20,
                        resizeMode: 'contain',
                      }}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {idModif > 0 && (
              <>
                <Text style={styles.label}>Action à Realisé:</Text>
                <Dropdown
                  data={actions}
                  labelField="nom"
                  valueField="nom"
                  value={action}
                  onChange={item => setAction(item.nom)}
                  placeholder="Action à Realisé"
                  style={styles.dropdown}
                />

                <Text style={styles.label}>Date:</Text>
                <TouchableOpacity onPress={toggelPicker}>
                  <TextInput
                    style={styles.input}
                    value={date.toLocaleDateString()}
                    editable={false}
                  />
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
          {idModif <= 0 ? (
            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.button}
              onPress={handleAddAction}
              disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}> + Action</Text>
              )}
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: 'white',
  },
  titleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: 'black',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    padding: 1,
    color: 'black',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    flex: 1,

    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#d32f2f',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: '#ccc',
    paddingHorizontal: 10,
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
  dropdown: {
    width: '100%',
    height: 50,
    backgroundColor: 'transparent',
    borderColor: 'gray',
    borderWidth: 0.5,
    borderRadius: 5,
    marginBottom: 10,
    padding: 5,
    color: 'black',
  },
  flex: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginVertical: 10,
  },
  select: {
    borderColor: 'gray',
    borderWidth: 1,
    padding: 8,
    borderRadius: 5,
    textAlign: 'center',
    backgroundColor: 'white',
  },
  btn: {
    backgroundColor: 'transparent',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 50,
    height: 50,
    marginRight: 10,
    marginBottom: 10,
  },
});

export default CreateProjectScreen;
