import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { cloudinary } from "@/lib/cloudinary";

async function verifyDatabaseConnection() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is missing. Update your .env file with the MongoDB connection string."
    );
  }

  try {
    await prisma.$runCommandRaw({ ping: 1 });
    console.log("✅ MongoDB connection successful.");
  } catch (error) {
    console.error("❌ MongoDB connection failed.");

    if (
      error instanceof Error &&
      error.message.includes("password must be URL encoded")
    ) {
      console.error(
        "Tip: If your MongoDB password contains special characters, encode it with encodeURIComponent before placing it in DATABASE_URL."
      );
    }

    throw error;
  }
}

async function verifyCloudinaryConnection() {
  const hasCloudinaryUrl = Boolean(process.env.CLOUDINARY_URL);
  const hasIndividualCreds =
    Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
    Boolean(process.env.CLOUDINARY_API_KEY) &&
    Boolean(process.env.CLOUDINARY_API_SECRET);

  if (!hasCloudinaryUrl && !hasIndividualCreds) {
    throw new Error(
      "Cloudinary credentials are missing. Set CLOUDINARY_URL or the individual CLOUDINARY_* variables."
    );
  }

  try {
    const result = await (cloudinary as any).api.ping();
    if (result?.status === "ok") {
      console.log("✅ Cloudinary connection successful.");
    } else {
      console.warn("Cloudinary ping returned an unexpected response:", result);
    }
  } catch (error) {
    console.error("❌ Cloudinary connection failed.");
    throw error;
  }
}

async function main() {
  console.log("Running integration verification...");
  await verifyDatabaseConnection();
  await verifyCloudinaryConnection();
  console.log("All checks completed.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});


