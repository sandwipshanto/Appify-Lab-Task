'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: window.location.origin },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Login failed');
        setSubmitting(false);
        return;
      }

      // Keep submitting=true while navigating so button doesn't flash back
      router.push('/feed');
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="_social_login_content">
      <div className="_social_login_left_logo _mar_b28">
        <img src="/assets/images/logo.svg" alt="Buddy Script" className="_left_logo" />
      </div>
      <p className="_social_login_content_para _mar_b8">Welcome back</p>
      <h4 className="_social_login_content_title _titl4 _mar_b50">Login to your account</h4>
      <button type="button" className="_social_login_content_btn _mar_b40" disabled>
        <img src="/assets/images/google.svg" alt="Google" className="_google_img" />
        <span>Or sign-in with google</span>
      </button>
      <div className="_social_login_content_bottom_txt _mar_b40">
        <span>Or</span>
      </div>
      <form className="_social_login_form" onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
            <div className="_social_login_form_input _mar_b14">
              <label className="_social_login_label _mar_b8" htmlFor="login-email">Email</label>
              <input
                type="email"
                id="login-email"
                className="form-control _social_login_input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>
          <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
            <div className="_social_login_form_input _mar_b14">
              <label className="_social_login_label _mar_b8" htmlFor="login-password">Password</label>
              <input
                type="password"
                id="login-password"
                className="form-control _social_login_input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-6 col-xl-6 col-md-6 col-sm-12">
            <div className="form-check _social_login_form_check">
              <input
                className="form-check-input _social_login_form_check_input"
                type="checkbox"
                id="rememberMe"
              />
              <label className="form-check-label _social_login_form_check_label" htmlFor="rememberMe">
                Remember me
              </label>
            </div>
          </div>
          <div className="col-lg-6 col-xl-6 col-md-6 col-sm-12">
            <div className="_social_login_form_left">
              <p className="_social_login_form_left_para">Forgot password?</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="row">
            <div className="col-12">
              <div className="alert alert-danger mt-2 mb-0 py-2" role="alert" aria-live="polite">
                {error}
              </div>
            </div>
          </div>
        )}

        <div className="row">
          <div className="col-lg-12 col-md-12 col-xl-12 col-sm-12">
            <div className="_social_login_form_btn _mar_t40 _mar_b60">
              <button
                type="submit"
                className="_social_login_form_btn_link _btn1"
                disabled={submitting}
              >
                {submitting ? 'Logging in...' : 'Login now'}
              </button>
            </div>
          </div>
        </div>
      </form>
      <div className="row">
        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
          <div className="_social_login_bottom_txt">
            <p className="_social_login_bottom_txt_para">
              Don&apos;t have an account? <Link href="/register">Create New Account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
