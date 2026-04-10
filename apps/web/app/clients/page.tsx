'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Search, Plus, ChevronRight, Building2, User, Loader2, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';

function getRiskBadge(level: string | null) {
  if (!level) return <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-tertiary)', border: '1px solid var(--border-secondary)' }}>Unscored</span>;
  const cls = `badge badge-${level}`;
  return <span className={cls}>{level.toUpperCase()}</span>;
}

function getStatusBadge(status: string) {
  return <span className={`badge badge-${status}`}>● {status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

function getCountryFlag(code: string) {
  try {
    const flag = code.toUpperCase().split('').map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('');
    return flag;
  } catch { return '🌍'; }
}

export default function ClientsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page: String(page), page_size: '20' };
      if (search) params.search = search;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterRisk !== 'all') params.risk_level = filterRisk;
      const result = await api.listClients(params);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterRisk]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  // Debounce search
  const [searchTimer, setSearchTimer] = useState<any>(null);
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimer) clearTimeout(searchTimer);
    setSearchTimer(setTimeout(() => setPage(1), 400));
  };

  const clients = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="page-header animate-in">
        <div className="page-header-row">
          <div>
            <h2>Clients</h2>
            <p>Manage your KYC client portfolio</p>
          </div>
          <Link href="/clients/new" className="btn btn-primary" id="new-client-btn">
            <Plus size={16} /> New Client
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card glass-card-sm animate-in animate-in-delay-1" style={{
        display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap',
      }}>
        <div className="search-wrapper" style={{ flex: 1, minWidth: '250px' }}>
          <Search className="search-icon" size={18} />
          <input
            className="search-input"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            id="clients-search"
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select className="input" style={{ width: 'auto' }} value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="dormant">Dormant</option>
            <option value="suspended">Suspended</option>
          </select>
          <select className="input" style={{ width: 'auto' }} value={filterRisk} onChange={(e) => { setFilterRisk(e.target.value); setPage(1); }}>
            <option value="all">All Risk</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
        </div>
      ) : (
        <div className="glass-card animate-in animate-in-delay-2" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Type</th>
                <th>Country</th>
                <th>Status</th>
                <th>Risk</th>
                <th>Score</th>
                <th>Flags</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No clients found</td></tr>
              ) : clients.map((client: any) => (
                <tr key={client.id} onClick={() => router.push(`/clients/${client.id}`)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 'var(--radius-md)',
                        background: client.type === 'corporate' ? 'rgba(59,130,246,0.12)' : 'rgba(139,92,246,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {client.type === 'corporate' ? <Building2 size={16} color="var(--accent-primary)" /> : <User size={16} color="var(--accent-secondary)" />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{client.name}</div>
                        {client.industry && <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{client.industry}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                    {client.type}
                  </td>
                  <td>
                    <span style={{ fontSize: '13px' }}>{client.country ? `${getCountryFlag(client.country)} ${client.country}` : '—'}</span>
                  </td>
                  <td>{getStatusBadge(client.status || 'pending')}</td>
                  <td>{getRiskBadge(client.risk_level)}</td>
                  <td>
                    <span style={{
                      fontWeight: 700,
                      color: client.risk_score_total && client.risk_score_total >= 4 ? 'var(--risk-high)' :
                             client.risk_score_total && client.risk_score_total >= 2.5 ? 'var(--risk-medium)' :
                             client.risk_score_total ? 'var(--risk-low)' : 'var(--text-tertiary)',
                    }}>
                      {client.risk_score_total ? `${client.risk_score_total.toFixed(1)}/5` : '—'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {client.pep_status && (
                        <span className="badge badge-medium" style={{ fontSize: '10px', padding: '2px 6px' }}>PEP</span>
                      )}
                      {client.sanctions_hit && (
                        <span className="badge badge-high" style={{ fontSize: '10px', padding: '2px 6px' }}>⚠ SANCTIONS</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <ChevronRight size={16} color="var(--text-tertiary)" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: '16px', fontSize: '13px', color: 'var(--text-secondary)',
      }}>
        <span>Showing {clients.length} of {total} clients</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
            <button key={p} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      </div>

      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
