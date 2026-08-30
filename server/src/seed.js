// database seeding script for FoodMan
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

import {
  User,
  Zone,
  Subzone,
  UserAddress,
  Restaurant,
  Category,
  FoodItem,
  Rider,
  Order,
  Payment,
  Wallet,
  LedgerTransaction,
  Review,
} from './modules/models.index.js';
import { USER_ROLES, VEHICLE_TYPES, ADDRESS_LABELS } from './constants/index.js';

const seedDatabase = async () => {
  try {
    if (process.env.NODE_ENV === 'production' && !process.env.CONFIRM_SEED) {
      throw new Error('seeding database in production requires CONFIRM_SEED=true');
    }

    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in .env');
    }

    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully.');

    console.log('Cleaning existing database collections...');
    // delete dependent records first
    await Promise.all([
      Order.deleteMany({}),
      Payment.deleteMany({}),
      LedgerTransaction.deleteMany({}),
      Review.deleteMany({}),
      FoodItem.deleteMany({}),
      UserAddress.deleteMany({}),
      Rider.deleteMany({}),
      Wallet.deleteMany({}),
    ]);

    // delete parent documents
    await Promise.all([
      User.deleteMany({}),
      Restaurant.deleteMany({}),
      Category.deleteMany({}),
      Subzone.deleteMany({}),
      Zone.deleteMany({}),
    ]);
    console.log('Existing collections cleaned.');

    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('password123', salt);

    // seed zones and subzones
    console.log('Seeding Zones and Subzones...');
    const zonesData = [
      {
        name: 'Banani',
        city: 'Dhaka',
        fixed_delivery_fee: 150,
        subzones: ['Banani DOHS', 'Banani Block E', 'Banani Block F', 'Banani Road 11'],
      },
      {
        name: 'Gulshan',
        city: 'Dhaka',
        fixed_delivery_fee: 120,
        subzones: ['Gulshan 1', 'Gulshan 2', 'Gulshan Avenue', 'Niketan'],
      },
      {
        name: 'Dhanmondi',
        city: 'Dhaka',
        fixed_delivery_fee: 100,
        subzones: ['Kalabagan', 'Dhanmondi 27', 'Dhanmondi Lake', 'Shankar'],
      },
      {
        name: 'Mirpur',
        city: 'Dhaka',
        fixed_delivery_fee: 80,
        subzones: ['Mirpur 10', 'Mirpur 12', 'Mirpur 2', 'Mirpur DOHS'],
      },
      {
        name: 'Uttara',
        city: 'Dhaka',
        fixed_delivery_fee: 120,
        subzones: ['Sector 3', 'Sector 7', 'Sector 11', 'Sector 13'],
      },
      {
        name: 'Mohakhali',
        city: 'Dhaka',
        fixed_delivery_fee: 110,
        subzones: ['Mohakhali DOHS', 'Wireless Gate', 'Amtoli'],
      },
    ];

    const zoneMap = {};
    const subzoneMap = {};

    for (const z of zonesData) {
      const zoneDoc = await Zone.create({
        name: z.name,
        city: z.city,
        fixed_delivery_fee: z.fixed_delivery_fee,
        is_active: true,
      });
      zoneMap[z.name] = zoneDoc;

      for (const subName of z.subzones) {
        const subDoc = await Subzone.create({
          zone_id: zoneDoc._id,
          name: subName,
          custom_fixed_fee: null,
          is_active: true,
        });
        subzoneMap[`${z.name}:${subName}`] = subDoc;
      }
    }
    console.log(`Created ${Object.keys(zoneMap).length} zones and ${Object.keys(subzoneMap).length} subzones.`);

    // seed users
    console.log('Seeding Users...');
    const adminUser = await User.create({
      name: 'Admin Tahsin',
      phone_number: '01700000000',
      email: 'admin@foodman.com',
      password_hash: defaultPasswordHash,
      role: USER_ROLES.ADMIN,
    });

    const customerTahsin = await User.create({
      name: 'Tahsin',
      phone_number: '01795368446',
      email: 'tahsin@example.com',
      password_hash: defaultPasswordHash,
      role: USER_ROLES.CUSTOMER,
    });

    const customerSarah = await User.create({
      name: 'Sarah Rahman',
      phone_number: '01811223344',
      email: 'sarah@example.com',
      password_hash: defaultPasswordHash,
      role: USER_ROLES.CUSTOMER,
    });

    const vendorTakeoutUser = await User.create({
      name: 'Rahim Khan (Takeout)',
      phone_number: '01711111111',
      email: 'takeout@foodman.com',
      password_hash: defaultPasswordHash,
      role: USER_ROLES.VENDOR,
    });

    const vendorPizzaUser = await User.create({
      name: 'Karim Mia (Pizza Guy)',
      phone_number: '01722222222',
      email: 'pizzaguy@foodman.com',
      password_hash: defaultPasswordHash,
      role: USER_ROLES.VENDOR,
    });

    const vendorSultanUser = await User.create({
      name: 'Sultan Ahmed (Sultans Dine)',
      phone_number: '01733333333',
      email: 'sultans@foodman.com',
      password_hash: defaultPasswordHash,
      role: USER_ROLES.VENDOR,
    });

    const vendorTokyoUser = await User.create({
      name: 'Chef Hiroshi (Tokyo Express)',
      phone_number: '01744444444',
      email: 'tokyo@foodman.com',
      password_hash: defaultPasswordHash,
      role: USER_ROLES.VENDOR,
    });

    const riderKabirUser = await User.create({
      name: 'Kabir Hossain',
      phone_number: '01755555555',
      email: 'rider1@foodman.com',
      password_hash: defaultPasswordHash,
      role: USER_ROLES.RIDER,
    });

    const riderSalamUser = await User.create({
      name: 'Salam Mia',
      phone_number: '01766666666',
      email: 'rider2@foodman.com',
      password_hash: defaultPasswordHash,
      role: USER_ROLES.RIDER,
    });

    // seed saved addresses for customer tahsin
    console.log('Seeding Saved Addresses for customer...');
    await UserAddress.create([
      {
        user_id: customerTahsin._id,
        zone_id: zoneMap['Banani']._id,
        subzone_id: subzoneMap['Banani:Banani DOHS']._id,
        address_label: ADDRESS_LABELS.HOME,
        detailed_address: 'Road 9, House 34, Apt 4B',
        contact_person_name: 'Tahsin',
        contact_phone: '01795368446',
        is_default: true,
      },
      {
        user_id: customerTahsin._id,
        zone_id: zoneMap['Mirpur']._id,
        subzone_id: subzoneMap['Mirpur:Mirpur 12']._id,
        address_label: ADDRESS_LABELS.WORK,
        detailed_address: 'Metro Station 12, Level 3',
        contact_person_name: 'Tahsin',
        contact_phone: '01795368446',
        is_default: false,
      },
      {
        user_id: customerTahsin._id,
        zone_id: zoneMap['Mirpur']._id,
        subzone_id: subzoneMap['Mirpur:Mirpur 10']._id,
        address_label: ADDRESS_LABELS.HOME,
        detailed_address: 'Metro Station Circle, Block C',
        contact_person_name: 'Tahsin',
        contact_phone: '01795368446',
        is_default: false,
      },
      {
        user_id: customerTahsin._id,
        zone_id: zoneMap['Dhanmondi']._id,
        subzone_id: subzoneMap['Dhanmondi:Kalabagan']._id,
        address_label: ADDRESS_LABELS.HOME,
        detailed_address: 'Lake View Road, House 12',
        contact_person_name: 'Tahsin',
        contact_phone: '01795368446',
        is_default: false,
      },
    ]);

    // seed riders and wallets
    console.log('Seeding Riders & Wallets...');
    const allZoneIds = Object.values(zoneMap).map((z) => z._id);

    await Rider.create([
      {
        user_id: riderKabirUser._id,
        vehicle_type: VEHICLE_TYPES.MOTORCYCLE,
        driving_license_no: 'DH-DL-982143',
        nid_number: '19922692019482',
        is_online: true,
        cash_in_hand_limit: 5000,
        rating_avg: 4.9,
        total_ratings: 142,
        assigned_zones: allZoneIds,
      },
      {
        user_id: riderSalamUser._id,
        vehicle_type: VEHICLE_TYPES.BICYCLE,
        driving_license_no: null,
        nid_number: '19952692018890',
        is_online: true,
        cash_in_hand_limit: 3000,
        rating_avg: 4.8,
        total_ratings: 89,
        assigned_zones: allZoneIds,
      },
    ]);

    await Wallet.create([
      { user_id: riderKabirUser._id, current_balance: 0, lifetime_earnings: 0 },
      { user_id: riderSalamUser._id, current_balance: 0, lifetime_earnings: 0 },
      { user_id: vendorTakeoutUser._id, current_balance: 0, lifetime_earnings: 0 },
      { user_id: vendorPizzaUser._id, current_balance: 0, lifetime_earnings: 0 },
      { user_id: vendorSultanUser._id, current_balance: 0, lifetime_earnings: 0 },
      { user_id: vendorTokyoUser._id, current_balance: 0, lifetime_earnings: 0 },
    ]);

    // seed catalog categories
    console.log('Seeding Categories...');
    const categoriesData = [
      { name: 'Burgers', sort_order: 1 },
      { name: 'Pizza', sort_order: 2 },
      { name: 'Biryani & Kacchi', sort_order: 3 },
      { name: 'Asian & Sushi', sort_order: 4 },
      { name: 'Fast Food', sort_order: 5 },
      { name: 'Desserts', sort_order: 6 },
      { name: 'Beverages', sort_order: 7 },
    ];

    const categoryMap = {};
    for (const cat of categoriesData) {
      const catDoc = await Category.create(cat);
      categoryMap[cat.name] = catDoc;
    }

    // seed restaurants
    console.log('Seeding Restaurants...');
    const takeoutBurgers = await Restaurant.create({
      owner_id: vendorTakeoutUser._id,
      zone_id: zoneMap['Banani']._id,
      name: 'Takeout Burgers',
      slug: 'takeout-burgers',
      description: 'Dhaka most iconic gourmet beef and crispy chicken burgers grilled fresh to order.',
      address: 'Road 11, Block D, Banani, Dhaka',
      commission_rate: 10,
      is_open: true,
      rating_avg: 4.8,
      total_ratings: 320,
    });

    const pizzaGuy = await Restaurant.create({
      owner_id: vendorPizzaUser._id,
      zone_id: zoneMap['Gulshan']._id,
      name: 'Pizza Guy',
      slug: 'pizza-guy',
      description: 'Artisanal stone-baked Neapolitan and deep dish loaded cheese pizzas.',
      address: 'Gulshan Avenue, Circle 2, Dhaka',
      commission_rate: 12,
      is_open: true,
      rating_avg: 4.7,
      total_ratings: 215,
    });

    const sultansDine = await Restaurant.create({
      owner_id: vendorSultanUser._id,
      zone_id: zoneMap['Dhanmondi']._id,
      name: "Sultan's Dine",
      slug: 'sultans-dine',
      description: 'Authentic Dhaka Shahi Kacchi Biryani cooked with tender mutton and aromatic basmati rice.',
      address: 'Satmasjid Road, Dhanmondi, Dhaka',
      commission_rate: 15,
      is_open: true,
      rating_avg: 4.9,
      total_ratings: 540,
    });

    const tokyoExpress = await Restaurant.create({
      owner_id: vendorTokyoUser._id,
      zone_id: zoneMap['Banani']._id,
      name: 'Tokyo Express',
      slug: 'tokyo-express',
      description: 'Authentic Japanese hand-rolled sushi, spicy rich tonkotsu ramen and crispy appetizers.',
      address: 'Road 8, Block F, Banani, Dhaka',
      commission_rate: 12,
      is_open: true,
      rating_avg: 4.8,
      total_ratings: 180,
    });

    // seed food items
    console.log('Seeding Food Items with Variants and Add-ons...');
    await FoodItem.create([
      // takeout burgers items
      {
        restaurant_id: takeoutBurgers._id,
        category_id: categoryMap['Burgers']._id,
        name: 'Smoky BBQ Beef Bacon Blast',
        description: 'Juicy smashed beef patty, glazed smoked bacon, sharp cheddar, and signature barbecue sauce in a toasted brioche bun.',
        base_price: 390,
        is_available: true,
        is_vegetarian: false,
        variants: [
          {
            title: 'Patty Size',
            required: true,
            options: [
              { name: 'Single Patty (120g)', price_delta: 0 },
              { name: 'Double Patty (240g)', price_delta: 140 },
            ],
          },
        ],
        add_ons: [
          { name: 'Extra Cheddar Slice', price: 40 },
          { name: 'Crispy Beef Bacon Strip', price: 60 },
          { name: 'Spicy Pickled Jalapeño', price: 30 },
        ],
      },
      {
        restaurant_id: takeoutBurgers._id,
        category_id: categoryMap['Burgers']._id,
        name: 'Crispy Fried Chicken Burger',
        description: 'Golden spiced buttermilk fried chicken breast topped with creamy coleslaw and spicy ranch mayo.',
        base_price: 280,
        is_available: true,
        is_vegetarian: false,
        variants: [
          {
            title: 'Spice Level',
            required: false,
            options: [
              { name: 'Spicy Crisp', price_delta: 0 },
              { name: 'Honey Glazed Kick', price_delta: 40 },
            ],
          },
        ],
        add_ons: [
          { name: 'Cheese Slice', price: 35 },
          { name: 'Garlic Mayo Dip', price: 25 },
        ],
      },
      {
        restaurant_id: takeoutBurgers._id,
        category_id: categoryMap['Fast Food']._id,
        name: 'Cheesy Loaded Animal Fries',
        description: 'Crisp golden french fries loaded with melted cheese blend, grilled onions, and secret animal dressing.',
        base_price: 180,
        is_available: true,
        is_vegetarian: true,
        variants: [],
        add_ons: [
          { name: 'Bacon Bits', price: 50 },
          { name: 'Jalapeño Salsa', price: 30 },
        ],
      },
      {
        restaurant_id: takeoutBurgers._id,
        category_id: categoryMap['Beverages']._id,
        name: 'Mint Limeade Refresher',
        description: 'Fresh crushed mint leaves, zesty lime juice, and sparkling soda chilled with crushed ice.',
        base_price: 110,
        is_available: true,
        is_vegetarian: true,
        variants: [],
        add_ons: [],
      },

      // pizza guy items
      {
        restaurant_id: pizzaGuy._id,
        category_id: categoryMap['Pizza']._id,
        name: 'Pepperoni Overload Pizza',
        description: 'Loaded with double layers of beef pepperoni, rich marinara sauce, and gooey fresh mozzarella on hand-tossed dough.',
        base_price: 650,
        is_available: true,
        is_vegetarian: false,
        variants: [
          {
            title: 'Size',
            required: true,
            options: [
              { name: 'Medium 10-inch (6 Slices)', price_delta: 0 },
              { name: 'Large 12-inch (8 Slices)', price_delta: 200 },
            ],
          },
        ],
        add_ons: [
          { name: 'Extra Mozzarella Cheese', price: 80 },
          { name: 'Cheese Stuffed Crust', price: 120 },
        ],
      },
      {
        restaurant_id: pizzaGuy._id,
        category_id: categoryMap['Pizza']._id,
        name: 'Smoked Chicken BBQ Pizza',
        description: 'Tender smoked pulled chicken, red onions, sweet corn, and drizzled smoky barbecue swirl.',
        base_price: 590,
        is_available: true,
        is_vegetarian: false,
        variants: [
          {
            title: 'Size',
            required: true,
            options: [
              { name: 'Medium 10-inch', price_delta: 0 },
              { name: 'Large 12-inch', price_delta: 200 },
            ],
          },
        ],
        add_ons: [
          { name: 'Extra BBQ Dip', price: 30 },
        ],
      },
      {
        restaurant_id: pizzaGuy._id,
        category_id: categoryMap['Fast Food']._id,
        name: 'Garlic Bread with Cheese',
        description: 'Toasted baguette slathered in garlic herb butter and topped with bubbling golden mozzarella.',
        base_price: 160,
        is_available: true,
        is_vegetarian: true,
        variants: [],
        add_ons: [],
      },

      // sultans dine items
      {
        restaurant_id: sultansDine._id,
        category_id: categoryMap['Biryani & Kacchi']._id,
        name: 'Signature Kacchi Biryani (Basmati)',
        description: 'Fragrant basmati rice layered with succulent marinated mutton chunks, whole baby potatoes, and rich shahi spices.',
        base_price: 480,
        is_available: true,
        is_vegetarian: false,
        variants: [
          {
            title: 'Serving Size',
            required: true,
            options: [
              { name: 'Single 1:1 (1 Mutton piece)', price_delta: 0 },
              { name: 'Jumbo Platter (2 Mutton pieces)', price_delta: 220 },
            ],
          },
        ],
        add_ons: [
          { name: 'Shahi Borhani Glass', price: 60 },
          { name: 'Shahi Jorda Cup', price: 50 },
          { name: 'Aloo Bokhara Chutney', price: 30 },
        ],
      },
      {
        restaurant_id: sultansDine._id,
        category_id: categoryMap['Biryani & Kacchi']._id,
        name: 'Beef Kala Bhuna Special',
        description: 'Traditional slow-roasted tender beef caramelized in black spices, mustard oil, and fried onions.',
        base_price: 520,
        is_available: true,
        is_vegetarian: false,
        variants: [],
        add_ons: [
          { name: 'Crispy Butter Paratha (2 Pcs)', price: 40 },
          { name: 'Fresh Salad & Lemon', price: 20 },
        ],
      },
      {
        restaurant_id: sultansDine._id,
        category_id: categoryMap['Beverages']._id,
        name: 'Traditional Shahi Borhani (250ml)',
        description: 'Spiced thick yogurt drink brewed with mint, coriander, roasted cumin, and black rock salt.',
        base_price: 70,
        is_available: true,
        is_vegetarian: true,
        variants: [],
        add_ons: [],
      },
      {
        restaurant_id: sultansDine._id,
        category_id: categoryMap['Desserts']._id,
        name: 'Shahi Firni Clay Cup',
        description: 'Slow-cooked aromatic ground rice pudding infused with saffron, milk reduction, and crushed pistachios.',
        base_price: 80,
        is_available: true,
        is_vegetarian: true,
        variants: [],
        add_ons: [],
      },

      // tokyo express items
      {
        restaurant_id: tokyoExpress._id,
        category_id: categoryMap['Asian & Sushi']._id,
        name: 'Salmon Teriyaki Roll (8 Pcs)',
        description: 'Fresh Norwegian salmon, crisp cucumber, and avocado rolled in nori, topped with torched teriyaki glaze.',
        base_price: 680,
        is_available: true,
        is_vegetarian: false,
        variants: [],
        add_ons: [
          { name: 'Extra Wasabi & Pickled Ginger', price: 30 },
          { name: 'Spicy Japanese Mayo', price: 40 },
        ],
      },
      {
        restaurant_id: tokyoExpress._id,
        category_id: categoryMap['Asian & Sushi']._id,
        name: 'Spicy Miso Ramen',
        description: 'Rich miso pork bone broth, springy ramen noodles, marinated chashu slices, nitamago egg, and scallions.',
        base_price: 520,
        is_available: true,
        is_vegetarian: false,
        variants: [
          {
            title: 'Noodle Texture',
            required: false,
            options: [
              { name: 'Standard Medium', price_delta: 0 },
              { name: 'Firm Katame', price_delta: 0 },
            ],
          },
        ],
        add_ons: [
          { name: 'Ajitsuke Tamago (Ramen Egg)', price: 50 },
          { name: 'Extra Chashu Slices (2 Pcs)', price: 120 },
        ],
      },
    ]);

    console.log('✅ Database seeded successfully!');
    console.log('----------------------------------------------------');
    console.log('Login Credentials:');
    console.log('Admin:    01700000000 / password123 (admin@foodman.com)');
    console.log('Customer: 01795368446 / password123 (tahsin@example.com)');
    console.log('Customer: 01811223344 / password123 (sarah@example.com)');
    console.log('Vendor:   01711111111 / password123 (takeout@foodman.com)');
    console.log('Rider:    01755555555 / password123 (rider1@foodman.com)');
    console.log('----------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedDatabase();
