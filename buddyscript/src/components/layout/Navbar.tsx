'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface NavbarProps {
  user: {
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-light _header_nav _padd_t10">
      <div className="container _custom_container">
        <div className="_logo_wrap">
          <a className="navbar-brand" href="/feed">
            <img src="/assets/images/logo.svg" alt="BuddyScript" className="_nav_logo" />
          </a>
        </div>
        <button
          className="navbar-toggler bg-light"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <div className="_header_form ms-auto">
            <form className="_header_form_grp" onSubmit={(e) => e.preventDefault()}>
              <svg className="_header_form_svg" xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="none" viewBox="0 0 17 17">
                <circle cx="7" cy="7" r="6" stroke="#666" />
                <path stroke="#666" strokeLinecap="round" d="M16 16l-3-3" />
              </svg>
              <input className="form-control me-2 _inpt1" type="search" placeholder="input search text" aria-label="Search" disabled />
            </form>
          </div>
          <ul className="navbar-nav mb-2 mb-lg-0 _header_nav_list ms-auto _mar_r8">
            <li className="nav-item _header_nav_item">
              <a className="nav-link _header_nav_link_active _header_nav_link" href="/feed">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="21" fill="none" viewBox="0 0 18 21">
                  <path className="_home_active" stroke="#000" strokeWidth="1.5" strokeOpacity=".6" d="M1 9.924c0-1.552 0-2.328.314-3.01.313-.682.902-1.187 2.08-2.196l1.143-.98C6.667 1.913 7.732 1 9 1c1.268 0 2.333.913 4.463 2.738l1.142.98c1.179 1.01 1.768 1.514 2.081 2.196.314.682.314 1.458.314 3.01v4.846c0 2.155 0 3.233-.67 3.902-.669.67-1.746.67-3.901.67H5.57c-2.155 0-3.232 0-3.902-.67C1 18.002 1 16.925 1 14.77V9.924z" />
                  <path className="_home_active" stroke="#000" strokeOpacity=".6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.857 19.341v-5.857a1 1 0 00-1-1H7.143a1 1 0 00-1 1v5.857" />
                </svg>
              </a>
            </li>
            <li className="nav-item _header_nav_item">
              <span className="nav-link _header_nav_link">
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="20" fill="none" viewBox="0 0 26 20">
                  <path fill="#000" fillOpacity=".6" fillRule="evenodd" d="M12.79 12.15h.429c2.268.015 7.45.243 7.45 3.732 0 3.466-5.002 3.692-7.415 3.707h-.894c-2.268-.015-7.452-.243-7.452-3.727 0-3.47 5.184-3.697 7.452-3.711l.297-.001h.132zm0 1.75c-2.792 0-6.12.34-6.12 1.962 0 1.585 3.13 1.955 5.864 1.976l.255.002c2.792 0 6.118-.34 6.118-1.958 0-1.638-3.326-1.982-6.118-1.982zM12.789 0c2.96 0 5.368 2.392 5.368 5.33 0 2.94-2.407 5.331-5.368 5.331h-.031a5.329 5.329 0 01-3.782-1.57 5.253 5.253 0 01-1.553-3.764C7.423 2.392 9.83 0 12.789 0zm0 1.75c-1.987 0-3.604 1.607-3.604 3.58a3.526 3.526 0 001.04 2.527 3.58 3.58 0 002.535 1.054l.03.875v-.875c1.987 0 3.605-1.605 3.605-3.58S14.777 1.75 12.789 1.75z" clipRule="evenodd" />
                </svg>
              </span>
            </li>
            <li className="nav-item _header_nav_item">
              <span className="nav-link _header_nav_link">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="22" fill="none" viewBox="0 0 20 22">
                  <path fill="#000" fillOpacity=".6" fillRule="evenodd" d="M9.527 0c4.58 0 7.657 3.543 7.657 6.85 0 1.702.436 2.424.899 3.19.457.754.976 1.612.976 3.233-.36 4.14-4.713 4.478-9.531 4.478-4.818 0-9.172-.337-9.528-4.413-.003-1.686.515-2.544.973-3.299l.161-.27c.398-.679.737-1.417.737-2.918C1.871 3.543 4.948 0 9.528 0zm0 1.535c-3.6 0-6.11 2.802-6.11 5.316 0 2.127-.595 3.11-1.12 3.978-.422.697-.755 1.247-.755 2.444.173 1.93 1.455 2.944 7.986 2.944 6.494 0 7.817-1.06 7.988-3.01-.003-1.13-.336-1.681-.757-2.378-.526-.868-1.12-1.851-1.12-3.978 0-2.514-2.51-5.316-6.111-5.316z" clipRule="evenodd" />
                </svg>
              </span>
            </li>
            <li className="nav-item _header_nav_item">
              <span className="nav-link _header_nav_link">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20">
                  <path fill="#000" fillOpacity=".6" fillRule="evenodd" d="M14.486 0c2.716 0 4.528 1.828 4.528 4.577v10.846c0 2.749-1.812 4.577-4.528 4.577H5.527C2.811 20 1 18.172 1 15.423V4.577C1 1.828 2.811 0 5.528 0h8.958zm0 1.5H5.527C3.71 1.5 2.5 2.764 2.5 4.577v10.846C2.5 17.236 3.71 18.5 5.528 18.5h8.958c1.818 0 3.028-1.264 3.028-3.077V4.577c0-1.813-1.21-3.077-3.028-3.077zM14.1 13.2c.414 0 .75.336.75.75s-.336.75-.75.75H5.908a.75.75 0 010-1.5H14.1zm0-4.25c.414 0 .75.336.75.75s-.336.75-.75.75H5.908a.75.75 0 010-1.5H14.1zm-5.188-4.24c.414 0 .75.335.75.75 0 .414-.336.75-.75.75H5.908a.75.75 0 010-1.5h3.004z" clipRule="evenodd" />
                </svg>
              </span>
            </li>
          </ul>
          <div className="_header_nav_profile">
            <div className="_header_nav_profile_image">
              <img
                src={user.avatar || '/assets/images/default_avatar.png'}
                alt="Profile"
                className="_nav_profile_img"
              />
            </div>
            <div className="_header_nav_dropdown">
              <p className="_header_nav_para">{user.firstName} {user.lastName}</p>
              <button
                className="_header_nav_dropdown_btn _dropdown_toggle"
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="6" fill="none" viewBox="0 0 10 6">
                  <path fill="#112032" d="M5 5l.354.354L5 5.707l-.354-.353L5 5zm4.354-3.646l-4 4-.708-.708 4-4 .708.708zm-4.708 4l-4-4 .708-.708 4 4-.708.708z" />
                </svg>
              </button>
            </div>
            <div className={`_nav_profile_dropdown _profile_dropdown${dropdownOpen ? ' show' : ''}`}>
                <div className="_nav_profile_dropdown_info">
                  <div className="_nav_profile_dropdown_image">
                    <img
                      src={user.avatar || '/assets/images/default_avatar.png'}
                      alt="Profile"
                      className="_nav_drop_img"
                    />
                  </div>
                  <div className="_nav_profile_dropdown_info_txt">
                    <h4 className="_nav_dropdown_title">{user.firstName} {user.lastName}</h4>
                  </div>
                </div>
                <hr />
                <ul className="_nav_dropdown_list">
                  <li className="_nav_dropdown_list_item">
                    <button className="_nav_dropdown_link" onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', padding: '8px 0' }}>
                      <div className="_nav_drop_info">
                        <span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" fill="none" viewBox="0 0 19 19">
                            <path stroke="#377DFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6.667 18H2.889A1.889 1.889 0 011 16.111V2.89A1.889 1.889 0 012.889 1h3.778M13.277 14.222L18 9.5l-4.723-4.722M18 9.5H6.667" />
                          </svg>
                        </span>
                        Log Out
                      </div>
                    </button>
                  </li>
                </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
