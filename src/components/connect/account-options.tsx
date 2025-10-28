import React from 'react';

import { cn } from '@/lib/utils';
import { useXcavateContext } from '@/providers/xcavate-provider';
import Identicon from '@polkadot/react-identicon';
import { ScrollArea } from '../ui/scroll-area';

export function AccountOptions() {
  const { activeAccount, updateActiveAccount, accounts } = useXcavateContext();

  function onchangeAccount(account: any) {
    updateActiveAccount(() => account);
  }

  return (
    <>
      <div className="flex w-full gap-2">
        <div className="flex items-center justify-between">
          <h1 className="font-mona text-[1.125rem]/[1.5rem] font-semibold text-[#4E4E4E]">
            Select account
          </h1>
        </div>
      </div>

      {accounts && accounts.length >= 1 && (
        <div className="flex flex-col gap-2.5 transition">
          <ScrollArea className={cn('w-full', accounts.length > 3 ? 'h-[400px]' : '')}>
            <div className="mr-4 grid gap-4">
              {accounts.map((account, index) => (
                <button
                  type="button"
                  key={account.address}
                  className={cn(
                    'flex w-full cursor-pointer items-center justify-between rounded-lg border px-4 py-2 transition-colors duration-300 hover:border-primary-foreground',
                    activeAccount?.address === account.address
                      ? 'border-foreground'
                      : 'border-transparent'
                  )}
                  onClick={() => onchangeAccount(account)}
                >
                  <div className="flex items-center gap-2">
                    <Identicon
                      value={account?.address}
                      size={48}
                      theme="polkadot"
                      className="hover:cursor-pointer"
                    />

                    <div className="flex flex-col items-start gap-1">
                      <span className="font-mona text-[1.125rem]/[1.5rem]">
                        Account {index + 1}
                      </span>
                      <span className="max-w-28 truncate font-mona text-[1.125rem]/[1.5rem]">
                        {account.address}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </>
  );
}
