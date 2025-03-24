"use client";

import { useEffect, useState } from 'react';

interface RegionBasedMonthlyPriceProps {
  euPrice: string;
  nonEuPrice: string;
  className?: string;
}

export default function RegionBasedMonthlyPrice({ 
  euPrice, 
  nonEuPrice, 
  className = "" 
}: RegionBasedMonthlyPriceProps) {
  const [displayPrice, setDisplayPrice] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("€");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Try to detect if the user is from an EU country
    const detectEuUser = () => {
      // List of EU country language codes
      const euLanguageCodes = [
        'bg', 'cs', 'da', 'de', 'el', 'es', 'et', 'fi', 'fr', 
        'ga', 'hr', 'hu', 'it', 'lt', 'lv', 'mt', 'nl', 'pl', 
        'pt', 'ro', 'sk', 'sl', 'sv'
      ];
      
      // List of EU timezones
      const euTimezones = [
        'Europe/Amsterdam', 'Europe/Andorra', 'Europe/Athens', 'Europe/Belgrade',
        'Europe/Berlin', 'Europe/Bratislava', 'Europe/Brussels', 'Europe/Bucharest',
        'Europe/Budapest', 'Europe/Copenhagen', 'Europe/Dublin', 'Europe/Gibraltar',
        'Europe/Helsinki', 'Europe/Lisbon', 'Europe/Ljubljana', 'Europe/London',
        'Europe/Luxembourg', 'Europe/Madrid', 'Europe/Malta', 'Europe/Monaco',
        'Europe/Oslo', 'Europe/Paris', 'Europe/Prague', 'Europe/Riga', 'Europe/Rome',
        'Europe/Sofia', 'Europe/Stockholm', 'Europe/Tallinn', 'Europe/Tirane',
        'Europe/Vaduz', 'Europe/Vatican', 'Europe/Vienna', 'Europe/Vilnius',
        'Europe/Warsaw', 'Europe/Zagreb', 'Europe/Zurich'
      ];
      
      // Check if the browser language starts with any EU language code
      const browserLang = navigator.language.toLowerCase().split('-')[0];
      const isEuLanguage = euLanguageCodes.includes(browserLang);
      
      // Check if timezone is in EU
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const isEuTimezone = euTimezones.includes(timezone);
      
      // If either condition is true, use the EU price
      if (isEuLanguage || isEuTimezone) {
        setDisplayPrice(euPrice);
        setCurrencySymbol("€");
      } else {
        setDisplayPrice(nonEuPrice);
        setCurrencySymbol("$");
      }
    };

    try {
      detectEuUser();
    } catch (error) {
      console.error('Error detecting user region:', error);
      // Fallback to EU price if there's an error
      setDisplayPrice(euPrice);
      setCurrencySymbol("€");
    }
  }, [euPrice, nonEuPrice]);

  // Show nothing during SSR to avoid hydration mismatch
  if (!isClient) {
    return null;
  }

  return (
    <p className={`text-3xl font-bold ${className}`}>
      {currencySymbol}{displayPrice} <span className="text-base font-normal text-muted-foreground">/ month</span>
    </p>
  );
}
