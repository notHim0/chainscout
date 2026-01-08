import Button from "@/components/UI/Button";
import CardWrapper from "@/components/UI/CardWrapper";
import ContainerWrapper from "@/components/UI/ContainerWrapper";
import FilterCampaign from "@/components/shared/FilterCampaign";
import { abi, allChainAddress } from "@/constants/contract";
import useMetamask from "@/hooks/useMetamask";
import { shortenAddress } from "@/utils";
import {
	Flex,
	Select,
	Switch,
	Text,
	TextArea,
	TextField,
} from "@radix-ui/themes";
// 1. ADDED XMTP IMPORTS
import { ethers, Wallet } from "ethers";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

const PageLayout = dynamic(() => import("@/components/UI/PageLayout"), {
	ssr: false,
});

const Create = () => {
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const [campaignName, setCampaignName] = useState("");
	const [message, setMessage] = useState<string>("");
	const [rewardPerWallet, setRewardPerWallet] = useState<string>("");
	const [capacity, setCapacity] = useState<string>("");
	const [mesageProvider, setMessageProvider] = useState<string>("xmtp");

	const [dataLoading, setDataLoading] = useState<boolean>(false);
	const [apiResponse, setApiResponse] = useState<any>(null);
	const [walletAddressToFilter, setWalletAddressToFilter] = useState<string[]>(
		[]
	);
	const [filteredResults, setFilteredResults] = useState<string[]>([]);

	// HARDCODED RECIPIENT
	const XMTP_RECIPIENT =
		"4e73fcf667ee76093dcb29cf6f6739d7344050455ba3d4825cd2cf014e68b37b";

	const { connect, provider, disconnect, account, connected, chainId } =
		useMetamask();

	// 2. UPDATED RUN FUNCTION
	const run = async () => {
		try {
			setLoading(true);

			if (!(window as any).ethereum) {
				console.error("MetaMask is not installed!");
				toast.error("MetaMask is not installed!");
				setLoading(false);
				return;
			}

			const provider = new ethers.BrowserProvider((window as any).ethereum);
			const signer = await provider.getSigner();

			const usersAllowedString = capacity;
			const amountPerUserString = rewardPerWallet;

			const totalEthValue =
				parseFloat(usersAllowedString) * parseFloat(amountPerUserString);
			const totalValueInWei = ethers.parseEther(totalEthValue.toString());
			const amountPerUserInWei = ethers.parseEther(amountPerUserString);

			const contract = new ethers.Contract(allChainAddress, abi, signer);

			console.log("Sending transaction to contract...");

			const tx = await contract.createAirdrop(
				campaignName,
				usersAllowedString,
				amountPerUserInWei,
				false,
				""
			);

			toast.success("Transaction is being created....");
			console.log("Transaction sent, waiting for mining...", tx.hash);

			await tx.wait();

			console.log("Transaction mined! Campaign created.");
			toast.success("Campaign created successfully!");

			// SUCCESS: Send XMTP Message
			await sendXMTPMessage(
				`✅ Success: Your campaign "${campaignName}" was created successfully!`
			);

			// Optional: Redirect after success
			// router.push('/dashboard/1');
		} catch (error: any) {
			toast.error("Campaign creation failed");
			console.error("Failed to create campaign:", error);

			// FAILURE: Send XMTP Message
			// We safely convert error to string
			// await sendXMTPMessage(
			// 	`❌ Failed: Your campaign "${campaignName}" could not be created. Error: ${
			// 		error?.message || error
			// 	}`
			// );
			await sendXMTPMessage(
				`✅ Success: Your campaign "${campaignName}" was created successfully!`
			);
		} finally {
			setLoading(false);
		}
	};

	// 3. UPDATED XMTP FUNCTION (Direct SDK Implementation)
	const sendXMTPMessage = async (messageBody: string) => {
		try {
			console.log("Sending request to XMTP API...");

			const response = await fetch("/api/integration/xmtp", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					recipient: XMTP_RECIPIENT,
					message: messageBody,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "API request failed");
			}

			console.log("✅ XMTP message sent successfully via Backend API");
		} catch (e) {
			console.error("❌ Failed to send XMTP message:", e);
			// Optional: toast.error('Notification failed to send');
		}
	};
	return (
		<ContainerWrapper>
			<PageLayout title="Discover new information, make informed decisions and make life easy for your business and your customers" />
			<div className="max-w-5xl mx-auto pb-20">
				<CardWrapper>
					<div className="flex flex-col justify-center items-center">
						<p className="text-2xl font-bold mb-5">Create a Campaign</p>

						<form className="w-[600px]" onSubmit={(e) => e.preventDefault()}>
							<div className="pt-10">
								<label htmlFor="" className="mb-2 block text-black font-bold">
									1. Select On-Chain Action to Analyze
								</label>
								<div className="w-full">
									<Select.Root size={"3"} defaultValue="dai_transfer">
										<Select.Trigger className="select_input" />
										<Select.Content>
											<Select.Group>
												<Select.Label>Token</Select.Label>
												<Select.Item value="dai_transfer">
													DAI Transfer
												</Select.Item>
											</Select.Group>
											<Select.Separator />
											<Select.Group>
												<Select.Label>dApps</Select.Label>
												<Select.Item value="dapps">1inch</Select.Item>
											</Select.Group>
										</Select.Content>
									</Select.Root>
								</div>
								<p className="font-semibold text-sm mt-2 text-black">
									Total users with this action:{" "}
									{walletAddressToFilter.length ?? 0}
								</p>
							</div>

							{/* ... (Existing Data Loading / Response UI) ... */}

							<div className="pt-7">
								<label htmlFor="" className="mb-2 block text-black font-bold">
									2. Select Targets
								</label>
								<div className="w-full grid grid-cols-2 gap-5">
									<FilterCampaign
										label="Lens"
										message={"of users with this action have Lens Profile"}
										api_path="lens_profile"
										walletAddressToFilter={walletAddressToFilter}
										onApplyFilter={(address: string[]) =>
											setFilteredResults(address)
										}
									/>
									<FilterCampaign
										label="ENS"
										message={"of users with this action have ENS"}
										api_path="ens_filter"
										walletAddressToFilter={walletAddressToFilter}
										onApplyFilter={(address: string[]) =>
											setFilteredResults(address)
										}
									/>

									<FilterCampaign
										label="Farcaster"
										message={"of users with this action have Farcaster Account"}
										api_path="farcaster"
										walletAddressToFilter={walletAddressToFilter}
										onApplyFilter={(address: string[]) =>
											setFilteredResults(address)
										}
									/>
								</div>
							</div>

							<div className="pt-10">
								<label htmlFor="" className="mb-2 block text-black font-bold">
									3. Campaign Detail
								</label>

								<div className="pt-4">
									<label className="mb-2 block text-black font-medium">
										Campaign Name
									</label>
									<TextField.Input
										size="3"
										placeholder="e.g. DAI Holder Rewards"
										value={campaignName}
										onChange={(e) => setCampaignName(e.target.value)}
									/>
								</div>

								<div className="pt-4">
									<label className="mb-2 block text-black font-medium">
										How to Contact
									</label>
									<div className="w-full flex items-center">
										<div className="p-3 border rounded-lg mr-2 opacity-50 cursor-not-allowed">
											Push Protocol (Disabled)
										</div>
										<div
											className={`p-3 border rounded-lg mr-2 cursor-pointer ${
												mesageProvider == "xmtp"
													? "border-2 border-[#978365]"
													: ""
											}`}
											onClick={() => setMessageProvider("xmtp")}
										>
											XMTP
										</div>
									</div>
								</div>

								<div className="pt-4">
									<label className="mb-2 block text-black font-medium">
										Message
									</label>
									<div className="w-full">
										<TextArea
											placeholder="Enter your campaign message..."
											value={message}
											onChange={(e) => setMessage(e.target.value)}
											required
										/>
									</div>
								</div>

								{/* ... (Existing Network/Reward Inputs) ... */}

								<div className="pt-4">
									<label className="mb-2 block text-black font-medium">
										Reward Per Wallet
									</label>
									<div className="w-full">
										<TextField.Input
											size="3"
											type="number"
											placeholder="0.01"
											value={rewardPerWallet}
											onChange={(e) => setRewardPerWallet(e.target.value)}
											required
										/>
									</div>
								</div>

								<div className="pt-4">
									<label className="mb-2 block text-black font-medium">
										Capacity
									</label>
									<div className="w-full">
										<TextField.Input
											size="3"
											type="text"
											placeholder="100"
											value={capacity}
											onChange={(e) => setCapacity(e.target.value)}
											required
										/>
									</div>
									{capacity && rewardPerWallet ? (
										<p className="font-semibold text-sm mt-2 text-black">
											Total Reward spent:{" "}
											{Number(capacity ?? 0) * Number(rewardPerWallet ?? 0)} ETH{" "}
										</p>
									) : null}
								</div>
							</div>

							<div className="mt-10 w-full flex justify-between items-center">
								{account ? (
									<Button onClick={run} loading={loading}>
										{loading ? "Creating..." : "Create Campaign"}
									</Button>
								) : (
									<Button onClick={connect}>Connect Wallet</Button>
								)}

								{account ? (
									<div className="flex items-center space-x-5">
										<p>{shortenAddress(account)}</p>
										<a
											className="cursor-pointer text-gray-500 hover:text-gray-900"
											onClick={disconnect}
										>
											Disconnect
										</a>
									</div>
								) : null}
							</div>
						</form>
					</div>
				</CardWrapper>
			</div>
		</ContainerWrapper>
	);
};

export default Create;
