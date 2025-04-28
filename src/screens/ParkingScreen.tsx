import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Button, Card, Input } from '@rneui/themed';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parkCar, getMyCars } from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Car } from '../types';
import { EventRegister } from 'react-native-event-listeners';

// Definiáljuk az eseményt a parkolás frissítéséhez
export const PARKING_START_EVENT = 'parking_start_event';

type ParkingScreenRouteProp = RouteProp<RootStackParamList, 'Parking'>;

const ParkingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<ParkingScreenRouteProp>();
  const selectedSpot = route.params?.selectedSpot;

  const [loading, setLoading] = useState(false);
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCar, setSelectedCar] = useState<string | null>(null);
  const [loadingCars, setLoadingCars] = useState(true);

  useEffect(() => {
    if (!selectedSpot) {
      Alert.alert('Hiba', 'Nincs kiválasztott parkolóhely. Kérjük, válasszon egy parkolóhelyet.');
      navigation.navigate('ParkingSpots' as never);
      return;
    }
    loadMyCars();
  }, []);

  const loadMyCars = async () => {
    try {
      setLoadingCars(true);
      const myCars = await getMyCars();
      
      // Csak azokat az autókat mutatjuk, amelyek nincsenek parkolóban
      const availableCars = myCars.filter(car => !car.isParked);
      
      setCars(availableCars);
      
      if (availableCars.length > 0) {
        setSelectedCar(availableCars[0].id);
      }
      
    } catch (error) {
      console.error('Hiba az autók betöltésekor:', error);
      Alert.alert('Hiba', 'Nem sikerült betölteni az autókat. Kérjük, próbáld újra később.');
    } finally {
      setLoadingCars(false);
    }
  };

  const handlePark = async () => {
    if (!selectedCar) {
      Alert.alert('Figyelmeztetés', 'Kérjük, válassz ki egy autót a parkoláshoz.');
      return;
    }

    try {
      setLoading(true);
      
      const result = await parkCar({
        carId: selectedCar,
        parkingSpotId: selectedSpot.id
      });
      
      // Küldjünk frissítési eseményt a Dashboard számára
      console.log('Parkolás sikeres, frissítési esemény kiküldése');
      EventRegister.emit(PARKING_START_EVENT, { success: true });
      
      Alert.alert(
        'Sikeres parkolás',
        `A parkolás sikeresen megtörtént. Parkolási hely: ${selectedSpot.floorNumber}. emelet, ${selectedSpot.spotNumber}. hely.`,
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('Dashboard' as never) 
          }
        ]
      );
      
    } catch (error) {
      console.error('Hiba a parkolás során:', error);
      Alert.alert('Hiba', 'Nem sikerült végrehajtani a parkolást. Kérjük, próbáld újra később.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingCars) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2089dc" />
        <Text style={styles.loadingText}>Autók betöltése...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Parkolás</Text>
      
      <Card containerStyle={styles.card}>
        <Card.Title>Parkolóhely információk</Card.Title>
        <Card.Divider />
        
        {selectedSpot ? (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Emelet:</Text>
              <Text style={styles.infoValue}>{selectedSpot.floorNumber}. emelet</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hely száma:</Text>
              <Text style={styles.infoValue}>{selectedSpot.spotNumber}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Állapot:</Text>
              <Text style={[
                styles.infoValue, 
                { color: (selectedSpot.isAvailable || !selectedSpot.isOccupied) ? 'green' : 'red' }
              ]}>
                {(selectedSpot.isAvailable || !selectedSpot.isOccupied) ? 'Szabad' : 'Foglalt'}
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.noDataText}>Nincs kiválasztott parkolóhely</Text>
        )}
      </Card>
      
      <Card containerStyle={styles.card}>
        <Card.Title>Válassz autót</Card.Title>
        <Card.Divider />
        
        {cars.length === 0 ? (
          <View style={styles.noCarContainer}>
            <Text style={styles.noCarText}>Nincs elérhető autó a parkoláshoz</Text>
            <Button
              title="Új autó hozzáadása"
              buttonStyle={styles.addCarButton}
              onPress={() => navigation.navigate('Cars' as never)}
              containerStyle={styles.buttonContainer}
            />
          </View>
        ) : (
          <View>
            {cars.map(car => (
              <Button
                key={car.id}
                title={`${car.brand} ${car.model} (${car.licensePlate})`}
                buttonStyle={[
                  styles.carButton,
                  selectedCar === car.id ? styles.selectedCarButton : null
                ]}
                titleStyle={
                  selectedCar === car.id ? styles.selectedCarButtonText : null
                }
                onPress={() => setSelectedCar(car.id)}
                type={selectedCar === car.id ? "solid" : "outline"}
                containerStyle={styles.buttonContainer}
              />
            ))}
          </View>
        )}
      </Card>
      
      <View style={styles.buttonGroup}>
        <Button
          title="Vissza"
          type="outline"
          onPress={() => navigation.goBack()}
          containerStyle={[styles.buttonContainer, { flex: 1, marginRight: 8 }]}
        />
        
        <Button
          title={loading ? "Feldolgozás..." : "Parkolás indítása"}
          onPress={handlePark}
          disabled={loading || cars.length === 0}
          containerStyle={[styles.buttonContainer, { flex: 2 }]}
          disabledStyle={{ backgroundColor: '#cccccc' }}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
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
  card: {
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  infoValue: {
    fontSize: 16,
  },
  carButton: {
    paddingVertical: 12,
    marginBottom: 8,
  },
  selectedCarButton: {
    backgroundColor: '#2089dc',
  },
  selectedCarButtonText: {
    color: 'white',
  },
  buttonContainer: {
    marginVertical: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    marginTop: 16,
  },
  noCarContainer: {
    alignItems: 'center',
    padding: 16,
  },
  noCarText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 16,
    textAlign: 'center',
  },
  addCarButton: {
    backgroundColor: '#2089dc',
  },
  noDataText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});

export default ParkingScreen; 