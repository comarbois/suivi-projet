import {useState, useEffect, useRef} from 'react';
import {Platform, Linking} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {useIsFocused, useNavigation} from '@react-navigation/native';

const useLocation = () => {
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const locationRequestActive = useRef(false); // Ref to keep track of active requests
    const isFocused = useIsFocused();
  const getLocation = () => {
    if (locationRequestActive.current) {
      return; // If a request is already active, don't start a new one
    }

    setLoading(true);
    locationRequestActive.current = true;

    Geolocation.getCurrentPosition(
      position => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLoading(false);
        locationRequestActive.current = false;
      },
      error => {
        console.error(error);
        if (Platform.OS === 'android') {
          Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
        }
        navigation.goBack();
        setLoading(false);
        locationRequestActive.current = false;
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
      },
    );
  };

  useEffect(() => {
    getLocation();
  }, [isFocused]);

  return {latitude, longitude, loading, getLocation};
};

export default useLocation;
