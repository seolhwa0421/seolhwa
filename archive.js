// Seolhwa Archive - storage dedicated page

(function initializeArchivePage() {
  const ADMIN_ACCOUNT = {
    id: 'seolhwa0508'
  };
  const STORAGE_MB_BYTES = 1024 * 1024;
  const archiveFilesCollectionName = 'archiveFiles';
  const localAuthStorageKey = 'seolhwa-local-auth';
  const userProfilesStorageKey = 'seolhwa-user-profiles';
  const themeStorageKey = 'theme';
  const adminSpectrumStorageKey = 'seolhwa-admin-spectrum-theme';
  const archiveViewModeStorageKey = 'seolhwa-archive-view-mode';

  const archiveStatus = document.getElementById('archive-status');
  const archiveAccessPanel = document.getElementById('archive-access-panel');
  const archiveAccessStatus = document.getElementById('archive-access-status');
  const archiveAccessCopy = document.getElementById('archive-access-copy');
  const sharedFilePanel = document.getElementById('shared-file-panel');
  const sharedFileStatus = document.getElementById('shared-file-status');
  const sharedFileSummary = document.getElementById('shared-file-summary');
  const sharedFileName = document.getElementById('shared-file-name');
  const sharedFileMeta = document.getElementById('shared-file-meta');
  const sharedFileDownload = document.getElementById('shared-file-download');
  const sharedFileOpen = document.getElementById('shared-file-open');
  const userStoragePanel = document.getElementById('user-storage-panel');
  const userStorageStatus = document.getElementById('user-storage-status');
  const userStorageQuota = document.getElementById('user-storage-quota');
  const userStorageUsed = document.getElementById('user-storage-used');
  const userStorageCopy = document.getElementById('user-storage-copy');
  const userStorageWarning = document.getElementById('user-storage-warning');
  const archiveTotalFiles = document.getElementById('archive-total-files');
  const archiveSharedFiles = document.getElementById('archive-shared-files');
  const archiveRemainingSpace = document.getElementById('archive-remaining-space');
  const archiveCurrentView = document.getElementById('archive-current-view');
  const archiveSearchInput = document.getElementById('archive-search-input');
  const archiveFileInput = document.getElementById('archive-file-input');
  const archiveOpenUploadWindowButton = document.getElementById('archive-open-upload-window');
  const archiveRefreshButton = document.getElementById('archive-refresh');
  const archiveFileStatus = document.getElementById('archive-file-status');
  const archiveDropzone = document.getElementById('archive-dropzone');
  const archiveFileEmpty = document.getElementById('archive-file-empty');
  const archiveFileList = document.getElementById('archive-file-list');
  const archiveUploadProgress = document.getElementById('archive-upload-progress');
  const archiveUploadProgressLabel = document.getElementById('archive-upload-progress-label');
  const archiveUploadProgressFill = document.getElementById('archive-upload-progress-fill');
  const archiveUploadProgressCopy = document.getElementById('archive-upload-progress-copy');
  const archiveShareModal = document.getElementById('archive-share-modal');
  const archiveShareClose = document.getElementById('archive-share-close');
  const archiveShareFileName = document.getElementById('archive-share-file-name');
  const archiveShareFileMeta = document.getElementById('archive-share-file-meta');
  const archiveShareStatus = document.getElementById('archive-share-status');
  const archiveShareLink = document.getElementById('archive-share-link');
  const archiveShareToggle = document.getElementById('archive-share-toggle');
  const archiveShareCopy = document.getElementById('archive-share-copy');
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
  const yearSpan = document.getElementById('year');
  const themeToggle = document.getElementById('theme-toggle');
  const html = document.documentElement;
  const archiveFilterButtons = Array.from(document.querySelectorAll('[data-filter]'));
  const archiveViewButtons = Array.from(document.querySelectorAll('[data-view-mode]'));

  let currentUser = '';
  let currentUserProfile = null;
  let authMode = 'firebase';
  let selectedStorageUserId = '';
  let latestAdminProfiles = [];
  let currentFiles = [];
  let currentFilter = 'all';
  let currentSearchTerm = '';
  let currentViewMode = localStorage.getItem(archiveViewModeStorageKey) === 'list' ? 'list' : 'grid';
  let activeShareFileId = '';
  let currentUserProfileUnsubscribe = null;
  let adminProfilesUnsubscribe = null;
  let archiveFilesUnsubscribe = null;
  let sharedRouteFile = null;
  let isSyncingStorageUsage = false;
  let isUploadingFiles = false;
  let dragDepth = 0;

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

  function canUseArchiveFiles(userId = currentUser, profile = currentUserProfile) {
    return Boolean(userId) && (isAdminUserId(userId) || canUserAccessArchive(userId, profile));
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

  function formatStorageAmount(mbValue) {
    const safeValue = normalizeStorageQuotaMb(mbValue);
    if (safeValue >= 1024) {
      const gbValue = safeValue / 1024;
      const decimals = Number.isInteger(gbValue) ? 0 : 2;
      return `${gbValue.toLocaleString('ko-KR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} GB`;
    }

    return `${safeValue.toLocaleString('ko-KR')} MB`;
  }

  function formatFileSize(bytes) {
    const safeBytes = Math.max(0, Number(bytes) || 0);
    if (safeBytes >= STORAGE_MB_BYTES * 1024) {
      return `${(safeBytes / (STORAGE_MB_BYTES * 1024)).toLocaleString('ko-KR', { maximumFractionDigits: 2 })} GB`;
    }
    if (safeBytes >= STORAGE_MB_BYTES) {
      return `${(safeBytes / STORAGE_MB_BYTES).toLocaleString('ko-KR', { maximumFractionDigits: 2 })} MB`;
    }
    if (safeBytes >= 1024) {
      return `${(safeBytes / 1024).toLocaleString('ko-KR', { maximumFractionDigits: 1 })} KB`;
    }
    return `${safeBytes.toLocaleString('ko-KR')} B`;
  }

  function formatApprovalDate(value) {
    if (!value) return '시간 정보 없음';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '시간 정보 없음';
    return date.toLocaleString('ko-KR');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getFileExtension(fileName) {
    const name = String(fileName || '');
    const extension = name.includes('.') ? name.split('.').pop() : '';
    return String(extension || '').trim().toLowerCase();
  }

  function resolveArchiveFileCategory(file) {
    const mimeType = String(file?.mimeType || '').toLowerCase();
    const extension = getFileExtension(file?.fileName || '');

    if (mimeType.startsWith('image/')) {
      return 'image';
    }

    if (
      mimeType.includes('pdf') ||
      mimeType.includes('word') ||
      mimeType.includes('sheet') ||
      mimeType.includes('excel') ||
      mimeType.includes('presentation') ||
      mimeType.includes('text/') ||
      ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'csv', 'zip', 'rar', '7z', 'hwp'].includes(extension)
    ) {
      return 'document';
    }

    return 'other';
  }

  function getFileTypeLabel(file) {
    const category = resolveArchiveFileCategory(file);
    if (category === 'image') {
      return '이미지';
    }
    if (category === 'document') {
      return '문서';
    }
    return '파일';
  }

  function getFileMonogram(file) {
    const extension = getFileExtension(file?.fileName || 'file');
    const base = extension || getFileTypeLabel(file);
    return escapeHtml(String(base).slice(0, 4).toUpperCase());
  }

  function createArchiveFileId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }

    return `archive-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function sanitizeStorageFileName(fileName) {
    return String(fileName || 'file')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'file';
  }

  function getCurrentFilesTotalBytes(files = currentFiles) {
    return files.reduce((sum, file) => sum + Math.max(0, Number(file?.sizeBytes) || 0), 0);
  }

  function getRemainingQuotaBytes(profile = currentUserProfile, userId = currentUser) {
    if (isAdminUserId(userId)) {
      return Number.POSITIVE_INFINITY;
    }

    const quotaBytes = getStorageQuotaMb(profile) * STORAGE_MB_BYTES;
    return Math.max(0, quotaBytes - getCurrentFilesTotalBytes());
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

  function setArchiveFileStatus(message = '', type = 'info') {
    if (!archiveFileStatus) {
      return;
    }

    archiveFileStatus.textContent = message;
    archiveFileStatus.classList.remove('is-error', 'is-success');
    if (type === 'error') {
      archiveFileStatus.classList.add('is-error');
    }
    if (type === 'success') {
      archiveFileStatus.classList.add('is-success');
    }
  }

  function setArchiveShareStatus(message = '', type = 'info') {
    if (!archiveShareStatus) {
      return;
    }

    archiveShareStatus.textContent = message;
    archiveShareStatus.classList.remove('is-error', 'is-success');
    if (type === 'error') {
      archiveShareStatus.classList.add('is-error');
    }
    if (type === 'success') {
      archiveShareStatus.classList.add('is-success');
    }
  }

  function setSharedFileStatus(message = '', type = 'info') {
    if (!sharedFileStatus) {
      return;
    }

    sharedFileStatus.textContent = message;
    sharedFileStatus.classList.remove('is-error', 'is-success');
    if (type === 'error') {
      sharedFileStatus.classList.add('is-error');
    }
    if (type === 'success') {
      sharedFileStatus.classList.add('is-success');
    }
  }

  function setUploadProgress(visible, options = {}) {
    if (!archiveUploadProgress || !archiveUploadProgressLabel || !archiveUploadProgressFill || !archiveUploadProgressCopy) {
      return;
    }

    archiveUploadProgress.hidden = !visible;
    if (!visible) {
      archiveUploadProgressLabel.textContent = '업로드 준비 중';
      archiveUploadProgressFill.style.width = '0%';
      archiveUploadProgressCopy.textContent = '대기 중입니다.';
      return;
    }

    archiveUploadProgressLabel.textContent = options.label || '업로드 중';
    archiveUploadProgressCopy.textContent = options.copy || '업로드를 처리하고 있습니다.';
    const percent = Math.max(0, Math.min(100, Number(options.percent) || 0));
    archiveUploadProgressFill.style.width = `${percent}%`;
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
      archiveAccessCopy.textContent = '이제 이 페이지에서 개인 스토리지 한도와 파일 공간을 사용할 수 있습니다.';
      return;
    }

    archiveAccessStatus.textContent = '관리자가 아직 Archive 접근 권한을 부여하지 않았습니다.';
    archiveAccessCopy.textContent = '메인 홈페이지의 관리자 권한 화면에서 Archive 접근 허용을 받아야 개인 할당량과 스토리지 화면을 볼 수 있습니다.';
  }

  function renderUserStorageWarning() {
    if (!userStorageWarning) {
      return;
    }

    userStorageWarning.hidden = true;
    userStorageWarning.classList.remove('is-danger');

    if (!currentUser || !canUseArchiveFiles()) {
      return;
    }

    if (isAdminUserId(currentUser)) {
      userStorageWarning.hidden = false;
      userStorageWarning.textContent = '관리자 계정은 파일함과 사용자별 할당 관리 화면을 함께 사용합니다. 테스트 업로드를 하더라도 일반 사용자 한도에는 영향을 주지 않습니다.';
      return;
    }

    const quotaBytes = getStorageQuotaMb() * STORAGE_MB_BYTES;
    if (quotaBytes <= 0) {
      return;
    }

    const usedBytes = getCurrentFilesTotalBytes();
    const usageRatio = usedBytes / quotaBytes;

    if (usageRatio >= 0.95) {
      userStorageWarning.hidden = false;
      userStorageWarning.classList.add('is-danger');
      userStorageWarning.textContent = `저장 공간을 거의 모두 사용했습니다. 남은 공간은 ${formatFileSize(Math.max(0, quotaBytes - usedBytes))}입니다.`;
      return;
    }

    if (usageRatio >= 0.8) {
      userStorageWarning.hidden = false;
      userStorageWarning.textContent = `사용량이 ${Math.round(usageRatio * 100)}%에 도달했습니다. 불필요한 파일을 정리하거나 관리자에게 추가 용량을 요청하세요.`;
    }
  }

  function renderArchiveSidebarSummary() {
    const totalCount = currentFiles.length;
    const sharedCount = currentFiles.filter((file) => file.isShared).length;

    if (archiveTotalFiles) {
      archiveTotalFiles.textContent = `${totalCount.toLocaleString('ko-KR')}개`;
    }
    if (archiveSharedFiles) {
      archiveSharedFiles.textContent = `${sharedCount.toLocaleString('ko-KR')}개`;
    }
    if (archiveCurrentView) {
      archiveCurrentView.textContent = currentViewMode === 'list' ? '리스트' : '그리드';
    }
    if (archiveRemainingSpace) {
      if (!currentUser) {
        archiveRemainingSpace.textContent = '로그인 필요';
      } else if (isAdminUserId(currentUser)) {
        archiveRemainingSpace.textContent = '무제한';
      } else if (!canUserAccessArchive()) {
        archiveRemainingSpace.textContent = '권한 필요';
      } else {
        archiveRemainingSpace.textContent = formatFileSize(getRemainingQuotaBytes());
      }
    }
  }

  function renderUserStorage() {
    if (!userStorageQuota || !userStorageUsed || !userStorageCopy) {
      return;
    }

    const usedBytes = getCurrentFilesTotalBytes();

    if (!currentUser) {
      userStorageQuota.textContent = '0 MB';
      userStorageUsed.textContent = '0 MB';
      setUserStorageStatus('메인 페이지에서 로그인하면 여기서 할당량을 확인할 수 있습니다.');
      userStorageCopy.textContent = '로그인 세션은 브라우저에 저장되므로, 메인에서 로그인한 뒤 Archive로 돌아오면 바로 정보를 볼 수 있습니다.';
      renderUserStorageWarning();
      renderArchiveSidebarSummary();
      return;
    }

    if (isAdminUserId(currentUser)) {
      userStorageQuota.textContent = '무제한';
      userStorageUsed.textContent = formatFileSize(usedBytes);
      setUserStorageStatus('관리자 계정은 Archive 파일함과 사용자별 할당 관리 패널을 함께 사용할 수 있습니다.', 'success');
      userStorageCopy.textContent = '테스트 파일을 올리거나 다운로드 흐름을 점검할 수 있고, 아래 관리자 패널에서 일반 사용자 용량도 계속 조정할 수 있습니다.';
      renderUserStorageWarning();
      renderArchiveSidebarSummary();
      return;
    }

    if (!canUserAccessArchive()) {
      userStorageQuota.textContent = '0 MB';
      userStorageUsed.textContent = '0 MB';
      setUserStorageStatus('Archive 접근 권한이 아직 없습니다. 관리자에게 요청하세요.', 'error');
      userStorageCopy.textContent = '권한이 부여되면 이 자리에서 파일 업로드와 공유 기능을 사용할 수 있습니다.';
      renderUserStorageWarning();
      renderArchiveSidebarSummary();
      return;
    }

    const quotaMb = getStorageQuotaMb();
    userStorageQuota.textContent = formatStorageAmount(quotaMb);
    userStorageUsed.textContent = formatFileSize(usedBytes);

    if (quotaMb <= 0) {
      setUserStorageStatus('아직 할당된 스토리지 공간이 없습니다. 필요하면 관리자에게 요청하세요.');
      userStorageCopy.textContent = '할당량이 생기면 이 파일함에서 바로 업로드 제한이 적용되고 사용량이 자동으로 맞춰집니다.';
      renderUserStorageWarning();
      renderArchiveSidebarSummary();
      return;
    }

    const remainingBytes = Math.max(0, quotaMb * STORAGE_MB_BYTES - usedBytes);
    setUserStorageStatus(`현재 ${formatStorageAmount(quotaMb)} 중 ${formatFileSize(remainingBytes)}를 남겨두고 있습니다.`, 'success');
    userStorageCopy.textContent = '업로드한 파일 크기를 기준으로 사용량을 다시 계산합니다. 공유 링크를 만들면 다른 사람도 직접 다운로드할 수 있습니다.';
    renderUserStorageWarning();
    renderArchiveSidebarSummary();
  }

  function setCurrentUserProfile(profile = null) {
    currentUserProfile = profile && typeof profile === 'object'
      ? { ...profile, userId: normalizeUserId(profile.userId || currentUser) }
      : null;
    renderUserStorage();
    renderArchiveAccessGate();
    renderArchiveSidebarSummary();
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
        <button class="admin-storage-card${userId === selectedStorageUserId ? ' is-active' : ''}" type="button" data-storage-user-id="${escapeHtml(userId)}">
          <span class="admin-user-name">${escapeHtml(userId)}</span>
          <span class="admin-user-meta">${escapeHtml(profile.email || '이메일 없음')}</span>
          <span class="admin-user-meta">${escapeHtml(quotaLabel)} · 사용 ${escapeHtml(formatStorageAmount(usedMb))}</span>
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

  function stopArchiveFilesListener() {
    if (typeof archiveFilesUnsubscribe === 'function') {
      archiveFilesUnsubscribe();
      archiveFilesUnsubscribe = null;
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
    }

    let attempts = 0;
    while (!window.db && attempts < 20) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts += 1;
    }

    if (!window.db || !window.collection || !window.doc || !window.setDoc || !window.getDoc) {
      throw new Error('Firebase DB가 초기화되지 않았습니다.');
    }
  }

  async function waitForStorage() {
    if (window.firebaseDataReadyPromise) {
      await window.firebaseDataReadyPromise;
    }

    let attempts = 0;
    while (!window.storage && attempts < 20) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts += 1;
    }

    if (!window.storage || !window.storageRef || (!window.uploadBytes && !window.uploadBytesResumable) || !window.getDownloadURL) {
      throw new Error('Firebase Storage가 초기화되지 않았습니다.');
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
      const snapshot = await window.getDoc(window.doc(window.db, 'userProfiles', normalizedId));
      if (snapshot.exists()) {
        const profile = snapshot.data() || {};
        saveUserProfileCache(normalizedId, profile.email || idToEmail(normalizedId), profile);
        return { userId: normalizedId, ...profile };
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
      ...existingProfile,
      storageQuotaMb: normalizedQuotaMb,
      storageUsedMb: normalizeStorageQuotaMb(existingProfile?.storageUsedMb),
      storageAccessAllowed: archiveAccessAllowed,
      storageAccessEnabled: archiveAccessAllowed,
      storageQuotaAssignedAt: new Date().toISOString(),
      storageQuotaAssignedBy: ADMIN_ACCOUNT.id
    });
  }

  function normalizeArchiveFile(file) {
    const normalized = file && typeof file === 'object' ? file : {};
    return {
      id: String(normalized.id || '').trim(),
      ownerId: normalizeUserId(normalized.ownerId),
      ownerEmail: String(normalized.ownerEmail || '').trim(),
      fileName: String(normalized.fileName || '이름 없는 파일').trim(),
      mimeType: String(normalized.mimeType || 'application/octet-stream').trim(),
      sizeBytes: Math.max(0, Number(normalized.sizeBytes) || 0),
      storagePath: String(normalized.storagePath || '').trim(),
      downloadUrl: String(normalized.downloadUrl || '').trim(),
      createdAt: normalized.createdAt || '',
      updatedAt: normalized.updatedAt || normalized.createdAt || '',
      isShared: Boolean(normalized.isShared),
      shareUpdatedAt: normalized.shareUpdatedAt || '',
      lastDownloadedAt: normalized.lastDownloadedAt || ''
    };
  }

  function buildShareUrl(file) {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('shared', '1');
    url.searchParams.set('id', file.id);
    url.searchParams.set('name', file.fileName);
    url.searchParams.set('type', file.mimeType || 'application/octet-stream');
    url.searchParams.set('size', String(file.sizeBytes || 0));
    url.searchParams.set('download', file.downloadUrl || '');
    return url.toString();
  }

  function getSharedRouteState() {
    const url = new URL(window.location.href);
    if (url.searchParams.get('shared') !== '1') {
      return { active: false };
    }

    const downloadUrl = String(url.searchParams.get('download') || '').trim();
    return {
      active: true,
      id: String(url.searchParams.get('id') || '').trim(),
      fileName: String(url.searchParams.get('name') || '공유 파일').trim(),
      mimeType: String(url.searchParams.get('type') || 'application/octet-stream').trim(),
      sizeBytes: Math.max(0, Number(url.searchParams.get('size')) || 0),
      downloadUrl
    };
  }

  function renderSharedRoutePanel() {
    if (!sharedFilePanel) {
      return;
    }

    const routeState = getSharedRouteState();
    if (!routeState.active) {
      sharedRouteFile = null;
      sharedFilePanel.hidden = true;
      return;
    }

    sharedFilePanel.hidden = false;

    if (!routeState.downloadUrl) {
      sharedRouteFile = null;
      if (sharedFileSummary) {
        sharedFileSummary.hidden = true;
      }
      setSharedFileStatus('공유 링크가 올바르지 않습니다.', 'error');
      return;
    }

    sharedRouteFile = normalizeArchiveFile(routeState);
    if (sharedFileSummary) {
      sharedFileSummary.hidden = false;
    }
    if (sharedFileName) {
      sharedFileName.textContent = sharedRouteFile.fileName;
    }
    if (sharedFileMeta) {
      sharedFileMeta.textContent = `${getFileTypeLabel(sharedRouteFile)} · ${formatFileSize(sharedRouteFile.sizeBytes)} · 링크로 공유된 파일`;
    }
    if (sharedFileOpen) {
      sharedFileOpen.href = sharedRouteFile.downloadUrl;
    }
    setSharedFileStatus('공유 링크가 확인되었습니다. 바로 다운로드하거나 새 탭에서 열 수 있습니다.', 'success');
  }

  function renderArchiveControlsState() {
    const disabled = !canUseArchiveFiles() || isUploadingFiles;

    if (archiveFileInput) {
      archiveFileInput.disabled = disabled;
    }
    if (archiveSearchInput) {
      archiveSearchInput.disabled = !currentUser || !canUseArchiveFiles();
    }
    if (archiveRefreshButton) {
      archiveRefreshButton.disabled = isUploadingFiles;
    }
    if (archiveOpenUploadWindowButton) {
      archiveOpenUploadWindowButton.disabled = !currentUser || !canUseArchiveFiles();
    }
    if (archiveDropzone) {
      archiveDropzone.classList.toggle('is-disabled', disabled);
    }

    archiveFilterButtons.forEach((button) => {
      button.disabled = !currentUser || !canUseArchiveFiles();
      button.classList.toggle('is-active', button.dataset.filter === currentFilter);
    });

    archiveViewButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.viewMode === currentViewMode);
    });
  }

  function resetArchiveDragState() {
    dragDepth = 0;
    if (archiveDropzone) {
      archiveDropzone.classList.remove('is-dragover');
    }
  }

  function openArchiveUploadWindow() {
    if (!currentUser || !canUseArchiveFiles()) {
      setArchiveFileStatus('로그인과 Archive 권한 확인 후 업로드 전용 창을 열 수 있습니다.', 'error');
      return;
    }

    const popup = window.open('archive-upload.html', 'seolhwaArchiveUpload', 'width=960,height=760,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes');
    if (!popup) {
      setArchiveFileStatus('새창이 차단되었습니다. 브라우저에서 팝업을 허용한 뒤 다시 시도하세요.', 'error');
      return;
    }

    popup.focus();
    setArchiveFileStatus('업로드 전용 새창을 열었습니다. 업로드가 끝나면 이 목록에 바로 반영됩니다.', 'success');
  }

  function filterArchiveFiles() {
    const searchTerm = currentSearchTerm.trim().toLowerCase();

    return currentFiles.filter((file) => {
      if (currentFilter === 'shared' && !file.isShared) {
        return false;
      }
      if (currentFilter === 'images' && resolveArchiveFileCategory(file) !== 'image') {
        return false;
      }
      if (currentFilter === 'documents' && resolveArchiveFileCategory(file) === 'image') {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      const haystack = [file.fileName, file.mimeType, getFileExtension(file.fileName), getFileTypeLabel(file)]
        .join(' ')
        .toLowerCase();
      return haystack.includes(searchTerm);
    });
  }

  function buildArchiveFilePreview(file) {
    if (resolveArchiveFileCategory(file) === 'image' && file.downloadUrl) {
      return `<img src="${escapeHtml(file.downloadUrl)}" alt="${escapeHtml(file.fileName)} 미리보기" loading="lazy" />`;
    }

    return `<span class="archive-file-icon">${getFileMonogram(file)}</span>`;
  }

  function renderArchiveFiles() {
    if (!archiveFileList || !archiveFileEmpty) {
      return;
    }

    renderArchiveControlsState();
    renderArchiveSidebarSummary();
    renderUserStorageWarning();

    archiveFileList.classList.toggle('is-list', currentViewMode === 'list');

    if (!currentUser) {
      archiveFileList.innerHTML = '';
      archiveFileEmpty.hidden = false;
      archiveFileEmpty.textContent = '메인 페이지에서 로그인하면 개인 파일함과 공유 기능을 사용할 수 있습니다.';
      return;
    }

    if (!canUseArchiveFiles()) {
      archiveFileList.innerHTML = '';
      archiveFileEmpty.hidden = false;
      archiveFileEmpty.textContent = 'Archive 접근 권한과 스토리지 할당량이 있어야 파일을 업로드하고 관리할 수 있습니다.';
      return;
    }

    const visibleFiles = filterArchiveFiles();
    if (!visibleFiles.length) {
      archiveFileList.innerHTML = '';
      archiveFileEmpty.hidden = false;
      archiveFileEmpty.textContent = currentFiles.length
        ? '현재 필터와 검색어에 맞는 파일이 없습니다.'
        : '아직 파일이 없습니다. 위의 업로드 버튼으로 첫 파일을 추가해 보세요.';
      return;
    }

    archiveFileEmpty.hidden = true;
    archiveFileList.innerHTML = visibleFiles.map((file) => {
      const updatedAt = file.updatedAt || file.createdAt;
      const metaText = `${getFileTypeLabel(file)} · ${formatFileSize(file.sizeBytes)} · ${formatApprovalDate(updatedAt)}`;
      const shareTag = file.isShared ? '<span class="archive-file-tag is-shared">공유 링크 켜짐</span>' : '';
      const downloadTag = file.lastDownloadedAt ? `<span class="archive-file-tag">최근 다운로드 ${escapeHtml(formatApprovalDate(file.lastDownloadedAt))}</span>` : '';
      return `
        <article class="archive-file-card" data-file-id="${escapeHtml(file.id)}">
          <div class="archive-file-preview">${buildArchiveFilePreview(file)}</div>
          <div class="archive-file-body">
            <h3 class="archive-file-name">${escapeHtml(file.fileName)}</h3>
            <p class="archive-file-meta">${escapeHtml(metaText)}</p>
            <div class="archive-file-tags">
              <span class="archive-file-tag">${escapeHtml(file.mimeType || 'application/octet-stream')}</span>
              ${shareTag}
              ${downloadTag}
            </div>
            <div class="archive-file-actions">
              <button class="archive-file-action primary" type="button" data-action="download" data-file-id="${escapeHtml(file.id)}">다운로드</button>
              <button class="archive-file-action" type="button" data-action="share" data-file-id="${escapeHtml(file.id)}">공유</button>
              <button class="archive-file-action" type="button" data-action="open" data-file-id="${escapeHtml(file.id)}">열기</button>
              <button class="archive-file-action" type="button" data-action="delete" data-file-id="${escapeHtml(file.id)}">삭제</button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  async function syncCurrentUserStorageUsageFromFiles() {
    if (isSyncingStorageUsage || !currentUser || isAdminUserId(currentUser) || !canUserAccessArchive()) {
      return;
    }

    const nextUsedMb = normalizeStorageQuotaMb(Math.ceil(getCurrentFilesTotalBytes() / STORAGE_MB_BYTES));
    if (nextUsedMb === getStorageUsedMb(currentUserProfile)) {
      renderUserStorage();
      return;
    }

    isSyncingStorageUsage = true;
    try {
      const existingProfile = currentUserProfile || await getUserProfile(currentUser, { preferFresh: true });
      if (!existingProfile) {
        return;
      }

      const email = existingProfile.email || idToEmail(currentUser);
      const mergedProfile = {
        ...existingProfile,
        storageUsedMb: nextUsedMb,
        storageUsageSyncedAt: new Date().toISOString()
      };

      await saveUserProfile(currentUser, email, mergedProfile);
      setCurrentUserProfile(mergedProfile);
    } finally {
      isSyncingStorageUsage = false;
    }
  }

  function startArchiveFilesListener() {
    stopArchiveFilesListener();
    currentFiles = [];
    renderArchiveFiles();

    if (!currentUser) {
      setArchiveFileStatus('로그인하면 개인 파일함을 불러옵니다.');
      return;
    }

    if (!canUseArchiveFiles()) {
      setArchiveFileStatus('Archive 접근 권한이 있어야 파일함을 사용할 수 있습니다.', 'error');
      return;
    }

    if (!window.collection || !window.onSnapshot || !window.db) {
      setArchiveFileStatus('파일 목록을 연결할 수 없습니다.', 'error');
      return;
    }

    setArchiveFileStatus('파일 목록을 불러오는 중입니다.');
    archiveFilesUnsubscribe = window.onSnapshot(window.collection(window.db, archiveFilesCollectionName), (snapshot) => {
      const nextFiles = [];
      snapshot.forEach((docSnapshot) => {
        const file = normalizeArchiveFile({ id: docSnapshot.id, ...docSnapshot.data() });
        if (file.ownerId === currentUser) {
          nextFiles.push(file);
        }
      });

      nextFiles.sort((left, right) => {
        const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
        const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
        return rightTime - leftTime;
      });

      currentFiles = nextFiles;
      renderArchiveFiles();
      syncCurrentUserStorageUsageFromFiles();
      if (currentFiles.length) {
        setArchiveFileStatus(`파일 ${currentFiles.length}개를 불러왔습니다.`, 'success');
      } else {
        setArchiveFileStatus('업로드할 준비가 완료되었습니다.', 'success');
      }
      if (activeShareFileId) {
        renderArchiveShareDialog();
      }
    }, (error) => {
      console.error('[Archive] archive files listener error', error);
      currentFiles = [];
      renderArchiveFiles();
      setArchiveFileStatus('파일 목록을 불러오는 중 오류가 발생했습니다.', 'error');
    });
  }

  function openArchiveShareDialog(fileId) {
    activeShareFileId = String(fileId || '');
    renderArchiveShareDialog();
    if (archiveShareModal) {
      archiveShareModal.classList.add('is-open');
      archiveShareModal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeArchiveShareDialog() {
    activeShareFileId = '';
    if (archiveShareModal) {
      archiveShareModal.classList.remove('is-open');
      archiveShareModal.setAttribute('aria-hidden', 'true');
    }
  }

  function renderArchiveShareDialog() {
    const file = currentFiles.find((item) => item.id === activeShareFileId) || null;

    if (!file) {
      if (archiveShareFileName) {
        archiveShareFileName.textContent = '선택한 파일 없음';
      }
      if (archiveShareFileMeta) {
        archiveShareFileMeta.textContent = '공유할 파일을 선택하면 링크와 상태가 여기에 표시됩니다.';
      }
      if (archiveShareLink) {
        archiveShareLink.value = '';
      }
      if (archiveShareCopy) {
        archiveShareCopy.disabled = true;
      }
      if (archiveShareToggle) {
        archiveShareToggle.disabled = true;
        archiveShareToggle.textContent = '공유 링크 만들기';
      }
      setArchiveShareStatus('공유할 파일을 먼저 선택하세요.');
      return;
    }

    if (archiveShareFileName) {
      archiveShareFileName.textContent = file.fileName;
    }
    if (archiveShareFileMeta) {
      archiveShareFileMeta.textContent = `${getFileTypeLabel(file)} · ${formatFileSize(file.sizeBytes)} · ${file.isShared ? '공유 링크 켜짐' : '비공개'}`;
    }
    if (archiveShareLink) {
      archiveShareLink.value = file.isShared ? buildShareUrl(file) : '';
    }
    if (archiveShareCopy) {
      archiveShareCopy.disabled = !file.isShared;
    }
    if (archiveShareToggle) {
      archiveShareToggle.disabled = false;
      archiveShareToggle.textContent = file.isShared ? '공유 링크 끄기' : '공유 링크 만들기';
    }
    setArchiveShareStatus(
      file.isShared
        ? '공유 링크가 켜져 있습니다. 이미 전달된 링크는 파일을 삭제하기 전까지 동작할 수 있습니다.'
        : '공유 링크를 켜면 상대방이 로그인 없이 이 파일을 내려받을 수 있습니다.'
    );
  }

  async function updateArchiveFileShareState(fileId, enabled) {
    const file = currentFiles.find((item) => item.id === fileId);
    if (!file) {
      return;
    }

    try {
      await waitForFirestore();
      await window.setDoc(window.doc(window.db, archiveFilesCollectionName, fileId), {
        isShared: Boolean(enabled),
        shareUpdatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setArchiveShareStatus(Boolean(enabled) ? '공유 링크를 만들었습니다.' : '공유 링크 생성을 중지했습니다.', 'success');
    } catch (error) {
      console.error('[Archive] update share state error', error);
      setArchiveShareStatus('공유 상태를 저장하지 못했습니다.', 'error');
    }
  }

  async function copyText(value) {
    const text = String(value || '').trim();
    if (!text) {
      return false;
    }

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (error) {
      console.warn('[Archive] clipboard copy failed', error);
    }

    if (archiveShareLink) {
      archiveShareLink.focus();
      archiveShareLink.select();
      return document.execCommand('copy');
    }

    return false;
  }

  async function downloadArchiveFile(file, options = {}) {
    const targetFile = file && typeof file === 'object' ? file : null;
    if (!targetFile?.downloadUrl) {
      return;
    }

    const anchor = document.createElement('a');
    anchor.href = targetFile.downloadUrl;
    anchor.download = targetFile.fileName || 'download';
    anchor.target = '_blank';
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    if (!options.track || !targetFile.id || !window.setDoc || !window.doc || !window.db) {
      return;
    }

    try {
      await waitForFirestore();
      await window.setDoc(window.doc(window.db, archiveFilesCollectionName, targetFile.id), {
        lastDownloadedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.warn('[Archive] track download error', error);
    }
  }

  async function uploadArchiveFile(file, position, totalCount) {
    await waitForFirestore();
    await waitForStorage();

    const fileId = createArchiveFileId();
    const safeName = sanitizeStorageFileName(file.name);
    const timestamp = Date.now();
    const objectPath = `archive-files/${currentUser}/${fileId}/${timestamp}-${safeName}`;
    const storageReference = window.storageRef(window.storage, objectPath);
    const metadata = {
      contentType: file.type || 'application/octet-stream'
    };

    setUploadProgress(true, {
      label: `${position}/${totalCount} 업로드 중`,
      percent: 0,
      copy: `${file.name} 업로드를 시작합니다.`
    });

    let snapshot;
    if (window.uploadBytesResumable) {
      snapshot = await new Promise((resolve, reject) => {
        const uploadTask = window.uploadBytesResumable(storageReference, file, metadata);
        uploadTask.on('state_changed', (taskSnapshot) => {
          const totalBytes = taskSnapshot.totalBytes || file.size || 1;
          const percent = (taskSnapshot.bytesTransferred / totalBytes) * 100;
          setUploadProgress(true, {
            label: `${position}/${totalCount} 업로드 중`,
            percent,
            copy: `${file.name} · ${formatFileSize(taskSnapshot.bytesTransferred)} / ${formatFileSize(totalBytes)}`
          });
        }, reject, () => resolve(uploadTask.snapshot));
      });
    } else {
      snapshot = await window.uploadBytes(storageReference, file, metadata);
      setUploadProgress(true, {
        label: `${position}/${totalCount} 업로드 완료`,
        percent: 100,
        copy: `${file.name} 업로드를 마쳤습니다.`
      });
    }

    const downloadUrl = await window.getDownloadURL(snapshot.ref);
    const now = new Date().toISOString();
    const fileRecord = {
      id: fileId,
      ownerId: currentUser,
      ownerEmail: currentUserProfile?.email || idToEmail(currentUser),
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: Number(file.size) || 0,
      storagePath: snapshot.metadata?.fullPath || objectPath,
      downloadUrl,
      createdAt: now,
      updatedAt: now,
      isShared: false,
      shareUpdatedAt: ''
    };

    await window.setDoc(window.doc(window.db, archiveFilesCollectionName, fileId), fileRecord, { merge: true });
  }

  async function handleArchiveFileSelection(files) {
    const nextFiles = Array.from(files || []).filter(Boolean);
    if (!nextFiles.length) {
      return;
    }

    if (!currentUser) {
      setArchiveFileStatus('로그인 후 파일을 업로드할 수 있습니다.', 'error');
      return;
    }

    if (!canUseArchiveFiles()) {
      setArchiveFileStatus('Archive 접근 권한과 할당량이 있어야 업로드할 수 있습니다.', 'error');
      return;
    }

    const quotaBytes = isAdminUserId(currentUser) ? Number.POSITIVE_INFINITY : getStorageQuotaMb() * STORAGE_MB_BYTES;
    let usedBytes = getCurrentFilesTotalBytes();
    const skippedNames = [];

    isUploadingFiles = true;
    renderArchiveControlsState();

    try {
      for (let index = 0; index < nextFiles.length; index += 1) {
        const file = nextFiles[index];
        if (!isAdminUserId(currentUser) && quotaBytes > 0 && usedBytes + file.size > quotaBytes) {
          skippedNames.push(file.name);
          continue;
        }

        await uploadArchiveFile(file, index + 1, nextFiles.length);
        usedBytes += Number(file.size) || 0;
      }

      if (skippedNames.length && skippedNames.length === nextFiles.length) {
        setArchiveFileStatus('현재 남은 공간으로는 업로드할 수 없습니다.', 'error');
      } else if (skippedNames.length) {
        setArchiveFileStatus(`일부 파일을 올렸고 ${skippedNames.length}개는 용량 부족으로 건너뛰었습니다.`, 'success');
      } else {
        setArchiveFileStatus(`${nextFiles.length}개 파일 업로드를 완료했습니다.`, 'success');
      }
    } catch (error) {
      console.error('[Archive] upload file error', error);
      setArchiveFileStatus('파일 업로드 중 오류가 발생했습니다.', 'error');
    } finally {
      isUploadingFiles = false;
      renderArchiveControlsState();
      setUploadProgress(false);
      if (archiveFileInput) {
        archiveFileInput.value = '';
      }
    }
  }

  async function deleteArchiveFile(fileId) {
    const file = currentFiles.find((item) => item.id === fileId);
    if (!file) {
      return;
    }

    const confirmed = window.confirm(`"${file.fileName}" 파일을 삭제하시겠습니까? 공유 링크가 있었다면 함께 사용할 수 없게 됩니다.`);
    if (!confirmed) {
      return;
    }

    try {
      setArchiveFileStatus(`${file.fileName} 파일을 삭제하는 중입니다.`);
      await waitForFirestore();
      await waitForStorage();
      if (file.storagePath && window.deleteObject) {
        await window.deleteObject(window.storageRef(window.storage, file.storagePath));
      }
      if (window.deleteDoc) {
        await window.deleteDoc(window.doc(window.db, archiveFilesCollectionName, file.id));
      }
      if (activeShareFileId === file.id) {
        closeArchiveShareDialog();
      }
      setArchiveFileStatus(`${file.fileName} 파일을 삭제했습니다.`, 'success');
    } catch (error) {
      console.error('[Archive] delete file error', error);
      setArchiveFileStatus('파일 삭제 중 오류가 발생했습니다.', 'error');
    }
  }

  function openArchiveFile(fileId) {
    const file = currentFiles.find((item) => item.id === fileId);
    if (!file?.downloadUrl) {
      return;
    }

    window.open(file.downloadUrl, '_blank', 'noopener');
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
    startArchiveFilesListener();
    startAdminProfilesListener();
  }

  function resetArchiveUI() {
    currentUser = '';
    currentFiles = [];
    stopCurrentUserProfileListener();
    stopAdminProfilesListener();
    stopArchiveFilesListener();
    setCurrentUserProfile(null);
    if (adminStoragePanel) {
      adminStoragePanel.hidden = true;
    }
    clearAdminStorageManager();
    renderUserStorage();
    renderArchiveFiles();
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

  if (archiveFileInput) {
    archiveFileInput.addEventListener('change', (event) => {
      handleArchiveFileSelection(event.target.files);
    });
  }

  if (archiveOpenUploadWindowButton) {
    archiveOpenUploadWindowButton.addEventListener('click', openArchiveUploadWindow);
  }

  if (archiveDropzone) {
    archiveDropzone.addEventListener('dragenter', (event) => {
      if (!canUseArchiveFiles() || isUploadingFiles) {
        return;
      }
      event.preventDefault();
      dragDepth += 1;
      archiveDropzone.classList.add('is-dragover');
    });

    archiveDropzone.addEventListener('dragover', (event) => {
      if (!canUseArchiveFiles() || isUploadingFiles) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      archiveDropzone.classList.add('is-dragover');
    });

    archiveDropzone.addEventListener('dragleave', (event) => {
      if (!canUseArchiveFiles() || isUploadingFiles) {
        return;
      }
      event.preventDefault();
      dragDepth = Math.max(0, dragDepth - 1);
      if (dragDepth === 0) {
        archiveDropzone.classList.remove('is-dragover');
      }
    });

    archiveDropzone.addEventListener('drop', (event) => {
      if (!canUseArchiveFiles() || isUploadingFiles) {
        return;
      }
      event.preventDefault();
      const files = event.dataTransfer?.files;
      resetArchiveDragState();
      if (files?.length) {
        handleArchiveFileSelection(files);
      }
    });
  }

  if (archiveRefreshButton) {
    archiveRefreshButton.addEventListener('click', () => {
      renderSharedRoutePanel();
      startArchiveFilesListener();
    });
  }

  if (archiveSearchInput) {
    archiveSearchInput.addEventListener('input', () => {
      currentSearchTerm = archiveSearchInput.value || '';
      renderArchiveFiles();
    });
  }

  archiveFilterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      currentFilter = button.dataset.filter || 'all';
      renderArchiveFiles();
    });
  });

  archiveViewButtons.forEach((button) => {
    button.addEventListener('click', () => {
      currentViewMode = button.dataset.viewMode === 'list' ? 'list' : 'grid';
      localStorage.setItem(archiveViewModeStorageKey, currentViewMode);
      renderArchiveFiles();
    });
  });

  if (archiveFileList) {
    archiveFileList.addEventListener('click', async (event) => {
      const target = event.target.closest('[data-action][data-file-id]');
      if (!target) {
        return;
      }

      const fileId = String(target.dataset.fileId || '');
      const action = String(target.dataset.action || '');
      const file = currentFiles.find((item) => item.id === fileId);
      if (!file) {
        return;
      }

      if (action === 'download') {
        await downloadArchiveFile(file, { track: true });
        return;
      }
      if (action === 'share') {
        openArchiveShareDialog(fileId);
        return;
      }
      if (action === 'open') {
        openArchiveFile(fileId);
        return;
      }
      if (action === 'delete') {
        await deleteArchiveFile(fileId);
      }
    });
  }

  if (archiveShareClose) {
    archiveShareClose.addEventListener('click', closeArchiveShareDialog);
  }

  if (archiveShareModal) {
    archiveShareModal.addEventListener('click', (event) => {
      if (event.target === archiveShareModal) {
        closeArchiveShareDialog();
      }
    });
  }

  if (archiveShareToggle) {
    archiveShareToggle.addEventListener('click', async () => {
      if (!activeShareFileId) {
        return;
      }

      const file = currentFiles.find((item) => item.id === activeShareFileId);
      if (!file) {
        return;
      }

      await updateArchiveFileShareState(file.id, !file.isShared);
    });
  }

  if (archiveShareCopy) {
    archiveShareCopy.addEventListener('click', async () => {
      const text = archiveShareLink ? archiveShareLink.value : '';
      const copied = await copyText(text);
      setArchiveShareStatus(copied ? '공유 링크를 복사했습니다.' : '링크를 복사하지 못했습니다.', copied ? 'success' : 'error');
    });
  }

  if (sharedFileDownload) {
    sharedFileDownload.addEventListener('click', async () => {
      if (!sharedRouteFile) {
        return;
      }

      await downloadArchiveFile(sharedRouteFile, { track: false });
    });
  }

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && archiveShareModal?.classList.contains('is-open')) {
      closeArchiveShareDialog();
    }
  });

  window.addEventListener('dragend', resetArchiveDragState);
  window.addEventListener('drop', (event) => {
    if (event.target === document.documentElement || event.target === document.body) {
      event.preventDefault();
      resetArchiveDragState();
    }
  });

  initializeTheme();
  renderSharedRoutePanel();
  renderUserStorage();
  renderArchiveFiles();
  renderArchiveAccessGate();
  clearAdminStorageManager();
  initializeAuth();
})();
