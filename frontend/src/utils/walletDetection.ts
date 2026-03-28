/**
 * Comprehensive wallet detection utility
 * Checks for all possible ways wallets might inject themselves
 */

/**
 * Result of the multi-wallet detection process.
 */
export interface WalletDetectionResult {
  /** True if any version of Freighter is found */
  freighter: boolean;
  /** True if any version of LOBSTR is found */
  lobstr: boolean;
  /** True if Albedo is found */
  albedo: boolean;
  /** Detailed breakdown of found injection points */
  details: {
    freighterApi?: boolean;
    freighter?: boolean;
    lobstrVault?: boolean;
    lobstr?: boolean;
    lobstrExtension?: boolean;
    albedo?: boolean;
  };
}

/**
 * Detect all installed Stellar wallets by checking known injection points.
 * 
 * @returns Comprehensive detection result object
 */
export function detectWallets(): WalletDetectionResult {
  if (typeof window === 'undefined') {
    return {
      freighter: false,
      lobstr: false,
      albedo: false,
      details: {},
    };
  }

  const w = window as any;

  // Freighter detection - check multiple possible locations
  const hasFreighterApi = !!w.freighterApi;
  const hasFreighter = !!w.freighter;
  const freighterDetected = hasFreighterApi || hasFreighter;

  // LOBSTR detection - check all possible injection points
  const hasLobstrVault = !!w.lobstrVault;
  const hasLobstr = !!w.lobstr;
  const hasLobstrExtension = !!w.lobstrExtension;
  const lobstrDetected = hasLobstrVault || hasLobstr || hasLobstrExtension;

  // Albedo detection
  const hasAlbedo = !!w.albedo;

  return {
    freighter: freighterDetected,
    lobstr: lobstrDetected,
    albedo: hasAlbedo,
    details: {
      freighterApi: hasFreighterApi,
      freighter: hasFreighter,
      lobstrVault: hasLobstrVault,
      lobstr: hasLobstr,
      lobstrExtension: hasLobstrExtension,
      albedo: hasAlbedo,
    },
  };
}

/**
 * Poll for a specific wallet to be injected.
 * Useful for browser extensions that load asynchronously.
 * 
 * @param walletName - Key of the wallet to wait for
 * @param options - Timeout and polling interval settings
 * @returns Promise resolving to true if found within timeout
 */
export async function waitForWallet(
  walletName: 'freighter' | 'lobstr' | 'albedo',
  options: { timeoutMs?: number; intervalMs?: number } = {}
): Promise<boolean> {
  const { timeoutMs = 3000, intervalMs = 100 } = options;
  const startTime = Date.now();

  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const detection = detectWallets();
      const isDetected = detection[walletName];

      if (isDetected) {
        clearInterval(checkInterval);
        resolve(true);
      }

      if (Date.now() - startTime > timeoutMs) {
        clearInterval(checkInterval);
        resolve(false);
      }
    }, intervalMs);
  });
}

/**
 * Retrieve raw debug information about wallet properties on the window object.
 * 
 * @returns Record of found wallet properties and their exported methods
 */
export function getWindowWalletInfo(): Record<string, any> {
  if (typeof window === 'undefined') return {};

  const w = window as any;
  const info: Record<string, any> = {};

  // Check all possible wallet-related properties
  const possibleProps = [
    'freighterApi',
    'freighter',
    'lobstrVault',
    'lobstr',
    'lobstrExtension',
    'albedo',
    'stellar',
    'stellarWallet',
  ];

  for (const prop of possibleProps) {
    if (w[prop]) {
      info[prop] = {
        exists: true,
        type: typeof w[prop],
        methods: typeof w[prop] === 'object' 
          ? Object.keys(w[prop]).filter(k => typeof w[prop][k] === 'function')
          : [],
      };
    }
  }

  return info;
}

/**
 * Log comprehensive wallet detection info to the console.
 * Helpful for troubleshooting connection issues on different browsers.
 */
export function debugWalletDetection(): void {
  if (typeof console === 'undefined') return;
  
  const detection = detectWallets();
  const windowInfo = getWindowWalletInfo();
  
  // Store in window for manual inspection
  (window as any).__walletDebug = {
    detection,
    windowInfo,
    userAgent: navigator.userAgent,
  };
}
