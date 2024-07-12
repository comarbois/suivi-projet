import {useAsyncStorage} from '@react-native-async-storage/async-storage';
import {addDays, format, set} from 'date-fns';
import React, {useEffect, useState} from 'react';
import {Dropdown} from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';

import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {Agenda} from 'react-native-calendars';

import {ActivityIndicator} from 'react-native-paper';
import { se } from 'date-fns/locale';

const actions = [
  {nom: 'Prospecter'},
  {nom: 'Appeler'},
  {nom: 'Visiter'},
  {nom: 'Relancer Devis'},
  {nom: 'Demander Réglement'},
  {nom: 'Note'},
];
const AgendaScreen = ({route, navigation}) => {
  const [items, setItems] = useState({});
  const [showDateRealiseePicker, setShowDateRealiseePicker] = useState(false);
  const [selectedDateRealisee, setSelectedDateRealisee] = useState(false);
  const [date, setDate] = useState(new Date());

  const [modalVisible, setModalVisible] = useState(false);
  const [newAction, setNewAction] = useState({
    project_id: 0,
    lieu: '',
    ACTION: '',
    datePrevue: '',
    dateRealisee: '',
    observation: '',
    description: '',
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => console.log(' value est jjj' + value), [value]);
  const {getItem, setItem} = useAsyncStorage('@storage_key');
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedProjet, setSelectedProjet] = useState(0);
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedSrc, setSelectedSrc] = useState('projet');

  const toggelPicker = () => {
    setShowDateRealiseePicker(!showDateRealiseePicker);
  };

  const hadleChangePicker = ({type}, date) => {
    if (type === 'set') {
      setDate(date);
      setNewAction({...newAction, dateRealisee: date.toLocaleDateString()});
    }
    toggelPicker();
  };

  const getActions = async () => {
    const response = await fetch(
      `https://tbg.comarbois.ma/projet_api/api/projet/GetAllActions.php?userId=${value}`,
    );
    const data = await response.json();

    const reduced = data.reduce((acc, currentItem) => {
      const {datePrevue, ...coolItem} = currentItem;

      if (!acc[datePrevue]) {
        acc[datePrevue] = [];
      }
      acc[datePrevue].push(coolItem);

      return acc;
    }, {});

    setItems(reduced);
  };

  
  const getProjects = async () => {
    const response = await fetch(
      `https://tbg.comarbois.ma/projet_api/api/projet/listprojet.php?userId=${value}`,
    );

    const data = await response.json();

    setProjects(data);
  };
  useEffect(() => {
    const readItemFromStorage = async () => {
      const item = await getItem();
      setValue(item);
    };

    readItemFromStorage();
  }, []);

  const getClients = async () => {
    const response = await fetch(
      `https://tbg.comarbois.ma/projet_api/api/projet/Getclients.php?userId=${value}`,
    );
    const data = await response.json();
    setClients(data);
  };

  useEffect(() => {
    setNewAction({...newAction, datePrevue: selectedDate});
  }, [selectedDate]);


  useEffect(() => {
    const getData = async () => {
      setLoading(true);
      await getActions();
      await getProjects();
      await getClients();
      setLoading(false);
    };
    if (value > 0) {
      getData();
    }
  }, [value]);

  const handleAddAction = async () => {
    if (selectedSrc == 'projet' && newAction.project_id == 0) {
      Alert.alert('Le projet est obligatoire');
      return;
    }
    if (selectedSrc == 'client' && newAction.client_id == 0) {
      Alert.alert('Le client est obligatoire');
      return;
    }
    if (selectedSrc == 'prospet' && newAction.prospet == '') {
      Alert.alert('Le prospet est obligatoire');
      return;
    }
    if (newAction.ACTION == '') {
      Alert.alert('Selectionner une action');
      return;
    }

    if(newAction.datePrevue == ''){
      Alert.alert('la date prevue est obligatoire');
      return;

    }
    if (newAction.lieu == '') {
      Alert.alert('le lieu est obligatoire');
      return;
    }
    if (newAction.observation == '') {
      Alert.alert("l'observation est obligatoire");
      return;
    }

    const response = await fetch(
      'https://tbg.comarbois.ma/projet_api/api/projet/AddAction.php',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value,
          ...newAction,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    Alert.alert('Action ajoutée avec succès');
    await getActions();
    setModalVisible(false);
    setNewAction({
      project_id: 0,
      lieu: '',
      ACTION: '',
      datePrevue: '',
      observation: '',
      description: '',
      prospet: '',
      client_id: 0,
    });
  };

  const renderItem = item => {
    return (
      <View style={styles.itemContainer}>
        <Text style={{fontWeight: '900'}}>{item.action}</Text>
        <Text style={{color: 'blue'}}>{item.action_src}</Text>
        <Text>{item.name}</Text>
        <Text>{item.lieu}</Text>
        <Text>{item.observation}</Text>
      </View>
    );
  };

  return (
    <>
      {!loading ? (
        <SafeAreaView style={styles.safe}>
          <Agenda
            items={items}
            renderItem={renderItem}
            onDayPress={day => {
              setSelectedDate(day.dateString);
              setNewAction({...newAction, datePrevue: day.dateString});
            }}
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              if (selectedDate) {
                setNewAction({...newAction, datePrevue: selectedDate});
              }
              setModalVisible(true);
            }}>
            <Text style={styles.addButtonText}>Ajouter Action</Text>
          </TouchableOpacity>

          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}>
            <View style={styles.overlay}>
              <View style={styles.modalView}>
                <Text style={styles.modalText}>Ajouter une action</Text>
                <View style={styles.flex}>
                  <Pressable
                    style={[
                      styles.select,
                      selectedSrc === 'projet'
                        ? {backgroundColor: '#b5e8ff'}
                        : '',
                    ]}
                    onPress={() => {
                      setSelectedSrc('projet');
                      setNewAction({
                        ...newAction,
                        client_id: 0,
                        project_id: 0,
                        prospet: '',
                      });
                    }}>
                    <Text> Projet</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.select,
                      selectedSrc === 'client'
                        ? {backgroundColor: '#b5e8ff'}
                        : '',
                    ]}
                    onPress={() => {
                      setSelectedSrc('client');
                      setNewAction({
                        ...newAction,
                        client_id: 0,
                        project_id: 0,
                        prospet: '',
                      });
                    }}>
                    <Text> Client</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.select,
                      selectedSrc === 'prospet'
                        ? {backgroundColor: '#b5e8ff'}
                        : '',
                    ]}
                    onPress={() => {
                      setSelectedSrc('prospet');
                      setNewAction({
                        ...newAction,
                        client_id: 0,
                        project_id: 0,
                        prospet: '',
                      });
                    }}>
                    <Text> Prospet</Text>
                  </Pressable>
                </View>
                {selectedSrc === 'projet' && (
                  <>
                    <Text style={styles.labelField}>Projet</Text>
                    <Dropdown
                      data={projects}
                      labelField={'designation'}
                      valueField={'id'}
                      value={newAction.project_id}
                      onChange={item =>
                        setNewAction({...newAction, project_id: item.id})
                      }
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
                    <Text style={styles.labelField}>Client</Text>
                    <Dropdown
                      data={clients}
                      labelField={'societe'}
                      valueField={'id'}
                      value={newAction.client_id}
                      onChange={item =>
                        setNewAction({...newAction, client_id: item.id})
                      }
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
                    <Text style={styles.labelField}>Prospet</Text>
                    <TextInput
                      style={styles.input}
                      value={newAction.prospet}
                      onChangeText={text =>
                        setNewAction({...newAction, prospet: text})
                      }
                    />
                  </>
                )}

                <Text>Date Prevue</Text>
                <TextInput
                  style={styles.input}
                  value={newAction.datePrevue}
                  readOnly
                />

                <Text>Date Realisé</Text>
                {/* <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowDateRealiseePicker(true)}>
                  <Text>
                    {selectedDateRealisee
                      ? newAction.dateRealisee.toLocaleDateString()
                      : ''}
                  </Text>
                </TouchableOpacity> */}
                <Pressable onPress={toggelPicker}>
                  <TextInput
                    style={styles.input}
                    value={newAction.dateRealisee}
                    editable={false}
                  />
                </Pressable>
                {showDateRealiseePicker && (
                  <DateTimePicker
                    mode="date"
                    value={date}
                    display="default"
                    onChange={hadleChangePicker}
                  />
                )}

                <Text style={styles.labelField}>Lieu</Text>
                <TextInput
                  style={styles.input}
                  value={newAction.lieu}
                  onChangeText={text =>
                    setNewAction({...newAction, lieu: text})
                  }
                />
                <Text style={styles.labelField}>Action</Text>
                <Dropdown
                  data={actions}
                  labelField={'nom'}
                  valueField={'nom'}
                  value={selectedAction}
                  onChange={item =>
                    setNewAction({...newAction, ACTION: item.nom})
                  }
                  placeholder={'Selectioner une action'}
                  style={styles.dropdown}
                  searchField="nom"
                  inputSearchStyle={{color: 'black'}}
                />

                <Text style={styles.labelField}>Observation</Text>
                <TextInput
                  style={styles.input}
                  value={newAction.observation}
                  onChangeText={text =>
                    setNewAction({...newAction, observation: text})
                  }
                />

                <Text style={styles.labelField}>Description</Text>
                <TextInput
                  style={styles.input}
                  value={newAction.description}
                  onChangeText={text =>
                    setNewAction({...newAction, description: text})
                  }
                />

                <View style={styles.flex}>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleAddAction}>
                    <Text style={styles.saveButtonText}>Enregistrer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, {backgroundColor: 'red'}]}
                    onPress={() => setModalVisible(false)}>
                    <Text style={styles.saveButtonText}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      ) : (
        <View style={{flex: 1}}>
          <ActivityIndicator size="large" color="black" />
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
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
  labelField: {
    color: 'black',
    textAlign: 'start',
  },
  modalView: {
    width: '80%',
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
});

export default AgendaScreen;
