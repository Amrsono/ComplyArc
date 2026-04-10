'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, Search, Plus, Filter, ChevronRight, Building2, User } from 'lucide-react';

const demoClients = [
  { id: '1', name: 'ABC Trading LLC', type: 'corporate', status: 'active', country: 'AE', risk_score: 4.2, risk_level: 'high', pep_status: false, sanctions_hit: true, industry: 'Trade Finance', created_at: '2024-01-15' },
  { id: '2', name: 'Global Investments Corp', type: 'corporate', status: 'active', country: 'GB', risk_score: 2.8, risk_level: 'medium', pep_status: false, sanctions_hit: false, industry: 'Financial Services', created_at: '2024-02-20' },
  { id: '3', name: 'John Smith', type: 'individual', status: 'active', country: 'US', risk_score: 1.5, risk_level: 'low', pep_status: false, sanctions_hit: false, industry: null, created_at: '2024-03-10' },
  { id: '4', name: 'Maria Gonzalez', type: 'individual', status: 'pending', country: 'ES', risk_score: null, risk_level: null, pep_status: false, sanctions_hit: false, industry: null, created_at: '2024-04-01' },
  { id: '5', name: 'Dragon Holdings Ltd', type: 'corporate', status: 'active', country: 'HK', risk_score: 3.6, risk_level: 'medium', pep_status: false, sanctions_hit: false, industry: 'Holding Company', created_at: '2024-01-28' },
  { id: '6', name: 'Pacific Ventures KK', type: 'corporate', status: 'dormant', country: 'JP', risk_score: 2.1, risk_level: 'low', pep_status: false, sanctions_hit: false, industry: 'Venture Capital', created_at: '2023-11-05' },
  { id: '7', name: 'Sahara Mining Co', type: 'corporate', status: 'suspended', country: 'ZA', risk_score: 4.7, risk_level: 'high', pep_status: false, sanctions_hit: true, industry: 'Mining', created_at: '2023-09-15' },
  { id: '8', name: 'Ahmed Al-Rashid', type: 'individual', status: 'active', country: 'SA', risk_score: 3.9, risk_level: 'medium', pep_status: true, sanctions_hit: false, industry: null, created_at: '2024-02-14' },
];

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
    // Convert country code to flag emoji
    const flag = code.toUpperCase().split('').map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('');
    return flag;
  } catch { return '🌍'; }
}

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');

  const filtered = demoClients.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterRisk !== 'all' && c.risk_level !== filterRisk) return false;
    return true;
  });

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
            onChange={(e) => setSearch(e.target.value)}
            id="clients-search"
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select className="input" style={{ width: 'auto' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="dormant">Dormant</option>
            <option value="suspended">Suspended</option>
          </select>
          <select className="input" style={{ width: 'auto' }} value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)}>
            <option value="all">All Risk</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>
        </div>
      </div>

      {/* Table */}
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
            {filtered.map((client) => (
              <tr key={client.id} onClick={() => {}}>
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
                  <span style={{ fontSize: '13px' }}>{getCountryFlag(client.country)} {client.country}</span>
                </td>
                <td>{getStatusBadge(client.status)}</td>
                <td>{getRiskBadge(client.risk_level)}</td>
                <td>
                  <span style={{
                    fontWeight: 700,
                    color: client.risk_score && client.risk_score >= 4 ? 'var(--risk-high)' :
                           client.risk_score && client.risk_score >= 2.5 ? 'var(--risk-medium)' :
                           client.risk_score ? 'var(--risk-low)' : 'var(--text-tertiary)',
                  }}>
                    {client.risk_score ? `${client.risk_score.toFixed(1)}/5` : '—'}
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

      {/* Pagination */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: '16px', fontSize: '13px', color: 'var(--text-secondary)',
      }}>
        <span>Showing {filtered.length} of {demoClients.length} clients</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn btn-secondary btn-sm" disabled>Previous</button>
          <button className="btn btn-primary btn-sm">1</button>
          <button className="btn btn-secondary btn-sm">2</button>
          <button className="btn btn-secondary btn-sm">Next</button>
        </div>
      </div>
    </div>
  );
}
