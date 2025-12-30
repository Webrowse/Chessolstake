import { FC, ReactNode, useMemo, useState, useEffect } from 'react';
import {
    ConnectionProvider,
    WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    TorusWalletAdapter,
    LedgerWalletAdapter,
    CoinbaseWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

// Network configuration - using Devnet for development
export const NETWORK = 'devnet';

// Program ID for the staking contract (deployed to Devnet)
export const STAKING_PROGRAM_ID = 'B5jR7EVRTkbJBc7zmRXmMAW1EwYpS9MfniGtRGxPoZ3u';

// Maximum time to wait for wallet provider (ms)
const PROVIDER_READY_TIMEOUT = 3000;
// Polling interval for provider check (ms)
const PROVIDER_CHECK_INTERVAL = 100;

interface WalletContextProviderProps {
    children: ReactNode;
}

/**
 * Check if any Solana wallet provider is available
 * Chrome injects wallet providers late, after app hydrates
 * Brave injects early
 */
const checkWalletProviderReady = (): boolean => {
    if (typeof window === 'undefined') return false;

    // Check for common wallet providers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;

    return !!(
        win.solana ||
        win.phantom?.solana ||
        win.solflare ||
        win.coin98 ||
        win.backpack ||
        // Check for wallet-standard wallets
        win.navigator?.wallets?.length > 0
    );
};

/**
 * Chrome-safe Wallet Context Provider
 *
 * This provider handles the timing issue where Chrome injects wallet
 * providers (window.solana) late, often after the app hydrates.
 *
 * Key fixes:
 * 1. Client-only initialization - never runs during SSR
 * 2. Provider readiness gate - waits for window.solana before enabling autoConnect
 * 3. Delayed adapter setup - wallets only initialized after provider ready
 * 4. Chrome-safe lifecycle - assumes extensions may be asleep on refresh
 */
export const WalletContextProvider: FC<WalletContextProviderProps> = ({ children }) => {
    // Track if we're on client side
    const [isClient, setIsClient] = useState(false);
    // Track if wallet provider is ready (injected into window)
    const [providerReady, setProviderReady] = useState(false);
    // Track if we've timed out waiting for provider
    const [providerTimeout, setProviderTimeout] = useState(false);

    // Ensure client-side only execution
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Wait for wallet provider to be injected
    useEffect(() => {
        if (!isClient) return;

        // Check immediately in case provider is already ready
        if (checkWalletProviderReady()) {
            console.log('[WalletContext] Provider already available');
            setProviderReady(true);
            return;
        }

        console.log('[WalletContext] Waiting for wallet provider...');

        // Poll for provider readiness
        let elapsed = 0;
        const interval = setInterval(() => {
            elapsed += PROVIDER_CHECK_INTERVAL;

            if (checkWalletProviderReady()) {
                console.log('[WalletContext] Provider became available after', elapsed, 'ms');
                setProviderReady(true);
                clearInterval(interval);
            } else if (elapsed >= PROVIDER_READY_TIMEOUT) {
                console.log('[WalletContext] Provider timeout after', elapsed, 'ms - proceeding without autoConnect');
                setProviderTimeout(true);
                setProviderReady(true); // Allow rendering but without autoConnect
                clearInterval(interval);
            }
        }, PROVIDER_CHECK_INTERVAL);

        return () => clearInterval(interval);
    }, [isClient]);

    // Listen for late provider injection (wallet extension wakes up)
    useEffect(() => {
        if (!isClient || !providerTimeout) return;

        // If we timed out but provider appears later, log it
        const checkLateProvider = () => {
            if (checkWalletProviderReady()) {
                console.log('[WalletContext] Provider appeared after timeout - user may need to manually connect');
            }
        };

        // Check periodically for late-arriving providers
        const interval = setInterval(checkLateProvider, 1000);

        // Also listen for the register event that wallet-standard uses
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleWalletRegister = () => {
            console.log('[WalletContext] Wallet registered via wallet-standard');
        };
        window.addEventListener('wallet-standard:register', handleWalletRegister);

        return () => {
            clearInterval(interval);
            window.removeEventListener('wallet-standard:register', handleWalletRegister);
        };
    }, [isClient, providerTimeout]);

    // Compute RPC endpoint
    const endpoint = useMemo(() => {
        if (!isClient) return '';
        return clusterApiUrl(NETWORK);
    }, [isClient]);

    // Initialize wallets only after provider is ready
    // This prevents the "Unexpected error" on Chrome
    const wallets = useMemo(() => {
        if (!isClient || !providerReady) return [];

        console.log('[WalletContext] Initializing wallet adapters');
        return [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
            new TorusWalletAdapter(),
            new LedgerWalletAdapter(),
            new CoinbaseWalletAdapter(),
        ];
    }, [isClient, providerReady]);

    // Only enable autoConnect if provider was ready before timeout
    // This prevents the "Unexpected error" when autoConnect tries to
    // connect to a wallet that hasn't injected yet
    const autoConnect = useMemo(() => {
        if (!isClient || !providerReady) return false;
        // Only auto-connect if provider was ready before timeout
        const shouldAutoConnect = !providerTimeout;
        console.log('[WalletContext] autoConnect:', shouldAutoConnect, 'providerTimeout:', providerTimeout);
        return shouldAutoConnect;
    }, [isClient, providerReady, providerTimeout]);

    // Don't render provider on server or before client is ready
    if (!isClient) {
        return <>{children}</>;
    }

    // Show loading state while waiting for provider
    if (!providerReady) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-slate-400">Detecting wallet...</p>
                </div>
            </div>
        );
    }

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider
                wallets={wallets}
                autoConnect={autoConnect}
                onError={(error) => {
                    console.error('[WalletContext] Wallet error:', error);
                    // Don't show error to user for common transient issues
                    if (error.name === 'WalletConnectionError' &&
                        error.message.includes('Unexpected error')) {
                        console.log('[WalletContext] Suppressing transient connection error');
                        return;
                    }
                }}
            >
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default WalletContextProvider;
