import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { useAuth } from '../context/AuthContext';

const SV = { green: '#228B22', greenLight: '#ADFF2F', brown: '#8B4513' };

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) { Alert.alert('Error', 'Please fill in all fields.'); return; }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>🥦 SpeedyVeg</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={SV.brown}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={SV.brown}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Signing in…' : 'Login'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SV.green },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: '700', color: SV.greenLight, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 15, color: SV.greenLight, textAlign: 'center', marginBottom: 32 },
  input: {
    backgroundColor: SV.greenLight, borderRadius: 10, padding: 14,
    fontSize: 15, color: SV.brown, marginBottom: 12,
  },
  btn: {
    backgroundColor: SV.brown, borderRadius: 10, padding: 16,
    alignItems: 'center', marginTop: 4, marginBottom: 16,
  },
  btnText: { color: SV.greenLight, fontWeight: '700', fontSize: 16 },
  link: { color: SV.greenLight, textAlign: 'center', fontSize: 14 },
});
