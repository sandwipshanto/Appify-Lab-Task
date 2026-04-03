'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ general: data.error || 'Registration failed' });
        }
        return;
      }

      router.push('/feed');
    } catch {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  const errorMessage = errors.general || Object.values(errors)[0] || '';

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
          <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
            <div className="_social_registration_form_input _mar_b14">
              <label className="_social_registration_label _mar_b8" htmlFor="reg-firstName">First Name</label>
              <input
                type="text"
                id="reg-firstName"
                className="form-control _social_registration_input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoComplete="given-name"
              />
            </div>
          </div>
          <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
            <div className="_social_registration_form_input _mar_b14">
              <label className="_social_registration_label _mar_b8" htmlFor="reg-lastName">Last Name</label>
              <input
                type="text"
                id="reg-lastName"
                className="form-control _social_registration_input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                autoComplete="family-name"
              />
            </div>
          </div>
          <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
            <div className="_social_registration_form_input _mar_b14">
              <label className="_social_registration_label _mar_b8" htmlFor="reg-email">Email</label>
              <input
                type="email"
                id="reg-email"
                className="form-control _social_registration_input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>
          <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
            <div className="_social_registration_form_input _mar_b14">
              <label className="_social_registration_label _mar_b8" htmlFor="reg-password">Password</label>
              <input
                type="password"
                id="reg-password"
                className="form-control _social_registration_input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
            <div className="_social_registration_form_input _mar_b14">
              <label className="_social_registration_label _mar_b8" htmlFor="reg-repeatPassword">Repeat Password</label>
              <input
                type="password"
                id="reg-repeatPassword"
                className="form-control _social_registration_input"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
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
                {submitting ? 'Registering...' : 'Register now'}
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
