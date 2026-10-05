'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BriefResponse } from '@vedasphere/shared';
import { Header } from '../components/Header';
import { CityPicker } from '../components/CityPicker';
import { DataCard } from '../components/DataCard';
import { AqiCard } from '../components/AqiCard';
import { BriefCard } from '../components/BriefCard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function HomePage() {
  const [city, setCity] = useState<string>('Hyderabad');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('vedasphere_selected_city');
    if (saved?.trim()) setCity(saved.trim());
    setIsLoaded(true);
  }, []);

  const handleSelectCity = (newCity: string) => {
    setCity(newCity);
    localStorage.setItem('vedasphere_selected_city', newCity);
  };

  const { data: briefResult, isLoading, isError, error } = useQuery<BriefResponse>({
    queryKey: ['brief', city],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/v1/brief?city=${encodeURIComponent(city)}&lang=en`);
      if (res.status === 404) {
        const d = await res.json();
        throw new Error(d?.error?.message || `City '${city}' not found.`);
      }
      if (!res.ok) throw new Error('Failed to load brief');
      return res.json();
    },
    enabled: isLoaded && !!city,
  });

  const errorMsg = error instanceof Error ? error.message : undefined;

  return (
    <main className="min-h-screen px-4 py-6 max-w-[480px] mx-auto">
      <Header />

      <CityPicker selectedCity={city} onSelectCity={handleSelectCity} />

      {/* Hero Brief Card */}
      <BriefCard
        city={city}
        lines={briefResult?.lines ?? []}
        overallStatus={briefResult?.overallStatus ?? 'fresh'}
        generatedAt={briefResult?.generatedAt ?? new Date().toISOString()}
        isLoading={isLoading || !isLoaded}
      />

      {/* Weather Card */}
      <div className="mb-4">
        <DataCard
          title="Today's Weather"
          data={briefResult?.weather}
          isLoading={isLoading || !isLoaded}
          isError={isError}
          errorMessage={errorMsg}
        />
      </div>

      {/* AQI Card */}
      <div className="mb-4">
        <AqiCard
          data={briefResult?.aqi}
          isLoading={isLoading || !isLoaded}
          isError={isError}
          errorMessage={errorMsg}
        />
      </div>
    </main>
  );
}
