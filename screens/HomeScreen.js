import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { AsyncStorage } from '@react-native-async-storage/async-storage';

const HomeScreen = ({ route, navigation }) => {
  const [value, setValue] = useState(0);
  useEffect(() => console.log(' value est ' + value), [value]);
  const { getItem, setItem } = useAsyncStorage('@storage_key');
  const readItemFromStorage = async () => {
    const item = await getItem();
    setValue(item);
  };
  const removeValue = async () => {
    try {
      await AsyncStorage.removeItem('@storage_key');
    } catch (e) {
    
    }

    console.log('Done.');
  };
  useEffect(() => {
    readItemFromStorage();
  }, []);

  const handleTakePhoto = () => {
    navigation.navigate('TakePhoto');
  };
  const handleViewMap = () => {
    navigation.navigate('Map');
  };

  const handleCreateProject = () => {
    navigation.navigate('CreateProject');
  };

  const handleListProject = () => {
    navigation.navigate('List');
  };
  const handleLogout = async () => {
    try {
      removeValue();
      navigation.replace('Login');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenue </Text>

      <Text style={styles.instructionsText}>Veuillez choisir une option:</Text>

      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={handleCreateProject}>
          <Image source={require('../assets/creationprojet.png')} style={styles.buttonImage} />
          <Text style={styles.buttonText}>Créer Projet</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleListProject}>
          <Image source={require('../assets/listeprojet.png')} style={styles.buttonImage} />
          <Text style={styles.buttonText}>Liste Projets</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
      <TouchableOpacity style={styles.button} onPress={handleTakePhoto}>
          <Image source={require('../assets/prendrephoto.png')} style={styles.buttonImage} />
          <Text style={styles.buttonText}>Geolocalisation</Text>
        </TouchableOpacity>

      <TouchableOpacity   style={[styles.button, {position:'relative'}]} onPress={handleViewMap}>
          {/* <View style={{position:'absolute', width:"125%" , height:'140%', backgroundColor:'#20212457', zIndex:100, borderRadius:5}}>

          </View> */}
          <Image source={require('../assets/map.png')} style={styles.buttonImage} />
          <Text style={styles.buttonText}>Map</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Itiniraires')}>
          <Image source={require('../assets/itineraires.png')} style={styles.buttonImage} />
          <Text style={styles.buttonText}>Itineraires</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Agenda')}>
          <Image source={require('../assets/Calendrier.png')} style={styles.buttonImage} />
          <Text style={styles.buttonText}>Calendrier</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Se deconnecter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  instructionsText: {
    fontSize: 16,
    marginBottom: 24,
    color: 'black',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  button: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: 8,
    elevation: 5, 
  },
  buttonImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 24,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
