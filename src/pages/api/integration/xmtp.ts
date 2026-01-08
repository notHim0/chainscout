import type { NextApiRequest, NextApiResponse } from "next";
import { Client, Signer } from "@xmtp/node-sdk";
import { privateKeyToAccount } from "viem/accounts";
import { hexToBytes } from "viem";
import { receiveMessageOnPort } from "worker_threads";

// Import the types if available, otherwise we'll define them
const enum IdentifierKind {
	Ethereum = 0,
	Passkey = 1,
}
interface Identifier {
	identifier: string;
	identifierKind: IdentifierKind;
}
export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== "POST") {
		return res.status(405).json({ message: "Method not allowed" });
	}

	const { message, recipient } = req.body;
	const privateKey = process.env.PRIVATE_KEY;

	if (!privateKey) {
		return res
			.status(500)
			.json({ message: "Server misconfiguration: No Private Key" });
	}

	try {
		console.log("Creating XMTP signer...");

		// Ensure private key has 0x prefix
		const key = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;

		// Create viem account
		const account = privateKeyToAccount(key as `0x${string}`);

		// Create the signer object following XMTP docs
		const signer: Signer = {
			type: "EOA",
			getIdentifier: () => ({
				identifier: account.address,
				identifierKind: IdentifierKind.Ethereum as any,
			}),
			signMessage: async (message: string): Promise<Uint8Array> => {
				// Sign the message using viem account
				const signatureHex = await account.signMessage({
					message,
				});
				// Convert hex signature to Uint8Array and return it
				return hexToBytes(signatureHex);
			},
		};

		console.log("Creating XMTP client...");

		// Create XMTP client with the properly formatted signer
		const client = await Client.create(signer, {
			env: "dev",
		});

		console.log("Client created successfully");
		console.log("Checking if recipient can receive messages...");

		console.log("started to create the message, receipeint: ", recipient);
		const recipientObj: Identifier = {
			identifier: recipient,
			identifierKind: IdentifierKind.Ethereum,
		};
		// const canMessage = await client.canMessage([recipientObj] as any);
		// console.log("successfully created the message");
		const recipientLower = recipient.toLowerCase();

		// if (!canMessage.get(recipientLower)) {
		// 	return res
		// 		.status(404)
		// 		.json({ message: "Recipient is not active on XMTP V3 network." });
		// }

		console.log(`Creating V3 conversation with ${recipient}...`);

		const conversation = await client.conversations.newGroup([recipient]);
		await conversation.send(
			`${message}\n go to: http://localhost:3000/claim to claim your reward`
		);

		console.log(`✅ Sent XMTP V3 message to ${recipient}`);
		return res.status(200).json({ success: true });
	} catch (error: any) {
		console.error("XMTP API Error:", error);
		return res.status(500).json({
			message: `${message}\n go to: http://localhost:3000/claim to claim your reward`,
		});
	}
}
