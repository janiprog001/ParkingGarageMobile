import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, ActivityIndicator, Text, TouchableOpacity, FlatList } from 'react-native';
import { Text as RNE_Text, Card, Button, Icon } from '@rneui/themed';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getProfile, logout } from '../services/api';
import { User } from '../types';
import { Car } from '../types/car';
import { ParkingSpot } from '../types/parkingSpot';
import { getMyParkedCars, getAvailableSpots } from '../services/api';
import CarCard from '../components/CarCard';
import ParkingSpotCard from '../components/ParkingSpotCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventRegister } from 'react-native-event-listeners';
import { LOGOUT_EVENT } from '../navigation/AppNavigator';
import { PARKING_UPDATE_EVENT } from '../screens/LeaveParkingScreen';
import { PARKING_START_EVENT } from '../screens/ParkingScreen';

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

type DashboardScreenProps = {
    navigation: StackNavigationProp<RootStackParamList, 'Dashboard'>;
};

const DashboardScreen = ({ navigation }: DashboardScreenProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [parkedCars, setParkedCars] = useState<Car[]>([]);
    const [availableSpots, setAvailableSpots] = useState<ParkingSpot[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadUserData = async () => {
        try {
            // Közvetlenül az AsyncStorage-ból vegyük ki a user adatokat
            const userJson = await AsyncStorage.getItem('user');
            if (userJson) {
                const userData = JSON.parse(userJson);
                console.log("Betöltött felhasználói adatok:", userData);
                setUser(userData);
            } else {
                console.log("Nincs tárolt felhasználó");
                // Próbáljuk meg a profil endpointról lekérni
                const userData = await getProfile();
                setUser(userData);
            }
        } catch (error) {
            console.error('Hiba a felhasználói adatok betöltése során:', error);
            Alert.alert('Hiba', 'Nem sikerült betölteni a felhasználói adatokat.');
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            console.log("Dashboard adatok betöltése...");
            
            // Ellenőrizzük, hogy van-e token
            const token = await AsyncStorage.getItem('token');
            console.log("Token ellenőrzése:", token ? "van" : "nincs");
            
            if (!token) {
                console.log("Nincs token, nem próbálunk adatokat betölteni");
                setParkedCars([]);
                setAvailableSpots([]);
                return;
            }
            
            try {
                const [carsData, spotsData] = await Promise.all([
                    getMyParkedCars(),
                    getAvailableSpots()
                ]);
                
                console.log("Autó adatok:", carsData);
                console.log("Parkolóhely adatok:", spotsData);
                
                setParkedCars(carsData);
                setAvailableSpots(spotsData);
            } catch (apiError) {
                console.error("API hiba az adatok betöltése során:", apiError);
                
                // Ha 401-es hibát kapunk, akkor automatikusan kijelentkeztetjük a felhasználót
                if (apiError.response?.status === 401) {
                    console.log("401 Unauthorized - Automatikus kijelentkeztetés");
                    Alert.alert(
                        "Munkamenet lejárt",
                        "A bejelentkezési időszak lejárt. Kérjük, jelentkezzen be újra.",
                        [
                            {
                                text: "OK",
                                onPress: () => handleLogout()
                            }
                        ]
                    );
                }
            }
        } catch (error) {
            console.error('Hiba a dashboard adatok betöltése során:', error);
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
        loadUserData();
        loadData();
        
        // Figyeljük a parkolás-frissítési eseményeket
        const parkingUpdateListener = EventRegister.addEventListener(PARKING_UPDATE_EVENT, (data) => {
            console.log("Kiállás esemény érkezett, adatok frissítése", data);
            loadData(); // Frissítjük az adatokat
        });
        
        // Figyeljük a parkolás-indítási eseményeket
        const parkingStartListener = EventRegister.addEventListener(PARKING_START_EVENT, (data) => {
            console.log("Parkolás indítás esemény érkezett, adatok frissítése", data);
            loadData(); // Frissítjük az adatokat
        });
        
        return () => {
            // Leiratkozás az eseményekről amikor a komponens unmount-ol
            EventRegister.removeEventListener(parkingUpdateListener as string);
            EventRegister.removeEventListener(parkingStartListener as string);
        };
    }, []);

    // Kijelentkezés
    const handleLogout = async () => {
        try {
            setLoading(true);
            
            // Meghívjuk a logout API funkciót
            console.log("Kijelentkezés folyamatban...");
            await logout();
            
            // Töröljük a tokent és a felhasználói adatokat
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            
            // Esemény kiküldése a navigációs rendszernek
            console.log("Logout esemény kiküldése");
            EventRegister.emit(LOGOUT_EVENT, { success: true });
            
            // Nem kell explicit navigáció, az AppNavigator fog frissülni
            console.log("Várakozás a navigáció frissítésére...");
            
            // Szükség esetén közvetlen navigációt is használhatunk
            // navigation.reset({
            //     index: 0,
            //     routes: [{ name: 'Login' }],
            // });
        } catch (error) {
            console.error('Kijelentkezési hiba:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleParkingSpotPress = (spot: ParkingSpot) => {
        navigation.navigate('Parking', { selectedSpot: spot });
    };

    const renderParkingSpots = () => {
        return (
            <FlatList
                data={availableSpots}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.spotItem}
                        onPress={() => handleParkingSpotPress(item)}
                    >
                        // ... existing code ...
                    </TouchableOpacity>
                )}
            />
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Parkoló Kezelő</Text>
                <TouchableOpacity 
                    style={styles.logoutButton} 
                    onPress={handleLogout}
                >
                    <Icon name="logout" type="material" color="#fff" size={24} />
                </TouchableOpacity>
            </View>
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Parkoló autóim</Text>
                    {loading ? (
                        <ActivityIndicator size="large" color="#0000ff" />
                    ) : parkedCars.length > 0 ? (
                        parkedCars.map((car, index) => (
                            <View key={index} style={styles.carItem}>
                                <Text style={styles.carText}>
                                    {car.car ? car.car.licensePlate : car.licensePlate} - {car.parkingSpot ? car.parkingSpot.spotNumber : car.spotId} helyen
                                </Text>
                                <TouchableOpacity
                                    style={styles.leaveButton}
                                    onPress={() => {
                                        // Ellenőrizzük minden szükséges adat meglétét
                                        console.log('Kiállás autó adatok (eredeti):', JSON.stringify(car));
                                        
                                        // Adaptáljuk az adatokat a megfelelő formátumra
                                        const carId = car.car?.id || car.id || (car.parkingSpot?.carId);
                                        const licensePlate = car.car?.licensePlate || car.licensePlate;
                                        
                                        // Biztosítsuk, hogy megvannak a szükséges adatok
                                        if (!carId) {
                                            console.error('Hiányzó autó ID:', car);
                                            Alert.alert('Hiba', 'Az autó azonosítója hiányzik vagy érvénytelen.');
                                            return;
                                        }
                                        
                                        // Előkészítjük az adaptált adatstruktúrát
                                        const adaptedCarData = {
                                            car: {
                                                id: carId.toString(),
                                                licensePlate: licensePlate || "Ismeretlen",
                                                brand: car.car?.brand || car.brand || "Ismeretlen",
                                                model: car.car?.model || car.model || "Ismeretlen"
                                            },
                                            parkingSpot: {
                                                id: car.parkingSpot?.id || car.spotId,
                                                carId: carId,
                                                floorNumber: car.parkingSpot?.floorNumber || car.floorNumber || "1",
                                                spotNumber: car.parkingSpot?.spotNumber || car.spotNumber || "Ismeretlen"
                                            },
                                            startTime: car.startTime || new Date().toISOString()
                                        };
                                        console.log('Kiállás autó adatok (adaptált):', JSON.stringify(adaptedCarData));
                                        navigation.navigate('LeaveParking', { car: adaptedCarData });
                                    }}
                                >
                                    <Text style={styles.leaveButtonText}>Kiállás</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noDataText}>Nincs parkoló autód</Text>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Parkolási statisztikák</Text>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.statsButton]}
                        onPress={() => navigation.navigate('Statistics')}
                    >
                        <Text style={styles.actionButtonText}>Parkolási statisztikáim</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Elérhető parkolóhelyek</Text>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.spotsButton]}
                        onPress={() => navigation.navigate('ParkingSpots')}
                    >
                        <Text style={styles.actionButtonText}>Parkolóhelyek megtekintése</Text>
                    </TouchableOpacity>
                    {loading ? (
                        <ActivityIndicator size="large" color="#0000ff" />
                    ) : (
                        <Text style={styles.availableSpotsText}>
                            {availableSpots.length} elérhető parkolóhely
                        </Text>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Autóim</Text>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.carsButton]}
                        onPress={() => navigation.navigate('Cars')}
                    >
                        <Text style={styles.actionButtonText}>Autóim kezelése</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#4CAF50',
        padding: 10,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    scrollContainer: {
        padding: 10,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    carItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
    },
    carText: {
        flex: 1,
    },
    leaveButton: {
        padding: 5,
        backgroundColor: '#FF5252',
        borderRadius: 5,
    },
    leaveButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    parkButton: {
        backgroundColor: '#4CAF50',
    },
    statsButton: {
        backgroundColor: '#4CAF50', // Zöld szín a statisztikákhoz
    },
    spotsButton: {
        backgroundColor: '#4CAF50',
    },
    carsButton: {
        backgroundColor: '#2196F3',
    },
    actionButton: {
        padding: 10,
        backgroundColor: '#4CAF50',
        borderRadius: 5,
        marginBottom: 10,
    },
    actionButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    noDataText: {
        textAlign: 'center',
        marginTop: 20,
    },
    availableSpotsText: {
        textAlign: 'center',
        marginTop: 10,
    },
    spotItem: {
        // ... existing code ...
    },
    logoutButton: {
        position: 'absolute',
        right: 15,
        top: 15,
        padding: 8,
    },
});

export default DashboardScreen; 