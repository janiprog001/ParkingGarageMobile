import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, ActivityIndicator, StyleSheet, Text, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Button } from '@rneui/themed';
import { getAvailableSpots } from '../services/api';
import { ParkingSpot } from '../types';

const ParkingSpotsScreen = () => {
  const navigation = useNavigation();
  
  const [availableSpots, setAvailableSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const spots = await getAvailableSpots();
      setAvailableSpots(spots);
      console.log('Parkolóhelyek betöltve:', spots.length);
    } catch (error) {
      console.error('Hiba a parkolóhelyek betöltésekor:', error);
      Alert.alert('Hiba', 'Nem sikerült betölteni a parkolóhelyeket. Kérjük, próbáld újra később.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Emeletenként csoportosítja a parkolóhelyeket
  const groupedSpots = availableSpots.reduce((acc, spot) => {
    const floor = spot.floorNumber;
    if (!acc[floor]) {
      acc[floor] = [];
    }
    
    // Beállítjuk az isAvailable mezőt az isOccupied alapján (ha foglalt, akkor nem elérhető)
    if (spot.isAvailable === undefined) {
      spot.isAvailable = !spot.isOccupied;
    }
    
    acc[floor].push(spot);
    return acc;
  }, {} as Record<number, ParkingSpot[]>);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2089dc" />
        <Text style={styles.loadingText}>Parkolóhelyek betöltése...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Parkolóhelyek</Text>

        {Object.entries(groupedSpots).length === 0 ? (
          <Card>
            <Card.Title>Nincs elérhető parkolóhely</Card.Title>
            <Card.Divider />
            <Text>Jelenleg nem található elérhető parkolóhely.</Text>
          </Card>
        ) : (
          Object.entries(groupedSpots)
            .sort(([floorA], [floorB]) => Number(floorA) - Number(floorB))
            .map(([floor, spots]) => (
              <View key={floor} style={styles.floorSection}>
                <Text style={styles.floorTitle}>{floor}. emelet</Text>
                <View style={styles.spotsGrid}>
                  {spots.map((spot) => (
                    <Card
                      key={spot.id}
                      containerStyle={[
                        styles.spotCard,
                        { backgroundColor: (spot.isAvailable || !spot.isOccupied) ? '#e8f5e9' : '#ffebee' }
                      ]}
                    >
                      <View style={styles.spotHeader}>
                        <Text style={styles.spotNumber}>{spot.spotNumber}</Text>
                        {(!spot.isAvailable || spot.isOccupied) && (
                          <View style={styles.reservedBadge}>
                            <Text style={styles.reservedText}>Foglalt</Text>
                          </View>
                        )}
                      </View>
                      
                      <Card.Divider />
                      
                      <View style={styles.spotDetails}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailText}>
                            {(spot.isAvailable || !spot.isOccupied) ? 'Szabad' : 'Foglalt'}
                          </Text>
                        </View>
                      </View>
                      
                      <Button
                        title="Részletek"
                        buttonStyle={styles.parkButton}
                        onPress={() => {
                          if (spot.isAvailable || !spot.isOccupied) {
                            navigation.navigate('Parking' as never, { selectedSpot: spot } as never);
                          } else {
                            Alert.alert('Foglalt hely', 'Ez a parkolóhely már foglalt.');
                          }
                        }}
                        disabled={!spot.isAvailable && spot.isOccupied}
                        disabledStyle={styles.disabledButton}
                      />
                    </Card>
                  ))}
                </View>
              </View>
            ))
        )}
        
        <Button
          title="Vissza a főoldalra"
          containerStyle={{ marginTop: 20, marginBottom: 30 }}
          onPress={() => navigation.navigate('Dashboard' as never)}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  floorSection: {
    marginBottom: 24,
  },
  floorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  spotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  spotCard: {
    width: '100%',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    marginHorizontal: 0,
  },
  spotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spotNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  reservedBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  reservedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  spotDetails: {
    marginVertical: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  parkButton: {
    borderRadius: 6,
    marginTop: 4,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
});

export default ParkingSpotsScreen; 