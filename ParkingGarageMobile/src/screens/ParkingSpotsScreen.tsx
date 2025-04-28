import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { getAvailableSpots } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type ParkingSpotsScreenProps = {
    navigation: StackNavigationProp<RootStackParamList, 'ParkingSpots'>;
};

interface ParkingSpot {
    id: string;
    floorNumber: number;
    spotNumber: number;
    isAvailable: boolean;
}

const ParkingSpotsScreen = ({ navigation }: ParkingSpotsScreenProps) => {
    const [spots, setSpots] = useState<ParkingSpot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFloor, setSelectedFloor] = useState(1);
    const floors = [1, 2, 3]; // feltételezve, hogy 3 emelet van

    const loadSpots = async () => {
        try {
            setLoading(true);
            setError(null);
            const availableSpots = await getAvailableSpots();
            setSpots(availableSpots);
        } catch (err) {
            console.error('Hiba a parkolóhelyek betöltésekor:', err);
            setError('Nem sikerült betölteni a parkolóhelyeket');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadSpots();
        setRefreshing(false);
    };

    useEffect(() => {
        loadSpots();
    }, []);

    const renderFloorSelector = () => (
        <View style={styles.floorSelector}>
            {floors.map(floor => (
                <TouchableOpacity
                    key={floor}
                    style={[
                        styles.floorButton,
                        selectedFloor === floor && styles.floorButtonSelected
                    ]}
                    onPress={() => setSelectedFloor(floor)}
                >
                    <Text
                        style={[
                            styles.floorButtonText,
                            selectedFloor === floor && styles.floorButtonTextSelected
                        ]}
                    >
                        {floor}. emelet
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    // Szűrés az aktuális emeletre
    const filteredSpots = spots.filter(spot => spot.floorNumber === selectedFloor);

    const renderSpot = ({ item }: { item: ParkingSpot }) => (
        <View style={[
            styles.spot,
            !item.isAvailable && styles.spotOccupied
        ]}>
            <Text style={styles.spotNumber}>{item.spotNumber}</Text>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Parkolóhelyek betöltése...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadSpots}>
                    <Text style={styles.retryButtonText}>Újrapróbálkozás</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Parkolóhelyek</Text>
            </View>
            
            {renderFloorSelector()}
            
            <FlatList
                data={filteredSpots}
                renderItem={renderSpot}
                keyExtractor={item => item.id}
                numColumns={3}
                contentContainerStyle={styles.spotsContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            />
            
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={styles.legendSpot} />
                    <Text style={styles.legendText}>Szabad</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendSpot, styles.spotOccupied]} />
                    <Text style={styles.legendText}>Foglalt</Text>
                </View>
            </View>
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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
    floorSelector: {
        flexDirection: 'row',
        margin: 10,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 4,
    },
    floorButton: {
        flex: 1,
        padding: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    floorButtonSelected: {
        backgroundColor: '#4CAF50',
    },
    floorButtonText: {
        fontSize: 16,
        color: '#666',
    },
    floorButtonTextSelected: {
        color: 'white',
        fontWeight: 'bold',
    },
    spotsContainer: {
        padding: 10,
    },
    spot: {
        flex: 1,
        aspectRatio: 1,
        margin: 5,
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    spotOccupied: {
        backgroundColor: '#FF5252',
    },
    spotNumber: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: 'white',
        marginVertical: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 10,
    },
    legendSpot: {
        width: 16,
        height: 16,
        backgroundColor: '#4CAF50',
        borderRadius: 4,
        marginRight: 8,
    },
    legendText: {
        fontSize: 14,
        color: '#666',
    },
    errorText: {
        color: '#FF5252',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#4CAF50',
        padding: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ParkingSpotsScreen; 