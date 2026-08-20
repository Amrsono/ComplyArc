'use client';

import React, { useState } from 'react';
import { Database, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import api from '@/lib/api';

export function DataSourcesSettings() {
  const { success, error: showError } = useToast();
  const [syncing, setSyncing] = useState(false);

  const handleSyncSanctions = async () => {
    setSyncing(true);
    try {
      await api.ingestSanctions();
      success('Global watchlists synchronization started in background.');
    } catch {
      showError('Failed to synchronize data. Check network status.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="glass-card">
      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Data Sources & Intelligence</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            padding: '16px',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-md)',
            borderLeft: '4px solid var(--accent-primary)',
          }}
        >
          <h4 style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
            Global Watchlists (OFAC, UN, EU, PEPs)
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Trigger a manual synchronization of the latest global intelligence data. This streams and ingests the
            newest records from the US Treasury, UN Security Council, and OpenSanctions Global databases into your local
            intelligence pool.
          </p>

          <button className="btn btn-primary" onClick={handleSyncSanctions} disabled={syncing}>
            {syncing ? (
              <>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} /> Initializing
                Sync...
              </>
            ) : (
              <>
                <Database size={14} style={{ marginRight: '8px' }} /> Sync Global Watchlists
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
