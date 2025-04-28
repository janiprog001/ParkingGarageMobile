export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    isAdmin: boolean;
}

export interface Car {
    id: number;
    brand: string;
    model: string;
    year: number;
    licensePlate: string;
    isParked?: boolean;
}

export interface ParkingSpot {
    id: number;
    floorNumber: string;
    spotNumber: string;
    isOccupied: boolean;
    carId?: number;
    startTime?: string;
    endTime?: string;
}

export interface ParkingHistory {
    id: number;
    startTime: string;
    endTime: string;
    floorNumber: string;
    spotNumber: string;
    fee: number;
    carId: number;
    carBrand: string;
    carModel: string;
    licensePlate: string;
    durationFormatted: string;
}

export interface Invoice {
    id: number;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    total: number;
    isPaid: boolean;
    parkingHistoryId: number;
    parkingHistory?: ParkingHistory;
}

export interface LoginResponse {
    message: string;
    user: string;
    userId: number;
    isAdmin: boolean;
    loginTime: string;
    expiresAt: string;
}

export interface Reservation {
    id: number;
    startTime: string;
    endTime: string;
    status: string;
    totalFee: number;
    floorNumber: string;
    spotNumber: string;
    car?: {
        id: number;
        brand: string;
        model: string;
        licensePlate: string;
    };
    createdAt?: string;
} 