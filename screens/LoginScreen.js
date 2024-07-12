import React, { useState,useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// const API_URL = 'https://tbg.comarbois.ma/projet_api/api/auth/login.php';
const API_URL = 'https://tbg.comarbois.ma/projet_api/api/auth/login.php';

const LoginScreen = ({ navigation }) => {
  const [username, setusername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [value, setValue] = useState('value');
  const { getItem, setItem } = useAsyncStorage('@storage_key');
  const readItemFromStorage = async () => {
    const item = await getItem();
    setValue(item);
  };

  const writeItemToStorage = async newValue => {
    await setItem(newValue);
    setValue(newValue);
  };

  useFocusEffect(
    React.useCallback(() => {
      setusername('');
      setPassword('');
      setErrors({});
    }, [])
  );

  const handleLogin = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();
      if (response.status === 200) {
        const { token } = data;
        writeItemToStorage(data.user_id);
        
        // Save the token to AsyncStorage
        navigation.replace('Home');

      } else {
        Alert.alert('Error','Username ou mot de passe incorrectes');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
      console.error(error);
    }
  };
  

  const validateForm = () => {
    const errors = {};
    if (username.trim() === '') {
      errors.username = 'Username is required';
    }
    if (password.trim() === '') {
      errors.password = 'Password is required';
    }
    return errors;
  };

  

  return (
    <View style={styles.container}>
    <Image source={require('../assets/logo.png')} style={{ width: 300, height: 100, marginBottom: 20 }} />
      <Text style={styles.title}>Welcome to Comarbois</Text>
      <View style={styles.inputContainer}>
      <Image source={require('../assets/user.png')} style={styles.logo} />
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setusername}
        autoCapitalize="none"
      />
      </View>
      {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
      <View style={styles.inputContainer}>
      <Image source={require('../assets/pass.png')} style={styles.logo} />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      </View>
      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor:'white',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  input: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FF0000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
  },
  forgotPasswordText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    marginTop: 12,
  },
});

export default LoginScreen;