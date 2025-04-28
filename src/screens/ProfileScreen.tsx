import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, Input, Button, Card } from '@rneui/themed';
import { getProfile, updateProfile, logout } from '../services/api';
import { User } from '../types';

const ProfileScreen = () => {
    const [user, setUser] = useState<User | null>(null);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const userData = await getProfile();
            setUser(userData);
            setName(userData.name);
        } catch (error) {
            console.error('Error loading user data:', error);
            Alert.alert('Hiba', 'Nem sikerült betölteni a felhasználói adatokat.');
        }
    };

    const handleUpdateProfile = async () => {
        if (!name.trim()) {
            Alert.alert('Hiba', 'A név nem lehet üres!');
            return;
        }

        setLoading(true);
        try {
            const updatedUser = await updateProfile({ name });
            setUser(updatedUser);
            Alert.alert('Sikeres', 'A profil sikeresen frissítve!');
        } catch (error: any) {
            Alert.alert(
                'Hiba',
                error.response?.data?.message || 'Hiba történt a profil frissítése során.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            // A navigáció automatikusan megtörténik az AppNavigator-ban
        } catch (error) {
            console.error('Error during logout:', error);
            Alert.alert('Hiba', 'Hiba történt a kijelentkezés során.');
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Card containerStyle={styles.card}>
                <Card.Title>Profil adatok</Card.Title>
                <Card.Divider />
                
                <Input
                    label="Email cím"
                    value={user?.email}
                    disabled
                    leftIcon={{ type: 'material', name: 'email' }}
                />

                <Input
                    label="Név"
                    value={name}
                    onChangeText={setName}
                    leftIcon={{ type: 'material', name: 'person' }}
                />

                <Button
                    title="Profil frissítése"
                    onPress={handleUpdateProfile}
                    loading={loading}
                    containerStyle={styles.buttonContainer}
                />
            </Card>

            <Card containerStyle={styles.card}>
                <Card.Title>Főkönyvtár</Card.Title>
                <Card.Divider />
                
                <Text style={styles.infoText}>
                    Regisztrált: {new Date(user?.createdAt || '').toLocaleDateString('hu-HU')}
                </Text>
                <Text style={styles.infoText}>
                    Utoljára módosítva: {new Date(user?.updatedAt || '').toLocaleDateString('hu-HU')}
                </Text>
                <Text style={styles.infoText}>
                    Szerepkör: {user?.role === 'admin' ? 'Adminisztrátor' : 'Felhasználó'}
                </Text>

                <Button
                    title="Kijelentkezés"
                    onPress={handleLogout}
                    type="outline"
                    containerStyle={styles.buttonContainer}
                />
            </Card>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    card: {
        borderRadius: 10,
        marginBottom: 15,
    },
    buttonContainer: {
        marginTop: 20,
    },
    infoText: {
        fontSize: 16,
        marginBottom: 10,
        color: '#666',
    },
});

export default ProfileScreen; 