import React, { useEffect, useState } from 'react';
import { View, Image, FlatList, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Modal } from 'react-native';

const ProjectImages = ({ route, navigation }) => {
  const { item } = route.params;
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const { id } = item;

  useEffect(() => {
    fetch(`https://tbg.comarbois.ma/projet_api/api/projet/Getimg?project_id=${id}`)
      .then(response => response.json())
      .then(data => {
        setImages(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching images:', error);
        setError('Error fetching images');
        setLoading(false);
      });
  }, [id]);

  const handleReturn = () => {
    navigation.goBack();
  };

  const handleAddPhotos = () => {
    navigation.navigate('TakePhoto', { projectId: id });
  };

  const handleImagePress = (uri) => {
    setSelectedImageUri(uri);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedImageUri(null);
  };

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
        <Text style={styles.title}>Photos du projet</Text>
      </View>
      {images.length === 0 ? (
        <Text style={styles.noPhotosText}>Pas de photos</Text>
      ) : (
        <FlatList
          data={images}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleImagePress(`https://tbg.comarbois.ma/${item.file}`)}>
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: `https://tbg.comarbois.ma/${item.file}` }}
                  // source={{ uri: `http://10.0.0.34/tbg-new/data/${item.file}` }}
                  style={styles.image}
                />
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.flatListContent}
        />
      )}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.returnButton} onPress={handleReturn}>
          <Text style={styles.returnButtonText}>Retour</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={handleAddPhotos}>
          <Text style={styles.addButtonText}>Ajouter Photos</Text>
        </TouchableOpacity>
      </View>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <Image source={{ uri: selectedImageUri }} style={styles.modalImage} />
          <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  titleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'black',
  },
  flatListContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  imageContainer: {
    margin: 10,
  },
  image: {
    width: 300,
    height: 300,
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
    color: 'red',
    fontSize: 16,
  },
  noPhotosText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  returnButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  returnButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '90%',
    resizeMode: 'contain',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default ProjectImages;
