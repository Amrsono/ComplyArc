'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Shield, AlertTriangle, User, Building2, ChevronLeft, Loader2, Search, Activity } from 'lucide-react';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import api from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

export default function ClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { success, error: showError } = useToast();
  const clientId = params.id as string;

  const [client, setClient] = useState<any>(null);
  const [risk, setRisk] = useState<any>(null);
  const [ubos, setUbos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [c, u] = await Promise.all([
          api.getClient(clientId),
          api.getUBOs(clientId).catch(() => []),
        ]);
        setClient(c);
        setUbos(u || []);
        // Try to get risk score
        try {
          const r = await api.getClientRisk(clientId);
          setRisk(r);
        } catch { /* no risk score yet */ }
      } catch (err: any) {
        showError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [clientId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
        <AlertTriangle size={40} style={{ color: 'var(--risk-medium)', marginBottom: '12px' }} />
        <h3>Client not found</h3>
        <Link href="/clients" className="btn btn-primary" style={{ marginTop: '16px' }}>Back to Clients</Link>
      </div>
    );
  }

  const riskBreakdown = risk?.breakdown ? [
    { factor: 'Client', value: risk.breakdown.client_risk?.score || 0, fullMark: 5 },
    { factor: 'Geography', value: risk.breakdown.geography_risk?.score || 0, fullMark: 5 },
    { factor: 'Product', value: risk.breakdown.product_risk?.score || 0, fullMark: 5 },
    { factor: 'Interface', value: risk.breakdown.interface_risk?.score || 0, fullMark: 5 },
  ] : [];

  const riskFactors = risk?.breakdown ? {
    client: { score: risk.breakdown.client_risk?.score || 0, factors: risk.breakdown.client_risk?.factors || [] },
    geography: { score: risk.breakdown.geography_risk?.score || 0, factors: risk.breakdown.geography_risk?.factors || [] },
    product: { score: risk.breakdown.product_risk?.score || 0, factors: risk.breakdown.product_risk?.factors || [] },
    interface: { score: risk.breakdown.interface_risk?.score || 0, factors: risk.breakdown.interface_risk?.factors || [] },
  } : null;

  const handleCalculateRisk = async () => {
    try {
      const r = await api.calculateRisk(clientId);
      setRisk(r);
      success('Risk score calculated');
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleScreenNow = () => {
    router.push(`/screening?q=${encodeURIComponent(client.name)}`);
  };

  const handleSuspend = async () => {
    try {
      await api.updateClient(clientId, { status: client.status === 'suspended' ? 'active' : 'suspended' });
      setClient({ ...client, status: client.status === 'suspended' ? 'active' : 'suspended' });
      success(`Client ${client.status === 'suspended' ? 'activated' : 'suspended'}`);
    } catch (err: any) {
      showError(err.message);
    }
  };

  const totalScore = risk?.total_score || client.risk_score_total || 0;
  const riskLevel = risk?.risk_level || client.risk_level || 'unscored';

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
              background: client.type === 'corporate' ? 'rgba(59,130,246,0.12)' : 'rgba(139,92,246,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {client.type === 'corporate' ? <Building2 size={28} color="var(--accent-primary)" /> : <User size={28} color="var(--accent-secondary)" />}
            </div>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em' }}>{client.name}</h2>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px', alignItems: 'center' }}>
                <span className={`badge badge-${client.status || 'pending'}`}>● {(client.status || 'Pending').charAt(0).toUpperCase() + (client.status || 'pending').slice(1)}</span>
                {client.country && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{client.country} · {client.industry || client.type}</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleScreenNow}>
              <Search size={14} /> Screen Now
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleCalculateRisk}>
              <Activity size={14} /> Calculate Risk
            </button>
            <button className={`btn btn-sm ${client.status === 'suspended' ? 'btn-primary' : 'btn-danger'}`} onClick={handleSuspend}>
              {client.status === 'suspended' ? 'Activate' : 'Suspend'}
            </button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Risk Score</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: totalScore >= 4 ? 'var(--risk-high)' : totalScore >= 2.5 ? 'var(--risk-medium)' : 'var(--risk-low)', lineHeight: 1.1 }}>
                {totalScore ? totalScore.toFixed(1) : '—'}<span style={{ fontSize: '16px', color: 'var(--text-tertiary)' }}>/5</span>
              </div>
              {riskLevel !== 'unscored' && <span className={`badge badge-${riskLevel}`} style={{ marginTop: '4px' }}>{riskLevel.toUpperCase()}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Risk Radar */}
        <div className="glass-card animate-in animate-in-delay-1">
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Risk Breakdown</h3>
          {riskBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={riskBreakdown}>
                  <PolarGrid stroke="rgba(148,163,184,0.1)" />
                  <PolarAngleAxis dataKey="factor" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 5]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <Radar dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
              {riskFactors && (
                <div style={{ marginTop: '16px' }}>
                  {Object.entries(riskFactors).map(([key, data]) => (
                    <div key={key} style={{ marginBottom: '12px', padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' }}>{key.replace('_', ' ')} Risk</span>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: data.score >= 4 ? 'var(--risk-high)' : data.score >= 3 ? 'var(--risk-medium)' : 'var(--risk-low)' }}>{data.score}/5</span>
                      </div>
                      {data.factors.map((f: string, i: number) => (
                        <div key={i} style={{ fontSize: '11.5px', color: 'var(--text-secondary)', paddingLeft: '8px' }}>• {f}</div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              <p>No risk assessment yet</p>
              <button className="btn btn-primary btn-sm" onClick={handleCalculateRisk} style={{ marginTop: '12px' }}>
                Calculate Risk Score
              </button>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* UBO Structure */}
          <div className="glass-card animate-in animate-in-delay-2">
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>UBO Structure</h3>
            {ubos.length > 0 ? ubos.map((ubo: any, i: number) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)',
                marginBottom: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: ubo.risk_flag ? 'var(--risk-high-bg)' : 'rgba(99,132,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <User size={16} color={ubo.risk_flag ? 'var(--risk-high)' : 'var(--accent-primary)'} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{ubo.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{ubo.nationality || '—'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {ubo.risk_flag && <span className="badge badge-high" style={{ fontSize: '10px', padding: '2px 6px' }}>⚠ RISK</span>}
                  <div style={{ fontWeight: 700, fontSize: '16px', minWidth: '50px', textAlign: 'right' }}>{ubo.ownership_percent}%</div>
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                No UBO records
              </div>
            )}
          </div>

          {/* Client Info */}
          <div className="glass-card animate-in animate-in-delay-3">
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                ['Type', client.type],
                ['Country', client.country],
                ['Industry', client.industry],
                ['Email', client.email],
                ['Phone', client.phone],
                ['Status', client.status],
                ['Created', client.created_at ? new Date(client.created_at).toLocaleDateString() : '—'],
                ['ID', client.id?.slice(0, 8)],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginTop: '2px' }}>{val || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      {risk?.ai_summary && (
        <div className="glass-card animate-in animate-in-delay-4" style={{ marginTop: '20px', borderLeft: '3px solid var(--accent-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Shield size={16} color="var(--accent-primary)" />
            <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--accent-primary)' }}>AI Risk Summary</span>
          </div>
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{risk.ai_summary}</p>
        </div>
      )}

      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
