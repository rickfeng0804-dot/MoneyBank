export type CoinDenomination = 50 | 10 | 5 | 1;

export interface CoinSpec {
  value: CoinDenomination;
  weightGrams: number;
  diameterMm: number;
  color: string;
  borderColor: string;
  textColor: string;
  radialGradient: string;
  label: string;
}

export const COIN_SPECS: Record<CoinDenomination, CoinSpec> = {
  50: {
    value: 50,
    weightGrams: 10.0,
    diameterMm: 28,
    color: '#D4AF37', // Metallic gold
    borderColor: '#B8860B',
    textColor: '#5C3A21',
    radialGradient: 'radial-gradient(circle, #F3E5AB 0%, #D4AF37 60%, #AA7C11 100%)',
    label: '50元',
  },
  10: {
    value: 10,
    weightGrams: 7.5,
    diameterMm: 26,
    color: '#C0C0C0', // Silver
    borderColor: '#8A8D8F',
    textColor: '#333333',
    radialGradient: 'radial-gradient(circle, #F5F5F5 0%, #C0C0C0 60%, #7E8284 100%)',
    label: '10元',
  },
  5: {
    value: 5,
    weightGrams: 4.4,
    diameterMm: 22,
    color: '#CD7F32', // Bronze/brassish nickel
    borderColor: '#AA5E1A',
    textColor: '#402000',
    radialGradient: 'radial-gradient(circle, #EEDC82 0%, #CD7F32 60%, #8B4513 100%)',
    label: '5元',
  },
  1: {
    value: 1,
    weightGrams: 3.8,
    diameterMm: 20,
    color: '#B87333', // Copper
    borderColor: '#804000',
    textColor: '#3A1A00',
    radialGradient: 'radial-gradient(circle, #E9967A 0%, #B87333 60%, #703D0B 100%)',
    label: '1元',
  },
};

export interface WalletState {
  // Coin inventory counts
  inventory: Record<CoinDenomination, number>;
  // Calibration tare weight of the physical empty wallet itself (grams)
  tareWeightGrams: number;
  // Sensor reading mode: 'separate' (4 independent slot scales) or 'combined' (1 main bottom plate scale)
  sensorMode: 'separate' | 'combined';
  // Additional sensor noise simulation or error calibration
  sensorMalfunction: boolean;
}

export interface DispenseTransaction {
  id: string;
  timestamp: string;
  requestedAmount: number;
  dispensedAmount: number;
  coinsDispensed: Record<CoinDenomination, number>;
  success: boolean;
}
