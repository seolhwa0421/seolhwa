// Seolhwa Archive - storage dedicated page

(function initializeArchivePage() {
  const ADMIN_ACCOUNT = {
    id: 'seolhwa0508'
  };
  const localAuthStorageKey = 'seolhwa-local-auth';
  const userProfilesStorageKey = 'seolhwa-user-profiles';
  const themeStorageKey = 'theme';
  const adminSpectrumStorageKey = 'seolhwa-admin-spectrum-theme';

  const archiveStatus = document.getElementById('archive-status');
  const archiveAccessPanel = document.getElementById('archive-access-panel');
  const archiveAccessStatus = document.getElementById('archive-access-status');
  const archiveAccessCopy = document.getElementById('archive-access-copy');
  const userStoragePanel = document.getElementById('user-storage-panel');
  const adminStoragePanel = document.getElementById('admin-storage-panel');
  const adminStorageUserStatus = document.getElementById('admin-storage-user-status');
  const adminStorageUserList = document.getElementById('admin-storage-user-list');
  const adminStorageSelectedUser = document.getElementById('admin-storage-selected-user');
  const adminStorageSelectedCopy = document.getElementById('admin-storage-selected-copy');
  const adminStorageForm = document.getElementById('admin-storage-form');
  const adminStorageQuotaInput = document.getElementById('admin-storage-quota-input');
  const adminStorageSaveButton = document.getElementById('admin-storage-save');
  const adminStorageClearButton = document.getElementById('admin-storage-clear');
  const adminStorageCurrentQuota = document.getElementById('admin-storage-current-quota');
  const adminStorageCurrentUsage = document.getElementById('admin-storage-current-usage');
  const adminStorageLastUpdated = document.getElementById('admin-storage-last-updated');
  const userStorageStatus = document.getElementById('user-storage-status');
  const userStorageQuota = document.getElementById('user-storage-quota');
  const userStorageUsed = document.getElementById('user-storage-used');
  const userStorageCopy = document.getElementById('user-storage-copy');
  const yearSpan = document.getElementById('year');
  const themeToggle = document.getElementById('theme-toggle');
  const html = document.documentElement;

  let currentUser = '';
  let currentUserProfile = null;
  let authMode = 'firebase';
  let selectedStorageUserId = '';
  let latestAdminProfiles = [];
  let currentUserProfileUnsubscribe = null;
  let adminProfilesUnsubscribe = null;

  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  function normalizeUserId(userId) {
    return String(userId || '').trim().toLowerCase();
  }

  function idToEmail(id) {
    return `${normalizeUserId(id)}@seolhwa.dev`;
  }

  function isAdminUserId(userId) {
    return normalizeUserId(userId) === ADMIN_ACCOUNT.id;
  }

  function canUserUseSpectrumTheme(userId = currentUser, profile = currentUserProfile) {
    return isAdminUserId(userId) || Boolean(profile?.spectrumThemeAllowed);
  }

  function getArchiveAccessPermission(profile = currentUserProfile) {
    if (!profile || typeof profile !== 'object') {
      return false;
    }

    if (Object.prototype.hasOwnProperty.call(profile, 'storageAccessAllowed')) {
      return Boolean(profile.storageAccessAllowed);
    }

    return Boolean(profile.storageAccessEnabled);
  }

  function canUserAccessArchive(userId = currentUser, profile = currentUserProfile) {
    return isAdminUserId(userId) || getArchiveAccessPermission(profile);
  }

  function applyTheme(theme) {
    const nextTheme = theme === 'dark' ? 'dark' : 'light';
    html.setAttribute('data-theme', nextTheme);
    html.classList.toggle('dark-mode', nextTheme === 'dark');
    html.classList.toggle('dark', nextTheme === 'dark');
    document.body.classList.toggle('dark-mode', nextTheme === 'dark');
    document.body.classList.toggle('dark', nextTheme === 'dark');
    localStorage.setItem(themeStorageKey, nextTheme);

    if (themeToggle) {
      themeToggle.checked = nextTheme === 'dark';
    }
  }

  function applyAdminSpectrumTheme(enabled, options = {}) {
    const shouldEnable = Boolean(enabled);
    html.setAttribute('data-admin-spectrum', shouldEnable ? 'on' : 'off');
    document.body.classList.toggle('admin-spectrum', shouldEnable);

    if (options.persist !== false) {
      localStorage.setItem(adminSpectrumStorageKey, shouldEnable ? 'on' : 'off');
    }
  }

  function syncSpectrumTheme() {
    const shouldEnable = canUserUseSpectrumTheme() && localStorage.getItem(adminSpectrumStorageKey) === 'on';
    applyAdminSpectrumTheme(shouldEnable, { persist: false });
  }

  function initializeTheme() {
    applyTheme(localStorage.getItem(themeStorageKey) || 'light');
    syncSpectrumTheme();

    if (themeToggle) {
      themeToggle.addEventListener('change', () => {
        applyTheme(themeToggle.checked ? 'dark' : 'light');
      });
    }

    window.addEventListener('storage', (event) => {
      if (event.key === themeStorageKey) {
        applyTheme(event.newValue || 'light');
        return;
      }

      if (event.key === adminSpectrumStorageKey || event.key === userProfilesStorageKey) {
        syncSpectrumTheme();
      }
    });
  }

  function normalizeStorageQuotaMb(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return 0;
    }

    return Math.max(0, Math.floor(numericValue));
  }

  function getStorageQuotaMb(profile = currentUserProfile) {
    return normalizeStorageQuotaMb(profile?.storageQuotaMb);
  }

  function getStorageUsedMb(profile = currentUserProfile) {
    return normalizeStorageQuotaMb(profile?.storageUsedMb);
  }

  function renderArchiveAccessGate() {
    const hasUser = Boolean(currentUser);
    const isAdmin = isAdminUserId(currentUser);
    const hasAccess = canUserAccessArchive();

    if (archiveAccessPanel) {
      archiveAccessPanel.hidden = !hasUser || isAdmin || hasAccess;
    }
    if (userStoragePanel) {
      userStoragePanel.hidden = hasUser && !isAdmin && !hasAccess;
    }

    if (!archiveAccessStatus || !archiveAccessCopy) {
      return;
    }

    if (!hasUser) {
      archiveAccessStatus.textContent = '메인 페이지에서 로그인하면 Archive 권한을 확인할 수 있습니다.';
      archiveAccessCopy.textContent = '일반 사용자는 관리자에게 Archive 접근 권한을 따로 받아야 이 페이지를 사용할 수 있습니다.';
      return;
    }

    if (isAdmin) {
      archiveAccessStatus.textContent = '관리자 계정은 Archive 전체 화면에 바로 접근할 수 있습니다.';
      archiveAccessCopy.textContent = '아래 관리자 패널에서 사용자별 할당량과 접근 상태를 계속 관리할 수 있습니다.';
      return;
    }

    if (hasAccess) {
      archiveAccessStatus.textContent = 'Archive 접근 권한이 확인되었습니다.';
      archiveAccessCopy.textContent = '이제 이 페이지에서 개인 스토리지 한도와 사용량을 확인할 수 있습니다.';
      return;
    }

    archiveAccessStatus.textContent = '관리자가 아직 Archive 접근 권한을 부여하지 않았습니다.';
    archiveAccessCopy.textContent = '메인 홈페이지의 관리자 권한 화면에서 Archive 접근 허용을 받아야 개인 할당량과 스토리지 화면을 볼 수 있습니다.';
  }

  function formatStorageAmount(mbValue) {
    const safeValue = normalizeStorageQuotaMb(mbValue);
    if (safeValue >= 1024) {
      const gbValue = safeValue / 1024;
      const decimals = Number.isInteger(gbValue) ? 0 : 2;
      return `${gbValue.toLocaleString('ko-KR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} GB`;
    }

    return `${safeValue.toLocaleString('ko-KR')} MB`;
  }

  function formatApprovalDate(value) {
    if (!value) return '시간 정보 없음';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '시간 정보 없음';
    return date.toLocaleString('ko-KR');
  }

  function readUserProfiles() {
    try {
      const raw = localStorage.getItem(userProfilesStorageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      console.warn('[Archive] read user profiles error', error);
      return {};
    }
  }

  function writeUserProfiles(profiles) {
    try {
      localStorage.setItem(userProfilesStorageKey, JSON.stringify(profiles));
    } catch (error) {
      console.warn('[Archive] write user profiles error', error);
    }
  }

  function saveUserProfileCache(userId, email, extra = {}) {
    const normalizedId = normalizeUserId(userId);
    if (!normalizedId) {
      return;
    }

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

  function getCachedProfileById(userId) {
    const normalizedId = normalizeUserId(userId);
    if (!normalizedId) {
      return null;
    }

    const profiles = readUserProfiles();
    return profiles[normalizedId] || null;
  }

  function getCachedEmailById(userId) {
    const normalizedId = normalizeUserId(userId);
    if (!normalizedId) {
      return '';
    }

    const profiles = readUserProfiles();
    return profiles[normalizedId]?.email || '';
  }

  function setArchiveStatus(message = '', type = 'info') {
    if (!archiveStatus) {
      return;
    }

    archiveStatus.textContent = message;
    archiveStatus.classList.remove('is-error', 'is-success');
    if (type === 'error') {
      archiveStatus.classList.add('is-error');
    }
    if (type === 'success') {
      archiveStatus.classList.add('is-success');
    }
  }

  function setAdminStorageUserStatus(message = '', type = 'info') {
    if (!adminStorageUserStatus) {
      return;
    }

    adminStorageUserStatus.textContent = message;
    adminStorageUserStatus.classList.remove('is-error', 'is-success');
    if (type === 'error') {
      adminStorageUserStatus.classList.add('is-error');
    }
    if (type === 'success') {
      adminStorageUserStatus.classList.add('is-success');
    }
  }

  function setUserStorageStatus(message = '', type = 'info') {
    if (!userStorageStatus) {
      return;
    }

    userStorageStatus.textContent = message;
    userStorageStatus.classList.remove('is-error', 'is-success');
    if (type === 'error') {
      userStorageStatus.classList.add('is-error');
    }
    if (type === 'success') {
      userStorageStatus.classList.add('is-success');
    }
  }

  function renderUserStorage() {
    if (!userStorageQuota || !userStorageUsed || !userStorageCopy) {
      return;
    }

    if (!currentUser) {
      userStorageQuota.textContent = '0 MB';
      userStorageUsed.textContent = '0 MB';
      setUserStorageStatus('메인 페이지에서 로그인하면 여기서 할당량을 확인할 수 있습니다.');
      userStorageCopy.textContent = '로그인 세션은 브라우저에 저장되므로, 메인에서 로그인한 뒤 Archive로 돌아오면 바로 정보를 볼 수 있습니다.';
      return;
    }

    if (isAdminUserId(currentUser)) {
      userStorageQuota.textContent = '관리자';
      userStorageUsed.textContent = '관리자';
      setUserStorageStatus('관리자 계정은 개인 업로드 대상이 아니라서 아래에서 사용자별 할당을 관리합니다.', 'success');
      userStorageCopy.textContent = '아래 관리자 패널에서 일반 사용자에게 스토리지 한도를 배정하거나 해제할 수 있습니다.';
      return;
    }

    if (!canUserAccessArchive()) {
      userStorageQuota.textContent = '0 MB';
      userStorageUsed.textContent = '0 MB';
      setUserStorageStatus('Archive 접근 권한이 아직 없습니다. 관리자에게 요청하세요.', 'error');
      userStorageCopy.textContent = '권한이 부여되면 이 자리에서 개인 할당량과 사용량을 확인할 수 있습니다.';
      return;
    }

    const quotaMb = getStorageQuotaMb();
    const usedMb = getStorageUsedMb();
    userStorageQuota.textContent = formatStorageAmount(quotaMb);
    userStorageUsed.textContent = formatStorageAmount(usedMb);

    if (quotaMb <= 0) {
      setUserStorageStatus('아직 할당된 스토리지 공간이 없습니다. 필요하면 관리자에게 요청하세요.');
      userStorageCopy.textContent = '스토리지 서버가 연결되면 여기 표시된 할당량이 개인 업로드 한도로 사용됩니다.';
      return;
    }

    const remainingMb = Math.max(0, quotaMb - usedMb);
    setUserStorageStatus(`현재 ${formatStorageAmount(quotaMb)} 중 ${formatStorageAmount(remainingMb)}를 남겨두고 있습니다.`, 'success');
    userStorageCopy.textContent = '지금은 할당량만 저장되며, 실제 파일 업로드와 사용량 증가는 나중에 스토리지 서버를 연결할 때 적용됩니다.';
  }

  function setCurrentUserProfile(profile = null) {
    currentUserProfile = profile && typeof profile === 'object'
      ? { ...profile, userId: normalizeUserId(profile.userId || currentUser) }
      : null;
    renderUserStorage();
    renderArchiveAccessGate();
    syncSpectrumTheme();
  }

  function clearAdminStorageManager() {
    selectedStorageUserId = '';
    latestAdminProfiles = [];
    if (adminStorageUserList) {
      adminStorageUserList.innerHTML = '';
    }
    if (adminStorageSelectedUser) {
      adminStorageSelectedUser.textContent = '선택한 사용자 없음';
    }
    if (adminStorageSelectedCopy) {
      adminStorageSelectedCopy.textContent = '왼쪽에서 사용자를 선택하면 할당량을 입력하고 저장할 수 있습니다.';
    }
    if (adminStorageQuotaInput) {
      adminStorageQuotaInput.value = '';
      adminStorageQuotaInput.disabled = true;
    }
    if (adminStorageSaveButton) {
      adminStorageSaveButton.disabled = true;
    }
    if (adminStorageClearButton) {
      adminStorageClearButton.disabled = true;
    }
    if (adminStorageCurrentQuota) {
      adminStorageCurrentQuota.textContent = '0 MB';
    }
    if (adminStorageCurrentUsage) {
      adminStorageCurrentUsage.textContent = '0 MB';
    }
    if (adminStorageLastUpdated) {
      adminStorageLastUpdated.textContent = '아직 저장된 스토리지 할당 정보가 없습니다.';
    }
  }

  function renderAdminSelectedStorageUser(profile) {
    const normalizedProfile = profile && typeof profile === 'object' ? profile : null;
    const quotaMb = getStorageQuotaMb(normalizedProfile);
    const usedMb = getStorageUsedMb(normalizedProfile);
    const hasSelection = Boolean(normalizedProfile?.userId);

    if (adminStorageSelectedUser) {
      adminStorageSelectedUser.textContent = hasSelection ? normalizedProfile.userId : '선택한 사용자 없음';
    }
    if (adminStorageSelectedCopy) {
      adminStorageSelectedCopy.textContent = hasSelection
        ? `${normalizedProfile.email || '이메일 없음'} · 현재 승인 상태 ${normalizedProfile.status || '정보 없음'}`
        : '왼쪽에서 사용자를 선택하면 할당량을 입력하고 저장할 수 있습니다.';
    }
    if (adminStorageQuotaInput) {
      adminStorageQuotaInput.disabled = !hasSelection;
      adminStorageQuotaInput.value = hasSelection && quotaMb > 0 ? String(quotaMb) : '';
    }
    if (adminStorageSaveButton) {
      adminStorageSaveButton.disabled = !hasSelection;
    }
    if (adminStorageClearButton) {
      adminStorageClearButton.disabled = !hasSelection || quotaMb <= 0;
    }
    if (adminStorageCurrentQuota) {
      adminStorageCurrentQuota.textContent = formatStorageAmount(quotaMb);
    }
    if (adminStorageCurrentUsage) {
      adminStorageCurrentUsage.textContent = formatStorageAmount(usedMb);
    }
    if (adminStorageLastUpdated) {
      if (!hasSelection) {
        adminStorageLastUpdated.textContent = '아직 저장된 스토리지 할당 정보가 없습니다.';
      } else if (normalizedProfile.storageQuotaAssignedAt) {
        adminStorageLastUpdated.textContent = `마지막 할당 변경: ${formatApprovalDate(normalizedProfile.storageQuotaAssignedAt)} · 담당자 ${normalizedProfile.storageQuotaAssignedBy || '관리자'}`;
      } else {
        adminStorageLastUpdated.textContent = '아직 저장된 스토리지 할당 정보가 없습니다.';
      }
    }
  }

  function renderAdminStorageUserManager(profiles = latestAdminProfiles) {
    if (!adminStorageUserList || !isAdminUserId(currentUser)) {
      clearAdminStorageManager();
      return;
    }

    latestAdminProfiles = Array.isArray(profiles) ? profiles : [];
    const manageableProfiles = latestAdminProfiles
      .filter((profile) => profile && profile.userId && !isAdminUserId(profile.userId))
      .sort((left, right) => normalizeUserId(left.userId).localeCompare(normalizeUserId(right.userId), 'ko'));

    if (!manageableProfiles.length) {
      clearAdminStorageManager();
      setAdminStorageUserStatus('스토리지를 할당할 사용자가 없습니다.');
      return;
    }

    const totalQuotaMb = manageableProfiles.reduce((sum, profile) => sum + getStorageQuotaMb(profile), 0);
    const grantedCount = manageableProfiles.filter((profile) => getStorageQuotaMb(profile) > 0).length;
    setAdminStorageUserStatus(`전체 ${manageableProfiles.length}명 중 ${grantedCount}명에게 총 ${formatStorageAmount(totalQuotaMb)}를 할당했습니다.`);

    if (!selectedStorageUserId || !manageableProfiles.some((profile) => normalizeUserId(profile.userId) === selectedStorageUserId)) {
      selectedStorageUserId = normalizeUserId(manageableProfiles[0].userId);
    }

    adminStorageUserList.innerHTML = manageableProfiles.map((profile) => {
      const userId = normalizeUserId(profile.userId);
      const quotaMb = getStorageQuotaMb(profile);
      const usedMb = getStorageUsedMb(profile);
      const quotaLabel = quotaMb > 0 ? `할당 ${formatStorageAmount(quotaMb)}` : '할당 없음';
      return `
        <button class="admin-storage-card${userId === selectedStorageUserId ? ' is-active' : ''}" type="button" data-storage-user-id="${userId}">
          <span class="admin-user-name">${userId}</span>
          <span class="admin-user-meta">${profile.email || '이메일 없음'}</span>
          <span class="admin-user-meta">${quotaLabel} · 사용 ${formatStorageAmount(usedMb)}</span>
        </button>
      `;
    }).join('');

    const selectedProfile = manageableProfiles.find((profile) => normalizeUserId(profile.userId) === selectedStorageUserId) || null;
    renderAdminSelectedStorageUser(selectedProfile);
  }

  function stopCurrentUserProfileListener() {
    if (typeof currentUserProfileUnsubscribe === 'function') {
      currentUserProfileUnsubscribe();
      currentUserProfileUnsubscribe = null;
    }
  }

  function stopAdminProfilesListener() {
    if (typeof adminProfilesUnsubscribe === 'function') {
      adminProfilesUnsubscribe();
      adminProfilesUnsubscribe = null;
    }
  }

  async function waitForAuth() {
    if (window.firebaseAuthReadyPromise) {
      await window.firebaseAuthReadyPromise;
      return;
    }

    let attempts = 0;
    while (!window.auth && attempts < 12) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts += 1;
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

    let attempts = 0;
    while (!window.db && attempts < 20) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts += 1;
    }

    if (!window.db) {
      throw new Error('Firebase DB가 초기화되지 않았습니다.');
    }
  }

  async function getUserProfile(userId, options = {}) {
    const normalizedId = normalizeUserId(userId);
    if (!normalizedId) {
      return null;
    }

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
      console.warn('[Archive] get user profile fallback', error);
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
      console.warn('[Archive] save user profile fallback to local cache', error);
    }
  }

  async function updateStorageQuota(userId, quotaMb) {
    const normalizedId = normalizeUserId(userId);
    const existingProfile = await getUserProfile(normalizedId, { preferFresh: true });
    const email = existingProfile?.email || getCachedEmailById(normalizedId) || idToEmail(normalizedId);
    const normalizedQuotaMb = normalizeStorageQuotaMb(quotaMb);
    const archiveAccessAllowed = getArchiveAccessPermission(existingProfile);

    await saveUserProfile(normalizedId, email, {
      storageQuotaMb: normalizedQuotaMb,
      storageUsedMb: normalizeStorageQuotaMb(existingProfile?.storageUsedMb),
      storageAccessAllowed: archiveAccessAllowed,
      storageAccessEnabled: archiveAccessAllowed,
      storageQuotaAssignedAt: new Date().toISOString(),
      storageQuotaAssignedBy: ADMIN_ACCOUNT.id
    });
  }

  function startCurrentUserProfileListener(userId, initialProfile = null) {
    stopCurrentUserProfileListener();
    setCurrentUserProfile(initialProfile);

    const normalizedId = normalizeUserId(userId);
    if (!normalizedId || isAdminUserId(normalizedId) || authMode !== 'firebase' || !window.onSnapshot || !window.doc || !window.db) {
      return;
    }

    currentUserProfileUnsubscribe = window.onSnapshot(window.doc(window.db, 'userProfiles', normalizedId), (snapshot) => {
      if (!snapshot.exists()) {
        setCurrentUserProfile(null);
        return;
      }

      const profile = snapshot.data() || {};
      saveUserProfileCache(normalizedId, profile.email || idToEmail(normalizedId), profile);
      setCurrentUserProfile({ userId: normalizedId, ...profile });
    }, (error) => {
      console.error('[Archive] current user profile listener error', error);
      setArchiveStatus('개인 스토리지 정보를 실시간으로 불러오지 못했습니다.', 'error');
    });
  }

  async function startAdminProfilesListener() {
    stopAdminProfilesListener();

    if (!isAdminUserId(currentUser)) {
      if (adminStoragePanel) {
        adminStoragePanel.hidden = true;
      }
      clearAdminStorageManager();
      return;
    }

    if (adminStoragePanel) {
      adminStoragePanel.hidden = false;
    }

    if (authMode !== 'firebase') {
      clearAdminStorageManager();
      setAdminStorageUserStatus('로컬 관리자 모드에서는 스토리지 할당 목록을 불러올 수 없습니다.', 'error');
      return;
    }

    if (!window.onSnapshot || !window.collection || !window.db) {
      clearAdminStorageManager();
      setAdminStorageUserStatus('스토리지 할당 목록을 불러올 수 없습니다.', 'error');
      return;
    }

    setAdminStorageUserStatus('사용자 목록을 불러오는 중입니다.');
    adminProfilesUnsubscribe = window.onSnapshot(window.collection(window.db, 'userProfiles'), (snapshot) => {
      const profiles = [];
      snapshot.forEach((docSnapshot) => {
        const profile = docSnapshot.data() || {};
        const normalizedId = normalizeUserId(profile.userId || docSnapshot.id);
        const mergedProfile = { userId: normalizedId, ...profile };
        profiles.push(mergedProfile);
        saveUserProfileCache(normalizedId, mergedProfile.email || idToEmail(normalizedId), mergedProfile);
      });
      renderAdminStorageUserManager(profiles);
    }, (error) => {
      console.error('[Archive] admin profiles listener error', error);
      clearAdminStorageManager();
      setAdminStorageUserStatus('스토리지 할당 목록을 불러오는 중 오류가 발생했습니다.', 'error');
    });
  }

  function applyAuthenticatedUser(userId, options = {}) {
    currentUser = normalizeUserId(userId);
    const nextProfile = options.profile || null;
    const hasAccess = canUserAccessArchive(currentUser, nextProfile);
    setArchiveStatus(
      isAdminUserId(currentUser) || hasAccess
        ? `${currentUser} 계정으로 Archive에 연결되었습니다.`
        : `${currentUser} 계정은 아직 Archive 접근 권한이 없습니다.`,
      isAdminUserId(currentUser) || hasAccess ? 'success' : 'error'
    );
    syncSpectrumTheme();
    startCurrentUserProfileListener(currentUser, nextProfile);
    renderUserStorage();
    renderArchiveAccessGate();
    startAdminProfilesListener();
  }

  function resetArchiveUI() {
    currentUser = '';
    stopCurrentUserProfileListener();
    stopAdminProfilesListener();
    setCurrentUserProfile(null);
    if (adminStoragePanel) {
      adminStoragePanel.hidden = true;
    }
    clearAdminStorageManager();
    renderUserStorage();
    renderArchiveAccessGate();
    syncSpectrumTheme();
  }

  function restoreLocalAuthSession() {
    try {
      const raw = localStorage.getItem(localAuthStorageKey);
      if (!raw) {
        return false;
      }

      const session = JSON.parse(raw);
      if (!session || !isAdminUserId(session.userId)) {
        return false;
      }

      applyAuthenticatedUser(session.userId, { isLocalFallback: true });
      return true;
    } catch (error) {
      console.warn('[Archive] local session restore error', error);
      return false;
    }
  }

  async function initializeAuth() {
    setArchiveStatus('세션을 확인하는 중입니다.');

    try {
      await waitForAuth();

      if (!window.auth || !window.onAuthStateChanged) {
        throw new Error('Firebase Auth 객체를 찾을 수 없습니다.');
      }

      authMode = 'firebase';
      window.onAuthStateChanged(window.auth, async (user) => {
        if (user) {
          const rawUserId = user.displayName || user.email?.split('@')[0] || '익명';
          const normalizedUserId = normalizeUserId(rawUserId);

          if (isAdminUserId(normalizedUserId)) {
            applyAuthenticatedUser(normalizedUserId);
            return;
          }

          const profile = await getUserProfile(normalizedUserId, { preferFresh: true });
          applyAuthenticatedUser(normalizedUserId, {
            profile: profile || {
              userId: normalizedUserId,
              email: user.email || idToEmail(normalizedUserId),
              storageAccessAllowed: false,
              storageQuotaMb: 0,
              storageUsedMb: 0,
              storageAccessEnabled: false
            }
          });
          return;
        }

        resetArchiveUI();
        setArchiveStatus('메인 페이지에서 로그인하면 Archive에서 스토리지를 확인할 수 있습니다.');
      });
    } catch (error) {
      console.error('[Archive] initializeAuth error', error);
      authMode = 'local';
      resetArchiveUI();

      if (restoreLocalAuthSession()) {
        setArchiveStatus('로컬 관리자 세션으로 Archive를 열었습니다.', 'success');
        return;
      }

      setArchiveStatus('인증 세션을 찾지 못했습니다. 메인 페이지에서 먼저 로그인하세요.', 'error');
    }
  }

  if (adminStorageUserList) {
    adminStorageUserList.addEventListener('click', (event) => {
      const targetButton = event.target.closest('[data-storage-user-id]');
      if (!targetButton || !isAdminUserId(currentUser)) {
        return;
      }

      selectedStorageUserId = normalizeUserId(targetButton.dataset.storageUserId);
      renderAdminStorageUserManager();
    });
  }

  if (adminStorageForm) {
    adminStorageForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!isAdminUserId(currentUser) || !selectedStorageUserId || !adminStorageQuotaInput) {
        return;
      }

      const nextQuota = normalizeStorageQuotaMb(adminStorageQuotaInput.value);

      try {
        if (adminStorageSaveButton) {
          adminStorageSaveButton.disabled = true;
        }
        if (adminStorageClearButton) {
          adminStorageClearButton.disabled = true;
        }

        setAdminStorageUserStatus(`${selectedStorageUserId} 사용자에게 ${formatStorageAmount(nextQuota)}를 저장하는 중입니다.`);
        await updateStorageQuota(selectedStorageUserId, nextQuota);

        latestAdminProfiles = latestAdminProfiles.map((profile) => (
          normalizeUserId(profile?.userId) === selectedStorageUserId
            ? {
              ...profile,
              storageQuotaMb: nextQuota,
              storageUsedMb: normalizeStorageQuotaMb(profile?.storageUsedMb),
              storageAccessAllowed: getArchiveAccessPermission(profile),
              storageAccessEnabled: getArchiveAccessPermission(profile),
              storageQuotaAssignedAt: new Date().toISOString(),
              storageQuotaAssignedBy: ADMIN_ACCOUNT.id
            }
            : profile
        ));

        renderAdminStorageUserManager(latestAdminProfiles);
        setAdminStorageUserStatus(`${selectedStorageUserId} 사용자에게 ${formatStorageAmount(nextQuota)}를 할당했습니다.`, 'success');
      } catch (error) {
        console.error('[Archive] update storage quota error', error);
        setAdminStorageUserStatus('스토리지 할당 저장 중 오류가 발생했습니다.', 'error');
      } finally {
        renderAdminStorageUserManager(latestAdminProfiles);
      }
    });
  }

  if (adminStorageClearButton) {
    adminStorageClearButton.addEventListener('click', async () => {
      if (!isAdminUserId(currentUser) || !selectedStorageUserId) {
        return;
      }

      try {
        if (adminStorageSaveButton) {
          adminStorageSaveButton.disabled = true;
        }
        if (adminStorageClearButton) {
          adminStorageClearButton.disabled = true;
        }

        setAdminStorageUserStatus(`${selectedStorageUserId} 사용자의 스토리지 할당을 해제하는 중입니다.`);
        await updateStorageQuota(selectedStorageUserId, 0);

        latestAdminProfiles = latestAdminProfiles.map((profile) => (
          normalizeUserId(profile?.userId) === selectedStorageUserId
            ? {
              ...profile,
              storageQuotaMb: 0,
              storageUsedMb: normalizeStorageQuotaMb(profile?.storageUsedMb),
              storageAccessAllowed: getArchiveAccessPermission(profile),
              storageAccessEnabled: getArchiveAccessPermission(profile),
              storageQuotaAssignedAt: new Date().toISOString(),
              storageQuotaAssignedBy: ADMIN_ACCOUNT.id
            }
            : profile
        ));

        renderAdminStorageUserManager(latestAdminProfiles);
        setAdminStorageUserStatus(`${selectedStorageUserId} 사용자의 스토리지 할당을 해제했습니다.`, 'success');
      } catch (error) {
        console.error('[Archive] clear storage quota error', error);
        setAdminStorageUserStatus('스토리지 할당 해제 중 오류가 발생했습니다.', 'error');
      } finally {
        renderAdminStorageUserManager(latestAdminProfiles);
      }
    });
  }

  initializeTheme();
  renderUserStorage();
  renderArchiveAccessGate();
  clearAdminStorageManager();
  initializeAuth();
})();