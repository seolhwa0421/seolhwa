// Seolhwa - 메인 JavaScript 파일

function updateYear() {
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
}

function setupNavigation() {
  const navLinks = document.querySelectorAll('nav a');

  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();

      if (window.clearPostRoute) {
        window.clearPostRoute(true);
      }

      // 링크 active 상태 관리
      navLinks.forEach((nav) => nav.classList.remove('active'));
      link.classList.add('active');

      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') {
        return;
      }

      const targetSection = document.querySelector(targetId);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

function setupThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  const html = document.documentElement;

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    html.classList.toggle('dark-mode', theme === 'dark');
    html.classList.toggle('dark', theme === 'dark');
    document.body.classList.toggle('dark-mode', theme === 'dark');
    document.body.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
    if (themeToggle) {
      themeToggle.checked = theme === 'dark';
    }
    console.log('[ThemeToggle] applied theme=', theme, {
      htmlDataset: html.dataset.theme,
      htmlClass: html.className,
      bodyClass: document.body.className,
      localStorage: localStorage.getItem('theme')
    });
  }

  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);

  if (!themeToggle) return;
  themeToggle.addEventListener('change', () => {
    const newTheme = themeToggle.checked ? 'dark' : 'light';
    applyTheme(newTheme);
  });
}

function setupGridInteraction() {
  const cards = document.querySelectorAll('.item');
  cards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-2px)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
    });

    const targetSelector = card.dataset.target;
    if (!targetSelector) {
      return;
    }

    const moveToSection = () => {
      const targetSection = document.querySelector(targetSelector);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    card.addEventListener('click', moveToSection);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        moveToSection();
      }
    });
  });
}

function setupPostWriter() {
  const postTitleInput = document.getElementById('post-title');
  const postSubtitleInput = document.getElementById('post-subtitle');
  const postInput = document.getElementById('user-post');
  const postImageInput = document.getElementById('post-image');
  const submitBtn = document.getElementById('post-submit');
  const postsList = document.getElementById('posts-list');
  const loginId = document.getElementById('login-id');
  const loginPassword = document.getElementById('login-password');
  const loginSubmit = document.getElementById('login-submit');
  const loginMessage = document.getElementById('login-message');
  const signupEmail = document.getElementById('signup-email');
  const signupId = document.getElementById('signup-id');
  const signupPassword = document.getElementById('signup-password');
  const signupSubmit = document.getElementById('signup-submit');
  const signupMessage = document.getElementById('signup-message');
  const authStatus = document.getElementById('auth-status');
  const logoutSubmit = document.getElementById('logout-submit');
  const openLoginButton = document.getElementById('open-login');
  const openSignupButton = document.getElementById('open-signup');
  const authModal = document.getElementById('auth-modal');
  const authCloseButton = document.getElementById('auth-close');
  const authDialogTitle = document.getElementById('auth-dialog-title');
  const authDialogCopy = document.getElementById('auth-dialog-copy');
  const loginPanel = document.getElementById('login-panel');
  const signupPanel = document.getElementById('signup-panel');
  const providerButtons = document.querySelectorAll('.auth-provider-button');
  const approvalStatusBox = document.getElementById('approval-status');
  const approvalAdminSection = document.getElementById('approval-admin');
  const approvalAdminStatus = document.getElementById('approval-admin-status');
  const approvalList = document.getElementById('approval-list');

  let currentUser = null;
  let currentPosts = [];
  const postsStorageKey = 'seolhwa-posts';
  const localAuthStorageKey = 'seolhwa-local-auth';
  const userProfilesStorageKey = 'seolhwa-user-profiles';
  let authObserverInitialized = false;
  let authMode = 'firebase';
  let approvalUnsubscribe = null;

  const ADMIN_ACCOUNT = {
    id: 'seolhwa0508',
    passwordHash: '2cf68f668b30b2d474189b1543c09c4e941423d2ece91d7cc1dbc71fe267f234'
  };

  function idToEmail(id) {
    const normalizedId = String(id || '').trim().toLowerCase();
    return `${normalizedId}@seolhwa.dev`;
  }

  function normalizeUserId(userId) {
    return String(userId || '').trim().toLowerCase();
  }

  function userToDisplayId(user) {
    if (!user) return null;
    if (user.displayName) return user.displayName;
    if (user.email) return user.email.split('@')[0];
    return null;
  }

  function isAdminUserId(userId) {
    return String(userId || '').trim().toLowerCase() === ADMIN_ACCOUNT.id;
  }

  function getAuthUnavailableMessage() {
    return '광고차단 또는 네트워크 차단으로 Firebase 인증을 사용할 수 없어 로컬 관리자 모드로 전환되었습니다.';
  }

  function providerLabel(providerName) {
    if (providerName === 'google') return '구글';
    if (providerName === 'github') return '깃허브';
    if (providerName === 'twitter') return '트위터(X)';
    return '제공업체';
  }

  function readUserProfiles() {
    try {
      const raw = localStorage.getItem(userProfilesStorageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      console.warn('[Auth] read user profiles error', error);
      return {};
    }
  }

  function writeUserProfiles(profiles) {
    try {
      localStorage.setItem(userProfilesStorageKey, JSON.stringify(profiles));
    } catch (error) {
      console.warn('[Auth] write user profiles error', error);
    }
  }

  function saveUserProfileCache(userId, email, extra = {}) {
    const normalizedId = normalizeUserId(userId);
    if (!normalizedId) return;

    const profiles = readUserProfiles();
    const existing = profiles[normalizedId] || {};
    profiles[normalizedId] = {
      ...existing,
      email: String(email || existing.email || '').trim(),
      userId: normalizedId,
      ...extra,
      updatedAt: new Date().toISOString()
    };
    writeUserProfiles(profiles);
  }

  function getCachedEmailById(userId) {
    const normalizedId = normalizeUserId(userId);
    if (!normalizedId) return '';
    const profiles = readUserProfiles();
    return profiles[normalizedId]?.email || '';
  }

  function getCachedProfileById(userId) {
    const normalizedId = normalizeUserId(userId);
    if (!normalizedId) return null;
    const profiles = readUserProfiles();
    return profiles[normalizedId] || null;
  }

  function setApprovalStatus(message = '', type = 'info') {
    if (!approvalStatusBox) return;

    approvalStatusBox.textContent = message;
    approvalStatusBox.style.display = message ? 'block' : 'none';
    approvalStatusBox.style.background = type === 'error'
      ? 'rgba(239,68,68,0.12)'
      : type === 'success'
        ? 'rgba(34,197,94,0.12)'
        : 'rgba(3,102,214,0.08)';
    approvalStatusBox.style.color = type === 'error'
      ? '#b91c1c'
      : type === 'success'
        ? '#166534'
        : 'var(--text)';
  }

  function setApprovalAdminStatus(message = '', type = 'info') {
    if (!approvalAdminStatus) return;

    approvalAdminStatus.textContent = message;
    approvalAdminStatus.style.background = type === 'error'
      ? 'rgba(239,68,68,0.12)'
      : type === 'success'
        ? 'rgba(34,197,94,0.12)'
        : 'rgba(3,102,214,0.08)';
    approvalAdminStatus.style.color = type === 'error'
      ? '#b91c1c'
      : type === 'success'
        ? '#166534'
        : 'var(--text)';
  }

  function toggleApprovalAdminSection(visible) {
    if (!approvalAdminSection) return;
    approvalAdminSection.classList.toggle('is-visible', visible);
  }

  function setAuthInputsDisabled(disabled) {
    if (loginId) loginId.disabled = disabled;
    if (loginPassword) loginPassword.disabled = disabled;
    if (loginSubmit) loginSubmit.disabled = disabled;
    if (signupId) signupId.disabled = disabled;
    if (signupPassword) signupPassword.disabled = disabled;
    if (signupSubmit) signupSubmit.disabled = disabled;
    if (signupEmail) signupEmail.disabled = disabled;
  }

  function stopApprovalListener() {
    if (typeof approvalUnsubscribe === 'function') {
      approvalUnsubscribe();
      approvalUnsubscribe = null;
    }

    if (approvalList) {
      approvalList.innerHTML = '';
    }
    toggleApprovalAdminSection(false);
  }

  function formatApprovalDate(value) {
    if (!value) return '시간 정보 없음';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '시간 정보 없음';
    return date.toLocaleString('ko-KR');
  }

  function renderApprovalQueue(profiles) {
    if (!approvalList) return;

    const pendingProfiles = profiles
      .filter((profile) => profile && profile.userId && profile.status === 'pending' && !isAdminUserId(profile.userId))
      .sort((left, right) => new Date(left.requestedAt || left.updatedAt || 0) - new Date(right.requestedAt || right.updatedAt || 0));

    if (!pendingProfiles.length) {
      approvalList.innerHTML = '<p class="approval-empty">현재 승인 대기 중인 가입 요청이 없습니다.</p>';
      setApprovalAdminStatus('새로운 승인 요청이 없습니다.', 'success');
      return;
    }

    approvalList.innerHTML = pendingProfiles.map((profile) => `
      <article class="approval-item">
        <div class="approval-item-header">
          <div>
            <h3 class="approval-item-title">${profile.userId}</h3>
            <p class="approval-item-meta">이메일: ${profile.email || '없음'}</p>
            <p class="approval-item-meta">가입 요청: ${formatApprovalDate(profile.requestedAt || profile.updatedAt)}</p>
            <p class="approval-item-meta">제공업체: ${profile.provider || 'password'}</p>
          </div>
          <div class="approval-item-actions">
            <button class="approval-action approve" type="button" data-approval-action="approve" data-user-id="${profile.userId}">승인</button>
            <button class="approval-action reject" type="button" data-approval-action="reject" data-user-id="${profile.userId}">거절</button>
          </div>
        </div>
      </article>
    `).join('');

    setApprovalAdminStatus(`승인 대기 ${pendingProfiles.length}건`, 'info');
  }

  async function getUserProfile(userId, options = {}) {
    const normalizedId = normalizeUserId(userId);
    if (!normalizedId) return null;

    if (!options.preferFresh) {
      const cachedProfile = getCachedProfileById(normalizedId);
      if (cachedProfile) {
        return cachedProfile;
      }
    }

    try {
      await waitForFirestore();
      if (window.doc && window.getDoc && window.db) {
        const snapshot = await window.getDoc(window.doc(window.db, 'userProfiles', normalizedId));
        if (snapshot.exists()) {
          const profile = snapshot.data() || {};
          saveUserProfileCache(normalizedId, profile.email || idToEmail(normalizedId), profile);
          return { userId: normalizedId, ...profile };
        }
      }
    } catch (error) {
      console.warn('[Auth] get user profile fallback', error);
    }

    return getCachedProfileById(normalizedId);
  }

  async function saveUserProfile(userId, email, extra = {}) {
    const normalizedId = normalizeUserId(userId);
    const profilePayload = {
      userId: normalizedId,
      email: String(email).trim(),
      ...extra,
      updatedAt: new Date().toISOString()
    };

    saveUserProfileCache(normalizedId, email, profilePayload);

    if (!window.doc || !window.setDoc || !window.db) {
      return;
    }

    try {
      await waitForFirestore();
      await window.setDoc(window.doc(window.db, 'userProfiles', normalizedId), profilePayload, { merge: true });
    } catch (error) {
      console.warn('[Auth] save user profile fallback to local cache', error);
    }
  }

  async function ensureApprovalProfile(user) {
    const userId = userToDisplayId(user) || normalizeUserId(user?.email?.split('@')[0]);
    if (!userId) {
      return null;
    }

    if (isAdminUserId(userId)) {
      return {
        userId,
        approved: true,
        status: 'approved',
        provider: user?.providerData?.[0]?.providerId || 'password'
      };
    }

    const existingProfile = await getUserProfile(userId, { preferFresh: true });
    if (existingProfile) {
      return existingProfile;
    }

    const email = user?.email || idToEmail(userId);
    const profile = {
      uid: user?.uid || '',
      approved: false,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      provider: user?.providerData?.[0]?.providerId || 'password'
    };

    await saveUserProfile(userId, email, profile);
    return { userId, email, ...profile };
  }

  async function updateApprovalState(userId, status) {
    const normalizedId = normalizeUserId(userId);
    const existingProfile = await getUserProfile(normalizedId, { preferFresh: true });
    const email = existingProfile?.email || getCachedEmailById(normalizedId) || idToEmail(normalizedId);
    const now = new Date().toISOString();

    if (status === 'approved') {
      await saveUserProfile(normalizedId, email, {
        approved: true,
        status: 'approved',
        approvedAt: now,
        approvedBy: ADMIN_ACCOUNT.id,
        rejectedAt: null,
        rejectedBy: null
      });
      return;
    }

    await saveUserProfile(normalizedId, email, {
      approved: false,
      status: 'rejected',
      rejectedAt: now,
      rejectedBy: ADMIN_ACCOUNT.id
    });
  }

  function applyPendingUser(userId, profile = {}) {
    currentUser = null;
    setPostFormEnabled(false);
    setAuthInputsDisabled(true);
    setProviderButtonsDisabled(true);
    if (openLoginButton) openLoginButton.style.display = 'none';
    if (openSignupButton) openSignupButton.style.display = 'none';
    if (logoutSubmit) logoutSubmit.style.display = 'inline-flex';
    toggleApprovalAdminSection(false);

    const isRejected = profile.status === 'rejected';
    const message = isRejected
      ? `${userId} 계정은 아직 승인되지 않았습니다. 관리자에게 문의 후 다시 로그인해주세요.`
      : `${userId} 계정은 관리자 승인 대기 중입니다. 승인 후 글 작성이 가능합니다.`;

    setApprovalStatus(message, isRejected ? 'error' : 'info');
    setAuthStatus(message, isRejected ? 'error' : 'info');
    closeAuthModal();
  }

  async function startApprovalListener() {
    if (authMode !== 'firebase') {
      setApprovalAdminStatus('로컬 관리자 모드에서는 승인 목록을 불러올 수 없습니다.', 'error');
      return;
    }

    toggleApprovalAdminSection(true);

    if (!window.onSnapshot || !window.collection || !window.db) {
      setApprovalAdminStatus('승인 목록을 불러올 수 없습니다.', 'error');
      return;
    }

    stopApprovalListener();
    toggleApprovalAdminSection(true);
    setApprovalAdminStatus('승인 요청 목록을 불러오는 중입니다.', 'info');

    approvalUnsubscribe = window.onSnapshot(window.collection(window.db, 'userProfiles'), (snapshot) => {
      const profiles = [];
      snapshot.forEach((docSnapshot) => {
        const profile = docSnapshot.data() || {};
        const normalizedId = normalizeUserId(profile.userId || docSnapshot.id);
        const mergedProfile = { userId: normalizedId, ...profile };
        profiles.push(mergedProfile);
        saveUserProfileCache(normalizedId, mergedProfile.email || idToEmail(normalizedId), mergedProfile);
      });
      renderApprovalQueue(profiles);
    }, (error) => {
      console.error('[Approval] listener error', error);
      setApprovalAdminStatus('승인 요청 목록을 불러오는 중 오류가 발생했습니다.', 'error');
    });
  }

  async function sha256(value) {
    const encoded = new TextEncoder().encode(String(value || ''));
    const buffer = await window.crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(buffer))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  function saveLocalAuthSession(userId) {
    try {
      localStorage.setItem(localAuthStorageKey, JSON.stringify({ userId }));
    } catch (error) {
      console.warn('[Auth] local session save error', error);
    }
  }

  function clearLocalAuthSession() {
    try {
      localStorage.removeItem(localAuthStorageKey);
    } catch (error) {
      console.warn('[Auth] local session clear error', error);
    }
  }

  async function waitForAuth() {
    if (window.firebaseAuthReadyPromise) {
      await window.firebaseAuthReadyPromise;
      return;
    }

    let attempts = 0;
    const maxAttempts = 12;
    while (!window.auth && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.auth) {
      throw new Error('Firebase Auth가 초기화되지 않았습니다.');
    }
  }

  async function waitForFirestore() {
    if (window.firebaseDataReadyPromise) {
      await window.firebaseDataReadyPromise;
      return;
    }

    if (window.firebaseReadyPromise) {
      await window.firebaseReadyPromise;
      return;
    }

    let attempts = 0;
    const maxAttempts = 20;
    while (!window.db && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.db) {
      throw new Error('Firebase DB가 초기화되지 않았습니다.');
    }
  }

  async function getEmailForLogin(userId) {
    const normalizedId = normalizeUserId(userId);
    if (!normalizedId) return '';

    if (normalizedId.includes('@')) {
      return normalizedId;
    }

    const cachedEmail = getCachedEmailById(normalizedId);
    if (cachedEmail) {
      return cachedEmail;
    }

    try {
      await waitForFirestore();
      if (window.doc && window.getDoc && window.db) {
        const snapshot = await window.getDoc(window.doc(window.db, 'userProfiles', normalizedId));
        if (snapshot.exists()) {
          const email = snapshot.data()?.email || '';
          if (email) {
            saveUserProfileCache(normalizedId, email);
            return email;
          }
        }
      }
    } catch (error) {
      console.warn('[Auth] get email by id fallback', error);
    }

    return idToEmail(normalizedId);
  }

  function restoreLocalAuthSession() {
    try {
      const raw = localStorage.getItem(localAuthStorageKey);
      if (!raw) return false;

      const session = JSON.parse(raw);
      if (!session || !isAdminUserId(session.userId)) {
        clearLocalAuthSession();
        return false;
      }

      applyAuthenticatedUser(session.userId, { isLocalFallback: true });
      return true;
    } catch (error) {
      console.warn('[Auth] local session restore error', error);
      clearLocalAuthSession();
      return false;
    }
  }

  function setAuthStatus(message, type = 'info') {
    if (!authStatus) return;
    authStatus.textContent = message;
    authStatus.style.display = message ? 'inline-flex' : 'none';
    authStatus.style.color = type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : 'var(--muted)';
  }

  function clearAuthMessages() {
    if (loginMessage) {
      loginMessage.style.color = '#db2777';
      loginMessage.textContent = '';
    }
    if (signupMessage) {
      signupMessage.style.color = '#db2777';
      signupMessage.textContent = '';
    }
  }

  function setProviderButtonsDisabled(disabled) {
    providerButtons.forEach((button) => {
      button.disabled = disabled;
      button.style.opacity = disabled ? '0.65' : '1';
      button.style.cursor = disabled ? 'not-allowed' : 'pointer';
    });
  }

  function buildProviderInstance(providerName) {
    if (providerName === 'google' && window.GoogleAuthProvider) {
      return new window.GoogleAuthProvider();
    }
    if (providerName === 'github' && window.GithubAuthProvider) {
      return new window.GithubAuthProvider();
    }
    if (providerName === 'twitter' && window.TwitterAuthProvider) {
      return new window.TwitterAuthProvider();
    }
    return null;
  }

  async function handleProviderAuth(providerName, mode = 'login') {
    const targetMessage = mode === 'signup' ? signupMessage : loginMessage;
    const label = providerLabel(providerName);

    clearAuthMessages();

    if (!targetMessage) {
      return;
    }

    if (authMode === 'local' || !window.auth || !window.signInWithPopup) {
      targetMessage.style.color = '#ef4444';
      targetMessage.textContent = '광고차단으로 Firebase가 막힌 상태에서는 소셜 로그인을 사용할 수 없습니다.';
      return;
    }

    const provider = buildProviderInstance(providerName);
    if (!provider) {
      targetMessage.style.color = '#ef4444';
      targetMessage.textContent = `${label} 제공업체를 불러오지 못했습니다.`;
      return;
    }

    try {
      setProviderButtonsDisabled(true);
      targetMessage.style.color = 'var(--muted)';
      targetMessage.textContent = `${label} 팝업을 여는 중입니다...`;

      const credential = await window.signInWithPopup(window.auth, provider);
      const user = credential.user;
      const displayId = userToDisplayId(user) || normalizeUserId(user?.email?.split('@')[0]) || label;
      const profile = await ensureApprovalProfile(user);

      if (user?.email) {
        saveUserProfileCache(displayId, user.email);
      }

      if (profile?.approved || profile?.status === 'approved' || isAdminUserId(displayId)) {
        targetMessage.style.color = '#22c55e';
        targetMessage.textContent = mode === 'signup'
          ? `${label} 계정으로 가입 및 로그인이 완료되었습니다.`
          : `${label} 계정으로 로그인되었습니다.`;
        applyAuthenticatedUser(displayId);
      } else {
        targetMessage.style.color = '#f59e0b';
        targetMessage.textContent = `${label} 계정은 관리자 승인 대기 중입니다.`;
        applyPendingUser(displayId, profile || {});
      }
    } catch (error) {
      console.error('[Auth] provider auth error', providerName, error);
      targetMessage.style.color = '#ef4444';

      if (error?.code === 'auth/account-exists-with-different-credential') {
        targetMessage.textContent = '이미 다른 방식으로 가입된 계정입니다. 기존 방식으로 로그인한 뒤 다시 시도해주세요.';
      } else if (error?.code === 'auth/popup-closed-by-user') {
        targetMessage.textContent = '팝업이 닫혀 로그인이 취소되었습니다.';
      } else if (error?.code === 'auth/unauthorized-domain') {
        targetMessage.textContent = 'Firebase 승인 도메인에 현재 주소를 추가해야 합니다.';
      } else {
        targetMessage.textContent = `${label} 로그인 중 오류가 발생했습니다.`;
      }
    } finally {
      setProviderButtonsDisabled(false);
    }
  }

  function openAuthModal(mode = 'login') {
    if (!authModal || !loginPanel || !signupPanel) return;

    const isLogin = mode === 'login';
    loginPanel.classList.toggle('is-active', isLogin);
    signupPanel.classList.toggle('is-active', !isLogin);

    if (authDialogTitle) {
      authDialogTitle.textContent = isLogin ? '로그인' : '회원가입';
    }
    if (authDialogCopy) {
      authDialogCopy.textContent = isLogin
        ? '아이디와 비밀번호로 로그인하세요.'
        : '이메일, 아이디, 비밀번호를 입력해 이메일/비밀번호 방식으로 가입합니다.';
    }

    clearAuthMessages();
    authModal.classList.add('is-open');
    authModal.setAttribute('aria-hidden', 'false');

    window.setTimeout(() => {
      const targetInput = isLogin ? loginId : (signupEmail || signupId);
      if (targetInput) {
        targetInput.focus();
      }
    }, 0);
  }

  function closeAuthModal() {
    if (!authModal) return;
    authModal.classList.remove('is-open');
    authModal.setAttribute('aria-hidden', 'true');
  }

  function applyAuthenticatedUser(userId, options = {}) {
    currentUser = userId;
    setPostFormEnabled(true);
    const adminLabel = isAdminUserId(userId) ? '관리자 ' : '';

    if (loginMessage) {
      loginMessage.style.color = '#22c55e';
      loginMessage.textContent = `${userId}님 환영합니다! 이제 글을 작성할 수 있습니다.`;
    }

    if (loginId) loginId.disabled = true;
    if (loginPassword) loginPassword.disabled = true;
    if (loginSubmit) loginSubmit.disabled = true;
    if (signupId) signupId.disabled = true;
    if (signupPassword) signupPassword.disabled = true;
    if (signupSubmit) signupSubmit.disabled = true;
    if (signupEmail) signupEmail.disabled = true;
    if (openLoginButton) openLoginButton.style.display = 'none';
    if (openSignupButton) openSignupButton.style.display = 'none';
    if (logoutSubmit) logoutSubmit.style.display = 'inline-flex';
    setProviderButtonsDisabled(true);
    if (signupMessage) signupMessage.textContent = '';
    if (loginId) loginId.value = '';
    if (loginPassword) loginPassword.value = '';
    if (signupId) signupId.value = '';
    if (signupPassword) signupPassword.value = '';
    if (signupEmail) signupEmail.value = '';

    if (options.isLocalFallback || authMode === 'local') {
      saveLocalAuthSession(userId);
    } else {
      clearLocalAuthSession();
    }

    setApprovalStatus('', 'info');
    setAuthStatus(`${userId} ${adminLabel}계정으로 로그인됨`.trim(), 'success');
    if (isAdminUserId(userId)) {
      startApprovalListener();
    } else {
      stopApprovalListener();
    }
    closeAuthModal();
  }

  function resetAuthUI() {
    currentUser = null;
    setPostFormEnabled(false);

    setAuthInputsDisabled(false);
    if (openLoginButton) openLoginButton.style.display = 'inline-flex';
    if (openSignupButton) openSignupButton.style.display = 'inline-flex';
    if (logoutSubmit) logoutSubmit.style.display = 'none';
    setProviderButtonsDisabled(false);
    setApprovalStatus('', 'info');
    stopApprovalListener();
  }

  async function handleLocalAdminLogin(id, password) {
    const normalizedId = String(id || '').trim().toLowerCase();
    const passwordHash = await sha256(password);

    if (normalizedId !== ADMIN_ACCOUNT.id || passwordHash !== ADMIN_ACCOUNT.passwordHash) {
      throw new Error('INVALID_ADMIN_CREDENTIALS');
    }

    authMode = 'local';
    applyAuthenticatedUser(ADMIN_ACCOUNT.id, { isLocalFallback: true });
    setAuthStatus(`${ADMIN_ACCOUNT.id} 관리자 계정으로 로컬 로그인됨`, 'success');
  }

  async function initializeAuth() {
    setAuthStatus('Firebase 인증 준비 중...', 'info');

    try {
      await waitForAuth();

      if (!window.auth || !window.onAuthStateChanged) {
        throw new Error('Firebase Auth 객체를 찾을 수 없습니다.');
      }

      if (authObserverInitialized) {
        return;
      }

      authObserverInitialized = true;
      authMode = 'firebase';
      window.onAuthStateChanged(window.auth, async (user) => {
        if (user) {
          const userId = userToDisplayId(user);
          const normalizedUserId = userId || normalizeUserId(user?.email?.split('@')[0]) || '익명';

          if (isAdminUserId(normalizedUserId)) {
            applyAuthenticatedUser(normalizedUserId);
            return;
          }

          const profile = await ensureApprovalProfile(user);
          if (profile?.approved || profile?.status === 'approved') {
            applyAuthenticatedUser(normalizedUserId);
          } else {
            applyPendingUser(normalizedUserId, profile || {});
          }
        } else {
          resetAuthUI();
          clearLocalAuthSession();
          setAuthStatus('로그인 후 글을 작성할 수 있습니다.', 'info');
        }
      });
    } catch (error) {
      console.error('[Auth] initializeAuth error', error);
      authMode = 'local';
      resetAuthUI();
      if (!restoreLocalAuthSession()) {
        setAuthStatus(getAuthUnavailableMessage(), 'info');
      }
    }
  }

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9가-힣]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48);
  }

  function normalizePost(post) {
    const createdAt = post.createdAt || new Date().toISOString();
    const timestamp = Number(new Date(createdAt)) || Date.now();
    const baseSlug = slugify(post.title || 'post') || 'post';
    const suffix = slugify(post.id || String(timestamp)).slice(0, 16);

    return {
      ...post,
      createdAt,
      slug: post.slug || `${baseSlug}-${timestamp}-${suffix}`
    };
  }

  function setCurrentPosts(posts) {
    currentPosts = posts.map(normalizePost);
  }

  function getCurrentPostSlug() {
    return new URL(window.location.href).searchParams.get('post');
  }

  function findPostBySlug(slug) {
    return currentPosts.find((post) => post.slug === slug) || null;
  }

  // Firebase 준비 상태 확인
  async function waitForFirebase() {
    await waitForFirestore();
  }

  // Firebase 연결 상태 표시
  const firebaseStatus = document.getElementById('firebase-status');

  function updateFirebaseStatus(message, type = 'info') {
    if (firebaseStatus) {
      firebaseStatus.textContent = message;
      firebaseStatus.style.display = 'block';
      firebaseStatus.style.background = type === 'success' ? 'rgba(34,197,94,0.1)' : type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)';
      firebaseStatus.style.color = type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : 'var(--accent)';
    }
  }

  // Firebase 연결 상태 확인
  async function checkFirebaseConnection() {
    updateFirebaseStatus('🔄 Firebase 연결 확인 중...');
    try {
      await waitForFirebase();
      console.log('[PostWriter] Firebase 연결 성공');
      updateFirebaseStatus('✅ 모든 기기에서 글 공유 가능', 'success');
      return true;
    } catch (e) {
      console.warn('[PostWriter] Firebase 연결 실패, localStorage 사용:', e.message);
      updateFirebaseStatus('⚠️ Firebase 연결 실패 - 광고차단이 켜져 있으면 현재 기기 로컬 모드로 동작합니다.', 'error');
      return false;
    }
  }

  async function loadSavedPosts() {
    try {
      await waitForFirebase();
      const q = window.query(window.collection(window.db, "posts"), window.orderBy("createdAt", "desc"));
      const querySnapshot = await window.getDocs(q);
      const posts = [];
      querySnapshot.forEach((doc) => {
        posts.push(normalizePost({ id: doc.id, ...doc.data() }));
      });
      return posts;
    } catch (e) {
      console.error('[PostWriter] loadSavedPosts error', e);
      // Firebase 실패시 localStorage 폴백
      try {
        const raw = localStorage.getItem(postsStorageKey);
        const posts = raw ? JSON.parse(raw) : [];
        return posts.map(normalizePost);
      } catch (localError) {
        console.error('[PostWriter] localStorage fallback error', localError);
        return [];
      }
    }
  }

  async function savePostToFirebase(post) {
    try {
      await waitForFirebase();
      const docRef = await window.addDoc(window.collection(window.db, "posts"), post);
      console.log('[PostWriter] Post saved to Firebase with ID:', docRef.id);
      return docRef.id;
    } catch (e) {
      console.error('[PostWriter] savePostToFirebase error', e);
      // Firebase 실패시 localStorage에 저장
      try {
        const existing = JSON.parse(localStorage.getItem(postsStorageKey) || '[]');
        existing.push(post);
        localStorage.setItem(postsStorageKey, JSON.stringify(existing));
        console.log('[PostWriter] Saved to localStorage as fallback');
      } catch (localError) {
        console.error('[PostWriter] localStorage fallback save error', localError);
      }
      return null;
    }
  }

  function showMainSections() {
    const sectionIds = ['auth', 'home', 'contact', 'approval-admin', 'post-write'];
    sectionIds.forEach((sectionId) => {
      const section = document.getElementById(sectionId);
      if (section) {
        section.style.display = '';
      }
    });

    if (detailView) {
      detailView.style.display = 'none';
    }
  }

  function clearPosts() {
    if (postsList) {
      postsList.innerHTML = '';
    }
  }

  async function renderSavedPosts() {
    if (!postsList) return;

    try {
      await waitForFirebase();

      // 실시간 리스너 설정
      const q = window.query(window.collection(window.db, "posts"), window.orderBy("createdAt", "desc"));
      window.onSnapshot(q, (querySnapshot) => {
        const posts = [];
        clearPosts();
        querySnapshot.forEach((doc) => {
          const post = normalizePost({ id: doc.id, ...doc.data() });
          posts.push(post);
          addPostToDOM(post, false);
        });
        setCurrentPosts(posts);
        syncViewFromRoute();
      });
    } catch (e) {
      console.error('[PostWriter] renderSavedPosts Firebase error', e);
      // Firebase 실패시 localStorage에서 로드
      try {
        const saved = JSON.parse(localStorage.getItem(postsStorageKey) || '[]');
        const sorted = saved
          .map(normalizePost)
          .slice()
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        clearPosts();
        setCurrentPosts(sorted);
        sorted.forEach((post) => {
          addPostToDOM(post, false);
        });
        syncViewFromRoute();
      } catch (localError) {
        console.error('[PostWriter] localStorage fallback render error', localError);
      }
    }
  }

  function addPostToDOM(post, prepend = true) {
    const subtitleText = post.subtitle && post.subtitle.trim() ? post.subtitle.trim() : '';

    const card = document.createElement('article');
    card.className = 'card post-preview-card';
    card.style.marginTop = '0.75rem';
    card.style.width = '100%';
    card.style.maxWidth = '100%';
    card.style.overflow = 'hidden';
    card.style.boxSizing = 'border-box';

    const titleText = post.title && post.title.trim() ? post.title.trim() : '제목 없음';
    const safeSubtitle = subtitleText || '부제목 없음';

    card.innerHTML = `
      <div class="post-preview-body">
        <h3 class="post-preview-title">${titleText}</h3>
        <p class="post-preview-subtitle">${safeSubtitle}</p>
      </div>
    `;

    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `${titleText} 게시물 열기`);
    card.addEventListener('click', () => {
      openDetail(post);
    });
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openDetail(post);
      }
    });

    if (prepend) {
      postsList.prepend(card);
    } else {
      postsList.appendChild(card);
    }
  }

  function setPostFormEnabled(enabled) {
    postTitleInput.disabled = !enabled;
    postSubtitleInput.disabled = !enabled;
    postInput.disabled = !enabled;
    postImageInput.disabled = !enabled;
    submitBtn.disabled = !enabled;

    // theme-driven form styles (dark/light)
    postTitleInput.style.background = '';
    postTitleInput.style.color = '';
    postSubtitleInput.style.background = '';
    postSubtitleInput.style.color = '';
    postInput.style.background = '';
    postInput.style.color = '';
    postImageInput.style.background = '';
    postImageInput.style.color = '';

    submitBtn.style.opacity = enabled ? '1' : '0.6';
    submitBtn.style.cursor = enabled ? 'pointer' : 'not-allowed';
  }

  const detailView = document.getElementById('post-detail-view');
  const detailBack = document.getElementById('detail-back');
  const detailTitle = document.getElementById('detail-title');
  const detailSubtitle = document.getElementById('detail-subtitle');
  const detailMeta = document.getElementById('detail-meta');
  const detailImageWrapper = document.getElementById('detail-image-wrapper');
  const detailContent = document.getElementById('detail-content');
  const detailEmpty = document.getElementById('detail-empty');

  function syncViewFromRoute() {
    const slug = getCurrentPostSlug();
    if (!slug) {
      showMainSections();
      return;
    }

    const post = findPostBySlug(slug);
    if (!post) {
      showMainSections();
      return;
    }

    renderDetail(post);
  }

  function setPostRoute(slug, replace = false) {
    const url = new URL(window.location.href);
    if (slug) {
      url.searchParams.set('post', slug);
    } else {
      url.searchParams.delete('post');
    }

    const state = slug ? { postSlug: slug } : {};
    window.history[replace ? 'replaceState' : 'pushState'](state, '', url);
  }

  function renderDetail(post) {
    showMainSections();
    if (!detailView) return;

    const sectionIds = ['auth', 'home', 'contact', 'approval-admin', 'post-write'];
    sectionIds.forEach((sectionId) => {
      const section = document.getElementById(sectionId);
      if (section) {
        section.style.display = 'none';
      }
    });

    detailTitle.textContent = post.title || '제목 없음';
    detailSubtitle.textContent = post.subtitle || '';
    detailSubtitle.style.display = post.subtitle ? 'block' : 'none';
    detailMeta.textContent = `${post.user || '익명'} • ${new Date(post.createdAt).toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric', weekday:'short' })}`;
    detailContent.innerHTML = (post.content || '').replace(/\n/g, '<br>');
    detailImageWrapper.innerHTML = post.imageDataUrl ? `<img src="${post.imageDataUrl}" alt="상세 이미지" style="max-width:100%; max-height:70vh; width:100%; object-fit:contain; border-radius:12px;" />` : '';

    if (detailEmpty) {
      detailEmpty.style.display = post.imageDataUrl || post.content ? 'none' : 'block';
    }

    detailView.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  const openDetail = (post, options = {}) => {
    const normalizedPost = normalizePost(post);
    const shouldReplace = options.replace === true;

    setPostRoute(normalizedPost.slug, shouldReplace);
    renderDetail(normalizedPost);
  };

  function clearPostRoute(replace = false) {
    setPostRoute('', replace);
    showMainSections();
  }

  window.clearPostRoute = clearPostRoute;
  window.addEventListener('popstate', syncViewFromRoute);

  if (detailBack) {
    detailBack.addEventListener('click', () => {
      clearPostRoute(false);
    });
  }

  const openLegacyDetail = (post) => {
    detailTitle.textContent = post.title || '제목 없음';
    detailSubtitle.textContent = post.subtitle || '';
    detailSubtitle.style.display = post.subtitle ? 'block' : 'none';
    detailMeta.textContent = `${post.user || '익명'} • ${new Date(post.createdAt).toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric', weekday:'short' })}`;
    detailContent.innerHTML = (post.content || '').replace(/\n/g, '<br>');

    detailImageWrapper.innerHTML = post.imageDataUrl ? `<img src="${post.imageDataUrl}" alt="상세 이미지" style="max-width:100%; max-height:100%; object-fit:contain; border-radius:8px;" />` : '';
  };

  async function addPost(content, imageDataUrl, user = currentUser, createdAt = null, shouldPersist = true, title = '', subtitle = '') {
    if (!content.trim() && !imageDataUrl && !title.trim() && !subtitle.trim()) return;

    const now = createdAt ? new Date(createdAt) : new Date();
    const titleText = title && title.trim() ? title.trim() : '제목 없음';
    const subtitleText = subtitle && subtitle.trim() ? subtitle.trim() : '';

    const postData = {
      user: user || '익명',
      title: titleText,
      subtitle: subtitleText,
      content,
      imageDataUrl,
      createdAt: now.toISOString()
    };

    const normalizedPost = normalizePost(postData);

    // DOM에 즉시 추가 (Firebase 저장 전에도 표시)
    currentPosts.unshift(normalizedPost);
    addPostToDOM(normalizedPost, true);

    if (shouldPersist) {
      await savePostToFirebase(normalizedPost);
    }
  }

  if (openLoginButton) {
    openLoginButton.addEventListener('click', () => {
      openAuthModal('login');
    });
  }

  if (openSignupButton) {
    openSignupButton.addEventListener('click', () => {
      openAuthModal('signup');
    });
  }

  if (authCloseButton) {
    authCloseButton.addEventListener('click', () => {
      closeAuthModal();
    });
  }

  if (authModal) {
    authModal.addEventListener('click', (event) => {
      if (event.target === authModal) {
        closeAuthModal();
      }
    });
  }

  providerButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const providerName = button.dataset.provider;
      const mode = button.dataset.authMode || 'login';
      handleProviderAuth(providerName, mode);
    });
  });

  if (approvalList) {
    approvalList.addEventListener('click', async (event) => {
      const actionButton = event.target.closest('[data-approval-action]');
      if (!actionButton || !currentUser || !isAdminUserId(currentUser)) {
        return;
      }

      const action = actionButton.dataset.approvalAction;
      const userId = actionButton.dataset.userId;
      if (!action || !userId) {
        return;
      }

      try {
        actionButton.disabled = true;
        setApprovalAdminStatus(`${userId} 계정을 처리하는 중입니다.`, 'info');
        await updateApprovalState(userId, action === 'approve' ? 'approved' : 'rejected');
        setApprovalAdminStatus(
          action === 'approve' ? `${userId} 계정을 승인했습니다.` : `${userId} 계정을 거절했습니다.`,
          action === 'approve' ? 'success' : 'error'
        );
      } catch (error) {
        console.error('[Approval] update error', error);
        setApprovalAdminStatus('승인 상태를 변경하는 중 오류가 발생했습니다.', 'error');
      } finally {
        actionButton.disabled = false;
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && authModal && authModal.classList.contains('is-open')) {
      closeAuthModal();
    }
  });

  loginSubmit.addEventListener('click', async () => {
    const id = loginId.value.trim();
    const password = loginPassword.value.trim();

    if (!id || !password) {
      loginMessage.textContent = '아이디와 비밀번호를 모두 입력해주세요.';
      return;
    }

    try {
      if (authMode === 'local' || !window.auth || !window.signInWithEmailAndPassword) {
        await handleLocalAdminLogin(id, password);
        return;
      }

      const email = await getEmailForLogin(id);
      const credential = await window.signInWithEmailAndPassword(window.auth, email, password);
      const displayId = userToDisplayId(credential.user) || normalizeUserId(id);
      const profile = await ensureApprovalProfile(credential.user);
      saveUserProfileCache(displayId, credential.user?.email || email, profile || {});

      if (profile?.approved || profile?.status === 'approved' || isAdminUserId(displayId)) {
        applyAuthenticatedUser(displayId);
      } else {
        applyPendingUser(displayId, profile || {});
      }
    } catch (error) {
      console.error('[Auth] signIn error', error);
      loginMessage.style.color = '#db2777';
      loginMessage.textContent = authMode === 'local'
        ? '로컬 관리자 계정 정보가 올바르지 않습니다.'
        : '아이디 또는 비밀번호가 틀렸습니다.';
    }
  });

  if (signupSubmit) {
    signupSubmit.addEventListener('click', () => {
      const email = signupEmail.value.trim();
      const id = signupId.value.trim();
      const password = signupPassword.value.trim();

      if (!email || !id || !password) {
        signupMessage.style.color = '#ef4444';
        signupMessage.textContent = '이메일, 아이디, 비밀번호를 모두 입력해주세요.';
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        signupMessage.style.color = '#ef4444';
        signupMessage.textContent = '올바른 이메일 형식으로 입력해주세요.';
        return;
      }

      if (id.length < 4 || password.length < 4) {
        signupMessage.style.color = '#ef4444';
        signupMessage.textContent = '아이디와 비밀번호는 4자 이상으로 입력해주세요.';
        return;
      }

      if (authMode === 'local' || !window.auth || !window.createUserWithEmailAndPassword || !window.updateProfile) {
        signupMessage.style.color = '#ef4444';
        signupMessage.textContent = '광고차단으로 Firebase가 막힌 상태에서는 회원가입이 불가능합니다. 관리자 계정으로 로그인해주세요.';
        return;
      }

      window.createUserWithEmailAndPassword(window.auth, email, password)
        .then(async (credential) => {
          await window.updateProfile(credential.user, { displayName: id });
          await saveUserProfile(id, email, {
            uid: credential.user.uid,
            approved: false,
            status: 'pending',
            requestedAt: new Date().toISOString(),
            provider: 'password'
          });
          signupMessage.style.color = '#22c55e';
          signupMessage.textContent = '회원가입이 완료되었습니다. 관리자 승인 후 로그인 상태에서 글 작성이 가능합니다.';
          applyPendingUser(id, { approved: false, status: 'pending' });
          signupEmail.value = '';
          signupId.value = '';
          signupPassword.value = '';
        })
        .catch((error) => {
          console.error('[Auth] signUp error', error);
          signupMessage.style.color = '#ef4444';
          signupMessage.textContent = error.code === 'auth/email-already-in-use'
            ? '이미 사용 중인 이메일입니다.'
            : error.code === 'auth/invalid-display-name'
              ? '아이디 형식을 다시 확인해주세요.'
              : '회원가입 중 오류가 발생했습니다.';
        });
    });
  }

  if (logoutSubmit) {
    logoutSubmit.addEventListener('click', () => {
      if (authMode === 'local' || !window.auth || !window.signOut) {
        clearLocalAuthSession();
        resetAuthUI();
        if (loginId) loginId.value = '';
        if (loginPassword) loginPassword.value = '';
        if (signupEmail) signupEmail.value = '';
        if (loginMessage) loginMessage.textContent = '';
        setAuthStatus(getAuthUnavailableMessage(), 'info');
        return;
      }

      window.signOut(window.auth)
        .then(() => {
          if (loginId) loginId.value = '';
          if (loginPassword) loginPassword.value = '';
          if (signupEmail) signupEmail.value = '';
          if (signupId) signupId.value = '';
          if (signupPassword) signupPassword.value = '';
          if (loginMessage) loginMessage.textContent = '';
          if (signupMessage) signupMessage.textContent = '';
          setAuthStatus('로그아웃되었습니다.', 'info');
        })
        .catch((error) => {
          console.error('[Auth] signOut error', error);
          setAuthStatus('로그아웃 중 오류가 발생했습니다.', 'error');
        });
    });
  }

  function exportPostsAsJson() {
    loadSavedPosts().then(posts => {
      const blob = new Blob([JSON.stringify(posts, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'seolhwa-posts.json';
      anchor.click();
      URL.revokeObjectURL(url);
    }).catch(e => {
      console.error('[PostWriter] exportPostsAsJson error', e);
      alert('내보내기 중 오류가 발생했습니다.');
    });
  }

  function importPostsFromJson(jsonText) {
    try {
      const imported = JSON.parse(jsonText);
      if (!Array.isArray(imported)) throw new Error('JSON은 게시물 목록이어야 합니다.');

      // Firebase에 가져온 게시물들 추가
      imported.forEach(async (post) => {
        if (post && post.createdAt) {
          await savePostToFirebase({
            user: post.user || '익명',
            title: post.title || '제목 없음',
            subtitle: post.subtitle || '',
            content: post.content || '',
            imageDataUrl: post.imageDataUrl || null,
            createdAt: post.createdAt
          });
        }
      });

      alert('게시물 가져오기가 완료되었습니다.');
    } catch (e) {
      alert('가져오기 실패: 올바른 JSON 파일인지 확인해 주세요.');
      console.error('[PostWriter] importPostsFromJson error', e);
    }
  }

  setPostFormEnabled(false);
  initializeAuth();
  // Firebase 연결 확인 후 게시물 로드
  checkFirebaseConnection().then(isConnected => {
    if (isConnected) {
      console.log('Firebase 연결됨: 모든 기기에서 글 공유 가능');
    } else {
      console.log('Firebase 연결 실패: 현재 기기에서만 글 저장됨');
      // localStorage에서 기존 데이터 로드
      try {
        const localPosts = JSON.parse(localStorage.getItem(postsStorageKey) || '[]').map(normalizePost);
        if (localPosts.length > 0) {
          clearPosts();
          setCurrentPosts(localPosts);
          localPosts.forEach(post => addPostToDOM(post, false));
        }
      } catch (e) {
        console.error('localStorage 로드 실패:', e);
      }
    }
    renderSavedPosts();
  });

  syncViewFromRoute();

  const exportBtn = document.getElementById('export-posts');
  const importInput = document.getElementById('import-posts');

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportPostsAsJson();
    });
  }
  if (importInput) {
    importInput.addEventListener('change', (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        importPostsFromJson(reader.result);
        importInput.value = '';
      };
      reader.readAsText(file);
    });
  }

  submitBtn.addEventListener('click', () => {
    if (!postInput || !currentUser) {
      alert('로그인 후 글을 작성해주세요.');
      return;
    }

    const title = postTitleInput.value;
    const subtitle = postSubtitleInput.value;
    const value = postInput.value;
    const file = postImageInput.files && postImageInput.files[0];

    if (!title.trim() && !subtitle.trim() && !value.trim() && !file) {
      alert('제목 또는 부제목 또는 본문 또는 이미지를 입력해 주세요.');
      return;
    }

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        addPost(value, reader.result, currentUser, null, true, title, subtitle);
        postTitleInput.value = '';
        postSubtitleInput.value = '';
        postInput.value = '';
        postImageInput.value = '';
      };
      reader.onerror = () => {
        alert('이미지를 불러오는 중 오류가 발생했습니다.');
      };
      reader.readAsDataURL(file);
    } else {
      addPost(value, null, currentUser, null, true, title, subtitle);
      postTitleInput.value = '';
      postSubtitleInput.value = '';
      postInput.value = '';
      postImageInput.value = '';
    }
  });
}

function init() {
  updateYear();
  setupNavigation();
  setupGridInteraction();
  setupThemeToggle();
  setupPostWriter();
  console.log('Seolhwa 페이지 초기화 완료');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

