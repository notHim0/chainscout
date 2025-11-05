import "@/styles/globals.css";
import { MetaMaskProvider } from "@metamask/sdk-react";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Theme
      accentColor="gold"
      grayColor="gray"
      panelBackground="solid"
      scaling="100%"
    >
      <div className="bg-[#faf8f3] text-[#646464]">
        <div className="mx-auto max-w-screen-xl px-1 md:px-4 sm:px-6 relative">
          <MetaMaskProvider
            debug={false}
            sdkOptions={{
              checkInstallationImmediately: true,
              dappMetadata: {
                name: "chainScout",
              },
            }}
          >
              <Component {...pageProps} node={null} />
          </MetaMaskProvider>
        </div>
      </div>
    </Theme>
  );
}
