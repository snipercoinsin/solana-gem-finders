import { useState, useEffect, useRef } from 'react';

type AdPosition = 'top' | 'bottom' | 'left' | 'right';

interface SiteAd {
  id: string;
  position: AdPosition;
  contentType: string;
  content: string;
  isActive: boolean;
}

interface AdDisplayProps {
  position: AdPosition;
}

export function AdDisplay({ position }: AdDisplayProps) {
  const [ads, setAds] = useState<SiteAd[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await fetch('/api/ads');
        if (response.ok) {
          const data = await response.json();
          const filteredAds = data.filter((ad: SiteAd) => ad.position === position);
          setAds(filteredAds);
        }
      } catch (err) {
        console.error('Failed to fetch ads:', err);
      }
    };

    fetchAds();
  }, [position]);

  useEffect(() => {
    ads.forEach((ad) => {
      if (ad.contentType === 'js' && containerRef.current) {
        try {
          const script = document.createElement('script');
          script.textContent = ad.content;
          containerRef.current.appendChild(script);
        } catch (err) {
          console.error('Error executing ad script:', err);
        }
      }
    });
  }, [ads]);

  if (ads.length === 0) return null;

  const positionClasses: Record<AdPosition, string> = {
    top: 'w-full py-2 border-b border-border',
    bottom: 'w-full py-2 border-t border-border',
    left: 'fixed left-0 top-1/2 -translate-y-1/2 w-[160px] z-40',
    right: 'fixed right-0 top-1/2 -translate-y-1/2 w-[160px] z-40',
  };

  return (
    <div ref={containerRef} className={`bg-background/80 ${positionClasses[position]}`}>
      {ads.map((ad) => {
        if (ad.contentType === 'url') {
          return (
            <div key={ad.id} className="flex justify-center">
              <a href={ad.content} target="_blank" rel="noopener noreferrer">
                <img
                  src={ad.content}
                  alt="Advertisement"
                  className="max-h-[90px] object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </a>
            </div>
          );
        }

        if (ad.contentType === 'html') {
          return (
            <div
              key={ad.id}
              className="flex justify-center"
              dangerouslySetInnerHTML={{ __html: ad.content }}
            />
          );
        }

        return <div key={ad.id} />;
      })}
    </div>
  );
}
