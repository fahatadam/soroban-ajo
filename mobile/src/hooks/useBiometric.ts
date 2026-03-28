import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

interface BiometricState {
  isAvailable: boolean;
  biometricType: BiometricType;
  authenticate: (reason?: string) => Promise<boolean>;
}

export function useBiometric(): BiometricState {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>('none');

  useEffect(() => {
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setIsAvailable(hasHardware && isEnrolled);

      if (hasHardware && isEnrolled) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('facial');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('fingerprint');
        } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          setBiometricType('iris');
        }
      }
    })();
  }, []);

  const authenticate = async (reason = 'Confirm your identity'): Promise<boolean> => {
    if (!isAvailable) return true; // skip if not available
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use Passcode',
      cancelLabel: 'Cancel',
    });
    return result.success;
  };

  return { isAvailable, biometricType, authenticate };
}
