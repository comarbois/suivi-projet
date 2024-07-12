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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useAsyncStorage} from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-get-location';
import {ActivityIndicator} from 'react-native-paper';

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

const CreateProjectScreen = props => {
  const [value, setValue] = useState(0);
  useEffect(() => console.log(' value est ' + value), [value]);
  const {getItem, setItem} = useAsyncStorage('@storage_key');
  const readItemFromStorage = async () => {
    const item = await getItem();
    setValue(item);
  };
  const [auteur, setAuteur] = useState('');
  const [datedeb, setDatedeb] = useState(new Date());
  const [client, setClient] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [projet, setProjet] = useState('');
  const [typeprojet, setTypeprojet] = useState('');
  const [chantier, setChantier] = useState('');
  const [adresse, setAdresse] = useState('');
  const [observation, setObservation] = useState('');
  const [contactnom, setContactnom] = useState('');
  const [contacttel, setContacttel] = useState('');
  const [contactville, setContactville] = useState('');
  const [mode, setMode] = useState('date');
  const [show, setShow] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  useEffect(() => {
    readItemFromStorage();
  }, []);

  // useEffect(() => {
  //   console.log('value changed', value);
    
     
  // }, [value]);

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || datedeb;
    setShow(Platform.OS === 'ios');
    setDatedeb(currentDate);
  };

  const showMode = currentMode => {
    setShow(true);
    setMode(currentMode);
  };

  const showDatepicker = () => {
    showMode('date');
  };

  const showTimepicker = () => {
    showMode('time');
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
      }).finally(() => {
        readItemFromStorage();
      }); 
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
  useEffect(() => {
    fetch('https://tbg.comarbois.ma/projet_api/api/projet/Getclients.php')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then((json) => {
       
        if (!Array.isArray(json)) {
          throw new Error('Invalid data format');
        }
        setData(json);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  const handleSubmit = () => {
    if(latitude === null || longitude === null) {
      Alert.alert('Erreur', 'La récupération de la position n\'est pas disponible');
      return;
    }
    if (!client && !nouveau) {
      Alert.alert(
        'Erreur',
        'Veuillez remplir au moins un des champs Client ou Nouveau',
      );
      return;
    }

    if (contacttel && contacttel.length < 10) {
      Alert.alert(
        'Erreur',
        'Le numéro de téléphone doit contenir au moins 10 chiffres.',
      );
      return;
    }

   

    const data = {
      value,
      datedeb: datedeb.toISOString().slice(0, 10),
      client,
      nouveau,
      projet,
      typeprojet,
      chantier,
      adresse,
      observation,
      contactnom,
      contacttel,
      contactville,
      latitude,
      longitude,
    };

    console.log('data:', data);
    
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    fetch('https://tbg.comarbois.ma/projet_api/api/projet/CreerProjet.php', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data),
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        if (data.status === 'success') {
          Alert.alert('Succès', 'Le projet a été enregistré avec succès');
          setAuteur('');
          setDatedeb(new Date());
          setClient('');
          setNouveau('');
          setProjet('');
          setTypeprojet('appel offre');
          setChantier('');
          setAdresse('');
          setObservation('');
          setContactnom('');
          setContacttel('');
          setContactville('');
          navigation.replace('List');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        Alert.alert('Erreur', "Erreur lors de l'enregistrement du projet");
      });
  };

  const {navigation} = props;

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="red" />
      ) : (
        <>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>CREATION DU PROJET</Text>
          </View>
          <ScrollView>
            <View style={styles.row}>
              <Text style={styles.label}>Date debut chantier:</Text>
              <Button title="Date debut chantier" onPress={showDatepicker} />
              {show && (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={datedeb}
                  mode={mode}
                  is24Hour={true}
                  display="default"
                  onChange={onChange}
                />
              )}
            </View>
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
            <View style={styles.row}>
              <Text style={styles.label}>Nouveau:</Text>
              <TextInput
                style={styles.input}
                placeholder="Nouveau"
                value={nouveau}
                onChangeText={text => setNouveau(text)}
              />
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Titre:</Text>
              <TextInput
                style={styles.input}
                placeholder="Titre"
                value={projet}
                onChangeText={text => setProjet(text)}
              />
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Type de projet:</Text>
              <Picker
                selectedValue={typeprojet}
                style={{height: 50, width: '70%'}}
                onValueChange={(itemValue, itemIndex) =>
                  setTypeprojet(itemValue)
                }>
                <Picker.Item label="" value="" />
                <Picker.Item label="Appel offre" value="Appel Offre" />
                <Picker.Item label="Projet" value="Projet" />
              </Picker>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Chantier:</Text>
              <TextInput
                style={styles.input}
                placeholder="Chantier"
                value={chantier}
                onChangeText={text => setChantier(text)}
              />
            </View>
            {/* <View style={styles.row}>
              <Text style={styles.label}>Adresse:</Text>
              <TextInput
                style={styles.input}
                placeholder="Adresse"
                value={adresse}
                onChangeText={text => setAdresse(text)}
              />
            </View> */}
            <View style={styles.row}>
              <Text style={styles.label}>Observation:</Text>
              <TextInput
                style={styles.input}
                placeholder="Observation"
                value={observation}
                onChangeText={text => setObservation(text)}
              />
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Contact Nom:</Text>
              <TextInput
                style={styles.input}
                placeholder="Nom"
                value={contactnom}
                onChangeText={text => setContactnom(text)}
              />
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Contact Tel:</Text>
              <TextInput
                style={styles.input}
                placeholder="Tel"
                value={contacttel}
                onChangeText={text => setContacttel(text)}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Contact Ville:</Text>
              <TextInput
                style={styles.input}
                placeholder="Ville"
                value={contactville}
                onChangeText={text => setContactville(text)}
              />
            </View>
          </ScrollView>
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Enregistrer</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
  },
  titleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: 'black',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    width: '30%',
    padding: 1,
    color: 'black',
    fontWeight: 'bold',
  },
  input: {
    flex: 1,
    padding: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
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
});

export default CreateProjectScreen;
