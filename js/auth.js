// ============================================================
// BUSINESS LOGIC: auth.js
// Handles authentication - login, logout, session validation.
// Depends on: data/users.js, data/session-store.js
// ============================================================

const GKAuth = (() => {

  function login(username, password) {
    const user = GK_USERS.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    if (!user) {
      return { success: false, error: "Invalid username or password. Try: diya / gurukul123" };
    }
    GKStore.saveCurrentUser(user.id);
    // Merge persisted profile data (XP, completedTopics) with base user
    const profile = GKStore.getUserProfile(user.id);
    const merged = { ...user, ...(profile || {}) };
    return { success: true, user: merged };
  }

  function logout() {
    GKStore.clearCurrentUser();
  }

  function getCurrentUser() {
    const userId = GKStore.getCurrentUserId();
    if (!userId) return null;
    const baseUser = GK_USERS.find(u => u.id === userId);
    if (!baseUser) return null;
    const profile = GKStore.getUserProfile(userId);
    return { ...baseUser, ...(profile || {}) };
  }

  function isLoggedIn() {
    return !!GKStore.getCurrentUserId();
  }

  function refreshUser() {
    return getCurrentUser();
  }

  return { login, logout, getCurrentUser, isLoggedIn, refreshUser };
})();
