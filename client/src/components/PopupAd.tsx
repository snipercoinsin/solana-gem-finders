import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SiteAd {
  id: string;
  position: string;
  contentType: string;
  content: string;
  isActive: boolean;
}

const POPUP_INTERVAL = 5 * 60 * 1000;

export function PopupAd() {
  const [isVisible, setIsVisible] = useState(false);
  const [ad, setAd] = useState<SiteAd | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    const fetchPopupAd = async () => {
      try {
        const response = await fetch('/api/ads');
        if (response.ok) {
          const data = await response.json();
          const popupAd = data.find((a: SiteAd) => a.position === 'popup' && a.isActive);
          if (popupAd) {
            setAd(popupAd);
          }
        }
      } catch (err) {
        console.error('Failed to fetch popup ad:', err);
      }
    };

    fetchPopupAd();
  }, []);

  useEffect(() => {
    if (!ad) return;

    const checkAndShowPopup = () => {
      const lastShown = localStorage.getItem('popup_ad_last_shown');
      const now = Date.now();
      
      if (!lastShown || now - parseInt(lastShown) >= POPUP_INTERVAL) {
        setIsVisible(true);
        localStorage.setItem('popup_ad_last_shown', now.toString());
        loadedRef.current = false;
      }
    };

    checkAndShowPopup();

    const interval = setInterval(checkAndShowPopup, POPUP_INTERVAL);

    return () => clearInterval(interval);
  }, [ad]);

  useEffect(() => {
    if (!isVisible || !ad || !containerRef.current || loadedRef.current) return;

    loadedRef.current = true;
    const container = containerRef.current;
    container.innerHTML = '';

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
      img.className = 'max-w-full max-h-[400px] object-contain';
      img.onerror = () => { img.style.display = 'none'; };
      container.appendChild(img);
    }
  }, [isVisible, ad]);

  const handleClose = () => {
    setIsVisible(false);
    loadedRef.current = false;
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
  };

  if (!ad || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative bg-card border border-border rounded-lg shadow-2xl max-w-[90vw] max-h-[90vh] overflow-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="absolute -top-3 -right-3 z-10 bg-destructive text-destructive-foreground rounded-full hover-elevate"
          data-testid="button-close-popup"
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="p-2">
          <div ref={containerRef} className="flex justify-center items-center" />
        </div>
      </div>
    </div>
  );
}
