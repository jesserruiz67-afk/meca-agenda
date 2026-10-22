export type VehicleType = 'carro' | 'moto';

export type PaymentMethod =
  | 'efectivo'
  | 'transferencia'
  | 'tarjeta'
  | 'paypal'
  | 'link';

export type Maintenance = {
  id: string;
  clientName: string;
  clientPhone: string;
  vehicleType: VehicleType;
  vehicleBrand: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleKm: number;
  services: string[];
  dueDate: string;
  dueTime?: string;
  dueKm?: number;
  intervalMonths?: number;
  intervalKm?: number;
  notes?: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  completed: boolean;
  completedAt?: string;
  nextMaintenanceId?: string;
  invoiceNumber?: string;
  invoicedAt?: string;
  createdAt: string;
};

export type MaintenanceStatus =
  | 'vencido'
  | 'hoy'
  | 'semana'
  | 'proximo'
  | 'completado';

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  minStock: number;
  unitCost: number;
  updatedAt: string;
};

export type TransactionType = 'ingreso' | 'egreso';

export type Transaction = {
  id: string;
  date: string;
  type: TransactionType;
  description: string;
  amount: number;
  method: PaymentMethod;
  maintenanceId?: string;
  createdAt: string;
};

export type Backup = {
  version: 1;
  exportedAt: string;
  maintenances: Maintenance[];
  products: Product[];
  transactions: Transaction[];
  invoiceCounter: number;
};
