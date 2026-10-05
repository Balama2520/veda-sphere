'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Check, Loader2 } from 'lucide-react';
import { CityItem } from '@vedasphere/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface CityPickerProps {
  selectedCity: string;
  onSelectCity: (city: string) => void;
}

export function CityPicker({ selectedCity, onSelectCity }: CityPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounce search query 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: cities, isLoading } = useQuery<CityItem[]>({
    queryKey: ['cities', debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.trim().length < 2) return [];
      const res = await fetch(`${API_BASE_URL}/v1/cities/search?q=${encodeURIComponent(debouncedQuery.trim())}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: debouncedQuery.trim().length >= 2,
  });

  const handleSelect = (cityName: string) => {
    onSelectCity(cityName);
    setSearchQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative mb-6" ref={wrapperRef}>
      <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">
        Select City
      </label>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
          <MapPin className="w-5 h-5 text-brand" />
        </div>

        <input
          type="text"
          value={isOpen ? searchQuery : selectedCity}
          onFocus={() => {
            setIsOpen(true);
            setSearchQuery('');
          }}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search city in India (e.g. Hyderabad, Mumbai)"
          className="w-full pl-11 pr-10 py-3 bg-surface border border-border rounded-btn text-ink text-base font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-brand transition-all"
        />

        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-muted">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-brand" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-surface border border-border rounded-card shadow-lg max-h-60 overflow-y-auto py-1">
          {debouncedQuery.trim().length < 2 ? (
            <div className="px-4 py-3 text-xs text-muted">Type at least 2 characters to search...</div>
          ) : isLoading ? (
            <div className="px-4 py-3 text-sm text-muted flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Searching cities...
            </div>
          ) : !cities || cities.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted">
              City &apos;{debouncedQuery}&apos; not found. Try Hyderabad, Mumbai, Delhi, etc.
            </div>
          ) : (
            cities.map((city) => (
              <button
                key={`${city.name}-${city.state}`}
                type="button"
                onClick={() => handleSelect(city.name)}
                className="w-full text-left px-4 py-3 hover:bg-surface-2 flex items-center justify-between transition-colors min-h-[44px]"
              >
                <div>
                  <span className="font-semibold text-ink text-sm block">{city.name}</span>
                  <span className="text-xs text-muted block">{city.state}</span>
                </div>
                {selectedCity.toLowerCase() === city.name.toLowerCase() && (
                  <Check className="w-4 h-4 text-brand" />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
