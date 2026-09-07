// migration script to convert variant options to absolute pricing in database
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { FoodItem } from '../modules/menu/foodItem.model.js';

dotenv.config({ path: '.env' });

async function migrate() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is missing in .env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB. Starting variant price migration...');

  const items = await FoodItem.find({ 'variants.0': { $exists: true } });
  console.log(`Found ${items.length} items with variants.`);

  for (const item of items) {
    let modified = false;

    for (const group of item.variants) {
      for (const option of group.options) {
        if (item.name === 'Bhaat + Murgi') {
          // Explicit handling for Janata Hotel's Bhaat + Murgi
          if (option.name.includes('Half Murgi')) {
            option.price = 60;
          } else if (option.name.includes('Full Murgi')) {
            option.price = 90;
          } else if (option.price === undefined || option.price === null) {
            option.price = item.base_price;
          }
          modified = true;
        } else {
          // Standard conversion for other dishes
          if (option.price === undefined || option.price === null) {
            const rawOpt = option._doc || option;
            const delta = rawOpt.price_delta !== undefined ? Number(rawOpt.price_delta) : 0;
            option.price = item.base_price + delta;
            modified = true;
          }
        }
      }
    }

    if (modified) {
      item.markModified('variants');
      await item.save();
      console.log(`Updated variants for "${item.name}":`, item.variants.map((g) => ({
        group: g.title,
        options: g.options.map((o) => ({ name: o.name, price: o.price })),
      })));
    }
  }

  console.log('Migration completed successfully.');
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
