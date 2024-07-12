import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import {WebView} from 'react-native-webview';
import html_script from './html_script';
import {useAsyncStorage} from '@react-native-async-storage/async-storage';


const MapScreen2 = () => {
  const [value, setValue] = useState(0);
  const {getItem, setItem} = useAsyncStorage('@storage_key');
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const locations = [
    {name: 'Belgrade', lat: 44.7866, lon: 20.4489},
    {name: 'Tokyo', lat: 35.6804, lon: 139.769},
    {name: 'Madrid', lat: 40.4168, lon: -3.7038},
    {name: 'New York', lat: 40.7128, lon: -74.006},
    
  ];

  const showLocations = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://tbg.comarbois.ma/projet_api/api/projet/listprojet.php?userId=${value}`,
      );
      if (!response.ok) {
        console.log(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
     
      const locations = data.map(item => {
        return {
          name: item.designation,
          lat: item.latitude,
          lon: item.longitude,
        };
      });

      console.log(locations); 

      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          window.addMarkers(${JSON.stringify(locations)});
          true;
        `
          
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (value > 0) {
      showLocations();
    }
  }, [value]);

  useEffect(() => {
    const readItemFromStorage = async () => {
      const item = await getItem();
      setValue(item);
    };
    readItemFromStorage();
  }, []);


  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.Container}>
        <WebView
          ref={webViewRef}
          source={{html: html_script}}
          style={styles.Webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onError={syntheticEvent => {
            const {nativeEvent} = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
          }}
          onMessage={event => {
            console.log(event.nativeEvent.data);
          }}
        />
       
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  Container: {
    flex: 1,
    padding: 10,
    backgroundColor: 'grey',
  },
  Webview: {
    flex: 1,
  },
  ButtonArea: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  Button: {
    width: 150,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'black',
    alignItems: 'center',
  },
  ButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default MapScreen2;
