import { create } from 'zustand';

interface Service {
  id: string;
  name: string;
  price: number;
}

interface BookingState {
  service: Service | null;
  vehicleCategory: string | null;
  vehicleType: string | null;
  vehicleNumber: string | null;
  vehicleImageUrl: string | null;
  bookingDate: Date | null;
  address: string | null;
  storeId: string | null;
  addonIds: string[];
  step: number;
  setService: (service: Service) => void;
  setVehicleDetails: (category: string, type: string, number?: string) => void;
  setVehicleImage: (url: string) => void;
  setBookingDate: (date: Date) => void;
  setLocation: (address: string, storeId?: string) => void;
  toggleAddon: (addonId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetBooking: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  service: null,
  vehicleCategory: null,
  vehicleType: null,
  vehicleNumber: null,
  vehicleImageUrl: null,
  bookingDate: null,
  address: null,
  storeId: null,
  addonIds: [],
  step: 1,
  
  setService: (service) => set({ service }),
  setVehicleDetails: (category, type, number) => set({ vehicleCategory: category, vehicleType: type, vehicleNumber: number }),
  setVehicleImage: (url) => set({ vehicleImageUrl: url }),
  setBookingDate: (date) => set({ bookingDate: date }),
  setLocation: (address, storeId) => set({ address, storeId }),
  toggleAddon: (addonId) => set((state) => ({
    addonIds: state.addonIds.includes(addonId) 
      ? state.addonIds.filter(id => id !== addonId) 
      : [...state.addonIds, addonId]
  })),
  
  nextStep: () => set((state) => ({ step: state.step + 1 })),
  prevStep: () => set((state) => ({ step: state.step > 1 ? state.step - 1 : 1 })),
  resetBooking: () => set({
    service: null,
    vehicleCategory: null,
    vehicleType: null,
    vehicleNumber: null,
    vehicleImageUrl: null,
    bookingDate: null,
    address: null,
    storeId: null,
    addonIds: [],
    step: 1,
  }),
}));
