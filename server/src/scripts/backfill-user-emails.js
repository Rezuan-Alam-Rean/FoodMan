// temporary script to backfill missing emails for users using their name
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { User } from '../modules/user/user.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });
dotenv.config();

async function backfillEmails() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is missing in .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.');

  // Find all users where email is not set, null, or empty
  const usersWithoutEmail = await User.find({
    $or: [
      { email: { $exists: false } },
      { email: null },
      { email: '' },
    ],
  });

  console.log(`Found ${usersWithoutEmail.length} users without email.`);

  if (usersWithoutEmail.length === 0) {
    console.log('All users already have emails set. Nothing to update.');
    await mongoose.disconnect();
    return;
  }

  let updatedCount = 0;

  for (const user of usersWithoutEmail) {
    // Sanitize name: convert to lowercase, replace non-alphanumeric with dots, remove leading/trailing dots
    let baseHandle = (user.name || 'user')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '');

    // Fallback if handle becomes empty (e.g. names in non-latin script)
    if (!baseHandle) {
      const phoneSuffix = user.phone_number ? user.phone_number.slice(-4) : user._id.toString().slice(-4);
      baseHandle = `user.${phoneSuffix}`;
    }

    let candidateEmail = `${baseHandle}@foodman.com`;

    // Ensure uniqueness
    let isUnique = false;
    let attempt = 0;

    while (!isUnique) {
      const existing = await User.findOne({
        email: candidateEmail,
        _id: { $ne: user._id },
      });

      if (!existing) {
        isUnique = true;
      } else {
        attempt += 1;
        if (attempt === 1 && user.phone_number) {
          const suffix = user.phone_number.slice(-4);
          candidateEmail = `${baseHandle}.${suffix}@foodman.com`;
        } else {
          candidateEmail = `${baseHandle}.${attempt}@foodman.com`;
        }
      }
    }

    // Update user directly
    user.email = candidateEmail;
    await user.save();
    updatedCount += 1;
    console.log(`[${updatedCount}/${usersWithoutEmail.length}] Updated user`);
  }

  console.log(`Successfully backfilled email for ${updatedCount} users.`);
  await mongoose.disconnect();
  console.log('Database disconnected.');
}

backfillEmails().catch((err) => {
  console.error('Error during backfill:', err);
  process.exit(1);
});
