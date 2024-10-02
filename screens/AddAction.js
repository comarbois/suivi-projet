import AsyncStorage, {
  useAsyncStorage,
} from '@react-native-async-storage/async-storage';
import {addDays, format, set} from 'date-fns';
import React, {useEffect, useState} from 'react';
import {Dropdown} from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import {openCamera, openPicker} from 'react-native-image-crop-picker';
import RNFS from 'react-native-fs';

import {
  Alert,
  ImageBackground,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {Agenda} from 'react-native-calendars';

import {ActivityIndicator} from 'react-native-paper';
import {ca, se} from 'date-fns/locale';
import moment from 'moment';
import { Image } from 'react-native';

const actions = [
  {nom: 'Prospecter'},
  {nom: 'Appeler'},
  {nom: 'Visiter'},
  {nom: 'Relancer Devis'},
  {nom: 'Demander Réglement'},
  {nom: 'Note'},
];

const AddAction = ({route, navigation}) => {
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedSrc, setSelectedSrc] = useState('projet');
  const [value, setValue] = useState(0);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [projet, setProjet] = useState(0);
  const [client, setClient] = useState(0);
  const [prospet, setProspet] = useState('');
  const [datePrevue, setDatePrevue] = useState(moment().format('YYYY-MM-DD'));
  const [dateRealisee, setDateRealisee] = useState('');
  const [showDatePrevue, setShowDatePrevue] = useState(false);
  const [showDateRealisee, setShowDateRealisee] = useState(false);
  const [observation, setObservation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState([]);

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

  const handleSubmit = async () => {
    if (selectedAction === '') {
      Alert.alert('Erreur', 'Veuillez selectionner une action');
      return;
    }
    if (datePrevue === '') {
      Alert.alert('Erreur', 'Veuillez selectionner une date prévue');
      return;
    }
    if (selectedSrc === 'projet' && projet === 0) {
      Alert.alert('Erreur', 'Veuillez selectionner un projet');
      return;
    }

    if (selectedSrc === 'client' && client === 0) {
      Alert.alert('Erreur', 'Veuillez selectionner un client');
      return;
    }
    if (selectedSrc === 'prospet' && prospet === '') {
      Alert.alert('Erreur', 'Veuillez entrer le nom du prospet');
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
      userId: value,
      idProjet: projet,
      clientId: client,
      prospet: prospet,
      action: selectedAction,
      datePrevue: datePrevue,
      dateRealisee: dateRealisee,
      observation: observation,
      images: imagesData,
    };
    console.log(data);
    try {
      setSubmitting(true);
      const response = await fetch(
        'https://tbg.comarbois.ma/projet_api/api/projet/AddAction.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        },
      );

      if (response.ok) {
        const result = await response.json();
        console.log(result);
        Alert.alert('Succès', 'Action ajoutée avec succès');
        setSelectedAction('');
        setDatePrevue(moment().format('YYYY-MM-DD'));
        setDateRealisee('');
        setObservation('');
        setImages([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const getClients = async () => {
    const response = await fetch(
      `https://tbg.comarbois.ma/projet_api/api/projet/Getclients.php?userId=${value}`,
    );
    const data = await response.json();
    setClients(data);
  };
  const getProjects = async () => {
    const response = await fetch(
      `https://tbg.comarbois.ma/projet_api/api/projet/listprojet.php?userId=${value}`,
    );

    const data = await response.json();
    console.log(data);
    setProjects(data);
  };

  useEffect(() => {
    const getData = async () => {
      setLoading(true);

      await getProjects();

      await getClients();
      setLoading(false);
    };
    if (value > 0) {
      getData();
    }
  }, [value]);

  useEffect(() => {
    const readItemFromStorage = async () => {
      const user = JSON.parse(await AsyncStorage.getItem('user'));

      setValue(user.id);
    };

    readItemFromStorage();
  }, []);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <Text style={styles.title}>AJOUTER ACTION</Text>
          <ScrollView>
            <View style={[styles.flex, {marginVertical: 10}]}>
              <Pressable
                style={[
                  styles.select,
                  selectedSrc === 'projet' ? {backgroundColor: '#b5e8ff'} : '',
                ]}
                onPress={() => {
                  setSelectedSrc('projet');
                  setClient(0);
                  setProjet(0);
                  setProspet('');
                }}>
                <Text>Projet / Chantier</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.select,
                  selectedSrc === 'client' ? {backgroundColor: '#b5e8ff'} : '',
                ]}
                onPress={() => {
                  setSelectedSrc('client');
                  setClient(0);
                  setProjet(0);
                  setProspet('');
                }}>
                <Text>Client</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.select,
                  selectedSrc === 'prospet' ? {backgroundColor: '#b5e8ff'} : '',
                ]}
                onPress={() => {
                  setSelectedSrc('prospet');
                  setClient(0);
                  setProjet(0);
                  setProspet('');
                }}>
                <Text>Prospet</Text>
              </Pressable>
            </View>

            {selectedSrc === 'projet' && (
              <>
                <Text style={styles.label}>Projet</Text>
                <Dropdown
                  data={projects}
                  labelField={'designation'}
                  valueField={'id'}
                  value={projet}
                  onChange={item => setProjet(item.id)}
                  placeholder={'Selectioner un projet'}
                  style={styles.dropdown}
                  search
                  searchField="designation"
                  searchPlaceholder="Chercher un projet"
                  inputSearchStyle={{color: 'black'}}
                />
              </>
            )}
            {selectedSrc === 'client' && (
              <>
                <Text style={styles.label}>Client</Text>
                <Dropdown
                  data={clients}
                  labelField={'societe'}
                  valueField={'id'}
                  value={client}
                  onChange={item => setClient(item.id)}
                  placeholder={'Selectioner un client'}
                  style={styles.dropdown}
                  search
                  searchField="societe"
                  searchPlaceholder="Chercher un client"
                  inputSearchStyle={{color: 'black'}}
                />
              </>
            )}
            {selectedSrc === 'prospet' && (
              <>
                <Text style={styles.label}>Prospet</Text>
                <TextInput
                  style={styles.input}
                  value={prospet}
                  onChangeText={text => {
                    setProspet(text);
                  }}
                />
              </>
            )}

            <Text style={styles.label}>Action</Text>
            <Dropdown
              data={actions}
              labelField={'nom'}
              valueField={'nom'}
              value={selectedAction}
              onChange={item => setSelectedAction(item.nom)}
              placeholder={'Selectioner une action'}
              style={styles.dropdown}
              search
              searchField="nom"
              searchPlaceholder="Chercher une action"
              inputSearchStyle={{color: 'black'}}
            />

            <Text style={styles.label}>Date Prévue</Text>
            <Pressable
              onPress={() => {
                setShowDatePrevue(true);
              }}>
              <TextInput
                style={styles.input}
                value={datePrevue}
                editable={false}
              />
            </Pressable>

            {showDatePrevue && (
              <DateTimePicker
                mode="date"
                value={new Date(datePrevue)}
                onChange={(event, selectedDate) => {
                  const currentDate = selectedDate || datePrevue;
                  setShowDatePrevue(false);
                  setDatePrevue(format(currentDate, 'yyyy-MM-dd'));
                }}
              />
            )}

            <Text style={styles.label}>Date Réalisée</Text>
            <Pressable
              onPress={() => {
                setShowDateRealisee(true);
              }}>
              <TextInput
                style={styles.input}
                value={dateRealisee}
                editable={false}
              />
            </Pressable>

            {showDateRealisee && (
              <DateTimePicker
                mode="date"
                value={new Date()}
                onChange={(event, selectedDate) => {
                  const currentDate = selectedDate || dateRealisee;
                  setShowDateRealisee(false);
                  setDateRealisee(format(currentDate, 'yyyy-MM-dd'));
                }}
              />
            )}

            <Text style={styles.label}>Observation</Text>
            <TextInput
              style={styles.input}
              multiline
              numberOfLines={4}
              placeholder="Observation"
              value={observation}
              onChangeText={text => {
                setObservation(text);
              }}
            />

            <View style={{flexDirection: 'row', marginTop: 20}}>
              <TouchableOpacity style={styles.btn} onPress={handleOpenCamera}>
                <Image
                  source={require('../assets/camera.png')}
                  style={styles.image}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.btn} onPress={handleOpenGallery}>
                <Image
                  source={require('../assets/gallery.png')}
                  style={styles.image}
                />
              </TouchableOpacity>
            </View>

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


          </ScrollView>

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>+ Action</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: 'black',
    textAlign: 'center',
  },
  select: {
    borderColor: 'gray',
    borderWidth: 1,
    padding: 8,
    borderRadius: 5,
    textAlign: 'center',
  },
  itemContainer: {
    backgroundColor: 'white',
    margin: 5,
    borderRadius: 15,

    flex: 1,
    padding: 10,
  },
  addButton: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    margin: 20,
  },
  flex: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },

  addButtonText: {
    color: 'white',
    fontSize: 18,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
  modalView: {
    width: '80%',
    height: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    width: '95%',
  },
  saveButton: {
    backgroundColor: 'green',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
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
  saveButtonText: {
    color: 'white',
    fontSize: 18,
  },
  button: {
    backgroundColor: '#4CAF50',
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

export default AddAction;
