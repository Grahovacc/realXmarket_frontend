import MarketCard from '@/components/cards/market-card';
import {
  checkBlock,
  getActiveProperties,
  getAllAssets,
  getAllOngoingListings,
  getAllOngoingListingsWhereAddressIsDeveloper,
  getAllTokenBuyerForListing,
  getAllTokenBuyers,
  getItemMetadata,
  getPropertyById,
  getTokenRemaining,
  getTokensAndListingsOwnedByAccount
} from '@/lib/queries';

import { FetchedProperty, Listing, Property } from '@/types';
import FilterTabs from './filter-tabs';
import { hexToString } from '@/lib/utils';
import { getCookieStorage } from '@/lib/cookie-storage';
import { Shell } from '@/components/shell';
import { generatePresignedUrl } from '@/lib/s3';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';

function getDetail<T = unknown>(obj: unknown, key: string): T | undefined {
  if (obj && typeof obj === 'object' && key in (obj as Record<string, unknown>)) {
    return (obj as Record<string, unknown>)[key] as T;
  }
  return undefined;
}

function toNumLoose(v: unknown): number | null {
  if (v == null) return null;
  const cleaned = String(v).replace(/[^0-9.\-]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function norm(v: unknown): string {
  return (v ?? '').toString().normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
}

function parseRange(v?: string): readonly [number | null, number | null] {
  if (!v) return [null, null] as const;
  const [a = '', b = ''] = v.split('-');
  return [toNumLoose(a), toNumLoose(b)] as const;
}

function extractTokenPrice(listing: Listing, meta: any): number | null {
  const c1 = getDetail<string>(listing.listing?.listingDetails, 'tokenPrice');
  const c2 = getDetail<string>(listing.listing?.listingDetails, 'pricePerToken');
  const c3 = meta?.price_per_token;
  const c4 = meta?.token_price;
  const c5 =
    meta?.property_price != null && meta?.number_of_tokens != null
      ? Number(meta.property_price) / Number(meta.number_of_tokens)
      : null;

  let price =
    toNumLoose(c1) ??
    toNumLoose(c2) ??
    toNumLoose(c3) ??
    toNumLoose(c4) ??
    (typeof c5 === 'number' && Number.isFinite(c5) ? c5 : null);

  if (price != null && price > 100_000) {
    price = Math.round(price / 100);
  }
  return price;
}

function extractPropertyPrice(listing: Listing, meta: any): number | null {
  const m1 = meta?.property_price ?? meta?.price ?? meta?.valuation;
  const d1 = getDetail<unknown>(listing.listing?.listingDetails, 'propertyPrice');
  return toNumLoose(m1) ?? toNumLoose(d1);
}

export const maxDuration = 300;
export default async function Marketplace({
  searchParams
}: {
  searchParams?: Record<string, string>;
}) {
  const data = await getAllOngoingListings();
  const assets = await getAllAssets();

  // console.log('assets', assets);

  // console.log('data', data);
  // console.log('ALL ONGOING LISTINGS', data);

  // const activeListingsWhereAccountIsDeveloper =
  //   await getAllOngoingListingsWhereAddressIsDeveloper(
  //     '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'
  //   );
  // console.log('activeListingsWhereAccountIsDeveloper', activeListingsWhereAccountIsDeveloper);
  // console.log('activeListingsWhereAccountIsDeveloper', activeListingsWhereAccountIsDeveloper);

  // const allTokenBuyers = await getAllTokenBuyers();
  // console.log('ALL TOKEN BUYERS', allTokenBuyers);

  // const listing9Buyers = await getAllTokenBuyerForListing(9);
  // console.log('TOKEN BUYERS FOR LISTING 9', listing9Buyers);

  // const tokensOwnedByBob = await getTokensAndListingsOwnedByAccount(
  //   '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'
  // ); // Bob account

  // console.log('TOKENS OWNED BY BOB ACCOUNT', tokensOwnedByBob);
  // const properties = (await getActiveProperties()) as FetchedProperty[];

  // console.log(properties);

  // async function FetchMetaData() {
  //   activeListingsWhereAccountIsDeveloper.map(async listing => {
  //     // const details  = JSON.parse(listing.listingDetails);

  //     if (listing.listingDetails && typeof listing.listingDetails === 'object') {
  //       const metaData = await getItemMetadata(
  //         listing.listingDetails.collectionId,
  //         listing.listingDetails.itemId
  //       );
  //       console.log(hexToString(metaData.data));
  //     }
  //   });
  // }

  // console.log(await FetchMetaData());

  async function FetchMetaData() {
    const results = await Promise.all(
      data.map(async (listing: any) => {
        if (listing.listingDetails && typeof listing.listingDetails === 'object') {
          const metaData = await getItemMetadata(
            listing.listingDetails.collectionId,
            listing.listingDetails.itemId
          );
          // const tokenRemaining = await getTokenRemaining(listing.listingId);
          // const metadata = hexToString(metaData.data);
          const metadata = metaData.data.startsWith('0x')
            ? hexToString(metaData.data)
            : metaData.data;
          // console.log(listing?.listingDetails.listedTokenAmount);

          // Parse metadata and generate file URLs
          let fileUrls: string[] = [];
          try {
            if (metadata && typeof metadata === 'string') {
              const data = JSON.parse(metadata);
              if (data.files && Array.isArray(data.files)) {
                fileUrls = await Promise.all(
                  data.files
                    .filter((fileKey: string) => fileKey.split('/')[2] === 'property_image')
                    .map(async (fileKey: string) => await generatePresignedUrl(fileKey))
                );
              }
            }
          } catch (error) {}

          return {
            listing,
            tokenRemaining: listing?.listingDetails.listedTokenAmount,
            metadata,
            fileUrls
          };
        }
      })
    );
    return results;
  }

  // console.log(await FetchMetaData());

  const listings: Listing[] = (await FetchMetaData()).filter(
    (item): item is Listing => item !== undefined
  );

  const townCitySet = new Map<string, string>();
  for (const l of listings) {
    try {
      const meta = l.metadata ? JSON.parse(l.metadata) : {};
      const raw = (meta.address_town_city || '').toString().trim();
      if (!raw) continue;
      const value = norm(raw);
      const label = raw;
      if (!townCitySet.has(value)) townCitySet.set(value, label);
    } catch {}
  }
  const townCityOptions = Array.from(townCitySet.entries()).map(([value, name]) => ({
    name,
    value
  }));

  // ---- read URL params
  const q = norm(searchParams?.q ?? '');
  const propertyTypeParam = norm(searchParams?.propertyType ?? '');
  const countryParam = norm(searchParams?.country ?? '');
  const cityParam = norm(searchParams?.city ?? '');

  const [ppMin, ppMax] = parseRange(searchParams?.propertyPrice);
  const [tpMin, tpMax] = parseRange(searchParams?.tokenPrice);
  // ----

  const filtered = listings.filter(l => {
    try {
      const meta = l.metadata ? JSON.parse(l.metadata) : {};

      const addressStreet = (meta.address_street || '').toString();
      const addressTownCity = (meta.address_town_city || '').toString();
      const address =
        `${addressStreet}${addressStreet && addressTownCity ? ', ' : ''}${addressTownCity}`.toLowerCase();

      const city = norm(addressTownCity);
      const countryFromMeta = norm(meta.country);

      const type =
        norm(meta.property_type) ||
        norm(meta.type) ||
        norm(getDetail<string>(l.listing?.listingDetails, 'propertyType'));

      const propPrice = extractPropertyPrice(l, meta);
      const tokenPrice = extractTokenPrice(l, meta);

      if (propertyTypeParam && propertyTypeParam !== 'all') {
        const match = type.replace(/[^a-z]/g, '') === propertyTypeParam.replace(/[^a-z]/g, '');
        if (!match) return false;
      }

      if (countryParam && countryParam !== 'all') {
        if (countryFromMeta) {
          if (!countryFromMeta.includes(countryParam)) return false;
        }
      }

      if (cityParam && cityParam !== 'all' && !city.includes(cityParam)) return false;

      if (ppMin != null && propPrice != null && propPrice < ppMin) return false;
      if (ppMax != null && propPrice != null && propPrice > ppMax) return false;

      if (tpMin != null && tokenPrice != null && tokenPrice < tpMin) return false;
      if (tpMax != null && tokenPrice != null && tokenPrice > tpMax) return false;

      if (q) {
        const hay = `${l.listing?.listingId} ${address} ${type}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    } catch {
      return true;
    }
  });

  return (
    <Shell variant={'basic'} className="gap-10 pb-32">
      <Suspense fallback={<div>Loading filters...</div>}>
        <FilterTabs townCityOptions={townCityOptions} />
      </Suspense>
      <div className="flex flex-col gap-6 px-4 md:px-[50px]">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-4">
            <Button>Marketplace</Button>
            <Button variant="outline" className="border border-black/10 bg-white text-caption">
              Notice Board
            </Button>
          </div>
          <div className="flex items-end justify-end">
            <span className="flex items-center gap-2 font-sans text-[1rem]">
              Sort: Recommended
              <SortIcon />
            </span>
          </div>
        </div>

        {filtered && filtered.length >= 1 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map(async listing => {
              const data = JSON.parse(listing.metadata);
              const fileUrls = await Promise.all(
                (data.files || [])
                  .filter((fileKey: string) => fileKey.split('/')[2] == 'property_image')
                  .map(async (fileKey: string) => await generatePresignedUrl(fileKey))
              );
              // const expired = ['112,508', '112,161', '112,434', '101,264'];
              const blockNumber = Number(
                listing.listing.listingDetails.listingExpiry.replace(/,/g, '')
              );

              const isPassed = await checkBlock(blockNumber);
              // expired.includes(listing.listing.listingDetails.listingExpiry
              if (isPassed) {
                return null;
              }
              return (
                <MarketCard
                  key={listing.listing.listingId}
                  //   price={listing.listing.listingDetails.tokenPrice}
                  id={listing.listing.listingId}
                  fileUrls={listing.fileUrls || fileUrls || []}
                  details={listing.listing.listingDetails}
                  tokenRemaining={listing.tokenRemaining}
                  metaData={data}
                />
              );
            })}
          </div>
        ) : (
          <div></div>
        )}
      </div>
    </Shell>
  );
}

const SortIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="21"
    height="11"
    viewBox="0 0 21 11"
    fill="none"
  >
    <path
      opacity="0.8"
      d="M17.25 5.55078C17.25 5.74969 17.171 5.94046 17.0303 6.08111C16.8897 6.22176 16.6989 6.30078 16.5 6.30078H4.5C4.30109 6.30078 4.11032 6.22176 3.96967 6.08111C3.82902 5.94046 3.75 5.74969 3.75 5.55078C3.75 5.35187 3.82902 5.1611 3.96967 5.02045C4.11032 4.8798 4.30109 4.80078 4.5 4.80078H16.5C16.6989 4.80078 16.8897 4.8798 17.0303 5.02045C17.171 5.1611 17.25 5.35187 17.25 5.55078ZM20.25 0.300781H0.75C0.551088 0.300781 0.360322 0.379799 0.21967 0.520451C0.0790176 0.661104 0 0.851869 0 1.05078C0 1.24969 0.0790176 1.44046 0.21967 1.58111C0.360322 1.72176 0.551088 1.80078 0.75 1.80078H20.25C20.4489 1.80078 20.6397 1.72176 20.7803 1.58111C20.921 1.44046 21 1.24969 21 1.05078C21 0.851869 20.921 0.661104 20.7803 0.520451C20.6397 0.379799 20.4489 0.300781 20.25 0.300781ZM12.75 9.30078H8.25C8.05109 9.30078 7.86032 9.3798 7.71967 9.52045C7.57902 9.6611 7.5 9.85187 7.5 10.0508C7.5 10.2497 7.57902 10.4405 7.71967 10.5811C7.86032 10.7218 8.05109 10.8008 8.25 10.8008H12.75C12.9489 10.8008 13.1397 10.7218 13.2803 10.5811C13.421 10.4405 13.5 10.2497 13.5 10.0508C13.5 9.85187 13.421 9.6611 13.2803 9.52045C13.1397 9.3798 12.9489 9.30078 12.75 9.30078Z"
      fill="#4E4E4E"
    />
  </svg>
);
