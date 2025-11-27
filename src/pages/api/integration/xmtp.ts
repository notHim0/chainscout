import { NextApiRequest, NextApiResponse } from 'next';
import { Client, Signer, IdentifierKind } from '@xmtp/node-sdk';
import { ethers } from 'ethers'; // Make sure to import ethers

const XMTPSendMessage = async (req: NextApiRequest, res: NextApiResponse) => {

    const { wallet_address, message } = req.body;

    if (!process.env.PRIVATE_KEY) {
        console.error("PRIVATE_KEY for XMTP bot is not set in .env.local");
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);

    // This is the V3-compatible Signer object with all type errors fixed
    const xmtpSigner: Signer = {
        type: 'EOA',
        getIdentifier: () => ({
            identifier: wallet.address,
            // FIX 1: Changed from .ETHEREUM to .Ethereum (PascalCase)
            identifierKind: IdentifierKind.Ethereum,
        }),
        // FIX 2: This function now correctly returns a Promise<Uint8Array>
        signMessage: async (message: string): Promise<Uint8Array> => {
            const signature = await wallet.signMessage(message);
            // Convert the hex string signature into a Uint8Array
            // This line fixes the "string is not assignable to Uint8Array" error
            return ethers.getBytes(signature);
        },
    };

    console.log("Initializing XMTP V3 client on 'dev' network...");

    try {
        const xmtp = await Client.create(xmtpSigner, { env: 'dev' });
        console.log("XMTP client initialized.");

        for (const walletAddress of wallet_address) {
            
            const canMessage = await xmtp.canMessage(walletAddress);
            
            if (canMessage) {
                const conversation = await xmtp.conversations.newDm(
                    walletAddress
                );
                await conversation.send(message);
                console.log(`Message sent to ${walletAddress}`);
            } else {
                console.warn(`Cannot message ${walletAddress}: User is not on the XMTP network.`);
            }
        }

        console.log("XMTP job complete.");
        return res.status(200).json({ status: 'okay' });

    } catch (e: any) {
        console.error("Error in XMTP V3 client:", e);
        return res.status(500).json({ error: e.message || 'Failed to send XMTP messages' });
    }
};

export default XMTPSendMessage;