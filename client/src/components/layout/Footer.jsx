import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { FaDiscord, FaRedditAlien } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { manhwaService } from '../../services/manhwaService';

export default function Footer() {
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await manhwaService.getMeta();
        setGenres(res.data?.genres?.slice(0, 4) || []);
      } catch (err) {
        console.error('Failed to fetch footer genres:', err);
      }
    })();
  }, []);

  const footerLinks = [
    {
      title: 'Browse',
      links: [
        { label: 'All Manhwa', to: '/browse' },
        { label: 'New Releases', to: '/browse?sort=latest' },
        { label: 'Popular', to: '/browse?sort=views' },
        { label: 'Completed', to: '/browse?status=completed' },
      ],
    },
    {
      title: 'Genres',
      links: genres
        .filter(g => typeof g === 'string')
        .map(g => ({
          label: g,
          to: `/genre/${g.toLowerCase().replace(/\s+/g, '-')}`
        })),
    },
    {
      title: 'Legal',
      links: [
        { label: 'About', to: '#' },
        { label: 'DMCA', to: '#' },
        { label: 'Contact', to: '#' },
        { label: 'Privacy', to: '#' },
      ],
    },
  ];
  return (
    <footer className="bg-terra-bg-secondary border-t border-terra-border mt-20 pb-16 md:pb-0" id="main-footer">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="text-terra-muted text-sm mt-3 leading-relaxed max-w-xs">
              Worlds Beyond Pages — Your home for premium manhwa reading.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" className="text-terra-muted hover:text-terra-red transition-colors"><FaDiscord size={18} /></a>
              <a href="#" className="text-terra-muted hover:text-terra-red transition-colors"><FaXTwitter size={16} /></a>
              <a href="#" className="text-terra-muted hover:text-terra-red transition-colors"><FaRedditAlien size={18} /></a>
            </div>
          </div>

          {/* Link groups */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="font-display text-sm tracking-wider text-terra-text mb-3">{group.title}</h4>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-terra-muted hover:text-terra-red transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-terra-border mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-terra-muted">© 2025 TerraManhwa. All rights reserved.</p>
          <p className="text-xs text-terra-muted">Made with ❤️ for manhwa readers</p>
        </div>
      </div>
    </footer>
  );
}
