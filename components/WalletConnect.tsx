"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWallet, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

export function WalletConnect() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;
        return (
          <div aria-hidden={!ready} className={ready ? "" : "pointer-events-none select-none opacity-0"}>
            {(() => {
              if (!connected) {
                return (
                  <button type="button" onClick={openConnectModal} className="btn btn-primary btn-xs">
                    <FontAwesomeIcon icon={faWallet} className="h-3 w-3" /> Connect
                  </button>
                );
              }
              if (chain.unsupported) {
                return (
                  <button type="button" onClick={openChainModal} className="btn btn-danger btn-xs">
                    <FontAwesomeIcon icon={faTriangleExclamation} className="h-3 w-3" /> Wrong network
                  </button>
                );
              }
              return (
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={openChainModal} className="btn btn-ghost btn-xs hidden sm:inline-flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-verified" /> {chain.name ?? "Studionet"}
                  </button>
                  <button type="button" onClick={openAccountModal} className="btn btn-ghost btn-xs">
                    <FontAwesomeIcon icon={faWallet} className="h-3 w-3 text-signal" />
                    <span className="mono">{account.displayName}</span>
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
