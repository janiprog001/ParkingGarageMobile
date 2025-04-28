import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { getMyReservations, cancelReservation } from '../services/api';
import { Reservation } from '../types';
import { useAuthStore } from '../store';
import { useNavigation } from '@react-navigation/native';

export default function ReservationsScreen() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const user = useAuthStore((state) => state.user);
    const navigation = useNavigation();

    useEffect(() => {
        if (user) {
            fetchReservations();
        } else {
            setLoading(false);
            setError('Be kell jelentkeznie a foglalások megtekintéséhez.');
        }
    }, [user]);

    const fetchReservations = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getMyReservations();
            setReservations(data);
        } catch (err: any) {
            console.error('Hiba a foglalások betöltésekor:', err);
            setError(err.message || 'Hiba történt a foglalások betöltésekor');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchReservations();
    };

    const handleCancelReservation = (id: number) => {
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
                            await cancelReservation(id);
                            Alert.alert('Siker', 'A foglalás sikeresen lemondva.');
                            fetchReservations();
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

    const renderReservation = ({ item }: { item: Reservation }) => (
        <TouchableOpacity 
            style={styles.reservationCard}
            onPress={() => navigation.navigate('ReservationDetails', { reservationId: item.id })}
        >
            <View style={styles.header}>
                <Text style={styles.spotInfo}>
                    {item.floorNumber}. emelet - {item.spotNumber}. hely
                </Text>
                <Text style={[
                    styles.status,
                    item.status === 'Jóváhagyott' ? styles.statusApproved : 
                    item.status === 'Függőben' ? styles.statusPending : 
                    item.status === 'Lemondott' ? styles.statusCancelled : 
                    styles.statusCompleted
                ]}>
                    {item.status}
                </Text>
            </View>
            <View style={styles.timeInfo}>
                <Text style={styles.time}>Kezdés: {formatDate(item.startTime)}</Text>
                <Text style={styles.time}>Befejezés: {formatDate(item.endTime)}</Text>
            </View>
            <View style={styles.footer}>
                <Text style={styles.fee}>Díj: {item.totalFee} Ft</Text>
                {item.status === 'Jóváhagyott' && new Date(item.startTime) > new Date() && (
                    <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={() => handleCancelReservation(item.id)}
                    >
                        <Text style={styles.cancelButtonText}>Lemondás</Text>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0066cc" />
                <Text style={styles.loadingText}>Foglalások betöltése...</Text>
            </View>
        );
    }

    if (error && !user) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity 
                    style={styles.loginButton}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.loginButtonText}>Bejelentkezés</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchReservations}>
                    <Text style={styles.retryButtonText}>Újrapróbálás</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={reservations}
                renderItem={renderReservation}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#0066cc']}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Nincsenek foglalások</Text>
                        <TouchableOpacity 
                            style={styles.createButton}
                            onPress={() => navigation.navigate('CreateReservation')}
                        >
                            <Text style={styles.createButtonText}>Új foglalás</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
            {reservations.length > 0 && (
                <TouchableOpacity 
                    style={styles.floatingButton}
                    onPress={() => navigation.navigate('CreateReservation')}
                >
                    <Text style={styles.floatingButtonText}>+</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
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
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    reservationCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    spotInfo: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    status: {
        fontSize: 12,
        fontWeight: 'bold',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    statusApproved: {
        backgroundColor: '#e3f2fd',
        color: '#0066cc',
    },
    statusPending: {
        backgroundColor: '#fff9c4',
        color: '#ffa000',
    },
    statusCancelled: {
        backgroundColor: '#ffebee',
        color: '#d32f2f',
    },
    statusCompleted: {
        backgroundColor: '#e8f5e9',
        color: '#388e3c',
    },
    timeInfo: {
        marginBottom: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#f0f0f0',
    },
    time: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    fee: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2ecc71',
    },
    cancelButton: {
        backgroundColor: '#ffebee',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
    },
    cancelButtonText: {
        color: '#d32f2f',
        fontSize: 14,
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
    loginButton: {
        backgroundColor: '#0066cc',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
    },
    loginButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    createButton: {
        backgroundColor: '#0066cc',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
    },
    createButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    floatingButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#0066cc',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    floatingButtonText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    }
}); 