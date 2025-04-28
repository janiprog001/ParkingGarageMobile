import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Car, ParkingSpot, ParkingHistory, Invoice, LoginResponse, Reservation } from '../types';

// A szerverünk cookie-alapú autentikációt használ, nem JWT tokent
// Régi: const API_URL = 'http://172.25.16.1:5025/api';
// Használjunk IP címet, amely elérhető a mobil hálózatból
const API_URL = 'http://192.168.0.15:5025/api';

// Debug info
console.log("API URL:", API_URL);

// A cookie-alapú hitelesítés nem mindig működik React Native-ben közvetlenül
// Itt egy speciális konfigurációt használunk
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // A CORS kérések engedélyezése
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true'
    },
    withCredentials: true, // Ez fontos a cookie-khoz
    timeout: 10000, // 10 másodperces timeout
});

// A cookie-alapú autentikáció nem működik teljes mértékben React Native-ben
// Imitáljuk egy HTTP fejléccel
let sessionCookie = null;

// Token interceptor
api.interceptors.request.use(
    async (config) => {
        // Ellenőrizzük, hogy van-e token vagy cookie
        const token = await AsyncStorage.getItem('token');
        console.log("Request interceptor - Token:", token ? "van" : "nincs");
        
        // Ha van token, beállítjuk mint Authorization header
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Ha van tárolt cookie, akkor azt is beállítjuk
        if (sessionCookie) {
            config.headers.Cookie = sessionCookie;
        }
        
        console.log("Request URL:", config.url);
        return config;
    },
    (error) => {
        console.error("Request interceptor - Hiba:", error);
        return Promise.reject(error);
    }
);

// Válasz interceptor
api.interceptors.response.use(
    (response) => {
        console.log("Response status:", response.status);
        
        // Ellenőrizzük, hogy van-e cookie a válaszban
        const setCookieHeader = response.headers['set-cookie'];
        if (setCookieHeader) {
            console.log("Set-Cookie header megtalálva:", setCookieHeader);
            // Tároljuk el a cookie-t a későbbi kérésekhez
            sessionCookie = setCookieHeader;
        }
        
        return response;
    },
    async (error) => {
        console.error("Response interceptor - Hiba:", error.message);
        console.error("Response interceptor - Status:", error.response?.status);
        console.error("Response interceptor - Data:", JSON.stringify(error.response?.data));
        
        if (error.response?.status === 401) {
            console.log("401 Unauthorized - Töröljük a tokeneket és cookie-kat");
            sessionCookie = null;
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
        }
        return Promise.reject(error);
    }
);

// Auth
export const login = async (email: string, password: string): Promise<LoginResponse> => {
    try {
        console.log(`Bejelentkezési kísérlet: ${email}`);
        
        // A helyes URL: /api/users/login
        console.log(`API URL: ${API_URL}/users/login`);
        
        // CORS és API URL tesztelése
        try {
            const testResponse = await fetch(`${API_URL}/users/login`, {
                method: 'OPTIONS',
                credentials: 'include' // Ez fontos a cookie-khoz
            });
            console.log("CORS teszt válasz:", testResponse.status);
        } catch (testError) {
            console.error("CORS teszt hiba:", testError);
        }
        
        // A helyes végpont: /users/login
        const response = await api.post<LoginResponse>('/users/login', { email, password });
        console.log('Szerver válasz:', response.data);
        
        // A szerver nem a várt formátumban adja vissza a User objektumot, hanem egyszerű szövegként az email
        // Készítsünk saját User objektumot a válaszból
        const userObject = {
            id: response.data.userId?.toString() || '0',
            email: response.data.user || email,
            name: response.data.user || email,
            role: response.data.isAdmin ? 'admin' : 'user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Manuálisan kezeljük a szerver válaszát
        // Ha a válasz tartalmaz tokent, akkor tároljuk
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            console.log('Token tárolva');
        } else {
            // Ha nincs token a szervertől, készítsünk egy ideiglenes tokent
            console.log('Nincs token a válaszban, csak cookie. Létrehozunk egy ideiglenes tokent.');
            const tempToken = 'session-' + new Date().getTime();
            await AsyncStorage.setItem('token', tempToken);
            console.log('Ideiglenes token tárolva:', tempToken);
            
            // Ellenőrizzük, hogy van-e cookie a válaszban
            const setCookieHeader = response.headers['set-cookie'];
            if (setCookieHeader) {
                console.log("Set-Cookie header megtalálva:", setCookieHeader);
                // Tároljuk el a cookie-t a későbbi kérésekhez
                sessionCookie = setCookieHeader;
            } else {
                console.log("Nincs Set-Cookie a válaszban");
            }
        }
        
        // Tároljuk a user objektumot
        await AsyncStorage.setItem('user', JSON.stringify(userObject));
        console.log('Felhasználói adatok tárolva:', userObject);
        
        // Értesítsük az AsyncStorage változás figyelőket
        console.log('AsyncStorage változás értesítés küldése');
        
        // Adjuk vissza a formázott választ
        return {
            ...response.data,
            user: userObject
        };
    } catch (error) {
        console.error('Bejelentkezési hiba:', error);
        console.error('Bejelentkezési hiba részletek:', error.response?.data);
        console.error('Bejelentkezési hiba státusz:', error.response?.status);
        throw error;
    }
};

export const logout = async (): Promise<void> => {
    try {
        console.log("Kijelentkezés kezdeményezése");
        
        // Küdjünk kérést a szerver felé a kijelentkezéshez
        try {
            const response = await api.post('/users/logout');
            console.log("Kijelentkezési válasz:", response.status);
        } catch (error) {
            console.error("Hiba a kijelentkezés során a szerveren:", error);
        }
        
        // Helyi adatok törlése függetlenül a szerver válaszától
        sessionCookie = null;
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        console.log("Kijelentkezés sikeres - helyi adatok törölve");
    } catch (error) {
        console.error("Hiba a helyi kijelentkezés során:", error);
        throw error;
    }
};

export const register = async (email: string, password: string, name: string): Promise<void> => {
    try {
        const response = await api.post('/auth/register', { email, password, name });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Users
export const getCurrentUser = async (): Promise<User> => {
    const response = await api.get<User>('/users/me');
    return response.data;
};

export const updateUser = async (userId: number, userData: Partial<User>): Promise<void> => {
    await api.put(`/users/${userId}`, userData);
};

// Cars
export const getUserCars = async (): Promise<Car[]> => {
    const response = await api.get<Car[]>('/cars');
    return response.data;
};

export const getMyCars = async (): Promise<Car[]> => {
    try {
        console.log("getMyCars hívása");
        // A cars/my végpont 405-ös hibát ad, használjuk inkább a profil lekérést
        const profileData = await getProfile();
        if (profileData && profileData.cars) {
            console.log("Autók betöltve:", profileData.cars.length);
            return profileData.cars;
        }
        console.log("Nincs autó a profilban");
        return [];
    } catch (error) {
        console.error('Hiba az autók betöltése során:', error);
        handleApiError(error);
        return [];
    }
};

export const addCar = async (carData: Partial<Car>): Promise<Car> => {
    const response = await api.post<Car>('/cars', carData);
    return response.data;
};

export const updateCar = async (carId: number, carData: Partial<Car>): Promise<void> => {
    await api.put(`/cars/${carId}`, carData);
};

export const deleteCar = async (carId: number): Promise<void> => {
    await api.delete(`/cars/${carId}`);
};

// Parking
export const getAvailableSpots = async (): Promise<ParkingSpot[]> => {
    try {
        console.log("getAvailableSpots hívása");
        // A dokumentáció szerint a helyes útvonal: /api/parking/spots/available
        const response = await api.get<ParkingSpot[]>('/parking/spots/available');
        
        // Minden spot-ra beállítjuk az isAvailable mezőt az isOccupied alapján
        const spots = response.data.map(spot => ({
            ...spot,
            isAvailable: !spot.isOccupied
        }));
        
        console.log("Elérhető parkolóhelyek:", spots.length);
        return spots;
    } catch (error) {
        console.error('Hiba a parkolóhelyek betöltése során:', error);
        return [];
    }
};

export const getAllSpots = async (): Promise<ParkingSpot[]> => {
    try {
        // A dokumentáció szerint a helyes útvonal: /api/parking/spots
        const response = await api.get<ParkingSpot[]>('/parking/spots');
        return response.data;
    } catch (error) {
        console.error('Hiba az összes parkolóhely betöltése során:', error);
        return [];
    }
};

export const startParking = async (carId: number, parkingSpotId: number): Promise<void> => {
    await api.post('/parking/start', { carId, parkingSpotId });
};

export const parkCar = async (params: { carId: string, parkingSpotId: number }): Promise<any> => {
    try {
        console.log("parkCar hívása:", params);
        const response = await api.post('/parking/start', {
            carId: params.carId,
            parkingSpotId: params.parkingSpotId
        });
        console.log("Parkolás válasz:", response.data);
        return response.data;
    } catch (error) {
        console.error('Hiba a parkolás során:', error);
        throw error;
    }
};

export const endParking = async (carId: number): Promise<any> => {
    try {
        console.log("endParking hívása, carId:", carId);
        
        // Ellenőrizzük, hogy van-e token
        const token = await AsyncStorage.getItem('token');
        console.log("Token ellenőrzése:", token ? "van" : "nincs");
        
        // Összegyűjtjük a szükséges fejléceket
        let headers: any = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        // Ha van token, akkor azt is hozzáadjuk
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Ha van session cookie, akkor azt is hozzáadjuk
        if (sessionCookie) {
            headers['Cookie'] = sessionCookie;
        }
        
        // Közvetlen fetch hívás az API végpontra
        const response = await fetch(`${API_URL}/parking/end`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ carId }),
            credentials: 'include'
        });
        
        // Hibakezelés az állapotkód alapján
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Hiba a kiállás során:', response.status, errorText);
            throw new Error(errorText || `HTTP error! Status: ${response.status}`);
        }
        
        // Sikeres válasz feldolgozása
        const data = await response.json().catch(() => ({}));
        console.log("Kiállás sikeres, válasz:", data);
        return data;
    } catch (error) {
        console.error('Hiba a kiállás során:', error);
        throw error;
    }
};

export async function getMyParkedCars(userId?: number): Promise<Car[]> {
    try {
        console.log("getMyParkedCars hívása, userId:", userId);
        
        // A dokumentáció szerint a helyes útvonal: /api/parking/my
        let endpoint = '/parking/my';
        
        console.log("Használt endpoint:", endpoint);
        const response = await api.get<Car[]>(endpoint);
        console.log("Leállt autók:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching my parked cars:', error);
        handleApiError(error);
        return [];
    }
}

export const getParkingStatus = async (carId: number): Promise<ParkingSpot> => {
    const response = await api.get<ParkingSpot>(`/parking/status/${carId}`);
    return response.data;
};

// History
export const getParkingHistory = async (): Promise<ParkingHistory[]> => {
    try {
        console.log("getParkingHistory hívása");
        const response = await api.get<ParkingHistory[]>('/statistics/history');
        console.log("Parkolási előzmények betöltve:", response.data.length);
        return response.data;
    } catch (error) {
        console.error('Hiba a parkolási előzmények betöltése során:', error);
        return [];
    }
};

// Invoices
export const getInvoices = async (): Promise<Invoice[]> => {
    try {
        console.log("getInvoices hívása");
        const response = await api.get<Invoice[]>('/invoices');
        console.log("Számlák betöltve:", response.data.length);
        return response.data;
    } catch (error) {
        console.error('Hiba a számlák betöltése során:', error);
        return [];
    }
};

export const getInvoice = async (invoiceId: number): Promise<Invoice> => {
    const response = await api.get<Invoice>(`/invoices/${invoiceId}`);
    return response.data;
};

export const getProfile = async () => {
    try {
        console.log("getProfile hívása");
        // Az API dokumentáció alapján itt kellene lennie egy /api/users/profile végpontnak, 
        // de mivel ilyen nincs listázva, használjuk a /api/users/{id} végpontot a tárolt ID-val
        
        // Felhasználó ID kinyerése az AsyncStorage-ból
        const userJson = await AsyncStorage.getItem('user');
        let userId = null;
        
        if (userJson) {
            const userData = JSON.parse(userJson);
            userId = userData.id;
            console.log("Tárolt user ID:", userId);
            
            if (userId) {
                const response = await api.get(`/users/${userId}`);
                console.log("Profil válasz:", response.data);
                return response.data;
            }
        }
        
        // Ha nem sikerült lekérni a profilt, akkor próbáljuk a tesztadatok végpontot
        console.log("Profil lekérése teszt adatokkal");
        const testResponse = await api.get('/test/userdata');
        console.log("Teszt profil válasz:", testResponse.data);
        return testResponse.data;
    } catch (error) {
        console.error('Hiba a profil betöltése során:', error);
        throw error;
    }
};

export const updateProfile = async (data: any) => {
    try {
        const response = await api.put('/users/profile', data);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Reservations
export const getMyReservations = async (): Promise<Reservation[]> => {
    try {
        const response = await api.get<Reservation[]>('/reservations/my');
        return response.data;
    } catch (error) {
        console.error('Error fetching my reservations:', error);
        handleApiError(error);
        return [];
    }
};

export const createReservation = async (
    carId: number, 
    parkingSpotId: number,
    startTime: Date,
    endTime: Date
): Promise<Reservation> => {
    try {
        const response = await api.post<Reservation>('/reservations', {
            carId,
            parkingSpotId,
            startTime,
            endTime
        });
        return response.data;
    } catch (error) {
        console.error('Error creating reservation:', error);
        handleApiError(error);
        throw error;
    }
};

export const cancelReservation = async (reservationId: number): Promise<void> => {
    try {
        await api.delete(`/reservations/${reservationId}`);
    } catch (error) {
        console.error('Error canceling reservation:', error);
        handleApiError(error);
        throw error;
    }
};

export const getReservationDetails = async (reservationId: number): Promise<Reservation> => {
    try {
        const response = await api.get<Reservation>(`/reservations/${reservationId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching reservation details:', error);
        handleApiError(error);
        throw error;
    }
};

// Új statisztikai végpontok
export const getStatisticsSummary = async () => {
    try {
        console.log("getStatisticsSummary hívása");
        const response = await api.get('/statistics/summary');
        console.log("Statisztikai összesítés betöltve");
        return response.data;
    } catch (error) {
        console.error('Hiba a statisztikai összesítés betöltése során:', error);
        return null;
    }
};

export const getStatisticsByCar = async () => {
    try {
        console.log("getStatisticsByCar hívása");
        const response = await api.get('/statistics/by-car');
        console.log("Autónkénti statisztikák betöltve:", response.data.length);
        return response.data;
    } catch (error) {
        console.error('Hiba az autónkénti statisztikák betöltése során:', error);
        return [];
    }
};

export const getMonthlyStatistics = async () => {
    try {
        console.log("getMonthlyStatistics hívása");
        const response = await api.get('/statistics/monthly');
        console.log("Havi statisztikák betöltve:", response.data.length);
        return response.data;
    } catch (error) {
        console.error('Hiba a havi statisztikák betöltése során:', error);
        return [];
    }
};

// API hibakezelő segédfüggvény
export const handleApiError = (error: any) => {
    let errorMessage = 'Ismeretlen hiba történt.';
    
    if (error.response) {
        // A szerver válaszolt, de hibakóddal
        const status = error.response.status;
        const data = error.response.data;
        
        if (typeof data === 'string') {
            errorMessage = data;
        } else if (data.message) {
            errorMessage = data.message;
        } else if (status === 401) {
            errorMessage = 'Nincs jogosultsága ehhez a művelethez.';
        } else if (status === 404) {
            errorMessage = 'A kért erőforrás nem található.';
        } else if (status === 500) {
            errorMessage = 'Szerverhiba történt. Kérjük, próbálja újra később.';
        }
    } else if (error.request) {
        // A kérés elküldésre került, de nem érkezett válasz
        errorMessage = 'Nem érkezett válasz a szervertől. Ellenőrizze a kapcsolatot.';
    } else {
        // Valami más hiba történt
        errorMessage = error.message || errorMessage;
    }
    
    return errorMessage;
};

export default api; 