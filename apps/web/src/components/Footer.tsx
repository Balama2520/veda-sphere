import React from 'react';

export function Footer() {
  return (
    <footer className="mt-8 pb-8 border-t border-border pt-5 text-xs text-muted space-y-1.5">
      <p className="font-semibold text-ink text-xs mb-2">Data Attribution</p>
      <p>
        Weather &amp; Air Quality model data by{' '}
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-brand-indigo transition-colors"
        >
          Open-Meteo.com
        </a>{' '}
        (CC&nbsp;BY&nbsp;4.0).
      </p>
      <p>
        Air quality forecasts use the{' '}
        <a
          href="https://atmosphere.copernicus.eu/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-brand-indigo transition-colors"
        >
          Copernicus Atmosphere Monitoring Service (CAMS)
        </a>{' '}
        model, produced by ECMWF.
      </p>
      <p>
        AQI calculated using the{' '}
        <a
          href="http://www.cpcb.nic.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-brand-indigo transition-colors"
        >
          Central Pollution Control Board (CPCB)
        </a>{' '}
        National AQI sub-index method. Figures are model estimates — not ground station readings.
      </p>
      <p className="pt-1">
        For detailed terms and licensing, see{' '}
        <a
          href="https://github.com/Balama2520/veda-sphere/blob/main/DATA_SOURCES.md"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-medium text-brand-indigo hover:opacity-80 transition-opacity"
        >
          DATA_SOURCES.md
        </a>.
      </p>
      <p className="pt-1 opacity-70">© {new Date().getFullYear()} VedaSphere. For informational purposes only.</p>
    </footer>
  );
}
