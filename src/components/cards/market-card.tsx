'use client';

import { useEffect, useState, MouseEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Icons } from '../icons';
import { IProperty, ListingDetails } from '@/types';
import { ImageIcon } from 'lucide-react';
import { formatAPY, formatPrice, truncate } from '@/lib/utils';
import ImageComponent from '../image-component';
import { useWalletContext } from '@/context/wallet-context';
import { favKey, readFavs, writeFavs } from '@/app/(marketplace)/marketplace/components/favorites-toggle';

export default function MarketCard({
  id,
  fileUrls,
  tokenRemaining,
  metaData,
  details,
  price
}: {
  id: string;
  fileUrls: string[];
  details: ListingDetails;
  tokenRemaining: any;
  metaData: IProperty;
  price?: any;
}) {
  const { selectedAccount } = useWalletContext();
  const address = selectedAccount?.[0]?.address as string | undefined;

  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    const favs = readFavs(address);
    setIsFav(favs.includes(id));
    const onStorage = (e: StorageEvent) => {
      if (e.key === favKey(address)) setIsFav(readFavs(address).includes(id));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [id, address]);

  const toggleFav = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const favs = readFavs(address);
    const next = favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id];
    writeFavs(next, address);
    setIsFav(next.includes(id));
    try {
      window.dispatchEvent(new CustomEvent('favorites:update', { detail: { address } }));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('favorites');
        bc.postMessage({ type: 'update', address });
        bc.close();
      }
    } catch {}
  };

  return (
    <Link
      href={`/marketplace/${id}`}
      className="relative flex w-full flex-col gap-6 rounded-lg bg-white pb-6 shadow-property-card transition-all duration-200 hover:translate-y-1"
    >
      {/* {metaData.fileUrls?.length && metaData.fileUrls.length >= 1 ? ( */}
      {fileUrls && fileUrls.length >= 1 ? (
        <Link href={`/marketplace/${id}`} className="relative">
          <div className="aspect-square h-[255px] w-full">
            <ImageComponent
              fill={true}
              src={fileUrls[0]}
              alt={metaData.property_name}
              // width={320}
              //   height={255}
              className="rounded-t-lg object-cover"
            />
          </div>
        </Link>
      ) : (
        // <Image
        //   src={metaData.fileUrls[0]}
        //   alt={metaData.property_name}
        //   width={320}
        //   height={255}
        //   className="h-[255px] w-full rounded-t-lg"
        //   priority
        // />
        <div className="flex h-[255px] w-full items-center justify-center rounded-t-lg bg-[#4E4E4E]/[0.10] text-primary/50">
          <ImageIcon size={130} />
        </div>
      )}

      <div className="absolute inset-4">
        <span className="items-center gap-1 rounded-lg bg-white px-2 py-[2px] text-[0.75rem] text-primary-200">
          {metaData.property_type}
        </span>
      </div>

      <Link href={`/marketplace/${id}`} className="relative flex flex-col gap-4 px-4">
        <div className="flex w-full items-center justify-between px-0">
          <div className="flex items-center justify-start">
            <Icons.location className="size-6 p-0 text-primary" />
            {/* <Image
              src={'/icons/pin_location.svg'}
              alt="loc"
              width={32}
              height={32}
              // className="pointer-events-none"
            /> */}
            <h3 className="text-md mt-1">
              <span className="capitalize">{metaData.address_street}</span>
              {', '}
              <span className="capitalize">{metaData.address_town_city}</span>
            </h3>
          </div>

          <button
            onClick={toggleFav}
            aria-pressed={isFav}
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
            className="rounded-full p-1"
          >
            <Icons.heart
              className={`size-8 transition ${isFav ? 'text-red-500' : 'text-gray-300 hover:text-primary'}`}
            />
          </button>
        </div>

        <div className="w-full space-y-2">
          <div className="flex items-center justify-between font-sans text-[0.875rem]/[1.5rem]">
            <dt className=" font-bold">{truncate(metaData.property_name, 20)}</dt>
            <dd className="">
              APY{' '}
              <span className="font-bold">
                {formatAPY(metaData.estimated_rental_income, metaData.property_price)}
              </span>
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="font-sans text-[0.875rem]/[1.5rem]">
              {tokenRemaining === '0' ? (
                <span className="rounded bg-primary-300 p-1 font-bold text-white">Sold Out</span>
              ) : (
                <>
                  Tokens <span className="font-bold">{tokenRemaining}</span>
                </>
              )}
            </dt>
            <dd className="font-sans text-[0.875rem]/[1.5rem]">
              Price{' '}
              <span className="font-bold">
                {price ? formatPrice(price) : formatPrice(metaData.property_price)}
              </span>
            </dd>
          </div>
        </div>
      </Link>
    </Link>
  );
}
