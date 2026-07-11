import { create } from 'zustand';

interface Service {
  id: string;
  name: string;
  price: number;
}

interface BookingState {
  service: Service | null;
  vehicleType: string | null;
  vehicleNumber: string | null;
  bookingDate: Date | null;
  address: string | null;
  storeId: string | null;
  step: number;
  setService: (service: Service) => void;
  setVehicleDetails: (type: string, number?: string) => void;
  setBookingDate: (date: Date) => void;
  setLocation: (address: string, storeId?: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetBooking: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  service: null,
  vehicleType: null,
  vehicleNumber: null,
  bookingDate: null,
  address: null,
  storeId: null,
  step: 1,
  
  setService: (service) => set({ service }),
  setVehicleDetails: (type, number) => set({ vehicleType: type, vehicleNumber: number }),
  setBookingDate: (date) => set({ bookingDate: date }),
  setLocation: (address, storeId) => set({ address, storeId }),
  
  nextStep: () => set((state) => ({ step: state.step + 1 })),
  prevStep: () => set((state) => ({ step: state.step > 1 ? state.step - 1 : 1 })),
  resetBooking: () => set({
    service: null,
    vehicleType: null,
    vehicleNumber: null,
    bookingDate: null,
    address: null,
    storeId: null,
    step: 1,
  }),
}));
