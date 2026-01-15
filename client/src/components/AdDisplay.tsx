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
  const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const loadedAds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await fetch('/api/ads');
        if (response.ok) {
          const data = await response.json();
          const filteredAds = data.filter((ad: SiteAd) => ad.position === position && ad.isActive);
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
      if (loadedAds.current.has(ad.id)) return;
      
      const container = containerRefs.current.get(ad.id);
      if (!container) return;

      loadedAds.current.add(ad.id);

      if (ad.contentType === 'html') {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = ad.content;

        const scripts = tempDiv.querySelectorAll('script');
        const nonScriptContent = tempDiv.innerHTML.replace(/<script[\s\S]*?<\/script>/gi, '');
        
        if (nonScriptContent.trim()) {
          const contentDiv = document.createElement('div');
          contentDiv.innerHTML = nonScriptContent;
          container.appendChild(contentDiv);
        }

        scripts.forEach((oldScript) => {
          const newScript = document.createElement('script');
          
          Array.from(oldScript.attributes).forEach((attr) => {
            newScript.setAttribute(attr.name, attr.value);
          });
          
          if (oldScript.src) {
            newScript.src = oldScript.src;
            newScript.async = true;
          } else if (oldScript.textContent) {
            newScript.textContent = oldScript.textContent;
          }
          
          container.appendChild(newScript);
        });
      } else if (ad.contentType === 'image') {
        const img = document.createElement('img');
        img.src = ad.content;
        img.alt = 'Advertisement';
        img.className = 'max-h-[90px] object-contain mx-auto';
        img.onerror = () => { img.style.display = 'none'; };
        container.appendChild(img);
      }
    });
  }, [ads]);

  if (ads.length === 0) return null;

  const positionClasses: Record<AdPosition, string> = {
    top: 'w-full py-3 border-b border-border',
    bottom: 'w-full py-3 border-t border-border',
    left: 'fixed left-0 top-1/2 -translate-y-1/2 w-[160px] z-40',
    right: 'fixed right-0 top-1/2 -translate-y-1/2 w-[160px] z-40',
  };

  return (
    <div className={`bg-background/80 ${positionClasses[position]}`}>
      {ads.map((ad) => (
        <div
          key={ad.id}
          ref={(el) => {
            if (el) containerRefs.current.set(ad.id, el);
          }}
          className="flex justify-center items-center min-h-[90px]"
        />
      ))}
    </div>
  );
}
