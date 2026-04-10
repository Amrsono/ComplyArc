'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Building2, ArrowRight, ArrowLeft, CheckCircle, Shield, Upload, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

const steps = ['Entity Type', 'Details', 'Documents', 'Review & Submit'];

export default function NewClientPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<any>({
    type: null,
    name: '', first_name: '', last_name: '',
    date_of_birth: '', nationality: '', id_type: 'Passport', id_number: '',
    email: '', phone: '', address: '',
    registration_number: '', country: '', incorporation_date: '',
    industry: 'Financial Services',
  });

  const update = (key: string, val: string) => setForm((f: any) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload: any = {
        type: form.type,
        name: form.type === 'individual' ? `${form.first_name} ${form.last_name}`.trim() : form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        country: form.nationality || form.country,
        nationality: form.nationality,
        date_of_birth: form.date_of_birth || undefined,
        id_number: form.id_number || undefined,
        registration_number: form.registration_number || undefined,
        industry: form.type === 'corporate' ? form.industry : undefined,
        incorporation_date: form.incorporation_date || undefined,
      };

      const client = await api.createClient(payload);
      success('Client created successfully!');

      // Try to calculate risk
      try {
        await api.calculateRisk(client.id);
      } catch { /* risk calc is optional */ }

      router.push(`/clients/${client.id}`);
    } catch (err: any) {
      showError(err.message || 'Failed to create client');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header animate-in">
        <h2>New Client Onboarding</h2>
        <p>KYC onboarding wizard — verify and onboard new clients</p>
      </div>

      {/* Stepper */}
      <div className="glass-card glass-card-sm animate-in animate-in-delay-1" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {steps.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700,
                background: i < step ? 'var(--risk-low)' : i === step ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                color: i <= step ? 'white' : 'var(--text-tertiary)', transition: 'all 0.3s',
              }}>
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span style={{ fontSize: '12px', fontWeight: i === step ? 600 : 400, color: i <= step ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{s}</span>
              {i < steps.length - 1 && (
                <div style={{ width: '40px', height: '2px', background: i < step ? 'var(--risk-low)' : 'var(--border-secondary)', margin: '0 4px' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="glass-card animate-in animate-in-delay-2">
        {step === 0 && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Select Entity Type</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '600px' }}>
              {[
                { type: 'individual' as const, icon: User, label: 'Individual', desc: 'Natural person — passport, ID verification' },
                { type: 'corporate' as const, icon: Building2, label: 'Corporate', desc: 'Legal entity — registration docs, UBO structure' },
              ].map(opt => (
                <div key={opt.type} onClick={() => update('type', opt.type)} style={{
                  padding: '24px', borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                  border: `2px solid ${form.type === opt.type ? 'var(--accent-primary)' : 'var(--border-secondary)'}`,
                  background: form.type === opt.type ? 'rgba(59,130,246,0.06)' : 'var(--bg-elevated)',
                  transition: 'all 0.2s', textAlign: 'center',
                }}>
                  <opt.icon size={32} color={form.type === opt.type ? 'var(--accent-primary)' : 'var(--text-secondary)'} style={{ marginBottom: '12px' }} />
                  <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{opt.label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {form.type === 'corporate' ? 'Corporate Details' : 'Individual Details'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '700px' }}>
              {form.type === 'individual' ? (
                <>
                  <div className="input-group"><label>First Name</label><input className="input" value={form.first_name} onChange={e => update('first_name', e.target.value)} placeholder="John" /></div>
                  <div className="input-group"><label>Last Name</label><input className="input" value={form.last_name} onChange={e => update('last_name', e.target.value)} placeholder="Smith" /></div>
                  <div className="input-group"><label>Date of Birth</label><input className="input" type="date" value={form.date_of_birth} onChange={e => update('date_of_birth', e.target.value)} /></div>
                  <div className="input-group"><label>Nationality</label><input className="input" value={form.nationality} onChange={e => update('nationality', e.target.value)} placeholder="US" /></div>
                  <div className="input-group"><label>ID Number</label><input className="input" value={form.id_number} onChange={e => update('id_number', e.target.value)} placeholder="A12345678" /></div>
                  <div className="input-group"><label>Email</label><input className="input" type="email" value={form.email} onChange={e => update('email', e.target.value)} /></div>
                </>
              ) : (
                <>
                  <div className="input-group"><label>Company Name</label><input className="input" value={form.name} onChange={e => update('name', e.target.value)} placeholder="ABC Trading LLC" /></div>
                  <div className="input-group"><label>Registration Number</label><input className="input" value={form.registration_number} onChange={e => update('registration_number', e.target.value)} /></div>
                  <div className="input-group"><label>Country</label><input className="input" value={form.country} onChange={e => update('country', e.target.value)} placeholder="AE" /></div>
                  <div className="input-group"><label>Industry</label>
                    <select className="input" value={form.industry} onChange={e => update('industry', e.target.value)}>
                      <option>Financial Services</option><option>Trade Finance</option><option>Real Estate</option><option>Technology</option><option>Mining</option>
                    </select>
                  </div>
                  <div className="input-group"><label>Email</label><input className="input" type="email" value={form.email} onChange={e => update('email', e.target.value)} /></div>
                  <div className="input-group"><label>Phone</label><input className="input" value={form.phone} onChange={e => update('phone', e.target.value)} /></div>
                </>
              )}
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label>Address</label><input className="input" value={form.address} onChange={e => update('address', e.target.value)} placeholder="Full address" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Document Upload</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '600px' }}>
              {['Passport / ID', 'Proof of Address', 'Certificate of Incorporation', 'Board Resolution'].map(doc => (
                <div key={doc} style={{
                  padding: '24px', borderRadius: 'var(--radius-md)', textAlign: 'center',
                  border: '2px dashed var(--border-secondary)', cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  <Upload size={24} color="var(--text-tertiary)" style={{ marginBottom: '8px' }} />
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{doc}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>PDF, JPG, PNG (max 10MB)</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <CheckCircle size={56} color="var(--risk-low)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Ready to Submit</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 24px' }}>
              Review all information and submit for KYC approval. The client profile will be created with an initial risk assessment.
            </p>
            <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</> : <><CheckCircle size={18} /> Submit & Create Client</>}
            </button>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--border-primary)' }}>
          <button className="btn btn-secondary" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            <ArrowLeft size={16} /> Previous
          </button>
          {step < 3 && (
            <button className="btn btn-primary" onClick={() => setStep(Math.min(steps.length - 1, step + 1))} disabled={step === 0 && !form.type}>
              Next Step <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
