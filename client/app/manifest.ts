import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FoodMan — Food Delivery in Bangladesh',
    short_name: 'FoodMan',
    description:
      'Order authentic feast, biryani, burgers, and delicious dishes from top restaurants with fixed zone delivery fees in Dhaka.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F8F9FA',
    theme_color: '#FF4B6E',
    categories: ['food', 'shopping', 'lifestyle'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Explore Food',
        short_name: 'Explore',
        description: 'Browse restaurants and deals near you',
        url: '/',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Track Orders',
        short_name: 'Orders',
        description: 'Check active food deliveries',
        url: '/orders',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
    ],
  };
}
