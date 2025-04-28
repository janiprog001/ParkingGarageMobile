import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Button, Card } from '@rneui/themed';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { endParking } from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';
import { EventRegister } from 'react-native-event-listeners';

// Definiáljuk az eseményt, ami a frissítést jelzi
export const PARKING_UPDATE_EVENT = 'parking_update_event';

type LeaveParkingScreenRouteProp = RouteProp<RootStackParamList, 'LeaveParking'>;

const LeaveParkingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<LeaveParkingScreenRouteProp>();
  const { car } = route.params || {};
  
  const [loading, setLoading] = useState(false);

  if (!car) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Nem található autó adat.</Text>
        <Button
          title="Vissza a főoldalra"
          onPress={() => navigation.navigate('Dashboard' as never)}
          containerStyle={styles.buttonContainer}
        />
      </View>
    );
  }

  const handleLeaveParking = async () => {
    try {
      setLoading(true);
      
      // Log a kapott adatokat
      console.log('Car object:', car);
      
      // Ellenőrizzük, hogy az autó ID megfelelő formátumban van-e
      let carId;
      
      if (car.car && car.car.id) {
        carId = parseInt(car.car.id);
        console.log('Using car.car.id:', carId);
      } else if (car.parkingSpot && car.parkingSpot.carId) {
        carId = car.parkingSpot.carId;
        console.log('Using car.parkingSpot.carId:', carId);
      } else if (car.id) {
        carId = parseInt(car.id);
        console.log('Using car.id:', carId);
      } else {
        console.error('Hiányzó autó ID:', car);
        Alert.alert('Hiba', 'Az autó azonosítója hiányzik vagy érvénytelen.');
        return;
      }
      
      console.log('Kiállás megkezdése, autó ID:', carId);
      
      // Kiállás a parkolóhelyről
      await endParking(carId);
      
      // Esemény kiküldése, hogy a Dashboard frissítse az adatokat
      console.log('Kiállás sikeres, frissítési esemény kiküldése');
      EventRegister.emit(PARKING_UPDATE_EVENT, { success: true });
      
      Alert.alert(
        'Sikeres kiállás',
        `A parkolóhelyről sikeresen kiálltál a(z) ${car.car ? car.car.licensePlate : 'ismeretlen'} rendszámú autóddal.`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Navigáció a Dashboard képernyőre
              navigation.navigate('Dashboard' as never);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Hiba a kiállás során:', error);
      
      // Részletesebb hibaüzenet megjelenítése
      let errorMessage = 'Nem sikerült kiállni a parkolóhelyről. Kérjük, próbáld újra később.';
      
      if (error.response && error.response.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      Alert.alert('Hiba', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kiállás a parkolóhelyről</Text>
      
      <Card containerStyle={styles.card}>
        <Card.Title>Autó adatok</Card.Title>
        <Card.Divider />
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Márka és modell:</Text>
          <Text style={styles.infoValue}>{car.car.brand} {car.car.model}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Rendszám:</Text>
          <Text style={styles.infoValue}>{car.car.licensePlate}</Text>
        </View>
      </Card>
      
      <Card containerStyle={styles.card}>
        <Card.Title>Parkolóhely adatok</Card.Title>
        <Card.Divider />
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Emelet:</Text>
          <Text style={styles.infoValue}>{car.parkingSpot.floorNumber}. emelet</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Hely száma:</Text>
          <Text style={styles.infoValue}>{car.parkingSpot.spotNumber}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Parkolás kezdete:</Text>
          <Text style={styles.infoValue}>
            {new Date(car.startTime).toLocaleString('hu-HU')}
          </Text>
        </View>
      </Card>
      
      <Button
        title={loading ? "Feldolgozás..." : "Kiállás a parkolóhelyről"}
        buttonStyle={styles.leaveButton}
        onPress={handleLeaveParking}
        loading={loading}
        disabled={loading}
        containerStyle={styles.buttonContainer}
      />
      
      <Button
        title="Vissza"
        type="outline"
        onPress={() => navigation.goBack()}
        containerStyle={styles.buttonContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    borderRadius: 8,
    marginBottom: 16,
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
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  leaveButton: {
    backgroundColor: '#FF5252',
    paddingVertical: 12,
  },
  buttonContainer: {
    marginVertical: 8,
  },
});

export default LeaveParkingScreen; 