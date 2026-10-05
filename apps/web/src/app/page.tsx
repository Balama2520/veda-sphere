'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NormalizedResult, WeatherData } from '@vedasphere/shared';
import { Header } from '../components/Header';
import { CityPicker } from '../components/CityPicker';
import { DataCard } from '../components/DataCard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function HomePage() {
  const [city, setCity] = useState<string>('Hyderabad');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved city preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('vedasphere_selected_city');
    if (saved && saved.trim()) {
      setCity(saved.trim());
    }
    setIsLoaded(true);
  }, []);

  const handleSelectCity = (newCity: string) => {
    setCity(newCity);
    localStorage.setItem('vedasphere_selected_city', newCity);
  };

  const {
    data: weatherResult,
    isLoading,
    isError,
    error,
  } = useQuery<NormalizedResult<WeatherData>>({
    queryKey: ['weather', city],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/v1/weather?city=${encodeURIComponent(city)}`);
      if (res.status === 404) {
        const errorData = await res.json();
        throw new Error(errorData?.error?.message || `City '${city}' not found.`);
      }
      if (!res.ok) {
        throw new Error('Failed to fetch weather data');
      }
      return res.json();
    },
    enabled: isLoaded && !!city,
  });

  return (
    <main className="min-h-screen px-4 py-6 max-w-[480px] mx-auto">
      <Header />

      <CityPicker selectedCity={city} onSelectCity={handleSelectCity} />

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-ink tracking-tight">Today in {city}</h2>
          <span className="text-xs font-semibold text-accent-saffron bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            Daily Brief
          </span>
        </div>

        <DataCard
          title="Today's Weather"
          data={weatherResult}
          isLoading={isLoading || !isLoaded}
          isError={isError}
          errorMessage={error instanceof Error ? error.message : undefined}
        />
      </section>
    </main>
  );
}
