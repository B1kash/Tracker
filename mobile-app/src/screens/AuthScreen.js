import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { login, register, googleLogin, setToken } from '../lib/storage';

// Safely load Google Sign-In — not available in plain Expo Go
let GoogleSignin = null;
let googleSigninAvailable = false;
try {
  const gsModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = gsModule.GoogleSignin;
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
  });
  googleSigninAvailable = true;
} catch (e) {
  console.log('Google Sign-In native module not available in Expo Go - username/password login works fine.');
}

export default function AuthScreen({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username || !password) {
      Alert.alert("Wait", "Please fill in username and password.");
      return;
    }

    setLoading(true);
    try {
      let data;
      if (isLogin) {
        data = await login(username, password);
      } else {
        data = await register(username, password);
      }
      
      if (data && data.token) {
        await setToken(data.token, data.id, data.username);
        onLoginSuccess();
      }
    } catch (e) {
      const msg = e.message || "Unknown error";
      Alert.alert("Failed", isLogin ? `Login failed: ${msg}` : `Registration failed: ${msg}`);
      console.error("Auth Exception:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!googleSigninAvailable) {
      Alert.alert(
        'Google Sign-In Unavailable',
        'Google Sign-In requires a custom native build and is not available in Expo Go.\n\nPlease use username & password to log in.',
        [{ text: 'OK' }]
      );
      return;
    }
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken || userInfo.idToken;

      setLoading(true);
      const data = await googleLogin(idToken);
      if (data && data.token) {
        await setToken(data.token, data.id, data.username);
        onLoginSuccess();
      }
    } catch (error) {
      console.error('Google Signin Exception:', error);
      Alert.alert('Google Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <View style={styles.formContainer}>
        <View style={styles.header}>
            <View style={styles.logoCircle}>
                <Ionicons name="sparkles" size={24} color="#0f172a" />
            </View>
            <Text style={styles.title}>LifeTracker</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'Welcome back! Ready to level up?' : 'Start tracking your daily progress'}
            </Text>
        </View>

        {!isLogin && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. MasterRoshi"
              placeholderTextColor="#94a3b8"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Your username"
            placeholderTextColor="#94a3b8"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Min 6 characters"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity 
            style={[styles.primaryButton, loading && styles.disabledButton]} 
            onPress={handleSubmit} 
            disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {isLogin ? 'Sign In' : 'Create Account'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
            style={[styles.googleButton, loading && styles.disabledButton, !googleSigninAvailable && { opacity: 0.4 }]} 
            onPress={handleGoogleLogin} 
            disabled={loading}
        >
            <Ionicons name="logo-google" size={20} color="#000" />
            <Text style={[styles.primaryButtonText, { color: '#000' }]}>
              {googleSigninAvailable ? 'Continue with Google' : 'Google (native build only)'}
            </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchButton}>
          <Text style={styles.switchText}>
            {isLogin ? "Don't have an account? " : "Already tracking your life? "}
            <Text style={styles.switchTextBold}>
                {isLogin ? 'Sign up' : 'Log in'}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
  },
  formContainer: {
    paddingHorizontal: 30,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#8b5cf6',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  switchTextBold: {
    color: '#8b5cf6',
    fontWeight: '700',
  }
});
