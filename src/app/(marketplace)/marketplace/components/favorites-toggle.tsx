'use client';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWalletContext } from '@/context/wallet-context';

export function favKey(addr?: string) {
  return `market_favorites:${addr || 'guest'}`;
}

export function readFavs(addr?: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(favKey(addr));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeFavs(next: string[], addr?: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(favKey(addr), JSON.stringify([...new Set(next)]));
  } catch {}
}

export default function FavoritesToggle() {
  const { selectedAccount } = useWalletContext();
  const address = selectedAccount?.[0]?.address as string | undefined;

  const [showFavs, setShowFavs] = useState(false);
  const [favs, setFavs] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setFavs(readFavs(address));
    sync();
    const onStorage = (e: StorageEvent) => {
      if (e.key === favKey(address)) sync();
    };
    window.addEventListener('storage', onStorage);
    const onLocal = (e: Event) => {
      const detail = (e as CustomEvent).detail as { address?: string } | undefined;
      if ((detail?.address || 'guest') === (address || 'guest')) sync();
    };
    window.addEventListener('favorites:update', onLocal as EventListener);
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('favorites');
      bc.onmessage = (msg) => {
        if ((msg?.data?.address || 'guest') === (address || 'guest')) sync();
      };
    }
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('favorites:update', onLocal as EventListener);
      if (bc) bc.close();
    };
  }, [address]);

  useEffect(() => {
    const grid = document.querySelector('[data-market-grid]');
    if (!grid) return;
    const items = Array.from(grid.querySelectorAll<HTMLElement>('[data-listing-id]'));
    if (!showFavs) {
      items.forEach((el) => (el.style.display = ''));
      return;
    }
    const favSet = new Set(favs);
    items.forEach((el) => {
      const id = el.getAttribute('data-listing-id') || '';
      el.style.display = favSet.has(id) ? '' : 'none';
    });
  }, [showFavs, favs]);

  const label = useMemo(() => (showFavs ? 'Showing Favorites' : 'Show Favorites'), [showFavs]);

  return (
    <div className="flex items-center gap-2">
      <Button variant={showFavs ? 'default' : 'outline'} onClick={() => setShowFavs((v) => !v)}>
        {label}
      </Button>
      {showFavs && (
        <span className="text-sm text-muted-foreground">
          {favs.length ? `${favs.length} saved` : 'No favorites yet'}
        </span>
      )}
    </div>
  );
}
