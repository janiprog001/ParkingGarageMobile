import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    Alert, 
    ActivityIndicator,
    TextInput,
    Platform 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { getUserCars, getAvailableSpots, createReservation } from '../services/api';
import { Car, ParkingSpot } from '../types';
import { useNavigation } from '@react-navigation/native';

export default function CreateReservationScreen() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [cars, setCars] = useState<Car[]>([]);
    const [availableSpots, setAvailableSpots] = useState<ParkingSpot[]>([]);
    const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
    const [selectedSpotId, setSelectedSpotId] = useState<number | null>(null);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(new Date().getTime() + 3600000)); // Default +1 hour
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const navigation = useNavigation();
    
    useEffect(() => {
        fetchData();
    }, []);
    
    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const [carsData, spotsData] = await Promise.all([
                getUserCars(),
                getAvailableSpots()
            ]);
            
            setCars(carsData);
            setAvailableSpots(spotsData);
            
            // Set default values if available
            if (carsData.length > 0) {
                setSelectedCarId(carsData[0].id);
            }
            
            if (spotsData.length > 0) {
                setSelectedSpotId(spotsData[0].id);
            }
        } catch (err: any) {
            console.error('Hiba az adatok betöltésekor:', err);
            setError('Nem sikerült betölteni az adatokat. Kérjük, próbálja újra.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleCreateReservation = async () => {
        if (!selectedCarId || !selectedSpotId) {
            Alert.alert('Hiba', 'Kérjük, válasszon autót és parkolóhelyet.');
            return;
        }
        
        if (startDate >= endDate) {
            Alert.alert('Hiba', 'A befejezési időpontnak a kezdési időpont után kell lennie.');
            return;
        }
        
        try {
            setSubmitting(true);
            await createReservation(
                selectedCarId,
                selectedSpotId,
                startDate,
                endDate
            );
            
            Alert.alert(
                'Siker',
                'A foglalás sikeresen létrejött.',
                [
                    { 
                        text: 'OK', 
                        onPress: () => navigation.navigate('Reservations')
                    }
                ]
            );
        } catch (err: any) {
            Alert.alert('Hiba', err.message || 'Nem sikerült létrehozni a foglalást.');
        } finally {
            setSubmitting(false);
        }
    };
    
    const onStartDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || startDate;
        setShowStartDatePicker(Platform.OS === 'ios');
        setStartDate(currentDate);
        
        // If start date is after end date, update end date
        if (currentDate >= endDate) {
            const newEndDate = new Date(currentDate.getTime() + 3600000); // +1 hour
            setEndDate(newEndDate);
        }
    };
    
    const onEndDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || endDate;
        setShowEndDatePicker(Platform.OS === 'ios');
        setEndDate(currentDate);
    };
    
    const formatDate = (date: Date) => {
        return date.toLocaleString('hu-HU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0066cc" />
                <Text style={styles.loadingText}>Adatok betöltése...</Text>
            </View>
        );
    }
    
    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
                    <Text style={styles.retryButtonText}>Újrapróbálás</Text>
                </TouchableOpacity>
            </View>
        );
    }
    
    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Új foglalás létrehozása</Text>
                
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Válasszon autót:</Text>
                    {cars.length > 0 ? (
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={selectedCarId}
                                onValueChange={(itemValue) => setSelectedCarId(itemValue)}
                                style={styles.picker}
                            >
                                {cars.map((car) => (
                                    <Picker.Item 
                                        key={car.id} 
                                        label={`${car.brand} ${car.model} (${car.licensePlate})`} 
                                        value={car.id} 
                                    />
                                ))}
                            </Picker>
                        </View>
                    ) : (
                        <View style={styles.noDataContainer}>
                            <Text style={styles.noDataText}>Nincs regisztrált autó</Text>
                            <TouchableOpacity 
                                style={styles.addButton}
                                onPress={() => navigation.navigate('AddCar')}
                            >
                                <Text style={styles.addButtonText}>Autó hozzáadása</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
                
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Válasszon parkolóhelyet:</Text>
                    {availableSpots.length > 0 ? (
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={selectedSpotId}
                                onValueChange={(itemValue) => setSelectedSpotId(itemValue)}
                                style={styles.picker}
                            >
                                {availableSpots.map((spot) => (
                                    <Picker.Item 
                                        key={spot.id} 
                                        label={`${spot.floorNumber}. emelet - ${spot.spotNumber}. hely`} 
                                        value={spot.id} 
                                    />
                                ))}
                            </Picker>
                        </View>
                    ) : (
                        <View style={styles.noDataContainer}>
                            <Text style={styles.noDataText}>Nincs elérhető parkolóhely</Text>
                        </View>
                    )}
                </View>
                
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Kezdő időpont:</Text>
                    <TouchableOpacity 
                        style={styles.datePickerButton} 
                        onPress={() => setShowStartDatePicker(true)}
                    >
                        <Text style={styles.datePickerButtonText}>
                            {formatDate(startDate)}
                        </Text>
                    </TouchableOpacity>
                    {showStartDatePicker && (
                        <DateTimePicker
                            value={startDate}
                            mode="datetime"
                            is24Hour={true}
                            display="default"
                            onChange={onStartDateChange}
                            minimumDate={new Date()}
                        />
                    )}
                </View>
                
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Befejező időpont:</Text>
                    <TouchableOpacity 
                        style={styles.datePickerButton} 
                        onPress={() => setShowEndDatePicker(true)}
                    >
                        <Text style={styles.datePickerButtonText}>
                            {formatDate(endDate)}
                        </Text>
                    </TouchableOpacity>
                    {showEndDatePicker && (
                        <DateTimePicker
                            value={endDate}
                            mode="datetime"
                            is24Hour={true}
                            display="default"
                            onChange={onEndDateChange}
                            minimumDate={new Date(startDate.getTime() + 1800000)} // Start + 30min
                        />
                    )}
                </View>
                
                <TouchableOpacity 
                    style={[
                        styles.submitButton, 
                        (submitting || !selectedCarId || !selectedSpotId) && styles.submitButtonDisabled
                    ]}
                    onPress={handleCreateReservation}
                    disabled={submitting || !selectedCarId || !selectedSpotId}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text style={styles.submitButtonText}>Foglalás létrehozása</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        padding: 20,
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
        color: '#666',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        backgroundColor: 'white',
    },
    picker: {
        height: 50,
    },
    datePickerButton: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        backgroundColor: 'white',
        padding: 15,
    },
    datePickerButtonText: {
        fontSize: 16,
        color: '#333',
    },
    noDataContainer: {
        padding: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        backgroundColor: 'white',
        alignItems: 'center',
    },
    noDataText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 10,
    },
    addButton: {
        backgroundColor: '#0066cc',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 5,
    },
    addButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    submitButton: {
        backgroundColor: '#0066cc',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    },
    submitButtonDisabled: {
        backgroundColor: '#b3d1ff',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        color: '#d32f2f',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#0066cc',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
});