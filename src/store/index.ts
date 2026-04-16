// src/store/index.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Leg = 'go' | 'back' | 'both' | 'none';

export interface Driver {
  id: string;
  name: string;
  vehicle: string;
  plate: string;
  seats: number;
  active: boolean;
  phone?: string;
}

export interface Passenger {
  id: string;
  name: string;
  phone?: string;
  preferredDriverId?: string;
}

export interface TripPassenger {
  passengerId: string;
  driverId: string;
  leg: Leg;
}

export interface Trip {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  driverIds: string[];
  passengers: TripPassenger[];
  pricePerLeg: number;
  notes?: string;
}

export interface WeekConfirmation {
  weekKey: string; // e.g. "2025-W16"
  passengerId: string;
  leg: Leg;
}

export interface AppSettings {
  pricePerLeg: number;
  notifyPassengersDay: number; // 0=Sun..6=Sat, default 4=Thu
  notifyDriversDay: number;    // default 3=Wed
  tripDay: number;             // default 6=Sat
  reportPeriod: 'monthly' | 'biweekly' | 'weekly';
  adminName: string;
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface AppState {
  drivers: Driver[];
  passengers: Passenger[];
  trips: Trip[];
  weekConfirmations: WeekConfirmation[];
  settings: AppSettings;

  // Driver actions
  addDriver: (d: Omit<Driver, 'id'>) => void;
  updateDriver: (id: string, d: Partial<Driver>) => void;
  removeDriver: (id: string) => void;
  toggleDriverActive: (id: string) => void;

  // Passenger actions
  addPassenger: (p: Omit<Passenger, 'id'>) => void;
  updatePassenger: (id: string, p: Partial<Passenger>) => void;
  removePassenger: (id: string) => void;

  // Trip actions
  addTrip: (t: Omit<Trip, 'id'>) => void;
  updateTrip: (id: string, t: Partial<Trip>) => void;
  removeTrip: (id: string) => void;

  // Week confirmation actions
  setWeekConfirmation: (weekKey: string, passengerId: string, leg: Leg) => void;
  getWeekConfirmation: (weekKey: string, passengerId: string) => Leg;

  // Settings
  updateSettings: (s: Partial<AppSettings>) => void;

  // Reports
  getMonthReport: (year: number, month: number) => MonthReport;
}

export interface PassengerDebt {
  passengerId: string;
  passengerName: string;
  driverId: string;
  driverName: string;
  legs: number;
  amount: number;
}

export interface MonthReport {
  year: number;
  month: number;
  totalTrips: number;
  totalLegs: number;
  totalAmount: number;
  byDriver: {
    driverId: string;
    driverName: string;
    subtotal: number;
    passengers: PassengerDebt[];
  }[];
  byPassenger: PassengerDebt[];
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_DRIVERS: Driver[] = [
  { id: 'd1', name: 'Roberto Lima', vehicle: 'Renault Kwid', plate: 'HOC-3849', seats: 4, active: true, phone: '' },
  { id: 'd2', name: 'Marcos Ferreira', vehicle: 'Fiat Uno', plate: 'KJP-1922', seats: 3, active: true, phone: '' },
];

const SEED_PASSENGERS: Passenger[] = [
  { id: 'p1', name: 'Ana Souza', preferredDriverId: 'd1' },
  { id: 'p2', name: 'João Moura', preferredDriverId: 'd1' },
  { id: 'p3', name: 'Paula Costa', preferredDriverId: 'd2' },
  { id: 'p4', name: 'Thiago Ramos', preferredDriverId: 'd2' },
];

const SEED_TRIPS: Trip[] = [
  {
    id: 't1',
    date: '2025-04-05',
    driverIds: ['d1', 'd2'],
    pricePerLeg: 6,
    passengers: [
      { passengerId: 'p1', driverId: 'd1', leg: 'both' },
      { passengerId: 'p2', driverId: 'd1', leg: 'both' },
      { passengerId: 'p3', driverId: 'd2', leg: 'both' },
      { passengerId: 'p4', driverId: 'd2', leg: 'both' },
    ],
  },
  {
    id: 't2',
    date: '2025-04-12',
    driverIds: ['d1', 'd2'],
    pricePerLeg: 6,
    passengers: [
      { passengerId: 'p1', driverId: 'd1', leg: 'both' },
      { passengerId: 'p2', driverId: 'd1', leg: 'go' },
      { passengerId: 'p3', driverId: 'd2', leg: 'back' },
      { passengerId: 'p4', driverId: 'd2', leg: 'both' },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function legCount(leg: Leg): number {
  if (leg === 'both') return 2;
  if (leg === 'go' || leg === 'back') return 1;
  return 0;
}

// ─── Store creation ───────────────────────────────────────────────────────────

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      drivers: SEED_DRIVERS,
      passengers: SEED_PASSENGERS,
      trips: SEED_TRIPS,
      weekConfirmations: [],
      settings: {
        pricePerLeg: 6,
        notifyPassengersDay: 4,
        notifyDriversDay: 3,
        tripDay: 6,
        reportPeriod: 'monthly',
        adminName: 'Admin',
      },

      // Drivers
      addDriver: (d) => set((s) => ({ drivers: [...s.drivers, { ...d, id: uuid.v4() as string }] })),
      updateDriver: (id, d) => set((s) => ({ drivers: s.drivers.map((x) => (x.id === id ? { ...x, ...d } : x)) })),
      removeDriver: (id) => set((s) => ({ drivers: s.drivers.filter((x) => x.id !== id) })),
      toggleDriverActive: (id) => set((s) => ({ drivers: s.drivers.map((x) => (x.id === id ? { ...x, active: !x.active } : x)) })),

      // Passengers
      addPassenger: (p) => set((s) => ({ passengers: [...s.passengers, { ...p, id: uuid.v4() as string }] })),
      updatePassenger: (id, p) => set((s) => ({ passengers: s.passengers.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      removePassenger: (id) => set((s) => ({ passengers: s.passengers.filter((x) => x.id !== id) })),

      // Trips
      addTrip: (t) => set((s) => ({ trips: [...s.trips, { ...t, id: uuid.v4() as string }] })),
      updateTrip: (id, t) => set((s) => ({ trips: s.trips.map((x) => (x.id === id ? { ...x, ...t } : x)) })),
      removeTrip: (id) => set((s) => ({ trips: s.trips.filter((x) => x.id !== id) })),

      // Week confirmations
      setWeekConfirmation: (weekKey, passengerId, leg) =>
        set((s) => {
          const filtered = s.weekConfirmations.filter(
            (w) => !(w.weekKey === weekKey && w.passengerId === passengerId)
          );
          return { weekConfirmations: [...filtered, { weekKey, passengerId, leg }] };
        }),

      getWeekConfirmation: (weekKey, passengerId) => {
        const c = get().weekConfirmations.find(
          (w) => w.weekKey === weekKey && w.passengerId === passengerId
        );
        return c?.leg ?? 'none';
      },

      // Settings
      updateSettings: (s) => set((st) => ({ settings: { ...st.settings, ...s } })),

      // Reports
      getMonthReport: (year, month) => {
        const { trips, drivers, passengers } = get();

        const monthTrips = trips.filter((t) => {
          const d = new Date(t.date);
          return d.getFullYear() === year && d.getMonth() + 1 === month;
        });

        const debts: PassengerDebt[] = [];

        for (const trip of monthTrips) {
          for (const tp of trip.passengers) {
            const legs = legCount(tp.leg);
            if (legs === 0) continue;
            const amount = legs * trip.pricePerLeg;
            const existing = debts.find(
              (d) => d.passengerId === tp.passengerId && d.driverId === tp.driverId
            );
            if (existing) {
              existing.legs += legs;
              existing.amount += amount;
            } else {
              const pax = passengers.find((p) => p.id === tp.passengerId);
              const drv = drivers.find((d) => d.id === tp.driverId);
              debts.push({
                passengerId: tp.passengerId,
                passengerName: pax?.name ?? '?',
                driverId: tp.driverId,
                driverName: drv?.name ?? '?',
                legs,
                amount,
              });
            }
          }
        }

        const byDriver = drivers
          .map((drv) => {
            const driverDebts = debts.filter((d) => d.driverId === drv.id);
            return {
              driverId: drv.id,
              driverName: drv.name,
              subtotal: driverDebts.reduce((a, d) => a + d.amount, 0),
              passengers: driverDebts,
            };
          })
          .filter((d) => d.subtotal > 0);

        // byPassenger: total per passenger across all drivers
        const byPax: PassengerDebt[] = [];
        for (const debt of debts) {
          const ex = byPax.find((d) => d.passengerId === debt.passengerId);
          if (ex) {
            ex.legs += debt.legs;
            ex.amount += debt.amount;
          } else {
            byPax.push({ ...debt });
          }
        }

        return {
          year,
          month,
          totalTrips: monthTrips.length,
          totalLegs: debts.reduce((a, d) => a + d.legs, 0),
          totalAmount: debts.reduce((a, d) => a + d.amount, 0),
          byDriver,
          byPassenger: byPax,
        };
      },
    }),
    {
      name: 'caronamais-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
