import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <>
      <Helmet><title>404 — Lost in Another World — TerraManhwa</title></Helmet>
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="relative mb-8">
          <span className="font-display text-[12rem] md:text-[16rem] leading-none text-terra-card select-none">404</span>
          <span className="absolute inset-0 flex items-center justify-center font-display text-[12rem] md:text-[16rem] leading-none text-gradient-red opacity-20 blur-sm">404</span>
        </div>
        <h1 className="font-display text-3xl md:text-4xl tracking-wider mb-3">LOST IN ANOTHER WORLD</h1>
        <p className="text-terra-muted max-w-md mb-8">
          It seems you've been isekai'd to a page that doesn't exist. 
          Don't worry — unlike most protagonists, you can go back easily.
        </p>
        <Link to="/">
          <Button variant="primary" size="lg">Return to Homepage</Button>
        </Link>
      </div>
    </>
  );
}
