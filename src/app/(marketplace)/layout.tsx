import { MarketPlaceHeader } from '@/components/layouts/market-place-header';
import SiteFooter from '@/components/layouts/site-footer';
import SubstrateContextProvider from '@/context/polkadot-contex';

export default function MarketplaceLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SubstrateContextProvider>
      <div className="relative flex min-h-screen flex-col">
        <MarketPlaceHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </div>
    </SubstrateContextProvider>
  );
}
