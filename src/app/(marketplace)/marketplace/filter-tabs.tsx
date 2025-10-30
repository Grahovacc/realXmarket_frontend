'use client';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  ComponentPropsWithoutRef,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';
import { cn } from '@/lib/utils';
import { FilterInput } from './components/filter-input';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { norm, parseRange } from './utils';
import { Button } from '@/components/ui/button';

type SelectLabelType = React.ComponentProps<'select'> & React.ComponentProps<'label'>;

const PROPERTY_TYPE_OPTIONS = [
  { name: 'All', value: 'all' },
  { name: 'Apartment', value: 'apartment' },
  { name: 'Flat', value: 'flat' },
  { name: 'Bungalow', value: 'bungalow' },
  { name: 'Detached', value: 'detached' },
  { name: 'Semi-Detached', value: 'semi-detached' },
  { name: 'Terraced', value: 'terraced' }
];

const COUNTRY_OPTIONS = [
  { name: 'All', value: 'all' },
  { name: 'United kingdom', value: 'united kingdom' }
];

type FilterTabsProps = {
  searchParams?: Record<string, string>;
  townCityOptions?: { name: string; value: string }[];
  suggestions?: { title: string; subtitle: string }[];
};

export default function FilterTabs({
  townCityOptions,
  suggestions,
  searchParams
}: FilterTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const _searchParams = useSearchParams();

  const TOWN_CITY_OPTIONS = useMemo(
    () =>
      [{ name: 'All', value: 'all' }].concat(
        townCityOptions && townCityOptions.length ? townCityOptions : []
      ),
    [townCityOptions]
  );

  const searchParam = norm(searchParams?.search);
  const propertyTypeParam = norm(searchParams?.propertyType);
  const countryParam = norm(searchParams?.country);
  const cityParam = norm(searchParams?.city);
  const [ppMin, ppMax] = parseRange(searchParams?.propertyPrice);
  const [tpMin, tpMax] = parseRange(searchParams?.tokenPrice);

  const [searchOpen, setSearchOpen] = useState(false);

  const [city, setCity] = useState<string | null>(cityParam ?? null);
  const [propertyType, setPropertyType] = useState<string | null>(propertyTypeParam ?? null);
  const [country, setCountry] = useState<string | null>(countryParam ?? null);
  const [searchTerm, setSearchTerm] = useState<string | null>(searchParam ?? null);
  const [propertyPrice, setPropertyPrice] = useState<(number | null)[] | null>(
    ppMin || ppMax ? [ppMin || 0, ppMax || 0] : null
  );
  const [tokenPrice, setTokenPrice] = useState<(number | null)[] | null>(
    tpMin || tpMax ? [tpMin || 0, tpMax || 0] : null
  );
  const [resetKey, setResetKey] = useState(0);

  const createQueryString = useCallback(
    (params: Record<string, string | number | null>) => {
      const next = new URLSearchParams(_searchParams?.toString());
      for (const [key, value] of Object.entries(params)) {
        if (value === null || value === '') next.delete(key);
        else next.set(key, String(value));
      }
      return next.toString();
    },
    [searchParams]
  );

  useEffect(() => {
    if (propertyType == null) return;
    startTransition(() => {
      const val = norm(propertyType);
      const qs = createQueryString({ propertyType: val === 'all' ? null : val });
      router.push(`${pathname}?${qs}`, { scroll: false });
    });
  }, [propertyType, createQueryString, pathname, router]);

  const debouncedPropertyPrice = useDebounce(propertyPrice, 700);

  useEffect(() => {
    if (!debouncedPropertyPrice) return;
    const [min, max] = debouncedPropertyPrice as (number | null)[];
    startTransition(() => {
      const hasAny = min != null || max != null;
      const qs = createQueryString({
        propertyPrice: hasAny ? `${min ?? ''}-${max ?? ''}` : null
      });
      router.push(`${pathname}?${qs}`, { scroll: false });
    });
  }, [debouncedPropertyPrice, createQueryString, pathname, router]);

  const debounceTokenPrice = useDebounce(tokenPrice, 700);

  useEffect(() => {
    if (!debounceTokenPrice) return;
    const [min, max] = debounceTokenPrice as (number | null)[];
    startTransition(() => {
      const hasAny = min != null || max != null;
      const qs = createQueryString({
        tokenPrice: hasAny ? `${min ?? ''}-${max ?? ''}` : null
      });
      router.push(`${pathname}?${qs}`, { scroll: false });
    });
  }, [debounceTokenPrice, createQueryString, pathname, router]);

  useEffect(() => {
    if (country == null) return;
    startTransition(() => {
      const val = norm(country);
      const qs = createQueryString({ country: val === 'all' ? null : val });
      router.push(`${pathname}?${qs}`, { scroll: false });
    });
  }, [country, createQueryString, pathname, router]);

  useEffect(() => {
    if (!city) return;
    startTransition(() => {
      const val = norm(city);
      const qs = createQueryString({ city: val === 'all' ? null : val });
      router.push(`${pathname}?${qs}`, { scroll: false });
    });
  }, [city, createQueryString, pathname, router]);

  const debouncedSearch = useDebounce(searchTerm, 400);

  useEffect(() => {
    startTransition(() => {
      const val = norm(debouncedSearch);
      const search = createQueryString({ search: val ? val : null });
      router.push(`${pathname}?${search}`, { scroll: false });
    });
  }, [debouncedSearch, createQueryString, pathname, router]);

  const filteredSuggestions = useMemo(() => {
    const source = suggestions ?? [];
    const search = norm(searchTerm);
    if (!search) return source.slice(0, 20);
    return source
      .filter(
        s =>
          s.title.toLowerCase().includes(search) || s.subtitle.toLowerCase().includes(search)
      )
      .slice(0, 20);
  }, [searchTerm, suggestions]);

  useEffect(() => {
    startTransition(() => {
      if (propertyType === 'all') {
        router.push(`${pathname}?${createQueryString({ propertyType: null })}`, {
          scroll: false
        });
        setPropertyType(null);
      }
      if (ppMin !== null && ppMax === 0) {
        router.push(`${pathname}?${createQueryString({ propertyPrice: null })}`, {
          scroll: false
        });
        setPropertyPrice(null);
      }
      if (tpMin !== null && tpMax === 0) {
        router.push(`${pathname}?${createQueryString({ tokenPrice: null })}`, {
          scroll: false
        });
        setTokenPrice(null);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResetFilters = () => {
    setCity(null);
    setCountry(null);
    setPropertyType(null);
    setSearchTerm(null);
    setPropertyPrice(null);
    setTokenPrice(null);
    setSearchOpen(false);
    setResetKey(k => k + 1);
    router.replace('/marketplace');
    router.refresh();
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-4 pb-6 md:px-[50px]">
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <div className="w-[520px]">
              <SelectButton label="SEARCH" placeholder="Find by property name or ID" />
            </div>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[--radix-popper-anchor-width] rounded-lg px-3 py-[18px]"
          >
            <div className="flex flex-col gap-3">
              <FilterInput
                key={`search-${resetKey}`}
                name="market_search"
                label="Search"
                type="text"
                inputMode="text"
                value={searchTerm ?? ''}
                onChange={e => setSearchTerm(e.target.value ? e.target.value : null)}
                placeholder="Start typing…"
              />
              <div className="max-h-64 overflow-auto rounded-md border border-primary/20">
                {filteredSuggestions.length ? (
                  <ul className="divide-y divide-white/5">
                    {filteredSuggestions.map((s, i) => (
                      <li
                        key={i}
                        className="cursor-pointer px-3 py-2 hover:bg-white/5"
                        onClick={() => {
                          setSearchTerm(s.title);
                          setSearchOpen(false);
                        }}
                      >
                        <p className="font-medium">{s.title}</p>
                        <p className="text-sm text-muted-foreground">{s.subtitle}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No results.
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Button onClick={handleResetFilters} variant="outline">
          Reset Filters
        </Button>
      </div>

      <Popover>
        <div className="hidden w-full grid-cols-5 gap-6 border-b px-4 pb-10 md:px-[50px] lg:grid">
          <FilterSelect
            key={`country-${resetKey}`}
            label="COUNTRY"
            placeholder="Show all"
            options={COUNTRY_OPTIONS}
            value={country ?? undefined}
            setOption={setCountry}
          />
          <FilterSelect
            key={`city-${resetKey}`}
            label="TOWN CITY"
            placeholder="Show all"
            options={TOWN_CITY_OPTIONS}
            value={city ?? undefined}
            setOption={setCity}
          />
          <FilterSelect
            key={`ptype-${resetKey}`}
            label="PROPERTY TYPE"
            placeholder="Show all"
            options={PROPERTY_TYPE_OPTIONS}
            value={propertyType ?? undefined}
            setOption={setPropertyType}
          />
          <PopoverTrigger>
            <SelectButton label="PROPERTY PRICE" placeholder="Max Price" />
          </PopoverTrigger>
          <Popover>
            <PopoverTrigger>
              <SelectButton label="TOKEN PRICE" placeholder="Max Price" />
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="grid w-[506px] grid-cols-2 gap-6 rounded-lg px-3 py-[18px]"
            >
              <FilterInput
                key={`tpmin-${resetKey}`}
                name="min_token_price"
                label="Min (£)"
                type="number"
                inputMode="numeric"
                value={tokenPrice ? tokenPrice[0] ?? '' : ''}
                onChange={e => {
                  const raw = e.target.value;
                  setTokenPrice([
                    raw === '' ? null : Number(raw),
                    tokenPrice ? tokenPrice[1] : null
                  ]);
                }}
              />
              <FilterInput
                key={`tpmax-${resetKey}`}
                name="max_token_price"
                label="Max (£)"
                type="number"
                inputMode="numeric"
                value={tokenPrice ? tokenPrice[1] ?? '' : ''}
                onChange={e => {
                  const raw = e.target.value;
                  setTokenPrice([
                    tokenPrice ? tokenPrice[0] : null,
                    raw === '' ? null : Number(raw)
                  ]);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
        <PopoverContent
          align="start"
          className="grid w-[506px] gap-6 rounded-lg px-3 py-[18px]"
        >
          <div className="flex items-center gap-6">
            <FilterInput
              key={`ppmin-${resetKey}`}
              name="min_property_price"
              label="Min (£)"
              type="number"
              inputMode="numeric"
              value={propertyPrice ? propertyPrice[0] ?? '' : ''}
              onChange={e => {
                const raw = e.target.value;
                setPropertyPrice([
                  raw === '' ? null : Number(raw),
                  propertyPrice ? propertyPrice[1] : null
                ]);
              }}
            />
            <FilterInput
              key={`ppmax-${resetKey}`}
              name="max_property_price"
              label="Max (£)"
              type="number"
              inputMode="numeric"
              value={propertyPrice ? propertyPrice[1] ?? '' : ''}
              onChange={e => {
                const raw = e.target.value;
                setPropertyPrice([
                  propertyPrice ? propertyPrice[0] : null,
                  raw === '' ? null : Number(raw)
                ]);
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export interface SelectButtonProps extends ComponentPropsWithoutRef<'button'> {
  label: string;
  placeholder: string;
}

const SelectButton = ({ label, className, placeholder, ...props }: SelectButtonProps) => (
  <div className="isolate flex w-full flex-col gap-2">
    {label ? <p className="text-[16px]/[24px] font-medium uppercase">{label}</p> : null}
    <button
      className={cn(
        'flex w-full items-center justify-between rounded border border-primary/[0.50] bg-background px-3 py-2 font-sans text-[1rem]/[1.5rem] placeholder:text-[#717171] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
        className
      )}
      {...props}
    >
      {placeholder}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="25"
        height="24"
        viewBox="0 0 25 24"
        fill="none"
      >
        <path
          d="M19.25 8.625L12.5 15.375L5.75 8.625"
          stroke="#3B4F74"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  </div>
);

export interface SelectProps extends SelectLabelType {
  value?: string;
  label: string;
  options?: { name: string; value: string }[];
  placeholder: string;
  setOption: React.Dispatch<React.SetStateAction<string | null>>;
}

const FilterSelect = ({
  label,
  value,
  options,
  placeholder,
  htmlFor,
  setOption
}: SelectProps) => (
  <div className="isolate flex w-full flex-col gap-2">
    {label ? (
      <label htmlFor={htmlFor} className="text-[16px]/[24px] font-medium uppercase">
        {label}
      </label>
    ) : null}
    <Select
      value={value}
      onValueChange={value => {
        const selectedOption = options?.find(opt => opt.value === value);
        if (selectedOption) setOption(selectedOption.value);
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options?.map((option, index) => (
            <SelectItem key={index} value={option.value}>
              {option.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
);
