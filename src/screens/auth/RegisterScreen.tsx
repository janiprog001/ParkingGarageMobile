import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Input, Button, Text } from '@rneui/themed';
import { register } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

const RegisterScreen = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation<RegisterScreenNavigationProp>();

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Hiba', 'Kérlek, töltsd ki az összes mezőt!');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Hiba', 'A jelszavak nem egyeznek!');
            return;
        }

        setLoading(true);
        try {
            await register(email, password, name);
            Alert.alert(
                'Sikeres regisztráció',
                'Most már bejelentkezhetsz az új fiókodba.',
                [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
            );
        } catch (error: any) {
            Alert.alert(
                'Regisztrációs hiba',
                error.response?.data?.message || 'Hiba történt a regisztráció során.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text h3 style={styles.title}>Parkolóház</Text>
            <Text h4 style={styles.subtitle}>Regisztráció</Text>

            <Input
                placeholder="Teljes név"
                value={name}
                onChangeText={setName}
                leftIcon={{ type: 'material', name: 'person' }}
                containerStyle={styles.input}
            />

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

            <Input
                placeholder="Jelszó megerősítése"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                leftIcon={{ type: 'material', name: 'lock' }}
                containerStyle={styles.input}
            />

            <Button
                title="Regisztráció"
                onPress={handleRegister}
                loading={loading}
                containerStyle={styles.buttonContainer}
            />

            <Button
                title="Vissza a bejelentkezéshez"
                type="clear"
                onPress={() => navigation.navigate('Login')}
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

export default RegisterScreen; 