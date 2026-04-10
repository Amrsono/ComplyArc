'use client';

import { Shield, AlertTriangle, User, Building2, Globe, FileText, Activity, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const client = {
  id: '1', name: 'ABC Trading LLC', type: 'corporate', status: 'active',
  country: 'AE', industry: 'Trade Finance', email: 'contact@abctrading.ae',
  phone: '+971-4-123-4567', registration_number: 'DED-2019-45678',
  incorporation_country: 'AE', incorporation_date: '2019-03-12',
  risk_score: 4.2, risk_level: 'high',
};

const riskBreakdown = [
  { factor: 'Client', value: 5, fullMark: 5 },
  { factor: 'Geography', value: 4, fullMark: 5 },
  { factor: 'Product', value: 3, fullMark: 5 },
  { factor: 'Interface', value: 4, fullMark: 5 },
];

const riskFactors = {
  client: { score: 5, factors: ['1 sanctions match (OFAC — medium confidence)', '2 adverse media hits (fraud allegations)', 'Complex UBO structure (3 layers)'] },
  geography: { score: 4, factors: ['UAE — elevated corruption index', 'Near FATF grey-listed jurisdictions'] },
  product: { score: 3, factors: ['Trade finance — moderate inherent risk'] },
  interface: { score: 4, factors: ['Onboarded via intermediary', 'Remote/online onboarding'] },
};

const ubos = [
  { name: 'Mohammed Al-Farsi', ownership: 60, nationality: 'AE', pep: false, risk: false },
  { name: 'Diana Chen', ownership: 25, nationality: 'HK', pep: false, risk: true },
  { name: 'Viktor Petrov', ownership: 15, nationality: 'RU', pep: true, risk: true },
];

const screeningHistory = [
  { date: '2024-06-15', list: 'OFAC', matched: 'JOHN A. SMITH (Director)', score: 87, decision: 'pending' },
  { date: '2024-05-20', list: 'EU', matched: 'No matches', score: 0, decision: 'clear' },
  { date: '2024-04-10', list: 'PEP', matched: 'Viktor Petrov (UBO)', score: 92, decision: 'true_positive' },
];

const mediaHits = [
  { date: '2024-06', title: 'Financial irregularities investigation linked to UAE trade firms', source: 'Financial Times', severity: 'high', category: 'fraud' },
  { date: '2024-03', title: 'Customs violation report — ABC Trading', source: 'Reuters', severity: 'medium', category: 'corruption' },
];

export default function ClientProfilePage() {
  return (
    <div>
      <Link href="/clients" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        <ChevronLeft size={16} /> Back to Clients
      </Link>

      {/* Header */}
      <div className="glass-card animate-in" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 'var(--radius-lg)',
              background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Building2 size={28} color="var(--accent-primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em' }}>{client.name}</h2>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px', alignItems: 'center' }}>
                <span className="badge badge-active">● Active</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>🇦🇪 {client.country} · {client.industry}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Reg: {client.registration_number}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Risk Score</div>
              <div style={{
                fontSize: '32px', fontWeight: 800, color: 'var(--risk-high)',
                lineHeight: 1.1,
              }}>
                {client.risk_score}<span style={{ fontSize: '16px', color: 'var(--text-tertiary)' }}>/5</span>
              </div>
              <span className="badge badge-high" style={{ marginTop: '4px' }}>HIGH RISK</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Risk Radar */}
        <div className="glass-card animate-in animate-in-delay-1">
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Risk Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={riskBreakdown}>
              <PolarGrid stroke="rgba(148,163,184,0.1)" />
              <PolarAngleAxis dataKey="factor" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 5]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <Radar dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
          
          {/* Factor details */}
          <div style={{ marginTop: '16px' }}>
            {Object.entries(riskFactors).map(([key, data]) => (
              <div key={key} style={{ marginBottom: '12px', padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' }}>{key.replace('_', ' ')} Risk</span>
                  <span style={{
                    fontWeight: 700, fontSize: '14px',
                    color: data.score >= 4 ? 'var(--risk-high)' : data.score >= 3 ? 'var(--risk-medium)' : 'var(--risk-low)',
                  }}>{data.score}/5</span>
                </div>
                {data.factors.map((f, i) => (
                  <div key={i} style={{ fontSize: '11.5px', color: 'var(--text-secondary)', paddingLeft: '8px' }}>• {f}</div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* UBO Structure */}
          <div className="glass-card animate-in animate-in-delay-2">
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>UBO Structure</h3>
            {ubos.map((ubo, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)',
                marginBottom: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: ubo.risk ? 'var(--risk-high-bg)' : 'rgba(99,132,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <User size={16} color={ubo.risk ? 'var(--risk-high)' : 'var(--accent-primary)'} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{ubo.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{ubo.nationality}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {ubo.pep && <span className="badge badge-medium" style={{ fontSize: '10px', padding: '2px 6px' }}>PEP</span>}
                  {ubo.risk && <span className="badge badge-high" style={{ fontSize: '10px', padding: '2px 6px' }}>⚠ RISK</span>}
                  <div style={{
                    fontWeight: 700, fontSize: '16px',
                    minWidth: '50px', textAlign: 'right',
                  }}>{ubo.ownership}%</div>
                </div>
              </div>
            ))}
          </div>

          {/* Screening History */}
          <div className="glass-card animate-in animate-in-delay-3">
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Screening History</h3>
            {screeningHistory.map((sr, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', borderRadius: 'var(--radius-md)',
                borderLeft: `3px solid ${sr.score >= 80 ? 'var(--risk-high)' : sr.score > 0 ? 'var(--risk-medium)' : 'var(--risk-low)'}`,
                background: 'var(--bg-elevated)', marginBottom: '8px', fontSize: '13px',
              }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{sr.list}</span>
                  <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>{sr.matched}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {sr.score > 0 && <span style={{ fontWeight: 700, color: sr.score >= 80 ? 'var(--risk-high)' : 'var(--risk-medium)' }}>{sr.score}%</span>}
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{sr.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Adverse Media */}
      <div className="glass-card animate-in animate-in-delay-4" style={{ marginTop: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} color="var(--risk-medium)" /> Adverse Media
          <span className="badge badge-high" style={{ fontSize: '10px' }}>{mediaHits.length} hits</span>
        </h3>
        {mediaHits.map((hit, i) => (
          <div key={i} className="alert-item">
            <div className={`alert-dot ${hit.severity}`} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>{hit.title}</span>
                <span className={`badge badge-${hit.severity}`} style={{ fontSize: '10px' }}>{hit.category}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {hit.source} · {hit.date}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
