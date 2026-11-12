import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'andormarcsi.hu – Canva, Claude és AI kezdőknek',
    short_name: 'andormarcsi',
    lang: 'hu',
    start_url: '/',
    display: 'browser',
    background_color: '#f4f2ee',
    theme_color: '#141216',
    icons: [{ src: '/icon.png', sizes: '512x512', type: 'image/png' }],
  };
}
