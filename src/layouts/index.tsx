import { Outlet } from 'umi';
import 'tdesign-react/es/style/index.css';
import './reset.css';
import './theme.css';
import styles from './index.less';
import AccountHeader from '@/components/account/accountHeader';
import ConnectDialog from '@/components/dialog/connect';
import { useCallback, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initReddio, reddio } from '@/utils/config';
import { addStarkKey } from '@/utils/store';
import { ConnectButton, connectorsForWallets } from '@rainbow-me/rainbowkit';

import Alert from '@mui/material/Alert';
import '@rainbow-me/rainbowkit/styles.css';

import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { configureChains, createClient, WagmiConfig } from 'wagmi';
import { goerli, mainnet } from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { watchAccount, watchNetwork, getNetwork } from '@wagmi/core';
import { isVercel } from '@/utils/config';
import { ConfigProvider } from 'tdesign-react';
import enConfig from 'tdesign-react/es/locale/en_US';
import {
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { particleWallet } from '@particle-network/rainbowkit-ext';
import { generateKey, particle } from '@/utils/util';

const { chains, provider } = configureChains(
  [isVercel ? mainnet : goerli],
  [
    alchemyProvider({
      apiKey: isVercel
        ? 'rLJsa2qBOoeS497vaqqXv9besBxlGK3L'
        : '3En6dktpG2M1HPNQdoac0PERTR-MFaTW',
    }),
  ],
);

const connectors = connectorsForWallets([
  {
    groupName: 'Web2 ways',
    wallets: [
      particleWallet({ chains, authType: 'google' }),
      particleWallet({ chains, authType: 'facebook' }),
      particleWallet({ chains, authType: 'apple' }),
      particleWallet({ chains }),
    ],
  },
  {
    groupName: 'Web3 ways',
    wallets: [
      rainbowWallet({ chains }),
      walletConnectWallet({ chains }),
      metaMaskWallet({ chains }),
    ],
  },
]);

const wagmiClient = createClient({
  autoConnect: false,
  connectors,
  provider,
});

const queryClient = new QueryClient();

const footerIconLinks = [
  {
    label: 'Linkedin',
    href: 'https://www.linkedin.com/company/reddio',
    img: require('@/assets/footerIcon/social/linkedin.png'),
  },
  {
    label: 'Github',
    href: 'https://github.com/reddio-com/NFT-Marketplace',
    img: require('@/assets/footerIcon/social/github.png'),
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/reddiocom',
    img: require('@/assets/footerIcon/social/facebook.png'),
  },
  {
    label: 'Twitter',
    href: 'https://twitter.com/reddio_com',
    img: require('@/assets/footerIcon/social/twitter.png'),
  },
  {
    label: 'Discord',
    href: 'https://discord.gg/SjNAJ4qkK3',
    img: require('@/assets/footerIcon/social/discord.png'),
  },
];

export default function Layout() {
  const [isFirst, setFirst] = useState(
    !Boolean(window.localStorage.getItem('isFirst')),
  );

  const [openAlert, setOpenAlert] = useState(true);

  const handleSuccess = useCallback(() => {
    setFirst(false);
    initReddio(wagmiClient);
  }, []);

  useEffect(() => {
    if (particle.auth.isLogin()) {
      particle.auth.logout();
    }
    initReddio(wagmiClient);
    let i = 0;
    const init = async () => {
      if (i > 0) {
        return;
      }
      const { publicKey, privateKey } = await generateKey();
      console.log(publicKey, privateKey);
      addStarkKey(publicKey);
    };
    watchAccount(async (account) => {
      const chainId = isVercel ? mainnet.id : goerli.id;
      if (account.address && getNetwork().chain?.id === chainId) {
        i++;
        !isFirst && (await init());
        i--;
      } else {
        addStarkKey('');
        i--;
      }
    });
    watchNetwork(async (network) => {
      const chainId = isVercel ? mainnet.id : goerli.id;
      if (network.chain?.id === chainId) {
        i++;
        !isFirst && (await init());
      }
    });
  }, []);

  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider globalConfig={enConfig}>
            <div className={styles.layout}>
              <header>
                <img src={require('@/assets/logo.png')} alt="" height={24} />
                <ConnectButton accountStatus="address" />
              </header>
              <div className={styles.container}>
                {isFirst ? (
                  <ConnectDialog onSuccess={handleSuccess} />
                ) : (
                  <>
                    <div className={styles.contentWrapper}>
                      <AccountHeader showAlert={openAlert} />
                      {openAlert && (
                        <Alert
                          severity="info"
                          onClose={() => setOpenAlert(false)}
                        >
                          Your transaction is going to be submitted to Layer2
                          and will be proved on L1
                        </Alert>
                      )}
                      <Outlet />
                    </div>
                  </>
                )}
              </div>
              <footer className={styles.footer}>
                <div>
                  {footerIconLinks.map((icon, index) => {
                    return (
                      <img
                        key={index}
                        src={icon.img}
                        className={styles.icon}
                        onClick={() => window.open(icon.href, '__blank')}
                      />
                    );
                  })}
                </div>
                <div className={styles.footerInfo}>
                  Copyright © {new Date().getFullYear()} Reddio. All rights
                  reserved.
                </div>
              </footer>
            </div>
          </ConfigProvider>
        </QueryClientProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
