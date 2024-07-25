import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Import Picker component

const EditProjectScreen = ({ route, navigation }) => {
  const { project } = route.params;

  // Initialize state variables for form inputs
  const [rs, setRs] = useState(project.rs);
  const [name] = useState(project.name);
  const [nouveau, setNouveau] = useState(project.nouveau);
  const [typeprojet, setTypeProjet] = useState(project.typeprojet);
  const [adresse, setAdresse] = useState(project.adresse);
  const [chantier, setChantier] = useState(project.chantier);
  const [projet, setProjet] = useState(project.projet);
  const [contactnom, setContactnom] = useState(project.contact_nom);
  const [contacttel, setContacttel] = useState(project.contact_tel);
  const [contactville, setContactville] = useState(project.contact_ville);
  const [observation,setObservation] = useState(project.observation);

  // States to disable inputs
  const [isClientDisabled, setIsClientDisabled] = useState(!!project.nouveau);
  const [isProspectDisabled, setIsProspectDisabled] = useState(!!project.rs);

  useEffect(() => {
    // Update isClientDisabled state when nouveau changes
    setIsClientDisabled(!!nouveau);
  }, [nouveau]);

  useEffect(() => {
    // Update isProspectDisabled state when rs changes
    setIsProspectDisabled(!!rs);
  }, [rs]);

  // Handler for saving changes
  const handleSave = () => {
    fetch('https://tbg.comarbois.ma/projet_api/api/projet/EditProjet.php', {
    // fetch('https://tbg.comarbois.ma/projet_api/api/projet/EditProjet.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: project.id,
        name,
        rs,
        nouveau,
        typeprojet,
        chantier,
        projet,
        contactnom,
        contacttel,
        contactville,
        observation,
      }),
    })
      .then((response) => response.json())
      .then((json) => {
        if (json.status == 'success') {
          Alert.alert('Succès', 'Projet mis à jour avec succès.');
          navigation.navigate('List');
        } else {
          Alert.alert('Erreur', 'Erreur lors de la mise à jour du projet.');
        }
      })
      .catch((error) => {
        Alert.alert('Erreur', 'Erreur lors de la mise à jour du projet.');
      });
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Modifier le projet</Text>
      </View>
      <ScrollView>
        <TextInput
          style={styles.input}
          value={name}
          placeholder="Auteur"
          autoCapitalize="none"
          editable={false} 
        />
         <TextInput
          style={styles.input}
          value={rs}
          onChangeText={setRs}
          placeholder="Client"
          autoCapitalize="none"
          editable={false} 
        />
        
       
        <Picker
          style={styles.input}
          selectedValue={typeprojet}
          onValueChange={(itemValue, itemIndex) => setTypeProjet(itemValue)}
        >
          <Picker.Item label="Appel offre" value="Appel Offre" />
          <Picker.Item label="Projet" value="Projet" />
        </Picker>
        
        <TextInput
          style={styles.input}
          value={chantier}
          onChangeText={setChantier}
          placeholder="Chantier"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          value={projet}
          onChangeText={setProjet}
          placeholder="Projet"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          value={contactnom}
          onChangeText={setContactnom}
          placeholder="Nom Contact"
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          value={contacttel}
          onChangeText={setContacttel}
          placeholder="Tel Contact"
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          value={contactville}
          onChangeText={setContactville}
          placeholder="Ville Contact"
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          value={observation}
          onChangeText={setObservation}
          placeholder="Observation"
          autoCapitalize="sentences"
        />
      </ScrollView>
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Enregistrer</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.returnButton} onPress={() => navigation.replace('List')}>
        <Text style={styles.returnButtonText}>Retour</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  titleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'black',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  returnButton: {
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  returnButtonText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default EditProjectScreen;
