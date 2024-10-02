import React, {useState, useEffect} from 'react';
import {Picker} from '@react-native-picker/picker';

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
  ActivityIndicatorBase,
  Linking,
  Pressable,
  ToastAndroid,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage, {
  useAsyncStorage,
} from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-get-location';
import {ActivityIndicator} from 'react-native-paper';
import {Dropdown} from 'react-native-element-dropdown';
import moment from 'moment';
import {id, se} from 'date-fns/locale';
import {set} from 'date-fns';

const actions = [
  {nom: 'Prospecter'},
  {nom: 'Appeler'},
  {nom: 'Visiter'},
  {nom: 'Relancer Devis'},
  {nom: 'Demander Réglement'},
  {nom: 'Note'},
];

const EditProjectScreen = props => {
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
  const [typeprojet, setTypeprojet] = useState('');
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

  useEffect(() => {
    readItemFromStorage();
  }, []);

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
      await getProject();
      setLoading(false);
    };
    const getProject = async () => {
      const projet = props.route.params?.project;
      console.log(projet);
      if (projet) {
        setProjet(projet.projet);
        setSelectedType(projet.typeprojet);
        setSelectedSrc(projet.idClient != '0' ? 'client' : 'prospect');
        setClient(projet.idClient);
        setSelectedClient(data.filter(item => item.id === projet.idClient)[0]);
        setIdModif(projet.id);
        setNouveau(projet.prospect);
        setObservation(projet.observation);
        setAdresse(projet.adresse);
        setLatitude(projet.latitude);
        setLongitude(projet.longitude);
        setNouveau(projet.nouveau);
        setContactville(
          villes.filter(item => item.villeLabel === projet.ville)[0].ville,
        );
        setSelectedVille(
          villes.filter(item => item.villeLabel === projet.ville)[0],
        );
      }
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

    const data = {
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
      id: idModif,
    
    };

    try {
      const response = await fetch(
        'https://tbg.comarbois.ma/projet_api/api/projet/EditProjet.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        },
      );
      
      if (response.ok) {
        

        Alert.alert('Succès', 'Projet créé avec succès');
        props.navigation.navigate('Home');
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
    const data = {
      idProjet: idModif,
      action: action,
      datePrevue: moment(date).format('YYYY-MM-DD'),
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
          body: JSON.stringify(data),
        },
      );
      if (response.ok) {
        Alert.alert('Succès', 'Action ajoutée avec succès');
        setAction('');
        setDate(new Date());
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue');
        const data = await response.json();
        console.log(data);
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
          <Text style={styles.title}>CREATION DU PROJET / CHANTIER</Text>
          <ScrollView>
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
              style={[styles.input, {marginBottom: 100, height: 55}]}
              multiline
              value={observation}
              onChangeText={text => setObservation(text)}
            />
          </ScrollView>

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
});

export default EditProjectScreen;
