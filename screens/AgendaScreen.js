import AsyncStorage, {
  useAsyncStorage,
} from '@react-native-async-storage/async-storage';
import {addDays, format, set} from 'date-fns';
import React, {useEffect, useState} from 'react';
import {Dropdown} from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';

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
import moment from 'moment';


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

  const [ville, setVille] = useState(0);
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
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedProjet, setSelectedProjet] = useState(0);
  const [status, setStatus] = useState('');
  
 



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

  useEffect(() => {
    const readItemFromStorage = async () => {
      const user = JSON.parse(await AsyncStorage.getItem('user'));
      setStatus(user.status);
     
      setValue(user.id);
    };

    readItemFromStorage();
  }, []);

  

  

 

  useEffect(() => {
    const getData = async () => {
      setLoading(true);
      await getActions();
    
      
     
      setLoading(false);
    };
    if (value > 0) {
      getData();
    }
  }, [value]);

  

  const renderItem = item => {
    return (
      <View style={styles.itemContainer}>
        <Text style={{fontWeight: '900'}}>{item.action} <Text style={  [item.dateRealisee !='0000-00-00' ? {color: 'green'} : {color: 'orange'}, {fontWeight:'normal'}]}>
          {item.dateRealisee !='0000-00-00' ? 'Realisée le ' + moment(item.dateRealisee).format('DD/MM/YYYY') : 'Non Realisée'}
        </Text> </Text>
        <Text style={{color: 'blue'}}>{item.action_src}</Text>
        <Text>{item.observation}</Text>
        <Text>{item.name}</Text>
        {item.action == 'Localiser Client' && (
          <Text>{item.lieu}</Text>
        )}
        <View
              style={{flexDirection: 'row', flexWrap: 'wrap', marginTop: 20}}>
              {item.images.map((image, index) => (
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
                    source={{ uri: `https://tbg.comarbois.ma/${image.file}` }}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 5,
                      overflow: 'hidden',
                    }}
                  />
                 
                </View>
              ))}
            </View>
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
});

export default AgendaScreen;
