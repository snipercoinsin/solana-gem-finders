import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AdPosition = 'top' | 'bottom' | 'left' | 'right';

interface SiteAd {
  id: string;
  position: AdPosition;
  content_type: string;
  content: string;
  is_active: boolean;
}

interface AdDisplayProps {
  position: AdPosition;
}

export function AdDisplay({ position }: AdDisplayProps) {
  const [ads, setAds] = useState<SiteAd[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAds = async () => {
      const { data } = await supabase
        .from('site_ads')
        .select('*')
        .eq('position', position)
        .eq('is_active', true);

      if (data) {
        setAds(data);
      }
    };

    fetchAds();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`ads-${position}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_ads',
          filter: `position=eq.${position}`,
        },
        () => {
          fetchAds();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [position]);

  useEffect(() => {
    // Execute JavaScript ads
    ads.forEach((ad) => {
      if (ad.content_type === 'js' && containerRef.current) {
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
        if (ad.content_type === 'url') {
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

        if (ad.content_type === 'html') {
          return (
            <div
              key={ad.id}
              className="flex justify-center"
              dangerouslySetInnerHTML={{ __html: ad.content }}
            />
          );
        }

        // JS ads are handled in useEffect
        return <div key={ad.id} />;
      })}
    </div>
  );
}
