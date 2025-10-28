import type { ApiPromise, HttpProvider, WsProvider } from '@polkadot/api';
import type { InjectedAccount } from '@polkadot/extension-inject/types';
import type { Signer } from '@polkadot/types/types';
import type { Dispatch, SetStateAction } from 'react';

export type XcavateContextType = {
  isInitializing?: boolean;
  isInitialized?: boolean;
  isConnecting?: boolean;
  isLoading: boolean;
  isConnected?: boolean;
  open: boolean;
  error?: XcavateError;
  qrCodeDataUrl: string | null;
  api?: ApiPromise;
  provider?: WsProvider | HttpProvider;
  connect: () => Promise<void>;
  disconnect: () => void;
  updateActiveAccount: (account: React.SetStateAction<InjectedAccount | undefined>) => void;
  accounts?: InjectedAccount[];
  activeAccount?: InjectedAccount;
  activeSigner?: Signer;
  setActiveAccount?: Dispatch<SetStateAction<InjectedAccount | undefined>>;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  balance: string | null;
  setBalance: (balance: string | null) => void;
};

export interface XcavateError {
  code: XcavateErrorCode;
  message: string;
}

export enum XcavateErrorCode {
  InitializationError = 0,
  NoSubstrateExtensionDetected = 1,
  NoAccountInjected = 2
}
