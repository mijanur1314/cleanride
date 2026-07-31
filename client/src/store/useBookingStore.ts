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
  vehicleName: string | null;
  vehicleNumber: string | null;
  vehicleImageUrl: string | null;
  bookingDate: Date | null;
  address: string | null;
  storeId: string | null;
  addonIds: string[];
  partnerId: string | null;
  step: number;
  setService: (service: Service) => void;
  setVehicleDetails: (category: string, type: string, name?: string, number?: string) => void;
  setVehicleImage: (url: string) => void;
  setBookingDate: (date: Date) => void;
  setLocation: (address: string, storeId?: string) => void;
  toggleAddon: (addonId: string) => void;
  setPartnerId: (partnerId: string | null) => void;
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;
  resetBooking: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  service: null,
  vehicleCategory: null,
  vehicleType: null,
  vehicleName: null,
  vehicleNumber: null,
  vehicleImageUrl: null,
  bookingDate: null,
  address: null,
  storeId: null,
  addonIds: [],
  partnerId: null,
  step: 1,
  
  setService: (service) => set({ service }),
  setVehicleDetails: (category, type, name, number) => set({ vehicleCategory: category, vehicleType: type, vehicleName: name, vehicleNumber: number }),
  setVehicleImage: (url) => set({ vehicleImageUrl: url }),
  setBookingDate: (date) => set({ bookingDate: date }),
  setLocation: (address, storeId) => set({ address, storeId }),
  toggleAddon: (addonId) => set((state) => ({
    addonIds: state.addonIds.includes(addonId) 
      ? state.addonIds.filter(id => id !== addonId) 
      : [...state.addonIds, addonId]
  })),
  setPartnerId: (partnerId) => set({ partnerId }),
  
  nextStep: () => set((state) => ({ step: state.step + 1 })),
  prevStep: () => set((state) => ({ step: state.step > 1 ? state.step - 1 : 1 })),
  setStep: (step) => set({ step }),
  resetBooking: () => set({
    service: null,
    vehicleCategory: null,
    vehicleType: null,
    vehicleName: null,
    vehicleNumber: null,
    vehicleImageUrl: null,
    bookingDate: null,
    address: null,
    storeId: null,
    addonIds: [],
    partnerId: null,
    step: 1,
  }),
}));
