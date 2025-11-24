import { useEffect, useState } from 'react';
import { getAllCandidats } from '@/api/candidatApi';
import type { Candidat } from '@/interfaces/interfaces';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';

export default function Candidats() {
  const [candidats, setCandidats] = useState<Candidat[]>([]);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [paginated, setPaginated] = useState(true);

  useEffect(() => {
    async function fetchCandidats() {
      try {
        const resp = await getAllCandidats(searchQuery, page);

        setCandidats(resp.candidats ? resp.candidats : resp.results.candidats);
        setCount(resp.count);
        setPaginated(searchQuery.trim() === '');
      } catch (error) {
        console.error('Error fetching candidats:', error);
      }
    }

    fetchCandidats();
  }, [page, searchQuery]);

  function applySearch() {
    setPage(1);
    setSearchQuery(search.trim());
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') applySearch();
  }

  return (
    <div className="space-y-6 px-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">
          Liste des candidats
        </h1>
      </div>

      {/* SEARCH BAR */}
      <div className="flex items-center gap-3">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
          <input
            placeholder="Rechercher un candidat..."
            className="w-full pl-10 pr-3 py-2 border bg-white rounded-xl focus:ring-2 focus:ring-neutral-500 focus:outline-none transition"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKey}
          />
        </div>

        <button
          onClick={applySearch}
          className="px-4 py-2 bg-neutral-600 text-white rounded-xl shadow-sm hover:bg-neutral-700 transition"
        >
          Filtrer
        </button>
      </div>

      {/* Candidates list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {candidats.map((c) => (
          <a
            href=""
            key={c.id}
            className="bg-white shadow-sm rounded-xl border p-4 hover:shadow-md transition"
          >
            <h2 className="text-lg font-semibold text-gray-800">{c.nom}</h2>

            <div className="mt-3 space-y-2 text-gray-600 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <p className="hover:underline">{c.email}</p>
              </div>

              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {c.telephone}
              </p>

              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {c.localisation}
              </p>
            </div>
          </a>
        ))}
      </div>

      {/* EMPTY STATE */}
      {candidats.length === 0 && (
        <div className="text-center text-gray-500 py-10">
          Aucun candidat trouvé.
        </div>
      )}

      {/* PAGINATION */}
      {paginated && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className={`px-4 py-2 flex items-center gap-2 rounded-xl transition 
              ${
                page <= 1
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-white hover:bg-gray-50'
              }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Précédent
          </button>

          <span className="text-gray-600 font-medium">Page {page}</span>

          <button
            disabled={candidats.length === 0}
            onClick={() => setPage(page + 1)}
            className={`px-4 py-2 flex items-center gap-2 rounded-xl transition 
              ${
                candidats.length === 0
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-white hover:bg-gray-50'
              }`}
          >
            Suivant
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
