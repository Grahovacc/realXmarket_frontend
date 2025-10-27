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

type SelectLabelType = React.ComponentProps<'select'> & React.ComponentProps<'label'>;

const TOWN_CITY_OPTIONS = [
  { name: 'All', value: 'all' },
  { name: 'London', value: 'london' }
];

const PROPERTY_TYPE_OPTIONS = [
  { name: 'All', value: 'all' },
  { name: 'Apartment', value: 'Apartment' },
  { name: 'Flat', value: 'Flat' },
  { name: 'Bungalow', value: 'Bungalow' },
  { name: 'Detached', value: 'Detached' },
  { name: 'Semi-Detached', value: 'Semi-Detached' },
  { name: 'Terraced', value: 'Terraced' }
];

const COUNTRY_OPTIONS = [
  { name: 'All', value: 'all' },
  { name: 'United kingdom', value: 'United kingdom' }
];

const filters = [
  {
    label: 'COUNTRY',
    options: [
      { name: 'All', value: 'all' },
      { name: 'United kingdom', value: 'United kingdom' }
    ]
  },
  {
    label: 'TOWN CITY',
    options: [
      { name: 'All', value: 'all' },
      { name: 'London', value: 'london' }
    ]
  },
  {
    label: 'Property Type',
    options: [
      { name: 'All', value: 'all' },
      { name: 'Apartment', value: 'Apartment' },
      { name: 'Flat', value: 'Flat' },
      { name: 'Bungalow', value: 'Bungalow' },
      { name: 'Detached', value: 'Detached' },
      { name: 'Semi-Detached', value: 'Semi-Detached' },
      { name: 'Terraced', value: 'Terraced' }
    ]
  }
];

const SEARCH_SUGGESTIONS = [
  { title: '12 Baker Street', subtitle: 'Marylebone • London • W1U' },
  { title: '221B Baker Street', subtitle: 'Marylebone • London • NW1' },
  { title: 'Canary Wharf Penthouse', subtitle: 'Docklands • London • E14' },
  { title: 'Riverside Flat', subtitle: 'Putney • London • SW15' },
  { title: 'Terraced on Elm Road', subtitle: 'Kensington • London • W8' }
];

export default function FilterTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const propertyPriceParams = searchParams?.get('propertyPrice');
  const tokenPriceParams = searchParams?.get('tokenPrice');
  const propertyTypeParams = searchParams?.get('propertyType');

  // Create query string
  const createQueryString = useCallback(
    (params: Record<string, string | number | null>) => {
      const newSearchParams = new URLSearchParams(searchParams?.toString());
      for (const [key, value] of Object.entries(params)) {
        if (value === null) newSearchParams.delete(key);
        else newSearchParams.set(key, String(value));
      }
      return newSearchParams.toString();
    },
    [searchParams]
  );

  const [propertyType, setPropertyType] = useState<string | null>(propertyTypeParams);
  useEffect(() => {
    if (!propertyType) return;
    startTransition(() => {
      const newQueryString = createQueryString({ propertyType });
      router.push(`${pathname}?${newQueryString}`, { scroll: false });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyType]);

  const isPropertyPrice = propertyPriceParams
    ? propertyPriceParams?.split('-').map(Number)
    : null;
  const [propertyPrice, setPropertyPrice] = useState<number[] | null>(isPropertyPrice);
  const debouncedPropertyPrice = useDebounce(propertyPrice, 1000);

  useEffect(() => {
    if (!debouncedPropertyPrice) return;
    const [min, max] = debouncedPropertyPrice;
    startTransition(() => {
      const newQueryString = createQueryString({ propertyPrice: `${min}-${max}` });
      router.push(`${pathname}?${newQueryString}`, { scroll: false });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPropertyPrice]);

  const isTokenPrice = tokenPriceParams ? tokenPriceParams?.split('-').map(Number) : null;
  const [tokenPrice, setTokenPrice] = useState<number[] | null>(isTokenPrice);
  const debounceTokenPrice = useDebounce(tokenPrice, 1000);

  useEffect(() => {
    if (!debounceTokenPrice) return;
    const [min, max] = debounceTokenPrice;
    startTransition(() => {
      const newQueryString = createQueryString({ tokenPrice: `${min}-${max}` });
      router.push(`${pathname}?${newQueryString}`, { scroll: false });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounceTokenPrice]);

  useEffect(() => {
    function clearFilters() {
      startTransition(() => {
        if (propertyType === 'all') {
          router.push(`${pathname}?${createQueryString({ propertyType: null })}`, {
            scroll: false
          });
          setPropertyType(null);
        }
        if (isPropertyPrice !== null && isPropertyPrice[1] === 0) {
          router.push(`${pathname}?${createQueryString({ propertyPrice: null })}`);
          setPropertyPrice(null);
        }
        if (isTokenPrice !== null && isTokenPrice[1] === 0) {
          router.push(`${pathname}?${createQueryString({ tokenPrice: null })}`);
          setTokenPrice(null);
        }
      });
    }
    clearFilters();
  }, [propertyType, propertyPrice, tokenPrice]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const filteredSuggestions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return SEARCH_SUGGESTIONS;
    return SEARCH_SUGGESTIONS.filter(
      s => s.title.toLowerCase().includes(q) || s.subtitle.toLowerCase().includes(q)
    );
  }, [searchTerm]);

  return (
    <div className="w-full">
      {/* Search section above filters */}
      <div className="hidden w-full px-4 pb-6 md:px-[50px] lg:block">
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <div className="w-[520px]">
              <SelectButton label="SEARCH" placeholder="Find by address, city or ID" />
            </div>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[--radix-popper-anchor-width] rounded-lg px-3 py-[18px]"
          >
            <div className="flex flex-col gap-3">
              <FilterInput
                name="market_search"
                label="Search"
                type="text"
                inputMode="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
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
                    No matches in demo data.
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Popover>
        <div className="hidden w-full grid-cols-5 gap-6 border-b px-4 pb-10 md:px-[50px] lg:grid">
          <FilterSelect
            label={'COUNTRY'}
            placeholder="Show all"
            options={COUNTRY_OPTIONS}
            setOption={() => {}}
          />
          <FilterSelect
            label={'TOWN CITY'}
            placeholder="Show all"
            options={TOWN_CITY_OPTIONS}
            setOption={() => {}}
          />
          <FilterSelect
            label={'PROPERTY TYPE'}
            placeholder="Show all"
            options={PROPERTY_TYPE_OPTIONS}
            setOption={setPropertyType}
          />
          <PopoverTrigger>
            <SelectButton label="PROPERTY PRICE" placeholder="Max Price" />
          </PopoverTrigger>
          <Popover>
            <PopoverTrigger>
              <SelectButton label="Token Price" placeholder="Max Price" />
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="grid w-[506px] grid-cols-2 gap-6  rounded-lg px-3 py-[18px]"
            >
              <FilterInput
                name="min_token_price"
                label="Min (£)"
                type="number"
                inputMode="numeric"
                value={tokenPrice ? tokenPrice[0] : 0}
                onChange={e => {
                  const value = Number(e.target.value);
                  setTokenPrice([value, tokenPrice ? tokenPrice[1] : 0]);
                }}
              />
              <FilterInput
                name="max_token_price"
                label="Max (£)"
                type="number"
                inputMode="numeric"
                value={tokenPrice ? tokenPrice[1] : 10000}
                onChange={e => {
                  const value = Number(e.target.value);
                  setTokenPrice([tokenPrice ? tokenPrice[0] : 0, value]);
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
              name="min_property_price"
              label="Min (£)"
              type="number"
              inputMode="numeric"
              value={propertyPrice ? propertyPrice[0] : 0}
              onChange={e => {
                const value = Number(e.target.value);
                setPropertyPrice([value, propertyPrice ? propertyPrice[1] : 0]);
              }}
            />
            <FilterInput
              name="max_property_price"
              label="Max (£)"
              type="number"
              inputMode="numeric"
              value={propertyPrice ? propertyPrice[1] : 1000000}
              onChange={e => {
                const value = Number(e.target.value);
                setPropertyPrice([propertyPrice ? propertyPrice[0] : 0, value]);
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

const SelectButton = ({ label, className, placeholder, ...props }: SelectButtonProps) => {
  return (
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
};

const ArrowDownIcon = () => (
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
);

export interface SelectProps extends SelectLabelType {
  label: string;
  options?: { name: string; value: string }[];
  placeholder: string;
  setOption: React.Dispatch<React.SetStateAction<string | null>>;
}

const FilterSelect = ({ label, options, placeholder, htmlFor, setOption }: SelectProps) => {
  return (
    <div className="isolate flex w-full flex-col gap-2">
      {label ? (
        <label htmlFor={htmlFor} className="text-[16px]/[24px] font-medium uppercase">
          {label}
        </label>
      ) : null}
      <Select
        onValueChange={value => {
          const selectedOption = options?.find(opt => opt.value === value);
          if (selectedOption) {
            setOption(selectedOption.value);
          }
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
};
