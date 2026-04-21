import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ManhwaGrid from '../components/manhwa/ManhwaGrid';
import { manhwaService } from '../services/manhwaService';

const GENRE_DESCRIPTIONS = {
  action: 'High-octane battles, intense fights, and non-stop adrenaline.',
  romance: 'Love stories that will make your heart flutter.',
  fantasy: 'Magical worlds, mythical creatures, and epic adventures.',
  isekai: 'Heroes transported to another world with new powers.',
  thriller: 'Suspenseful stories that keep you on the edge of your seat.',
  horror: 'Terrifying tales that will send chills down your spine.',
  comedy: 'Laugh-out-loud stories that brighten your day.',
  'slice-of-life': 'Everyday stories told in extraordinary ways.',
  'martial-arts': 'Masters of combat and ancient fighting techniques.',
  system: 'Level-up mechanics, stat screens, and gaming elements.',
  drama: 'Emotionally gripping narratives with deep character development.',
  supernatural: 'Beyond the natural world — ghosts, demons, and the occult.',
  sports: 'Athletic competition and the pursuit of greatness.',
};

export default function GenrePage() {
  const { genre } = useParams();
  const [manhwaList, setManhwaList] = useState([]);
  const [loading, setLoading] = useState(true);

  const genreName = genre.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  const description = GENRE_DESCRIPTIONS[genre] || `Explore the best ${genreName} manhwa on TerraManhwa.`;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await manhwaService.getAll({ genre: genreName, limit: 30 });
        setManhwaList(res.data?.data || []);
      } catch (err) { 
        console.error('Failed to fetch genre manhwas:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [genre, genreName]);

  return (
    <>
      <Helmet><title>{genreName} Manhwa — TerraManhwa</title></Helmet>
      <div className="relative py-16 mb-8">
        <div className="absolute inset-0 bg-hero-gradient opacity-60" />
        <div className="relative max-w-7xl mx-auto px-4">
          <h1 className="font-display text-5xl md:text-6xl tracking-wider">{genreName.toUpperCase()}</h1>
          <p className="text-terra-muted mt-2 max-w-lg">{description}</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <ManhwaGrid manhwaList={manhwaList} loading={loading} />
      </div>
    </>
  );
}
