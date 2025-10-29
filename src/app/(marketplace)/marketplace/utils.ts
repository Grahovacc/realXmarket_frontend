import { checkBlock, getItemMetadata } from '@/lib/queries';
import { generatePresignedUrl } from '@/lib/s3';
import { hexToString } from '@/lib/utils';
import { Listing } from '@/types';
import { AnyJson } from '@polkadot/types/types';

export function getKeyValue<T = unknown>(obj: unknown, key: string): T | undefined {
  if (obj && typeof obj === 'object' && key in (obj as Record<string, unknown>)) {
    return (obj as Record<string, unknown>)[key] as T;
  }
  return undefined;
}

// Extracts a number from any input.
// Example: "€ 1,234.50" becomes "1234.50"
export function extractNumber(v: unknown): number | null {
  if (v == null) return null;
  const cleaned = String(v).replace(/[^0-9.\-]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function norm(v: unknown): string {
  return (v ?? '').toString().normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
}

// Parses a range from a URL query parameter.
// Example: "propertyPrice=300000-500000" -> [300000, 500000]
export function parseRange(v?: string): readonly [number | null, number | null] {
  if (!v) return [null, null] as const;
  const [a = '', b = ''] = v.split('-');
  return [extractNumber(a), extractNumber(b)] as const;
}

export function parseTokenPriceLikeDisplayed(raw: unknown): number | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;

  const cleaned = s.replace(/[^\d.,-]/g, '');
  const normalized = cleaned.replace(/,/g, '');
  const n = Number(normalized);
  if (Number.isFinite(n) && n > 0 && n < 1e6) return n;

  const justDigits = s.replace(/\D/g, '');
  if (justDigits && justDigits.length > 5) {
    const micro = Number(justDigits);
    if (Number.isFinite(micro)) {
      const scaled = micro / 1_000_000;
      return Number.isFinite(scaled) ? scaled : null;
    }
  }
  return Number.isFinite(n) ? n : null;
}

export function extractTokenPrice(listing: Listing, meta: any): number | null {
  const candidates = [
    getKeyValue<string>(listing.listing?.listingDetails, 'tokenPrice'),
    getKeyValue<string>(listing.listing?.listingDetails, 'pricePerToken'),
    meta?.price_per_token,
    meta?.token_price
  ];
  for (const c of candidates) {
    const parsed = parseTokenPriceLikeDisplayed(c);
    if (parsed != null) return parsed;
  }
  const pp = extractNumber(meta?.property_price);
  const count = extractNumber(meta?.number_of_tokens);
  if (pp != null && count != null && count > 0) return pp / count;
  return null;
}

export function extractPropertyPrice(listing: Listing, meta: any): number | null {
  const m1 = meta?.property_price ?? meta?.price ?? meta?.valuation;
  const d1 = getKeyValue<unknown>(listing.listing?.listingDetails, 'propertyPrice');
  return extractNumber(m1) ?? extractNumber(d1);
}

export async function fetchListingMetadata(
  rawListings: Array<{ listingId: AnyJson; listingDetails: AnyJson }>
): Promise<Array<Listing>> {
  const listingData: Array<Listing> = (
    await Promise.all(
      rawListings.flatMap(async (listing: any) => {
        if (!listing?.listingDetails || typeof listing.listingDetails !== 'object')
          return undefined;

        const blockNumber = Number(
          String(listing.listingDetails.listingExpiry || '').replace(/,/g, '')
        );
        const expired = await checkBlock(blockNumber);
        if (expired) return null;

        const metadata = await getItemMetadata(
          listing.listingDetails.collectionId,
          listing.listingDetails.itemId
        );

        const metadataStr = metadata?.data?.startsWith?.('0x')
          ? hexToString(metadata.data)
          : metadata?.data ?? '';

        let fileUrls: string[] = [];
        try {
          if (metadataStr && typeof metadataStr === 'string') {
            const d = JSON.parse(metadataStr);
            if (Array.isArray(d.files)) {
              fileUrls = await Promise.all(
                d.files
                  .filter((fileKey: string) => fileKey.split('/')[2] === 'property_image')
                  .map(async (fileKey: string) => await generatePresignedUrl(fileKey))
              );
            }
          }
        } catch (error) {
          // Error generating file URLs, continue with empty array
        }

        return {
          listing: listing,
          tokenRemaining: listing?.listingDetails?.listedTokenAmount,
          metadata: metadataStr,
          fileUrls
        };
      })
    )
  ).filter(Boolean) as any;

  return listingData;
}
