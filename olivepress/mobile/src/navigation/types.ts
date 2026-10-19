import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { Client, Apport, User } from '../types';

export type RootStackParamList = {
  Login: undefined;
  Tabs: undefined;
  ClientDetail: { id: number; name: string };
  ClientForm: { client?: Client } | undefined;
  ApportForm: { clientId?: number; apport?: Apport } | undefined;
  ApportDetail: { id: number };
  YieldForm: { apportId: number; apportNumero: string; netWeightKg: number };
  Stock: undefined;
  Livraisons: undefined;
  LivraisonForm: undefined;
  Factures: undefined;
  FactureDetail: { id: number };
  FactureForm: undefined;
  Employees: undefined;
  EmployeeForm: { employee?: User } | undefined;
  Notifications: undefined;
  Reports: undefined;
  History: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Clients: undefined;
  Apports: undefined;
  Production: undefined;
  More: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
export type TabScreenProps<T extends keyof TabParamList> = BottomTabScreenProps<TabParamList, T>;
