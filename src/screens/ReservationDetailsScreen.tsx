import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { getReservationDetails, cancelReservation } from '../services/api';
import { Reservation } from '../types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function ReservationDetailsScreen() {
    const [loading, setLoading] = useState(true);
    const [reservation, setReservation] = useState<Reservation | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const navigation = useNavigation();
    const route = useRoute();
    const { reservationId } = route.params as { reservationId: number };
    
    useEffect(() => {
        fetchReservationDetails();
    }, [reservationId]);
    
    const fetchReservationDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getReservationDetails(reservationId);
            setReservation(data);
        } catch (err: any) {
            console.error('Hiba a foglalás részleteinek betöltésekor:', err);
            setError(err.message || 'Hiba történt a foglalás részleteinek betöltésekor');
        } finally {
            setLoading(false);
        }
    };
    
    const handleCancelReservation = () => {
        Alert.alert(
            'Foglalás lemondása',
            'Biztosan le szeretnéd mondani ezt a foglalást?',
            [
                { text: 'Mégsem', style: 'cancel' },
                {
                    text: 'Lemondás',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await cancelReservation(reservationId);
                            Alert.alert('Siker', 'A foglalás sikeresen lemondva.', [
                                { text: 'OK', onPress: () => navigation.goBack() }
                            ]);
                        } catch (err: any) {
                            Alert.alert('Hiba', err.message || 'Nem sikerült lemondani a foglalást.');
                        }
                    }
                }
            ]
        );
    };
    
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('hu-HU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Jóváhagyott':
                return '#0066cc';
            case 'Függőben':
                return '#ffa000';
            case 'Lemondott':
                return '#d32f2f';
            case 'Befejezett':
                return '#388e3c';
            default:
                return '#666';
        }
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
                <TouchableOpacity style={styles.retryButton} onPress={fetchReservationDetails}>
                    <Text style={styles.retryButtonText}>Újrapróbálás</Text>
                </TouchableOpacity>
            </View>
        );
    }
    
    if (!reservation) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Foglalás nem található</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>Vissza</Text>
                </TouchableOpacity>
            </View>
        );
    }
    
    const canCancel = reservation.status === 'Jóváhagyott' && new Date(reservation.startTime) > new Date();
    
    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backIcon} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>Foglalás részletei</Text>
            </View>
            
            <View style={styles.card}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Státusz</Text>
                    <View style={[styles.statusContainer, { backgroundColor: `${getStatusColor(reservation.status)}20` }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(reservation.status) }]}>
                            {reservation.status}
                        </Text>
                    </View>
                </View>
                
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Foglalás azonosító</Text>
                    <Text style={styles.sectionContent}>#{reservation.id}</Text>
                </View>
                
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Hely</Text>
                    <Text style={styles.sectionContent}>{reservation.floorNumber}. emelet - {reservation.spotNumber}. hely</Text>
                </View>
                
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Időszak</Text>
                    <Text style={styles.sectionContent}>
                        <Text style={styles.timePeriod}>Kezdés:</Text> {formatDate(reservation.startTime)}
                    </Text>
                    <Text style={styles.sectionContent}>
                        <Text style={styles.timePeriod}>Befejezés:</Text> {formatDate(reservation.endTime)}
                    </Text>
                </View>
                
                {reservation.car && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Jármű</Text>
                        <Text style={styles.sectionContent}>
                            {reservation.car.brand} {reservation.car.model}
                        </Text>
                        <Text style={styles.sectionContent}>
                            Rendszám: {reservation.car.licensePlate}
                        </Text>
                    </View>
                )}
                
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Fizetendő díj</Text>
                    <Text style={styles.price}>{reservation.totalFee} Ft</Text>
                </View>
                
                {reservation.createdAt && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Foglalás időpontja</Text>
                        <Text style={styles.sectionContent}>
                            {formatDate(reservation.createdAt)}
                        </Text>
                    </View>
                )}
                
                {canCancel && (
                    <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={handleCancelReservation}
                    >
                        <Text style={styles.cancelButtonText}>Foglalás lemondása</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backIcon: {
        marginRight: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 10,
        margin: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    sectionContent: {
        fontSize: 16,
        color: '#333',
    },
    statusContainer: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    timePeriod: {
        fontWeight: 'bold',
    },
    price: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2ecc71',
    },
    cancelButton: {
        backgroundColor: '#ffebee',
        padding: 12,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    },
    cancelButtonText: {
        color: '#d32f2f',
        fontSize: 16,
        fontWeight: 'bold',
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
    backButton: {
        backgroundColor: '#666',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
    },
    backButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
}); 