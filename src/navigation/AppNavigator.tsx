import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventRegister } from 'react-native-event-listeners';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegistrationScreen from '../screens/auth/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CarsScreen from '../screens/CarsScreen';
import ParkingScreen from '../screens/ParkingScreen';
import ParkingSpotsScreen from '../screens/ParkingSpotsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LeaveParkingScreen from '../screens/LeaveParkingScreen';
import StatisticsScreen from '../screens/StatisticsScreen';

// Types
import { User } from '../types';

export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    Dashboard: undefined;
    MyCars: undefined;
    Parking: { selectedSpot: any };
    ParkingSpots: undefined;
    Profile: undefined;
    Cars: undefined;
    LeaveParking: { car: any };
    Statistics: undefined;
};

// Globális eseményazonosító a bejelentkezéshez
export const LOGIN_EVENT = 'login_event';
export const LOGOUT_EVENT = 'logout_event';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    // Felhasználói adatok ellenőrzése induláskor és események hatására
    useEffect(() => {
        // Kezdeti ellenőrzés
        checkUser();
        
        // Login eseményre figyelés
        const loginListener = EventRegister.addEventListener(LOGIN_EVENT, () => {
            console.log("Bejelentkezés esemény érkezett");
            checkUser();
        });
        
        // Logout eseményre figyelés
        const logoutListener = EventRegister.addEventListener(LOGOUT_EVENT, () => {
            console.log("Kijelentkezés esemény érkezett");
            setUser(null);
        });
        
        // Közvetlen AsyncStorage változás figyelés
        const checkEverySecond = setInterval(() => {
            checkUser();
        }, 2000);  // 2 másodpercenként ellenőrizzük az adatokat
        
        return () => {
            EventRegister.removeEventListener(loginListener as string);
            EventRegister.removeEventListener(logoutListener as string);
            clearInterval(checkEverySecond);
        };
    }, []);

    const checkUser = async () => {
        try {
            console.log("AppNavigator: Felhasználó ellenőrzése...");
            const userJson = await AsyncStorage.getItem('user');
            const token = await AsyncStorage.getItem('token');
            
            console.log("AppNavigator - Token:", token ? "létezik" : "hiányzik");
            console.log("AppNavigator - User data:", userJson ? "létezik" : "hiányzik");
            
            if (userJson && token) {
                const parsedUser = JSON.parse(userJson);
                console.log("AppNavigator - Felhasználó betöltve:", parsedUser.email);
                setUser(parsedUser);
            } else {
                console.log("AppNavigator - Nincs bejelentkezett felhasználó");
                setUser(null);
            }
        } catch (error) {
            console.error('AppNavigator - Hiba a felhasználó ellenőrzése során:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return null; // vagy egy loading spinner
    }

    console.log(`AppNavigator - Renderelés: user ${user ? 'létezik' : 'hiányzik'}`);

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: {
                        backgroundColor: '#2089dc',
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}
            >
                {user ? (
                    // Bejelentkezett felhasználó útvonalai
                    <>
                        <Stack.Screen 
                            name="Dashboard" 
                            component={DashboardScreen}
                            options={{ title: 'Főoldal' }}
                        />
                        <Stack.Screen 
                            name="MyCars" 
                            component={CarsScreen}
                            options={{ title: 'Autóim' }}
                        />
                        <Stack.Screen 
                            name="Parking" 
                            component={ParkingScreen}
                            options={{ title: 'Parkolás' }}
                        />
                        <Stack.Screen 
                            name="ParkingSpots"
                            component={ParkingSpotsScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen 
                            name="Profile"
                            component={ProfileScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen 
                            name="Cars"
                            component={CarsScreen}
                            options={{ title: 'Autók kezelése' }}
                        />
                        <Stack.Screen 
                            name="LeaveParking"
                            component={LeaveParkingScreen}
                            options={{ title: 'Kiállás a parkolóhelyről' }}
                        />
                        <Stack.Screen 
                            name="Statistics"
                            component={StatisticsScreen}
                            options={{ title: 'Parkolási statisztikák' }}
                        />
                    </>
                ) : (
                    // Nem bejelentkezett felhasználó útvonalai
                    <>
                        <Stack.Screen 
                            name="Login" 
                            component={LoginScreen}
                            options={{ title: 'Bejelentkezés' }}
                        />
                        <Stack.Screen 
                            name="Register" 
                            component={RegistrationScreen}
                            options={{ title: 'Regisztráció' }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}; 