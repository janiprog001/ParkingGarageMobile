import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { Text, Card, Button, Icon, LinearProgress } from '@rneui/themed';
import { getParkingHistory, getInvoices, getStatisticsSummary, getStatisticsByCar, getMonthlyStatistics } from '../services/api';
import { ParkingHistory, Invoice } from '../types';

const { width } = Dimensions.get('window');

const StatisticsScreen = () => {
    const [parkingHistory, setParkingHistory] = useState<ParkingHistory[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [carStats, setCarStats] = useState<any[]>([]);
    const [monthlyStats, setMonthlyStats] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('summary');

    const loadData = async () => {
        try {
            setLoading(true);
            console.log("Statisztikák betöltése...");
            
            try {
                const history = await getParkingHistory();
                console.log("Parkolási előzmények betöltve:", history.length);
                setParkingHistory(history);
            } catch (error) {
                console.error("Hiba a parkolási előzmények betöltése során:", error);
            }
            
            try {
                const invoiceData = await getInvoices();
                console.log("Számlák betöltve:", invoiceData.length);
                setInvoices(invoiceData);
            } catch (error) {
                console.error("Hiba a számlák betöltése során:", error);
            }
            
            try {
                const summaryData = await getStatisticsSummary();
                console.log("Összesítő statisztikák betöltve");
                setSummary(summaryData);
            } catch (error) {
                console.error("Hiba az összesítő statisztikák betöltése során:", error);
            }
            
            try {
                const carStatsData = await getStatisticsByCar();
                console.log("Autó statisztikák betöltve:", carStatsData?.length || 0);
                setCarStats(carStatsData || []);
            } catch (error) {
                console.error("Hiba az autó statisztikák betöltése során:", error);
            }
            
            try {
                const monthlyStatsData = await getMonthlyStatistics();
                console.log("Havi statisztikák betöltve:", monthlyStatsData?.length || 0);
                setMonthlyStats(monthlyStatsData || []);
            } catch (error) {
                console.error("Hiba a havi statisztikák betöltése során:", error);
            }
            
        } catch (error) {
            console.error('Hiba a statisztikák betöltése során:', error);
            Alert.alert('Hiba', 'Nem sikerült betölteni a statisztikai adatokat. Kérjük, próbálja újra később.');
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

    // Összes parkolási idő számítása
    const calculateTotalParkingTime = () => {
        return parkingHistory.reduce((total, history) => {
            if (!history.startTime || !history.endTime) return total;
            
            const start = new Date(history.startTime);
            const end = new Date(history.endTime);
            const diff = end.getTime() - start.getTime();
            return total + diff;
        }, 0);
    };

    // Összes költség számítása
    const calculateTotalSpent = () => {
        if (summary && summary.totalFee !== undefined) {
            return summary.totalFee;
        }
        
        return parkingHistory.reduce((total, history) => {
            if (history.totalCost === null) return total;
            return total + history.totalCost;
        }, 0);
    };

    // Időtartam formázása (ms -> óra:perc)
    const formatDuration = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days} nap ${hours % 24} óra`;
        }
        return `${hours} óra ${minutes % 60} perc`;
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Statisztikák betöltése...</Text>
            </View>
        );
    }

    const renderTabButtons = () => (
        <View style={styles.tabContainer}>
            <Button
                title="Összesítés"
                type="clear"
                icon={{
                    name: 'chart-pie',
                    type: 'material-community',
                    size: 20,
                    color: activeTab === 'summary' ? '#4CAF50' : '#888',
                }}
                iconPosition="top"
                onPress={() => setActiveTab('summary')}
                buttonStyle={styles.tabButton}
                titleStyle={[
                    styles.tabButtonText,
                    activeTab === 'summary' && styles.activeTabButtonText
                ]}
            />
            <Button
                title="Előzmények"
                type="clear"
                icon={{
                    name: 'history',
                    type: 'material-community',
                    size: 20,
                    color: activeTab === 'history' ? '#4CAF50' : '#888',
                }}
                iconPosition="top"
                onPress={() => setActiveTab('history')}
                buttonStyle={styles.tabButton}
                titleStyle={[
                    styles.tabButtonText,
                    activeTab === 'history' && styles.activeTabButtonText
                ]}
            />
            <Button
                title="Számlák"
                type="clear"
                icon={{
                    name: 'file-document-outline',
                    type: 'material-community',
                    size: 20,
                    color: activeTab === 'invoices' ? '#4CAF50' : '#888',
                }}
                iconPosition="top"
                onPress={() => setActiveTab('invoices')}
                buttonStyle={styles.tabButton}
                titleStyle={[
                    styles.tabButtonText,
                    activeTab === 'invoices' && styles.activeTabButtonText
                ]}
            />
        </View>
    );

    const renderSummaryTab = () => (
        <>
            <View style={styles.statsCardContainer}>
                <View style={styles.statsCard}>
                    <Icon
                        name="car-outline"
                        type="material-community"
                        color="#4CAF50"
                        size={32}
                        containerStyle={styles.statsCardIcon}
                    />
                    <Text style={styles.statsCardValue}>
                        {summary?.totalParkings || parkingHistory.length}
                    </Text>
                    <Text style={styles.statsCardLabel}>Parkolások száma</Text>
                </View>
                
                <View style={styles.statsCard}>
                    <Icon
                        name="clock-outline"
                        type="material-community"
                        color="#FF9800"
                        size={32}
                        containerStyle={styles.statsCardIcon}
                    />
                    <Text style={styles.statsCardValue}>
                        {summary?.totalParkingTime 
                            ? formatDuration(summary.totalParkingTime) 
                            : formatDuration(calculateTotalParkingTime())}
                    </Text>
                    <Text style={styles.statsCardLabel}>Összes parkolási idő</Text>
                </View>
                
                <View style={styles.statsCard}>
                    <Icon
                        name="cash-multiple"
                        type="material-community"
                        color="#2196F3"
                        size={32}
                        containerStyle={styles.statsCardIcon}
                    />
                    <Text style={styles.statsCardValue}>{calculateTotalSpent()} Ft</Text>
                    <Text style={styles.statsCardLabel}>Összes költség</Text>
                </View>
            </View>

            {carStats.length > 0 && (
                <>
                    <Text style={styles.sectionTitle}>
                        <Icon 
                            name="car-multiple" 
                            type="material-community" 
                            size={20} 
                            color="#4CAF50" 
                        /> Autónkénti statisztikák
                    </Text>
                    {carStats.map((stat, index) => (
                        <Card key={index} containerStyle={styles.card}>
                            <View style={styles.cardHeader}>
                                <Icon
                                    name="car"
                                    type="material-community"
                                    color="#4CAF50"
                                    size={20}
                                />
                                <Text style={styles.historyTitle}>{stat.licensePlate || "Ismeretlen autó"}</Text>
                            </View>
                            <Card.Divider />
                            
                            <View style={styles.statRow}>
                                <Text style={styles.historyLabel}>Parkolások száma:</Text>
                                <Text style={styles.historyValue}>{stat.totalParkings || 0} db</Text>
                            </View>
                            
                            <View style={styles.statRow}>
                                <Text style={styles.historyLabel}>Összes idő:</Text>
                                <Text style={styles.historyValue}>
                                    {formatDuration(stat.totalParkingTime || 0)}
                                </Text>
                            </View>
                            
                            <View style={styles.statRow}>
                                <Text style={styles.historyLabel}>Összes díj:</Text>
                                <Text style={styles.historyValue}>{stat.totalFee || 0} Ft</Text>
                            </View>
                        </Card>
                    ))}
                </>
            )}

            {monthlyStats.length > 0 && (
                <>
                    <Text style={styles.sectionTitle}>
                        <Icon 
                            name="calendar-month" 
                            type="material-community" 
                            size={20} 
                            color="#4CAF50" 
                        /> Havi statisztikák
                    </Text>
                    {monthlyStats.map((stat, index) => (
                        <Card key={index} containerStyle={styles.card}>
                            <View style={styles.cardHeader}>
                                <Icon
                                    name="calendar"
                                    type="material-community"
                                    color="#4CAF50"
                                    size={20}
                                />
                                <Text style={styles.historyTitle}>{stat.month || "Ismeretlen hónap"}</Text>
                            </View>
                            <Card.Divider />
                            
                            <View style={styles.statRow}>
                                <Text style={styles.historyLabel}>Parkolások száma:</Text>
                                <Text style={styles.historyValue}>{stat.parkingCount || 0} db</Text>
                            </View>
                            
                            <View style={styles.statRow}>
                                <Text style={styles.historyLabel}>Összes idő:</Text>
                                <Text style={styles.historyValue}>
                                    {formatDuration(stat.totalTime || 0)}
                                </Text>
                            </View>
                            
                            <View style={styles.statRow}>
                                <Text style={styles.historyLabel}>Összes díj:</Text>
                                <Text style={styles.historyValue}>{stat.totalFee || 0} Ft</Text>
                            </View>
                        </Card>
                    ))}
                </>
            )}
        </>
    );

    const renderHistoryTab = () => (
        <>
            <Text style={styles.sectionTitle}>
                <Icon 
                    name="history" 
                    type="material-community" 
                    size={20} 
                    color="#4CAF50" 
                /> Parkolási előzmények
            </Text>
            
            {parkingHistory.length === 0 ? (
                <Card containerStyle={styles.card}>
                    <View style={styles.emptyContainer}>
                        <Icon
                            name="calendar-remove"
                            type="material-community"
                            color="#888"
                            size={50}
                        />
                        <Text style={styles.emptyText}>Nincs parkolási előzmény</Text>
                    </View>
                </Card>
            ) : (
                parkingHistory.map((history, index) => (
                    <Card key={index} containerStyle={styles.card}>
                        <View style={styles.historyHeader}>
                            <View style={styles.cardHeader}>
                                <Icon
                                    name={history.endTime ? "car-off" : "car-clock"}
                                    type="material-community"
                                    color={history.endTime ? "#4CAF50" : "#2196F3"}
                                    size={20}
                                />
                                <Text style={styles.historyTitle}>
                                    Parkolás #{history.id}
                                </Text>
                            </View>
                            <View style={[
                                styles.historyStatus,
                                history.endTime ? styles.historyCompleted : styles.historyActive
                            ]}>
                                <Text style={styles.historyStatusText}>
                                    {history.endTime ? 'Befejezve' : 'Aktív'}
                                </Text>
                            </View>
                        </View>
                        
                        <Card.Divider />
                        
                        <View style={styles.historyRow}>
                            <Text style={styles.historyLabel}>Rendszám:</Text>
                            <Text style={styles.historyValue}>{history.licensePlate || "Ismeretlen"}</Text>
                        </View>
                        
                        <View style={styles.historyRow}>
                            <Text style={styles.historyLabel}>Parkolóhely:</Text>
                            <Text style={styles.historyValue}>
                                {history.floorNumber || "?"} emelet, {history.spotNumber || "?"} hely
                            </Text>
                        </View>
                        
                        <View style={styles.historyRow}>
                            <Text style={styles.historyLabel}>Kezdés:</Text>
                            <Text style={styles.historyValue}>
                                {new Date(history.startTime).toLocaleString()}
                            </Text>
                        </View>
                        
                        {history.endTime && (
                            <View style={styles.historyRow}>
                                <Text style={styles.historyLabel}>Befejezés:</Text>
                                <Text style={styles.historyValue}>
                                    {new Date(history.endTime).toLocaleString()}
                                </Text>
                            </View>
                        )}
                        
                        {history.totalCost !== null && (
                            <View style={styles.historyRow}>
                                <Text style={styles.historyLabel}>Díj:</Text>
                                <Text style={styles.historyValue}>{history.totalCost} Ft</Text>
                            </View>
                        )}
                    </Card>
                ))
            )}
        </>
    );

    const renderInvoicesTab = () => (
        <>
            <Text style={styles.sectionTitle}>
                <Icon 
                    name="file-document-outline" 
                    type="material-community" 
                    size={20} 
                    color="#4CAF50" 
                /> Számlák
            </Text>
            
            {invoices.length === 0 ? (
                <Card containerStyle={styles.card}>
                    <View style={styles.emptyContainer}>
                        <Icon
                            name="file-document-off-outline"
                            type="material-community"
                            color="#888"
                            size={50}
                        />
                        <Text style={styles.emptyText}>Nincs számla</Text>
                    </View>
                </Card>
            ) : (
                invoices.map((invoice, index) => (
                    <Card key={index} containerStyle={styles.card}>
                        <View style={styles.historyHeader}>
                            <View style={styles.cardHeader}>
                                <Icon
                                    name="file-document-outline"
                                    type="material-community"
                                    color="#4CAF50"
                                    size={20}
                                />
                                <Text style={styles.historyTitle}>
                                    Számla #{invoice.id}
                                </Text>
                            </View>
                            <View style={[
                                styles.historyStatus,
                                invoice.status === 'paid' ? styles.invoicePaid : 
                                invoice.status === 'pending' ? styles.invoicePending : styles.invoiceCancelled
                            ]}>
                                <Text style={styles.historyStatusText}>
                                    {invoice.status === 'paid' ? 'Fizetve' : 
                                     invoice.status === 'pending' ? 'Függőben' : 'Törölve'}
                                </Text>
                            </View>
                        </View>
                        
                        <Card.Divider />
                        
                        <View style={styles.historyRow}>
                            <Text style={styles.historyLabel}>Kiállítva:</Text>
                            <Text style={styles.historyValue}>
                                {new Date(invoice.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                        
                        <View style={styles.historyRow}>
                            <Text style={styles.historyLabel}>Fizetési határidő:</Text>
                            <Text style={styles.historyValue}>
                                {new Date(invoice.dueDate).toLocaleDateString()}
                            </Text>
                        </View>
                        
                        <View style={styles.historyRow}>
                            <Text style={styles.historyLabel}>Összeg:</Text>
                            <Text style={styles.historyValue}>{invoice.amount} Ft</Text>
                        </View>
                    </Card>
                ))
            )}
        </>
    );

    return (
        <View style={styles.container}>
            {renderTabButtons()}
            
            {refreshing && (
                <LinearProgress 
                    color="#4CAF50" 
                    style={styles.progressBar}
                    variant="indeterminate"
                />
            )}
            
            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh}
                        colors={["#4CAF50"]}
                    />
                }
            >
                {activeTab === 'summary' && renderSummaryTab()}
                {activeTab === 'history' && renderHistoryTab()}
                {activeTab === 'invoices' && renderInvoicesTab()}
            </ScrollView>
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
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#333',
    },
    progressBar: {
        marginTop: 0,
        height: 3,
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#fff',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        elevation: 2,
    },
    tabButton: {
        paddingVertical: 8,
        borderRadius: 0,
    },
    tabButtonText: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    activeTabButtonText: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 30,
    },
    statsCardContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginVertical: 16,
        paddingHorizontal: 8,
    },
    statsCard: {
        width: (width - 40) / 3,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 12,
        alignItems: 'center',
        elevation: 2,
        marginBottom: 10,
    },
    statsCardIcon: {
        marginBottom: 8,
    },
    statsCardValue: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    statsCardLabel: {
        fontSize: 11,
        color: '#555',
        textAlign: 'center',
    },
    card: {
        borderRadius: 10,
        marginBottom: 16,
        marginHorizontal: 10,
        padding: 10,
        elevation: 3,
        borderWidth: 0,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#4CAF50',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        margin: 16,
        marginBottom: 8,
        color: '#333',
        flexDirection: 'row',
        alignItems: 'center',
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingHorizontal: 5,
    },
    statLabel: {
        fontSize: 16,
        color: '#555',
        fontWeight: '500',
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    historyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    historyStatus: {
        padding: 4,
        paddingHorizontal: 10,
        borderRadius: 20,
    },
    historyStatusText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'white',
    },
    historyCompleted: {
        backgroundColor: '#4CAF50',
    },
    historyActive: {
        backgroundColor: '#2196F3',
    },
    invoicePaid: {
        backgroundColor: '#4CAF50',
    },
    invoicePending: {
        backgroundColor: '#FFC107',
    },
    invoiceCancelled: {
        backgroundColor: '#F44336',
    },
    historyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        paddingHorizontal: 5,
    },
    historyLabel: {
        fontSize: 14,
        color: '#555',
    },
    historyValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 30,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#888',
        marginTop: 10,
    },
});

export default StatisticsScreen; 