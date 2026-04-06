'use client';

import { useState, FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '@/components/ui/Spinner.css';

/* ── Inline validation helpers ── */
function validateField(name: string, value: string): string {
  switch (name) {
    case 'firstName':
      if (!value.trim()) return 'First name is required';
      if (value.trim().length > 50) return 'Max 50 characters';
      return '';
    case 'lastName':
      if (!value.trim()) return 'Last name is required';
      if (value.trim().length > 50) return 'Max 50 characters';
      return '';
    case 'email':
      if (!value.trim()) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Please enter a valid email';
      return '';
    case 'password':
      if (!value) return 'Password is required';
      if (value.length < 8) return 'At least 8 characters';
      if (value.length > 128) return 'Max 128 characters';
      if (!/[a-zA-Z]/.test(value) || !/[0-9]/.test(value))
        return 'Must contain a letter and a number';
      return '';
    default:
      return '';
  }
}

/* ── Password visibility toggle icon ── */
function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function RegisterForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  /* Mark field as touched + validate on blur */
  const handleBlur = useCallback((name: string, value: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors((prev) => {
      const next = { ...prev };
      if (err) next[name] = err;
      else delete next[name];
      return next;
    });
  }, []);

  /* Password match check */
  const passwordMismatch = repeatPassword.length > 0 && password !== repeatPassword;
  const passwordMatch = repeatPassword.length > 0 && password === repeatPassword;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    if (password !== repeatPassword) {
      setErrors({ repeatPassword: 'Passwords do not match' });
      return;
    }
    if (!agreed) {
      setErrors({ terms: 'You must agree to terms & conditions' });
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: window.location.origin },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ general: data.error || 'Registration failed' });
        }
        setSubmitting(false);
        return;
      }

      // Keep submitting=true while navigating so button doesn't flash back
      router.push('/feed');
    } catch {
      setErrors({ general: 'Network error. Please try again.' });
      setSubmitting(false);
    }
  }

  const errorMessage = errors.general || errors.terms || '';

  /* Styles for inline field hints */
  const hintStyle = (isError: boolean): React.CSSProperties => ({
    fontSize: '12px',
    marginTop: '4px',
    color: isError ? '#ff4d4f' : '#52c41a',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  });

  const inputBorderError: React.CSSProperties = {
    borderColor: '#ff4d4f',
    boxShadow: '0 0 0 2px rgba(255,77,79,0.08)',
  };

  return (
    <div className="_social_registration_content">
      <div className="_social_registration_right_logo _mar_b28">
        <img src="/assets/images/logo.svg" alt="Buddy Script" className="_right_logo" />
      </div>
      <p className="_social_registration_content_para _mar_b8">Get Started Now</p>
      <h4 className="_social_registration_content_title _titl4 _mar_b50">Registration</h4>
      <button type="button" className="_social_registration_content_btn _mar_b40" disabled>
        <img src="/assets/images/google.svg" alt="Google" className="_google_img" />
        <span>Register with google</span>
      </button>
      <div className="_social_registration_content_bottom_txt _mar_b40">
        <span>Or</span>
      </div>
      <form className="_social_registration_form" onSubmit={handleSubmit}>
        <div className="row">
          {/* First Name */}
          <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
            <div className="_social_registration_form_input _mar_b14">
              <label className="_social_registration_label _mar_b8" htmlFor="reg-firstName">First Name</label>
              <input
                type="text"
                id="reg-firstName"
                className="form-control _social_registration_input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onBlur={() => handleBlur('firstName', firstName)}
                required
                autoComplete="given-name"
                style={touched.firstName && errors.firstName ? inputBorderError : undefined}
              />
              {touched.firstName && errors.firstName && (
                <div style={hintStyle(true)}>
                  <span>✗</span> {errors.firstName}
                </div>
              )}
            </div>
          </div>

          {/* Last Name */}
          <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
            <div className="_social_registration_form_input _mar_b14">
              <label className="_social_registration_label _mar_b8" htmlFor="reg-lastName">Last Name</label>
              <input
                type="text"
                id="reg-lastName"
                className="form-control _social_registration_input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onBlur={() => handleBlur('lastName', lastName)}
                required
                autoComplete="family-name"
                style={touched.lastName && errors.lastName ? inputBorderError : undefined}
              />
              {touched.lastName && errors.lastName && (
                <div style={hintStyle(true)}>
                  <span>✗</span> {errors.lastName}
                </div>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
            <div className="_social_registration_form_input _mar_b14">
              <label className="_social_registration_label _mar_b8" htmlFor="reg-email">Email</label>
              <input
                type="email"
                id="reg-email"
                className="form-control _social_registration_input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur('email', email)}
                required
                autoComplete="email"
                style={touched.email && errors.email ? inputBorderError : undefined}
              />
              {touched.email && errors.email && (
                <div style={hintStyle(true)}>
                  <span>✗</span> {errors.email}
                </div>
              )}
            </div>
          </div>

          {/* Password */}
          <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
            <div className="_social_registration_form_input _mar_b14">
              <label className="_social_registration_label _mar_b8" htmlFor="reg-password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="reg-password"
                  className="form-control _social_registration_input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password', password)}
                  required
                  autoComplete="new-password"
                  style={{
                    paddingRight: '42px',
                    ...(touched.password && errors.password ? inputBorderError : {}),
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                    color: '#999', display: 'flex', alignItems: 'center',
                  }}
                >
                  <EyeIcon visible={showPassword} />
                </button>
              </div>
              {touched.password && errors.password && (
                <div style={hintStyle(true)}>
                  <span>✗</span> {errors.password}
                </div>
              )}
              {touched.password && !errors.password && password.length > 0 && (
                <div style={hintStyle(false)}>
                  <span>✓</span> Password looks good
                </div>
              )}
            </div>
          </div>

          {/* Repeat Password */}
          <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
            <div className="_social_registration_form_input _mar_b14">
              <label className="_social_registration_label _mar_b8" htmlFor="reg-repeatPassword">Repeat Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showRepeatPassword ? 'text' : 'password'}
                  id="reg-repeatPassword"
                  className="form-control _social_registration_input"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  style={{
                    paddingRight: '42px',
                    ...(passwordMismatch ? inputBorderError : {}),
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                  aria-label={showRepeatPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                    color: '#999', display: 'flex', alignItems: 'center',
                  }}
                >
                  <EyeIcon visible={showRepeatPassword} />
                </button>
              </div>
              {/* Real-time password match indicator */}
              {passwordMismatch && (
                <div style={hintStyle(true)}>
                  <span>✗</span> Passwords do not match
                </div>
              )}
              {passwordMatch && (
                <div style={hintStyle(false)}>
                  <span>✓</span> Passwords match
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-12 col-xl-12 col-md-12 col-sm-12">
            <div className="form-check _social_registration_form_check">
              <input
                className="form-check-input _social_registration_form_check_input"
                type="checkbox"
                id="agreeTerms"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <label className="form-check-label _social_registration_form_check_label" htmlFor="agreeTerms">
                I agree to terms &amp; conditions
              </label>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="row">
            <div className="col-12">
              <div className="alert alert-danger mt-2 mb-0 py-2" role="alert" aria-live="polite">
                {errorMessage}
              </div>
            </div>
          </div>
        )}

        <div className="row">
          <div className="col-lg-12 col-md-12 col-xl-12 col-sm-12">
            <div className="_social_registration_form_btn _mar_t40 _mar_b60">
              <button
                type="submit"
                className="_social_registration_form_btn_link _btn1"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="btn-spinner" />
                    Registering...
                  </>
                ) : (
                  'Register now'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
      <div className="row">
        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
          <div className="_social_registration_bottom_txt">
            <p className="_social_registration_bottom_txt_para">
              Already have an account? <Link href="/login">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
