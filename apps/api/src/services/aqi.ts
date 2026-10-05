export type AqiCategory =
  | 'Good'
  | 'Satisfactory'
  | 'Moderate'
  | 'Poor'
  | 'Very Poor'
  | 'Severe';

export type DominantPollutant = 'PM2.5' | 'PM10' | 'None';

export type AqiBasis = '24h-average' | 'latest-hour';

export interface AqiCalculationResult {
  aqi: number;
  category: AqiCategory;
  dominantPollutant: DominantPollutant;
  subIndices: {
    pm25: number | null;
    pm10: number | null;
  };
  basis: AqiBasis;
}

interface Breakpoint {
  bpLo: number;
  bpHi: number;
  iLo: number;
  iHi: number;
}

// CPCB Breakpoints for PM2.5 (24-hour concentration in µg/m³)
// Verified Source: CPCB "National Air Quality Index" Publication (October 2014), Page 12, Table 1
// Document: Central Pollution Control Board, Ministry of Environment, Forests & Climate Change, Govt of India
const PM25_BREAKPOINTS: Breakpoint[] = [
  { bpLo: 0, bpHi: 30, iLo: 0, iHi: 50 },
  { bpLo: 31, bpHi: 60, iLo: 51, iHi: 100 },
  { bpLo: 61, bpHi: 90, iLo: 101, iHi: 200 },
  { bpLo: 91, bpHi: 120, iLo: 201, iHi: 300 },
  { bpLo: 121, bpHi: 250, iLo: 301, iHi: 400 },
  { bpLo: 251, bpHi: 380, iLo: 401, iHi: 500 }, // Severe upper cap 380 µg/m³
];

// CPCB Breakpoints for PM10 (24-hour concentration in µg/m³)
const PM10_BREAKPOINTS: Breakpoint[] = [
  { bpLo: 0, bpHi: 50, iLo: 0, iHi: 50 },
  { bpLo: 51, bpHi: 100, iLo: 51, iHi: 100 },
  { bpLo: 101, bpHi: 250, iLo: 101, iHi: 200 },
  { bpLo: 251, bpHi: 350, iLo: 201, iHi: 300 },
  { bpLo: 351, bpHi: 430, iLo: 301, iHi: 400 },
  { bpLo: 431, bpHi: 510, iLo: 401, iHi: 500 }, // Severe upper cap 510 µg/m³
];

export function calculateSubIndex(concentration: number, breakpoints: Breakpoint[]): number {
  if (concentration < 0 || isNaN(concentration)) {
    return 0;
  }

  // Find corresponding breakpoint interval
  let bp = breakpoints.find((b) => concentration >= b.bpLo && concentration <= b.bpHi);

  if (!bp) {
    // If higher than highest breakpoint, use top band and cap
    if (concentration > breakpoints[breakpoints.length - 1].bpHi) {
      bp = breakpoints[breakpoints.length - 1];
    } else {
      // Small gap interpolation fallback
      bp = breakpoints[0];
    }
  }

  const { bpLo, bpHi, iLo, iHi } = bp;
  
  if (bpHi === bpLo) {
    return Math.min(500, Math.round(iLo));
  }

  const subIndex = ((iHi - iLo) / (bpHi - bpLo)) * (concentration - bpLo) + iLo;
  return Math.min(500, Math.max(0, Math.round(subIndex)));
}

export function getAqiCategory(aqi: number): AqiCategory {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

export interface HourlyPollutantData {
  pm25Series: (number | null)[];
  pm10Series: (number | null)[];
}

export function calculateCpcbAqi(hourlyData: HourlyPollutantData): AqiCalculationResult {
  const { pm25Series, pm10Series } = hourlyData;

  // Filter last 24 hours non-null values
  const validPm25_24h = (pm25Series || []).slice(-24).filter((v): v is number => v !== null && !isNaN(v) && v >= 0);
  const validPm10_24h = (pm10Series || []).slice(-24).filter((v): v is number => v !== null && !isNaN(v) && v >= 0);

  let basis: AqiBasis = '24h-average';
  let pm25Concentration: number | null = null;
  let pm10Concentration: number | null = null;

  // Check PM2.5 24h average vs latest hour
  if (validPm25_24h.length >= 16) {
    pm25Concentration = validPm25_24h.reduce((a, b) => a + b, 0) / validPm25_24h.length;
  } else if (validPm25_24h.length > 0) {
    pm25Concentration = validPm25_24h[validPm25_24h.length - 1];
    basis = 'latest-hour';
  }

  // Check PM10 24h average vs latest hour
  if (validPm10_24h.length >= 16) {
    pm10Concentration = validPm10_24h.reduce((a, b) => a + b, 0) / validPm10_24h.length;
  } else if (validPm10_24h.length > 0) {
    pm10Concentration = validPm10_24h[validPm10_24h.length - 1];
    basis = 'latest-hour';
  }

  const pm25SubIndex = pm25Concentration !== null ? calculateSubIndex(pm25Concentration, PM25_BREAKPOINTS) : null;
  const pm10SubIndex = pm10Concentration !== null ? calculateSubIndex(pm10Concentration, PM10_BREAKPOINTS) : null;

  if (pm25SubIndex === null && pm10SubIndex === null) {
    throw new Error('Insufficient pollutant data to calculate CPCB AQI');
  }

  let finalAqi = 0;
  let dominant: DominantPollutant = 'None';

  if (pm25SubIndex !== null && pm25SubIndex >= finalAqi) {
    finalAqi = pm25SubIndex;
    dominant = 'PM2.5';
  }

  if (pm10SubIndex !== null && pm10SubIndex > finalAqi) {
    finalAqi = pm10SubIndex;
    dominant = 'PM10';
  }

  finalAqi = Math.min(500, Math.round(finalAqi));

  return {
    aqi: finalAqi,
    category: getAqiCategory(finalAqi),
    dominantPollutant: dominant,
    subIndices: {
      pm25: pm25SubIndex,
      pm10: pm10SubIndex,
    },
    basis,
  };
}
