const usersKey = 'users';
const authUserKey = 'authUser';

export default {
  async login(email, password) {
    // Simulate server check
    const users = JSON.parse(localStorage.getItem(usersKey)) || [];
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      throw new Error('Usuário ou senha inválidos');
    }
    localStorage.setItem(authUserKey, JSON.stringify(user));
  },

  async register(email, password) {
    const users = JSON.parse(localStorage.getItem(usersKey)) || [];
    if (users.find(u => u.email === email)) {
      throw new Error('Email já registrado');
    }
    users.push({ email, password });
    localStorage.setItem(usersKey, JSON.stringify(users));
  },

  logout() {
    localStorage.removeItem(authUserKey);
  },

  getAuthUser() {
    return JSON.parse(localStorage.getItem(authUserKey));
  },

  isAuthenticated() {
    return !!localStorage.getItem(authUserKey);
  }
};
