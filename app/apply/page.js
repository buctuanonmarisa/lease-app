'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopNav from '@/components/layout/TopNav';
import StepsBar from '@/components/layout/StepsBar';

const ID_TYPES = [
  "Driver's License",
  'Passport',
  'PhilSys ID',
  'SSS ID',
  'UMID',
  "Voter's ID",
  'PRC ID',
];

function required(val) {
  return !val || val.trim() === '' ? 'This field is required.' : '';
}

function validateEmail(val) {
  if (!val || val.trim() === '') return 'This field is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email address.';
  return '';
}

function validatePhone(val) {
  if (!val || val.trim() === '') return 'This field is required.';
  if (!/^[\d+\-\s()]{7,20}$/.test(val)) return 'Enter a valid phone number.';
  return '';
}

function validateIncome(val) {
  if (!val || val.trim() === '') return 'This field is required.';
  if (isNaN(Number(val)) || Number(val) <= 0) return 'Enter a valid monthly income.';
  return '';
}

export default function ApplyPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    idType: '',
    unit: '',
    monthlyRent: '',
    moveIn: '',
    monthlyIncome: '',
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [properties, setProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);

  useEffect(() => {
    fetch('/api/properties')
      .then((r) => r.json())
      .then((data) => setProperties(Array.isArray(data) ? data : []))
      .catch(() => setProperties([]))
      .finally(() => setPropertiesLoading(false));
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (submitted) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  function handlePropertyChange(e) {
    const selectedUnit = e.target.value;
    const property = properties.find((p) => p.unit === selectedUnit);
    setForm((prev) => ({
      ...prev,
      unit: selectedUnit,
      monthlyRent: property ? String(property.monthlyRent) : '',
    }));
    if (submitted) {
      setErrors((prev) => ({ ...prev, unit: '' }));
    }
  }

  function validate() {
    const e = {};
    e.firstName = required(form.firstName);
    e.lastName = required(form.lastName);
    e.email = validateEmail(form.email);
    e.phone = validatePhone(form.phone);
    e.dob = required(form.dob);
    e.idType = required(form.idType);
    e.unit = required(form.unit);
    e.moveIn = required(form.moveIn);
    e.monthlyIncome = validateIncome(form.monthlyIncome);
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate();
    const hasError = Object.values(errs).some(Boolean);
    if (hasError) {
      setErrors(errs);
      return;
    }
    sessionStorage.setItem('apply_form_data', JSON.stringify(form));
    router.push('/apply/documents');
  }

  const income = parseFloat(form.monthlyIncome) || 0;
  const rent = parseFloat(form.monthlyRent) || 0;
  const ratio = rent > 0 ? income / rent : 0;
  const showCallout = income > 0 && rent > 0;
  const calloutGreen = ratio >= 2.5;

  const selectedProperty = properties.find((p) => p.unit === form.unit) || null;

  // Group properties by type for the select optgroups
  const TYPES = ['Studio', '1-Bedroom', '2-Bedroom', '3-Bedroom', 'Penthouse'];
  const grouped = TYPES.reduce((acc, type) => {
    const group = properties.filter((p) => p.type === type);
    if (group.length) acc[type] = group;
    return acc;
  }, {});

  function field(name) {
    return {
      name,
      value: form[name],
      onChange: handleChange,
      className: `form-input${errors[name] ? ' error' : ''}`,
    };
  }

  return (
    <>
      <TopNav adminMode={false} />
      <StepsBar currentStep={1} />

      <div className="container">
        <h1 className="page-title">Rental Application</h1>
        <p className="page-sub">
          Complete all fields to proceed. All information is kept confidential and used solely for
          tenant screening purposes.
        </p>

        {showCallout && (
          <div className={`callout${calloutGreen ? ' green' : ' red'}`}>
            <span>💰</span>
            <span>
              Monthly Income: ₱{income.toLocaleString()}/mo ={' '}
              <strong>{ratio.toFixed(2)}×</strong> rent ratio{' '}
              {calloutGreen
                ? '— Meets the 2.5× minimum requirement ✓'
                : '— Below the 2.5× minimum requirement ✗'}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Personal Information */}
          <div className="form-section">
            <div className="form-section-title">Personal Information</div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  First Name <span className="required">*</span>
                </label>
                <input {...field('firstName')} type="text" placeholder="Juan" />
                <div className="form-error">{errors.firstName}</div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Last Name <span className="required">*</span>
                </label>
                <input {...field('lastName')} type="text" placeholder="dela Cruz" />
                <div className="form-error">{errors.lastName}</div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Email Address <span className="required">*</span>
                </label>
                <input {...field('email')} type="email" placeholder="juan@email.com" />
                <div className="form-error">{errors.email}</div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Phone Number <span className="required">*</span>
                </label>
                <input {...field('phone')} type="tel" placeholder="+63 917 000 0000" />
                <div className="form-error">{errors.phone}</div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Date of Birth <span className="required">*</span>
                </label>
                <input
                  {...field('dob')}
                  type="date"
                  className={`form-input${errors.dob ? ' error' : ''}`}
                />
                <div className="form-error">{errors.dob}</div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Government ID Type <span className="required">*</span>
                </label>
                <select
                  name="idType"
                  value={form.idType}
                  onChange={handleChange}
                  className={`form-select${errors.idType ? ' error' : ''}`}
                >
                  <option value="">— Select ID Type —</option>
                  {ID_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <div className="form-error">{errors.idType}</div>
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="form-section">
            <div className="form-section-title">Property Details</div>

            <div className="form-group">
              <label className="form-label">
                Select Unit <span className="required">*</span>
              </label>
              {propertiesLoading ? (
                <div
                  className="form-input"
                  style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                  Loading available units...
                </div>
              ) : (
                <select
                  name="unit"
                  value={form.unit}
                  onChange={handlePropertyChange}
                  className={`form-select${errors.unit ? ' error' : ''}`}
                >
                  <option value="">— Select a unit —</option>
                  {Object.entries(grouped).map(([type, units]) => (
                    <optgroup key={type} label={type}>
                      {units.map((p) => (
                        <option key={p.id} value={p.unit} disabled={!p.available}>
                          {p.unit}{!p.available ? ' — Unavailable' : ''}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              )}
              <div className="form-error">{errors.unit}</div>
            </div>

            {/* Property info card shown after a unit is selected */}
            {selectedProperty && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 10,
                  marginBottom: 14,
                  padding: '12px 14px',
                  background: selectedProperty.available ? 'var(--green-lt)' : 'var(--red-lt)',
                  border: `1.5px solid ${selectedProperty.available ? '#6ee7b7' : '#fca5a5'}`,
                }}
              >
                <div>
                  <div className="form-label">Type</div>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{selectedProperty.type}</div>
                </div>
                <div>
                  <div className="form-label">Floor</div>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>Floor {selectedProperty.floor}</div>
                </div>
                <div>
                  <div className="form-label">Availability</div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: selectedProperty.available ? 'var(--green)' : 'var(--red)',
                    }}
                  >
                    {selectedProperty.available ? '✓ Available' : '✗ Unavailable'}
                  </div>
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Monthly Rent (₱)</label>
                <div
                  className="form-input"
                  style={{
                    color: form.monthlyRent ? 'var(--ink)' : 'var(--muted)',
                    background: '#f9fafb',
                    cursor: 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>
                    {form.monthlyRent
                      ? `₱${parseFloat(form.monthlyRent).toLocaleString('en-PH')}`
                      : 'Auto-filled when unit is selected'}
                  </span>
                  {form.monthlyRent && (
                    <span style={{ fontSize: 9, color: 'var(--muted)' }}>per month</span>
                  )}
                </div>
                <div className="form-hint">Set by property — not editable.</div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Preferred Move-In Date <span className="required">*</span>
                </label>
                <input
                  {...field('moveIn')}
                  type="date"
                  className={`form-input${errors.moveIn ? ' error' : ''}`}
                />
                <div className="form-error">{errors.moveIn}</div>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="form-section">
            <div className="form-section-title">Financial Information</div>

            <div className="form-group">
              <label className="form-label">
                Gross Monthly Income (₱) <span className="required">*</span>
              </label>
              <input
                {...field('monthlyIncome')}
                type="number"
                min="0"
                placeholder="65000"
              />
              <div className="form-hint">
                Combined gross income before taxes. Minimum 2.5× monthly rent required.
              </div>
              <div className="form-error">{errors.monthlyIncome}</div>
            </div>
          </div>

          <p
            style={{
              fontSize: 10,
              color: 'var(--muted)',
              marginBottom: 14,
              borderTop: '1px dashed var(--border)',
              paddingTop: 14,
            }}
          >
            ₱5,000 non-refundable application fee charged on final submission.
          </p>

          <div className="btn-row">
            <button
              type="submit"
              className="btn primary"
              disabled={selectedProperty !== null && !selectedProperty?.available}
            >
              Save & Continue → Documents
            </button>
          </div>

          {selectedProperty && !selectedProperty.available && (
            <p style={{ fontSize: 10, color: 'var(--red)', marginTop: 8, textAlign: 'right' }}>
              This unit is currently unavailable. Please select a different unit to proceed.
            </p>
          )}
        </form>
      </div>
    </>
  );
}
