'use client';

import { useEffect } from 'react';
import { GrantDetails } from './GrantDetails';
import type { Application } from '@/lib/services/applications.service';

interface Props {
  application: Application;
  onClose: () => void;
  onUpdate: (data: Partial<Application>) => Promise<void>;
}

export function GrantDetailModal({ application, onClose, onUpdate }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <GrantDetails
            application={application}
            onUpdate={onUpdate}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}
