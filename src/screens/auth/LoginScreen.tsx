import React, { useState } from 'react';
import { View, StyleSheet, Alert, ToastAndroid } from 'react-native';
import { Input, Button, Text } from '@rneui/themed';
import { login } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import { EventRegister } from 'react-native-event-listeners';
import { LOGIN_EVENT } from '../../navigation/AppNavigator';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation<LoginScreenNavigationProp>();

    const showToast = (message: string) => {
        ToastAndroid.show(message, ToastAndroid.SHORT);
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Hiba', 'Kérlek, add meg az email címed és jelszavad!');
            return;
        }

        setLoading(true);
        try {
            showToast('Bejelentkezés folyamatban...');
            console.log("Bejelentkezés megkezdve:", email);
            
            const response = await login(email, password);
            console.log("Sikeres bejelentkezés:", response ? "válasz érkezett" : "nincs válasz");
            
            // Ellenőrizzük a bejelentkezési adatokat
            const storedToken = await AsyncStorage.getItem('token');
            const storedUser = await AsyncStorage.getItem('user');
            
            console.log("Tárolt token:", storedToken ? "létezik" : "hiányzik");
            console.log("Tárolt felhasználó:", storedUser ? "létezik" : "hiányzik");
            
            if (!storedToken || !storedUser) {
                showToast('Hiányzó bejelentkezési adatok!');
                throw new Error('Hiányzó bejelentkezési adatok');
            }
            
            showToast('Sikeres bejelentkezés');
            
            // Esemény kiküldése a navigációs rendszernek
            console.log("Login esemény kiküldése");
            EventRegister.emit(LOGIN_EVENT, {
                success: true,
                user: JSON.parse(storedUser)
            });
            
            // Ne használjunk navigációt itt, az AppNavigator automatikusan frissül
            console.log("Várakozás a navigáció frissítésére...");
            
        } catch (error: any) {
            console.error("Bejelentkezési hiba:", error.message || "Ismeretlen hiba");
            console.error("Hiba részletek:", error.response?.data || "Nincs részletes hibaüzenet");
            
            showToast('Bejelentkezési hiba');
            
            Alert.alert(
                'Bejelentkezési hiba',
                error.response?.data?.message || error.message || 'Hiba történt a bejelentkezés során.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text h3 style={styles.title}>Parkolóház</Text>
            <Text h4 style={styles.subtitle}>Bejelentkezés</Text>

            <Input
                placeholder="Email cím"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                leftIcon={{ type: 'material', name: 'email' }}
                containerStyle={styles.input}
            />

            <Input
                placeholder="Jelszó"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                leftIcon={{ type: 'material', name: 'lock' }}
                containerStyle={styles.input}
            />

            <Button
                title="Bejelentkezés"
                onPress={handleLogin}
                loading={loading}
                containerStyle={styles.buttonContainer}
            />

            <Button
                title="Regisztráció"
                type="clear"
                onPress={() => navigation.navigate('Register')}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    title: {
        textAlign: 'center',
        marginBottom: 10,
        color: '#2089dc',
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: 30,
        color: '#666',
    },
    input: {
        marginBottom: 10,
    },
    buttonContainer: {
        marginTop: 20,
        marginBottom: 10,
    },
});

export default LoginScreen; 