import { run } from "hardhat";

/**
 * Script to verify VKU token contract on Etherscan
 * 
 * Usage:
 * npx hardhat run scripts/verify.ts --network sepolia
 * 
 * You will be prompted to enter:
 * - Contract address
 * - Recipient address (initial token recipient)
 * - Owner address (contract owner)
 */

async function main() {
    // Replace these with your actual deployment values
    const contractAddress = process.env.CONTRACT_ADDRESS || "";
    const recipientAddress = process.env.RECIPIENT_ADDRESS || "";
    const ownerAddress = process.env.OWNER_ADDRESS || "";

    if (!contractAddress || !recipientAddress || !ownerAddress) {
        console.error("❌ Error: Missing required environment variables");
        console.log("\nPlease set the following in your .env file:");
        console.log("CONTRACT_ADDRESS=0x...");
        console.log("RECIPIENT_ADDRESS=0x...");
        console.log("OWNER_ADDRESS=0x...");
        console.log("\nOr run the command with arguments:");
        console.log("CONTRACT_ADDRESS=0x... RECIPIENT_ADDRESS=0x... OWNER_ADDRESS=0x... npx hardhat run scripts/verify.ts --network sepolia");
        process.exit(1);
    }

    console.log("🔍 Verifying VKU Token contract...");
    console.log("Contract Address:", contractAddress);
    console.log("Recipient Address:", recipientAddress);
    console.log("Owner Address:", ownerAddress);

    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: [recipientAddress, ownerAddress],
        });

        console.log("✅ Contract verified successfully!");
        console.log(`🔗 View on Etherscan: https://sepolia.etherscan.io/address/${contractAddress}#code`);
    } catch (error: any) {
        if (error.message.includes("Already Verified")) {
            console.log("✅ Contract is already verified!");
            console.log(`🔗 View on Etherscan: https://sepolia.etherscan.io/address/${contractAddress}#code`);
        } else {
            console.error("❌ Verification failed:", error.message);
            process.exit(1);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
