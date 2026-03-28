import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { WalletConnectScreen } from '../src/screens/auth/WalletConnectScreen';

export default function Index() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <WalletConnectScreen />;
}
