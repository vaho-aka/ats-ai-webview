import { useAppStore } from '@/store/useAppStore';
import { Loader2 } from 'lucide-react';

export default function LoadingOverlay() {
  const status = useAppStore((s) => s.uploadStatus);

  if (status === 'idle' || status === 'success') return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-8 flex flex-col items-center gap-4 w-96">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />

        <div className="text-lg font-semibold text-gray-900">
          {status === 'uploading' && 'Téléchargement des fichiers…'}
          {status === 'processing' && 'Analyse & extraction en cours…'}
        </div>

        <p className="text-sm text-gray-500 text-center">
          Merci de patienter pendant que nous traitons votre dossier.
        </p>
      </div>
    </div>
  );
}
