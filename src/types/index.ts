export interface User {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'admin';
    createdAt: string;
    updatedAt: string;
}

export interface LoginResponse {
    token: string;
    user: User;
    message: string;
}

export interface RegisterResponse {
    message: string;
    user: User;
}

export interface Car {
    id: string;
    brand: string;
    model: string;
    licensePlate: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface ParkingSpot {
    id: string;
    number: string;
    isAvailable: boolean;
    floor: number;
    createdAt: string;
    updatedAt: string;
}

export interface ParkingHistory {
    id: string;
    carId: string;
    spotId: string;
    startTime: string;
    endTime: string | null;
    totalCost: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface Invoice {
    id: string;
    parkingHistoryId: string;
    amount: number;
    status: 'pending' | 'paid' | 'cancelled';
    dueDate: string;
    createdAt: string;
    updatedAt: string;
} 