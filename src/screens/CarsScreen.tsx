import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { Text, Card, Button, Icon, ListItem, Avatar } from '@rneui/themed';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Car } from '../types/car';
import { getProfile } from '../services/api';

type CarsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Cars'>;

const CarsScreen = () => {
    const [cars, setCars] = useState<Car[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation<CarsScreenNavigationProp>();

    const loadData = async () => {
        try {
            setLoading(true);
            console.log("Autó adatok betöltése...");
            
            // Profil lekérése, mely tartalmazza az autó adatokat
            const profileData = await getProfile();
            console.log("Profil adat:", profileData);
            
            if (profileData && profileData.cars) {
                setCars(profileData.cars);
                console.log("Autók betöltve:", profileData.cars.length);
            } else {
                console.log("Nincsenek betölthető autók");
                setCars([]);
            }
        } catch (error) {
            console.error('Hiba az autó adatok betöltése során:', error);
            Alert.alert('Hiba', 'Nem sikerült betölteni az autó adatokat.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <View style={styles.container}>
            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2089dc" />
                    <Text style={styles.loadingText}>Autók betöltése...</Text>
                </View>
            ) : (
                <ScrollView
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    <Card containerStyle={styles.card}>
                        <Card.Title>Az Ön autói</Card.Title>
                        <Card.Divider />
                        
                        {cars.length > 0 ? (
                            cars.map((car, index) => (
                                <ListItem key={index} bottomDivider>
                                    <Avatar
                                        rounded
                                        icon={{name: 'directions-car', type: 'material'}}
                                        containerStyle={{backgroundColor: '#2089dc'}}
                                    />
                                    <ListItem.Content>
                                        <ListItem.Title>{car.brand} {car.model}</ListItem.Title>
                                        <ListItem.Subtitle>Rendszám: {car.licensePlate}</ListItem.Subtitle>
                                        {car.year && (
                                            <Text>Évjárat: {car.year}</Text>
                                        )}
                                        <Text style={car.isParked ? styles.parkedText : styles.notParkedText}>
                                            {car.isParked ? 'Leparkolt' : 'Nincs leparkolva'}
                                        </Text>
                                    </ListItem.Content>
                                    <Button
                                        icon={<Icon name="edit" size={20} color="white" />}
                                        buttonStyle={styles.editButton}
                                        onPress={() => Alert.alert('Információ', 'Szerkesztés funkció hamarosan érkezik!')}
                                    />
                                </ListItem>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>Jelenleg nincs regisztrált autója.</Text>
                        )}
                    </Card>
                    
                    <Button
                        title="Új autó hozzáadása"
                        icon={<Icon name="add" color="white" style={styles.buttonIcon} />}
                        containerStyle={styles.addButton}
                        onPress={() => Alert.alert('Információ', 'Új autó hozzáadása funkció hamarosan érkezik!')}
                    />
                    
                    <Button
                        title="Vissza a főoldalra"
                        type="outline"
                        containerStyle={styles.backButton}
                        onPress={() => navigation.goBack()}
                    />
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
    },
    card: {
        borderRadius: 10,
        marginBottom: 15,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 16,
        padding: 20,
    },
    buttonIcon: {
        marginRight: 10,
    },
    parkedText: {
        color: 'green',
        fontWeight: 'bold',
    },
    notParkedText: {
        color: 'gray',
    },
    editButton: {
        backgroundColor: '#2089dc',
        borderRadius: 5,
    },
    addButton: {
        marginHorizontal: 30,
        marginVertical: 10,
    },
    backButton: {
        marginHorizontal: 30,
        marginTop: 5,
        marginBottom: 30,
    },
});

export default CarsScreen; 