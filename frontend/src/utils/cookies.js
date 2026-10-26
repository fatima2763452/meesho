// Utility functions for managing browser cookies with iOS Safari compatibility

export const setCookie = (name, value, days = 30) => {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = '; expires=' + date.toUTCString();
  }
  const maxAge = days ? `; max-age=${days * 24 * 60 * 60}` : '';
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const secureFlag = isSecure ? '; Secure' : '';
  
  // Set for root path with SameSite=Lax
  document.cookie = `${name}=${encodeURIComponent(value || '')}${expires}${maxAge}; path=/${secureFlag}; SameSite=Lax`;
};

export const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      try {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      } catch (e) {
        return c.substring(nameEQ.length, c.length);
      }
    }
  }
  return null;
};

export const deleteCookie = (name) => {
  if (typeof document === 'undefined') return;
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const secureFlag = isSecure ? '; Secure' : '';
  
  // Set both expires in the past and max-age=0 for iOS Safari WebKit compatibility
  document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT${secureFlag}; SameSite=Lax`;
  
  if (typeof window !== 'undefined' && window.location.hostname) {
    document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${window.location.hostname}${secureFlag}; SameSite=Lax`;
  }
};

export const clearAllAuthData = () => {
  deleteCookie('token');
  deleteCookie('userInfo');
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userInfo');
  } catch (e) {
    // ignore
  }
};
