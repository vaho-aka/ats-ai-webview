import { useEffect, useState } from 'react';
import { getAllOffres } from '@/api/offreApi';
import {
  Search,
  Building2,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Offre } from '@/interfaces/interfaces';

export default function Offres() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [offres, setOffres] = useState<Offre[]>([]);

  const [searchQuery, setSearchQuery] = useState('');

  const [count, setCount] = useState(0);
  const [paginated, setPaginated] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const resp = await getAllOffres(search, page);

        setOffres(resp.results);
        setCount(resp.count);
        setPaginated(searchQuery.trim() === '');
      } catch (error) {
        console.error('Error fetching job offers:', error);
      }
    }
    fetchData();
  }, [search, page, searchQuery]);

  function applySearch() {
    setPage(1);
    setSearchQuery(search.trim());
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') applySearch();
  }

  return (
    <div className="space-y-6 min-h-screen px-6">
      <h1 className="text-2xl font-semibold text-neutral-800">
        Listes des offres d&apos;emploi
      </h1>

      <div className="flex items-center gap-3">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
          <input
            placeholder="Rechercher un candidat..."
            className="w-full pl-10 pr-3 py-2 border bg-white rounded-xl focus:ring-2 focus:ring-neutral-500 focus:outline-none transition"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Button onClick={applySearch}>Filtrer</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {offres.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-10">
            Aucune offre trouvée.
          </div>
        )}

        {offres.map((o) => (
          <div
            key={o.id}
            className="bg-white shadow-sm rounded-xl p-5 border
                       hover:shadow-md transition"
          >
            <h2 className="text-lg font-semibold text-neutral-800">
              {o.title}
            </h2>

            <div className="mt-3 space-y-2 text-gray-600 text-sm">
              {/* Company */}
              <p className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-neutral-800" />
                {o.company || 'Entreprise inconnue'}
              </p>

              {/* Location */}
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                {o.location || 'Non spécifié'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {paginated && (
        <div className="flex justify-between items-center gap-4 mt-6">
          <Button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className={`px-4 py-2 flex items-center gap-2 rounded-xl transition 
              ${page <= 1 ? 'text-gray-400' : ' hover:bg-neutral-700'}`}
          >
            <ChevronLeft className="w-5 h-5" />
            Précédent
          </Button>

          <span className="text-gray-600 font-medium">Page {page}</span>

          <Button
            disabled={offres.length === 0}
            onClick={() => setPage(page + 1)}
            className={`px-4 py-2 flex items-center gap-2 rounded-xl transition 
              ${
                offres.length === 0 ? 'text-gray-400' : 'hover:bg-neutral-700'
              }`}
          >
            Suivant
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
