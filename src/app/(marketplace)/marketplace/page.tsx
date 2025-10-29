import MarketCard from '@/components/cards/market-card';
import { getAllOngoingListings } from '@/lib/queries';
import FilterTabs from './filter-tabs';
import { Shell } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';
import {
  extractPropertyPrice,
  extractTokenPrice,
  fetchListingMetadata,
  norm,
  parseRange
} from './utils';

// This doesn't seem to be used anywhere.
export const maxDuration = 300;

type MarketplaceProps = {
  searchParams?: Record<string, string>;
};

export default async function Marketplace({ searchParams }: MarketplaceProps) {
  const rawListings = await getAllOngoingListings();

  const listingData = await fetchListingMetadata(rawListings.filter(l => l !== null));

  const townCitySet = new Map<string, string>();
  for (const l of listingData) {
    try {
      const meta = l.metadata ? JSON.parse(l.metadata) : {};
      const city = (meta.address_town_city || '').toString().trim();
      if (!city) continue;
      const value = norm(city);
      if (!townCitySet.has(value)) townCitySet.set(value, city);
    } catch {}
  }
  const townCityOptions = Array.from(townCitySet.entries()).map(([value, name]) => ({
    name,
    value
  }));

  const search = norm(searchParams?.search ?? '');
  const propertyTypeParam = norm(searchParams?.propertyType ?? '');
  const countryParam = norm(searchParams?.country ?? '');
  const cityParam = norm(searchParams?.city ?? '');
  const [ppMin, ppMax] = parseRange(searchParams?.propertyPrice);
  const [tpMin, tpMax] = parseRange(searchParams?.tokenPrice);

  const filteredListings = listingData.filter(l => {
    try {
      const meta = l.metadata ? JSON.parse(l.metadata) : {};

      const propertyName = (meta.property_name || meta.title || '').toString().toLowerCase();
      const addressStreet = (meta.address_street || '').toString();
      const addressTownCity = (meta.address_town_city || '').toString();
      const address =
        `${addressStreet}${addressStreet && addressTownCity ? ', ' : ''}${addressTownCity}`.toLowerCase();

      const city = norm(addressTownCity);
      const countryFromMeta = norm(meta.country);

      const propertyType = norm(meta.property_type);

      const propPrice = extractPropertyPrice(l, meta);
      const tokenPrice = extractTokenPrice(l, meta);

      if (propertyTypeParam && propertyTypeParam !== 'all') {
        const match =
          propertyType.toLowerCase().replace(/[^a-z0-9]/g, '') ===
          propertyTypeParam.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!match) return false;
      }

      if (countryParam && countryParam !== 'all') {
        if (countryFromMeta && !countryFromMeta.includes(countryParam)) return false;
      }

      if (cityParam && cityParam !== 'all' && !city.includes(cityParam)) return false;

      if (ppMin != null && propPrice != null && propPrice < ppMin) return false;
      if (ppMax != null && propPrice != null && propPrice > ppMax) return false;

      if (tpMin != null && tokenPrice != null && tokenPrice < tpMin) return false;
      if (tpMax != null && tokenPrice != null && tokenPrice > tpMax) return false;

      if (search) {
        const property =
          `${l.listing?.listingId} ${propertyName} ${address} ${propertyType}`.toLowerCase();
        if (!property.includes(search)) return false;
      }

      return true;
    } catch {
      return true;
    }
  });

  const suggestions: { title: string; subtitle: string }[] = [];
  for (const l of filteredListings) {
    try {
      const meta = l.metadata ? JSON.parse(l.metadata) : {};
      const propertyName = (meta.property_name || meta.title || '').toString().trim();
      const city = (meta.address_town_city || '').toString().trim();
      const postcode = (meta.postcode || meta.zip || '').toString().trim();

      const title = propertyName || String(l.listing?.listingId);
      if (!title) continue;

      const subtitle = [city, postcode].filter(Boolean).join(' • ');
      suggestions.push({ title, subtitle });
    } catch {}
  }

  return (
    <Shell variant={'basic'} className="gap-10 pb-32">
      <Suspense fallback={<div>Loading filters...</div>}>
        <FilterTabs
          townCityOptions={townCityOptions}
          suggestions={suggestions}
          searchParams={searchParams}
        />
      </Suspense>

      <div className="md:px={[50]} flex flex-col gap-6 px-4">
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

        {filteredListings.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filteredListings.map(listing => {
              const data = listing.metadata ? JSON.parse(listing.metadata) : {};
              return (
                <MarketCard
                  key={listing.listing.listingId}
                  id={listing.listing.listingId}
                  fileUrls={listing.fileUrls || []}
                  details={listing.listing.listingDetails}
                  tokenRemaining={listing.tokenRemaining}
                  metaData={data}
                />
              );
            })}
          </div>
        ) : (
          <div />
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
      d="M17.25 5.55078C17.25 5.74969 17.171 5.94046 17.0303 6.08111C16.8897 6.22176 16.6989 6.30078 16.5 6.30078H4.5C4.30109 6.30078 4.11032 6.22176 3.96967 6.08111C3.82902 5.94046 3.75 5.74969 3.75 5.35187 3.75 5.1611 3.82902 5.02045 4.11032 4.8798 4.30109 4.80078 4.5 4.80078H16.5C16.6989 4.80078 16.8897 4.8798 17.0303 5.02045 17.171 5.1611 17.25 5.35187 17.25 5.55078ZM20.25 0.300781H0.75C0.551088 0.300781 0.360322 0.379799 0.21967 0.520451 0.0790176 0.661104 0 0.851869 0 1.05078 0 1.24969 0.0790176 1.44046 0.21967 1.58111 0.360322 1.72176 0.551088 1.80078 0.75 1.80078H20.25C20.4489 1.80078 20.6397 1.72176 20.7803 1.58111 20.921 1.44046 21 1.24969 21 1.05078 21 0.851869 20.921 0.661104 20.7803 0.520451 20.6397 0.379799 20.4489 0.300781 20.25 0.300781ZM12.75 9.30078H8.25C8.05109 9.30078 7.86032 9.3798 7.71967 9.52045 7.57902 9.6611 7.5 9.85187 7.5 10.0508 7.5 10.2497 7.57902 10.4405 7.71967 10.5811 7.86032 10.7218 8.05109 10.8008 8.25 10.8008H12.75C12.9489 10.8008 13.1397 10.7218 13.2803 10.5811 13.421 10.4405 13.5 10.2497 13.5 10.0508 13.5 9.85187 13.421 9.6611 13.2803 9.52045 13.1397 9.3798 12.9489 9.30078 12.75 9.30078Z"
      fill="#4E4E4E"
    />
  </svg>
);
