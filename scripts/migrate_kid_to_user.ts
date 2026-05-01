import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Define schemas directly for the migration script to avoid dependency on application models
// that might have already been updated and removed KidProfile references.

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model("User", UserSchema, "users");

const KidProfileSchema = new mongoose.Schema({}, { strict: false });
const KidProfile = mongoose.model("KidProfile", KidProfileSchema, "kidprofiles");

// Mongoose connection string
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/swago-jr";

async function migrateData() {
  try {
    console.log("🚀 Starting database connection...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Fetch all kid profiles
    const kidProfiles = await KidProfile.find({});
    console.log(`🔍 Found ${kidProfiles.length} KidProfile records to process.`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const kid of kidProfiles) {
      const parentId = kid.userId;

      if (!parentId) {
        console.warn(`⚠️ KidProfile ${kid._id} has no userId attached. Skipping.`);
        skippedCount++;
        continue;
      }

      // Fetch the parent user
      const parentUser = await User.findById(parentId);

      if (!parentUser) {
        console.warn(`⚠️ Parent User ${parentId} not found for KidProfile ${kid._id}. Skipping.`);
        skippedCount++;
        continue;
      }

      console.log(`🔄 Migrating KidProfile ${kid._id} to User ${parentUser._id}...`);

      // Prepare updates
      const updateData: any = {
        // Map basic kid info to the main user profile
        childName: kid.name,
        childAge: kid.age,
        childAvatarColor: kid.avatarColor,
        childGrade: kid.grade,
      };

      // Map ambassador data
      if (kid.ambassador) {
        updateData.ambassador = {
          isActive: kid.ambassador.isActive || false,
          activatedAt: kid.ambassador.activatedAt,
          swagoMoney: kid.ambassador.swagoMoney || 0,
          entryChallenge: kid.ambassador.entryChallenge || null,
          brainGym: kid.ambassador.brainGym || [],
        };
        // Also map legacy swago money at root level if your app uses it
        updateData.swagoMoney = kid.ambassador.swagoMoney || 0;
      }

      // Map lottery tickets
      if (kid.lotteryTickets && kid.lotteryTickets.length > 0) {
        // If the user already has tickets from somewhere else, we merge them, otherwise just set them
        const existingTickets = parentUser.get("lotteryTickets") || [];
        
        // Use a Set to prevent duplicate ticket IDs
        const existingTicketIds = new Set(existingTickets.map((t: any) => t.codeId?.toString()));
        const newTickets = kid.lotteryTickets.filter((t: any) => !existingTicketIds.has(t.codeId?.toString()));

        if (newTickets.length > 0) {
          updateData.lotteryTickets = [...existingTickets, ...newTickets];
        }
      }

      // Update the user document
      await User.updateOne({ _id: parentId }, { $set: updateData });
      console.log(`✅ Successfully updated User ${parentUser._id}`);
      migratedCount++;
    }

    console.log("--------------------------------------------------");
    console.log("🎉 MIGRATION COMPLETE");
    console.log(`Total KidProfiles found: ${kidProfiles.length}`);
    console.log(`Successfully Migrated: ${migratedCount}`);
    console.log(`Skipped/Failed: ${skippedCount}`);
    console.log("--------------------------------------------------");
    console.log("⚠️ Note: The 'kidprofiles' collection was NOT deleted. You can manually drop it once you confirm everything works.");

  } catch (error) {
    console.error("❌ Migration failed with error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

migrateData();
