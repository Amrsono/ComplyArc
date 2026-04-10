'use client';

import { useState } from 'react';
import { User, Building2, ArrowRight, ArrowLeft, CheckCircle, Shield, Upload } from 'lucide-react';

const steps = ['Entity Type', 'Details', 'Documents', 'Screening', 'Risk Assessment', 'Review'];

export default function NewClientPage() {
  const [step, setStep] = useState(0);
  const [entityType, setEntityType] = useState<'individual' | 'corporate' | null>(null);

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
                color: i <= step ? 'white' : 'var(--text-tertiary)',
                transition: 'all 0.3s',
              }}>
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span style={{
                fontSize: '12px', fontWeight: i === step ? 600 : 400,
                color: i <= step ? 'var(--text-primary)' : 'var(--text-tertiary)',
              }}>{s}</span>
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
                <div key={opt.type} onClick={() => setEntityType(opt.type)} style={{
                  padding: '24px', borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                  border: `2px solid ${entityType === opt.type ? 'var(--accent-primary)' : 'var(--border-secondary)'}`,
                  background: entityType === opt.type ? 'rgba(59,130,246,0.06)' : 'var(--bg-elevated)',
                  transition: 'all 0.2s', textAlign: 'center',
                }}>
                  <opt.icon size={32} color={entityType === opt.type ? 'var(--accent-primary)' : 'var(--text-secondary)'} style={{ marginBottom: '12px' }} />
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
              {entityType === 'corporate' ? 'Corporate Details' : 'Individual Details'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '700px' }}>
              {entityType === 'individual' ? (
                <>
                  <div className="input-group"><label>First Name</label><input className="input" placeholder="John" /></div>
                  <div className="input-group"><label>Last Name</label><input className="input" placeholder="Smith" /></div>
                  <div className="input-group"><label>Date of Birth</label><input className="input" type="date" /></div>
                  <div className="input-group"><label>Nationality</label><input className="input" placeholder="US" /></div>
                  <div className="input-group"><label>ID Type</label><select className="input"><option>Passport</option><option>National ID</option><option>Driver License</option></select></div>
                  <div className="input-group"><label>ID Number</label><input className="input" placeholder="A12345678" /></div>
                  <div className="input-group"><label>Email</label><input className="input" type="email" placeholder="john@email.com" /></div>
                  <div className="input-group"><label>Phone</label><input className="input" placeholder="+1-xxx-xxx" /></div>
                </>
              ) : (
                <>
                  <div className="input-group"><label>Company Name</label><input className="input" placeholder="ABC Trading LLC" /></div>
                  <div className="input-group"><label>Registration Number</label><input className="input" placeholder="DED-2024-12345" /></div>
                  <div className="input-group"><label>Country of Incorporation</label><input className="input" placeholder="AE" /></div>
                  <div className="input-group"><label>Date of Incorporation</label><input className="input" type="date" /></div>
                  <div className="input-group"><label>Industry</label><select className="input"><option>Financial Services</option><option>Trade Finance</option><option>Real Estate</option><option>Technology</option><option>Mining</option></select></div>
                  <div className="input-group"><label>Contact Email</label><input className="input" type="email" /></div>
                </>
              )}
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label>Address</label>
                <input className="input" placeholder="Full address" />
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
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Automated Screening</h3>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Shield size={48} color="var(--accent-primary)" style={{ marginBottom: '16px' }} />
              <p style={{ fontSize: '15px', fontWeight: 500, marginBottom: '8px' }}>Screening against all watchlists...</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>OFAC · EU · UN · UK · PEP Database</p>
              <div style={{ marginTop: '20px', maxWidth: '300px', margin: '20px auto 0' }}>
                <div className="confidence-bar" style={{ height: '8px' }}>
                  <div className="confidence-bar-fill low" style={{ width: '75%', transition: 'width 2s ease' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Risk Assessment</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '700px' }}>
              <div className="input-group">
                <label>Product Type</label>
                <select className="input">
                  <option>Advisory</option><option>Trade Finance</option><option>Private Banking</option>
                  <option>Trust Services</option><option>Securities</option><option>Cash Services</option>
                </select>
              </div>
              <div className="input-group">
                <label>Interface Type</label>
                <select className="input"><option>Direct</option><option>Intermediary</option></select>
              </div>
              <div className="input-group">
                <label>Onboarding Channel</label>
                <select className="input"><option>Face to Face</option><option>Remote / Online</option></select>
              </div>
              <div className="input-group">
                <label>Source of Funds</label>
                <input className="input" placeholder="Description of fund source" />
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <CheckCircle size={56} color="var(--risk-low)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Ready to Submit</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 24px' }}>
              Review all information and submit for KYC approval. The client profile will be created
              with an initial risk assessment.
            </p>
            <button className="btn btn-primary btn-lg">
              <CheckCircle size={18} /> Submit & Create Client
            </button>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--border-primary)' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
          >
            <ArrowLeft size={16} /> Previous
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
            disabled={step === steps.length - 1 || (step === 0 && !entityType)}
          >
            Next Step <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
