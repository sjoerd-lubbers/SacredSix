"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface AmazonAffiliateButtonProps {
  usLink: string;
  nlLink: string;
  className?: string;
}

export default function AmazonAffiliateButton({ 
  usLink, 
  nlLink, 
  className = "" 
}: AmazonAffiliateButtonProps) {
  const [affiliateLink, setAffiliateLink] = useState(usLink);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Try to detect if the user is from the Netherlands
    const detectNetherlandsUser = () => {
      // Check if the browser language starts with 'nl'
      const isNlLanguage = navigator.language.toLowerCase().startsWith('nl');
      
      // Check timezone for Europe/Amsterdam
      const isNlTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone === 'Europe/Amsterdam';
      
      // If either condition is true, use the NL link
      if (isNlLanguage || isNlTimezone) {
        setAffiliateLink(nlLink);
      } else {
        setAffiliateLink(usLink);
      }
    };

    try {
      detectNetherlandsUser();
    } catch (error) {
      console.error('Error detecting user location:', error);
      // Fallback to US link if there's an error
      setAffiliateLink(usLink);
    }
  }, [nlLink, usLink]);

  // Show nothing during SSR to avoid hydration mismatch
  if (!isClient) {
    return null;
  }

  return (
    <Button asChild variant="default" className={`w-full sm:w-auto ${className}`}>
      <a href={affiliateLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
        </svg>
        Buy on Amazon
      </a>
    </Button>
  );
}
