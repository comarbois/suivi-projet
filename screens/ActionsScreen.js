import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Modal, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

const ActionsScreen = ({ route, navigation }) => {
  const [value, setValue] = useState(0);
  useEffect(() => console.log(' value est ' + value), [value]);
  const { getItem, setItem } = useAsyncStorage('@storage_key');
  const { item } = route.params;
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDateRealisee, setSelectedDateRealisee] = useState(false);
  const [newAction, setNewAction] = useState({
    ACTION: '',
    lieu: '',
    description: '',
    datePrevue: new Date(),
    dateRealisee: new Date(),
    observation: ''
  });
  const { id } = item;
  const [showDatePrevuePicker, setShowDatePrevuePicker] = useState(false);
  const [showDateRealiseePicker, setShowDateRealiseePicker] = useState(false);

  useEffect(() => {
    const readItemFromStorage = async () => {
      const item = await getItem();
      setValue(item);
    };
    readItemFromStorage();
  }, []);

  const fetchActions = async () => {
    try {
      const response = await fetch(`https://tbg.comarbois.ma/projet_api/api/projet/GetActions.php?project_id=${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setActions(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching Actions:', error);
      setError('Error fetching Actions');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, [id]);

  const handleReturn = () => {
    navigation.goBack();
  };

  const handleAddAction = async () => {
    try {
      const response = await fetch('https://tbg.comarbois.ma/projet_api/api/projet/AddAction.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: id,
          value,
          ...newAction,
          datePrevue: newAction.datePrevue.toISOString().split('T')[0],
          dateRealisee: newAction.dateRealisee.toISOString().split('T')[0],
        })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setModalVisible(false);
      setNewAction({
        ACTION: '',
        lieu: '',
        description: '',
        datePrevue: new Date(),
        dateRealisee: new Date(),
        observation: ''
      });
      fetchActions(); // Reload the actions after adding a new one
    } catch (error) {
      console.error('Error adding action:', error);
      setError('Error adding action');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.actionContainer}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>Commercial:</Text>
        <Text style={styles.actionText}>{item.name}</Text>
      </View>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>Actions:</Text>
        <Text style={styles.actionText}>{item.ACTION}</Text>
      </View>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>Lieu:</Text>
        <Text style={styles.actionText}>{item.lieu}</Text>
      </View>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>Date Creation:</Text>
        <Text style={styles.actionText}>{item.dateCreate}</Text>
      </View>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>Description:</Text>
        <Text style={styles.actionText}>{item.description}</Text>
      </View>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>Date Prevue:</Text>
        <Text style={styles.actionText}>{item.datePrevue}</Text>
      </View>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>Date Realise:</Text>
        <Text style={styles.actionText}>
          {item.dateRealisee === '0000-00-00' ? 'Pas encore Realise' : item.dateRealisee}
        </Text>
      </View>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>Observation:</Text>
        <Text style={styles.actionText}>{item.observation}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="red" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.returnButton} onPress={handleReturn}>
          <Text style={styles.returnButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
     <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Actions du Projet</Text>
        <Text style={styles.actionsCount}>{actions.length} actions</Text>
      </View>
      {actions && actions.length === 0 ? (
        <Text style={styles.noActionsText}>Pas d'actions disponibles</Text>
      ) : (
        <FlatList
          data={actions}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.flatListContent}
        />
      )}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.returnButton} onPress={handleReturn}>
          <Text style={styles.returnButtonText}>Retour</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>Ajouter Action</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter une action</Text>
            <Picker
              selectedValue={newAction.ACTION}
              style={styles.input}
              onValueChange={(itemValue, itemIndex) =>
                setNewAction({ ...newAction, ACTION: itemValue })
              }
            >
              <Picker.Item label="_Selectioner une action __" value="" />
              <Picker.Item label="Prospecter" value="Prospecter" />
              <Picker.Item label="Appeler" value="Appeler" />
              <Picker.Item label="Visiter" value="Visiter" />
              <Picker.Item label="Relancer" value="Relancer" />
              <Picker.Item label="Envoyer Devis" value="Envoyer Devis" />
              <Picker.Item label="Demander Reglement" value="Demander Reglement" />
              <Picker.Item label="Note" value="Note" />
            </Picker>
            <TextInput
              style={styles.input}
              placeholder="Lieu"
              value={newAction.lieu}
              onChangeText={(text) => setNewAction({ ...newAction, lieu: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={newAction.description}
              onChangeText={(text) => setNewAction({ ...newAction, description: text })}
            />
            <Text style={styles.label}>Date Prevue:</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowDatePrevuePicker(true)}>
              <Text>{newAction.datePrevue.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showDatePrevuePicker && (
              <DateTimePicker
                value={newAction.datePrevue}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePrevuePicker(false);
                  if (selectedDate) {
                    setNewAction({ ...newAction, datePrevue: selectedDate });
                  }
                }}
              />
            )}

            <Text style={styles.label}>Date Realisee:</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowDateRealiseePicker(true)}>
              <Text>{selectedDateRealisee ? newAction.dateRealisee.toLocaleDateString() : ''}</Text>
            </TouchableOpacity>
            {showDateRealiseePicker && (
              <DateTimePicker
                value={newAction.dateRealisee}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDateRealiseePicker(false);
                  setSelectedDateRealisee(true);
                  if (selectedDate) {
                    setNewAction({ ...newAction, dateRealisee: selectedDate });
                  }
                }}
              />
            )}
            
            <TextInput
              style={styles.input}
              placeholder="Observation"
              value={newAction.observation}
              onChangeText={(text) => setNewAction({ ...newAction, observation: text })}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalretourButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={handleAddAction}>
                <Text style={styles.modalButtonText}>Ajouter</Text>
              </TouchableOpacity>
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
    padding: 20,
    backgroundColor:'white',
  },
  titleContainer: {
      alignItems: 'center',
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#ccc',
    },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
  },
  actionsCount: {
    fontSize: 16,
    color: 'black',
  },
  actionContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: 'black',
    elevation: 4 ,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  label: {
    textAlign: 'left',
    fontWeight: 'bold',
    color:'black',
  },
  actionText: {
    flex: 1,
    textAlign: 'right',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    marginBottom: 20,
  },
  returnButton: {
    backgroundColor: 'red',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  returnButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: 'green',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  addButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  noActionsText: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
  },
  flatListContent: {
    paddingBottom: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
    color: 'black',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: 'gray',
    marginBottom: 10,
    padding: 10,
    borderRadius: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'green',
    margin: 5,
  },
  modalretourButton: {
      flex: 1,
      padding: 15,
      borderRadius: 10,
      backgroundColor: 'red',
      margin: 5,
    },
  modalButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default ActionsScreen;
