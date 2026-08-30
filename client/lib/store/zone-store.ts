// customer location and delivery zone selection store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Zone, Subzone } from '@/types';

interface ZoneState {
  selectedZone: Zone | null;
  selectedSubzone: Subzone | null;
  detailedAddressText: string;
  setSelectedZone: (zone: Zone | null) => void;
  setSelectedSubzone: (subzone: Subzone | null) => void;
  setDetailedAddressText: (address: string) => void;
  getDeliveryFee: () => number;
}

export const useZoneStore = create<ZoneState>()(
  persist(
    (set, get) => ({
      selectedZone: null,
      selectedSubzone: null,
      detailedAddressText: '',

      setSelectedZone: (selectedZone) => {
        const current = get().selectedZone;
        const currentId = current?.id || current?._id;
        const nextId = selectedZone?.id || selectedZone?._id;
        if (current && selectedZone && String(currentId) === String(nextId)) {
          return;
        }
        set({
          selectedZone,
          selectedSubzone: null, // reset subzone when zone changes
        });
      },

      setSelectedSubzone: (selectedSubzone) => {
        set({ selectedSubzone });
      },

      setDetailedAddressText: (detailedAddressText) => {
        set({ detailedAddressText });
      },

      getDeliveryFee: () => {
        const { selectedZone, selectedSubzone } = get();
        if (selectedSubzone && selectedSubzone.custom_fixed_fee !== null) {
          return selectedSubzone.custom_fixed_fee;
        }
        if (selectedZone) {
          return selectedZone.fixed_delivery_fee;
        }
        return 60; // default standard zone rate
      },
    }),
    {
      name: 'foodman_zone_storage',
    }
  )
);
