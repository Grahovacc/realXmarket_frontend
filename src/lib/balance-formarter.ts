import type { ApiPromise } from '@polkadot/api';
import { BN, BN_ZERO, bnToBn, formatBalance } from '@polkadot/util';

export const getFormattedBalance = async (
  address: string,
  api?: ApiPromise | null
): Promise<string> => {
  if (!api) {
    return '';
  }
  await api.isReady;

  //@ts-ignore
  const { data: balance } = await api.query.system.account(address);

  const chainDecimals = api.registry.chainDecimals[0];
  formatBalance.setDefaults({ unit: api.registry.chainTokens[0] });

  return formatBalance(balance.free, {
    withSiFull: false,
    withZero: false,
    decimals: chainDecimals
  }).replace(/\.(\d{2})\d+/g, '.$1');
};
