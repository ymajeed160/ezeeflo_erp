export const getToken = () => localStorage.getItem('accessToken');
export const getRefreshToken = () => localStorage.getItem('refreshToken');
export const getUser = () => {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
};
export const isAuthenticated = () => !!getToken();
export const isSuperAdmin = () => getUser()?.isSuperAdmin === true;

export const setAuth = ({ accessToken, refreshToken, user }) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};
