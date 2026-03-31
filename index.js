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
      const targetId = link.getAttribute('href');
      if (!targetId || !targetId.startsWith('#')) {
        return;
      }

      event.preventDefault();

      if (window.clearPostRoute) {
        window.clearPostRoute(true);
      }

      // 링크 active 상태 관리
      navLinks.forEach((nav) => nav.classList.remove('active'));
      link.classList.add('active');

      if (targetId === '#') {
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
  const adminSpectrumStorageKey = 'seolhwa-admin-spectrum-theme';

  function applyAdminSpectrumTheme(enabled, options = {}) {
    const shouldEnable = Boolean(enabled);
    html.setAttribute('data-admin-spectrum', shouldEnable ? 'on' : 'off');
    document.body.classList.toggle('admin-spectrum', shouldEnable);

    if (options.persist !== false) {
      localStorage.setItem(adminSpectrumStorageKey, shouldEnable ? 'on' : 'off');
    }

    window.dispatchEvent(new CustomEvent('seolhwa-spectrum-change', {
      detail: { enabled: shouldEnable }
    }));
  }

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
  applyAdminSpectrumTheme(localStorage.getItem(adminSpectrumStorageKey) === 'on', { persist: false });

  if (!themeToggle) return;
  themeToggle.addEventListener('change', () => {
    const newTheme = themeToggle.checked ? 'dark' : 'light';
    applyTheme(newTheme);
  });

  window.seolhwaThemeController = {
    applyTheme,
    applyAdminSpectrumTheme,
    isSpectrumEnabled() {
      return html.getAttribute('data-admin-spectrum') === 'on';
    }
  };
}

function setupGridInteraction() {
  const cards = document.querySelectorAll('.item');
  cards.forEach((card) => {
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
  const cancelEditBtn = document.getElementById('post-cancel-edit');
  const postFormTitle = document.getElementById('post-form-title');
  const postFormCopy = document.getElementById('post-form-copy');
  const postFormStatus = document.getElementById('post-form-status');
  const postsList = document.getElementById('posts-list');
  const myPostsList = document.getElementById('my-posts-list');
  const myPostsSection = document.getElementById('my-posts');
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
  const adminOpenApprovalButton = document.getElementById('admin-open-approval');
  const adminOpenUserPostsButton = document.getElementById('admin-open-user-posts');
  const adminOpenSpectrumUsersButton = document.getElementById('admin-open-spectrum-users');
  const adminOpenStorageUsersButton = document.getElementById('admin-open-storage-users');
  const adminApprovalView = document.getElementById('admin-approval-view');
  const adminUserBrowserView = document.getElementById('admin-user-browser-view');
  const adminSpectrumUsersView = document.getElementById('admin-spectrum-users-view');
  const adminStorageUsersView = document.getElementById('admin-storage-users-view');
  const approvalAdminStatus = document.getElementById('approval-admin-status');
  const approvalList = document.getElementById('approval-list');
  const adminSpectrumToggle = document.getElementById('admin-spectrum-toggle');
  const adminSpectrumToggleCopy = document.getElementById('admin-spectrum-toggle-copy');
  const adminUserStatus = document.getElementById('admin-user-status');
  const adminUserList = document.getElementById('admin-user-list');
  const adminUserPostsTitle = document.getElementById('admin-user-posts-title');
  const adminUserPostsCopy = document.getElementById('admin-user-posts-copy');
  const adminUserPostsList = document.getElementById('admin-user-posts-list');
  const adminSpectrumUserStatus = document.getElementById('admin-spectrum-user-status');
  const adminSpectrumUserList = document.getElementById('admin-spectrum-user-list');
  const adminSpectrumSelectedUser = document.getElementById('admin-spectrum-selected-user');
  const adminSpectrumSelectedCopy = document.getElementById('admin-spectrum-selected-copy');
  const adminSpectrumSelectedStatus = document.getElementById('admin-spectrum-selected-status');
  const adminSpectrumSelectedMeta = document.getElementById('admin-spectrum-selected-meta');
  const adminSpectrumSelectedHelper = document.getElementById('admin-spectrum-selected-helper');
  const adminSpectrumSelectedUpdated = document.getElementById('admin-spectrum-selected-updated');
  const adminSpectrumGrantButton = document.getElementById('admin-spectrum-grant');
  const adminSpectrumRevokeButton = document.getElementById('admin-spectrum-revoke');
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
  const userSpectrumSection = document.getElementById('user-spectrum-panel');
  const userSpectrumToggle = document.getElementById('user-spectrum-toggle');
  const userSpectrumToggleCopy = document.getElementById('user-spectrum-toggle-copy');
  const userStorageSection = document.getElementById('user-storage-panel');
  const userStorageStatus = document.getElementById('user-storage-status');
  const userStorageQuota = document.getElementById('user-storage-quota');
  const userStorageUsed = document.getElementById('user-storage-used');
  const userStorageCopy = document.getElementById('user-storage-copy');

  let currentUser = null;
  let currentPosts = [];
  const postsStorageKey = 'seolhwa-posts';
  const localAuthStorageKey = 'seolhwa-local-auth';
  const userProfilesStorageKey = 'seolhwa-user-profiles';
  let authObserverInitialized = false;
  let authMode = 'firebase';
  let approvalUnsubscribe = null;
  let currentUserProfileUnsubscribe = null;
  let editingPostId = null;
  let activeAdminView = 'approval';
  let selectedAdminUserId = '';
  let selectedSpectrumUserId = '';
  let selectedStorageUserId = '';
  let latestAdminProfiles = [];
  let currentUserProfile = null;

  const ADMIN_ACCOUNT = {
    id: 'seolhwa0508',
    passwordHash: '2cf68f668b30b2d474189b1543c09c4e941423d2ece91d7cc1dbc71fe267f234'
  };
  const MAX_POST_DOCUMENT_BYTES = 900 * 1024;
  const MAX_IMAGE_DATA_URL_BYTES = 700 * 1024;
  const IMAGE_MAX_DIMENSION = 1600;
  const POST_PAYLOAD_BUFFER_BYTES = 24 * 1024;

  function setPostFormStatus(message = '', type = 'info') {
    if (!postFormStatus) return;

    postFormStatus.textContent = message;
    postFormStatus.style.display = message ? 'block' : 'none';
    postFormStatus.style.background = type === 'error'
      ? 'rgba(239,68,68,0.12)'
      : type === 'success'
        ? 'rgba(34,197,94,0.12)'
        : 'rgba(3,102,214,0.08)';
    postFormStatus.style.color = type === 'error'
      ? '#b91c1c'
      : type === 'success'
        ? '#166534'
        : 'var(--text)';
  }

  function resetPostForm() {
    editingPostId = null;
    if (postFormTitle) postFormTitle.textContent = '나만의 글 작성';
    if (postFormCopy) postFormCopy.textContent = '관리자 글은 공개 목록에 보이고, 일반 회원 글은 내 글 공간에만 저장됩니다. 공유가 필요하면 글 상세에서 별도 링크를 만들 수 있습니다.';
    if (submitBtn) submitBtn.textContent = '저장';
    if (cancelEditBtn) cancelEditBtn.style.display = 'none';
    if (postTitleInput) postTitleInput.value = '';
    if (postSubtitleInput) postSubtitleInput.value = '';
    if (postInput) postInput.value = '';
    if (postImageInput) postImageInput.value = '';
    setPostFormStatus('', 'info');
  }

  function getPostById(postId) {
    return currentPosts.find((post) => String(post.id) === String(postId)) || null;
  }

  function canManagePost(post) {
    return Boolean(post) && (isPostOwner(post) || isAdminUserId(currentUser));
  }

  function enterEditMode(post) {
    if (!post || !canManagePost(post)) {
      return;
    }

    editingPostId = post.id;
    if (postFormTitle) postFormTitle.textContent = '글 수정';
    if (postFormCopy) postFormCopy.textContent = '제목, 부제목, 본문을 수정하고 저장하세요. 이미지를 새로 올리지 않으면 기존 이미지가 유지됩니다.';
    if (submitBtn) submitBtn.textContent = '수정 저장';
    if (cancelEditBtn) cancelEditBtn.style.display = 'inline-flex';
    if (postTitleInput) postTitleInput.value = post.title || '';
    if (postSubtitleInput) postSubtitleInput.value = post.subtitle || '';
    if (postInput) postInput.value = post.content || '';
    if (postImageInput) postImageInput.value = '';
    setPostFormStatus('수정 모드입니다. 저장하면 기존 글이 업데이트됩니다.', 'info');

    const postWriteSection = document.getElementById('post-write');
    if (postWriteSection) {
      postWriteSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (postTitleInput) {
      postTitleInput.focus();
    }
  }

  function idToEmail(id) {
    const normalizedId = String(id || '').trim().toLowerCase();
    return `${normalizedId}@seolhwa.dev`;
  }

  function createPostId() {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
    return `post-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }

  function createShareToken() {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID().replace(/-/g, '');
    }
    return `${Date.now()}${Math.random().toString(16).slice(2, 12)}`;
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

  function canUserUseSpectrumTheme(userId = currentUser, profile = currentUserProfile) {
    return isAdminUserId(userId) || Boolean(profile?.spectrumThemeAllowed);
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

  function canUserUseStorage(userId = currentUser, profile = currentUserProfile) {
    if (!userId || isAdminUserId(userId)) {
      return false;
    }

    return getStorageQuotaMb(profile) > 0;
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

  function estimateStringBytes(value) {
    try {
      return new TextEncoder().encode(String(value || '')).length;
    } catch (error) {
      return new Blob([String(value || '')]).size;
    }
  }

  function getPostPayloadBytes(post) {
    return estimateStringBytes(JSON.stringify(post || {}));
  }

  function getImageBudgetBytesForPostDraft({
    title = '',
    subtitle = '',
    content = '',
    user = currentUser,
    existingPost = null
  } = {}) {
    const ownerId = normalizeUserId(existingPost?.ownerId || user || '');
    const draft = normalizePost({
      ...existingPost,
      id: existingPost?.id || createPostId(),
      user: existingPost?.user || user || '익명',
      ownerId,
      visibility: existingPost?.visibility || (isAdminUserId(ownerId) ? 'public' : 'private'),
      title: title && title.trim() ? title.trim() : '제목 없음',
      subtitle: subtitle.trim(),
      content,
      imageDataUrl: '',
      createdAt: existingPost?.createdAt || new Date().toISOString(),
      sharedToken: existingPost?.sharedToken || '',
      slug: existingPost?.slug || ''
    });

    const availableBytes = MAX_POST_DOCUMENT_BYTES - getPostPayloadBytes(draft) - POST_PAYLOAD_BUFFER_BYTES;
    return Math.max(0, Math.min(MAX_IMAGE_DATA_URL_BYTES, availableBytes));
  }

  function createPostUploadError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  function getSubmitErrorMessage(error, fallbackMessage) {
    const code = String(error?.code || '').toLowerCase();

    if (code === 'post/image-too-large' || code === 'post/payload-too-large') {
      return '사진과 글의 총 용량이 커서 업로드할 수 없습니다. 사진 크기를 더 줄이거나 본문 길이를 조금 줄여서 다시 시도해주세요.';
    }

    if (code.includes('permission-denied')) {
      return '저장 권한이 확인되지 않았습니다. 다시 로그인한 뒤 재시도해주세요.';
    }

    return fallbackMessage;
  }

  function shouldFallbackToLocalPostSave(error) {
    const code = String(error?.code || '').toLowerCase();
    const message = String(error?.message || '').toLowerCase();

    return !window.db
      || code.includes('unavailable')
      || code.includes('network-request-failed')
      || message.includes('client is offline')
      || message.includes('failed to get document because the client is offline')
      || message.includes('firebase db가 초기화되지 않았습니다')
      || message.includes('firebase 연결 실패');
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(createPostUploadError('post/image-read-failed', '이미지를 불러오는 중 오류가 발생했습니다.'));
      reader.readAsDataURL(file);
    });
  }

  function loadImageElement(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(createPostUploadError('post/image-read-failed', '이미지를 처리할 수 없습니다.'));
      image.src = dataUrl;
    });
  }

  function getResizedDimensions(width, height, maxDimension = IMAGE_MAX_DIMENSION) {
    const safeWidth = Math.max(1, Number(width) || 1);
    const safeHeight = Math.max(1, Number(height) || 1);
    const largestSide = Math.max(safeWidth, safeHeight);

    if (largestSide <= maxDimension) {
      return { width: safeWidth, height: safeHeight };
    }

    const scale = maxDimension / largestSide;
    return {
      width: Math.max(1, Math.round(safeWidth * scale)),
      height: Math.max(1, Math.round(safeHeight * scale))
    };
  }

  async function buildPostImageDataUrl(file, options = {}) {
    if (!file) {
      return null;
    }

    const requestedMaxBytes = Number(options.maxBytes);
    const maxBytes = Math.max(
      0,
      Math.min(
        MAX_IMAGE_DATA_URL_BYTES,
        Number.isFinite(requestedMaxBytes) ? requestedMaxBytes : MAX_IMAGE_DATA_URL_BYTES
      )
    );

    if (maxBytes <= 0) {
      throw createPostUploadError('post/payload-too-large', '게시물에 사용할 수 있는 이미지 용량이 부족합니다.');
    }

    const originalDataUrl = await readFileAsDataUrl(file);
    if (!String(file.type || '').startsWith('image/')) {
      if (estimateStringBytes(originalDataUrl) > maxBytes) {
        throw createPostUploadError('post/image-too-large', '첨부 파일 용량이 너무 큽니다.');
      }
      return originalDataUrl;
    }

    const image = await loadImageElement(originalDataUrl);
    const initialSize = getResizedDimensions(image.naturalWidth || image.width, image.naturalHeight || image.height);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: false });

    if (!context) {
      throw createPostUploadError('post/image-read-failed', '이미지 변환을 시작할 수 없습니다.');
    }

    let width = initialSize.width;
    let height = initialSize.height;
    let quality = 0.86;
    let result = '';

    const renderImage = () => {
      canvas.width = width;
      canvas.height = height;
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      result = canvas.toDataURL('image/jpeg', quality);
    };

    renderImage();

    while (estimateStringBytes(result) > maxBytes && quality > 0.5) {
      quality = Math.max(0.5, Number((quality - 0.08).toFixed(2)));
      renderImage();
    }

    while (estimateStringBytes(result) > maxBytes && (width > 640 || height > 640)) {
      width = width > 640 ? Math.max(640, Math.round(width * 0.85)) : width;
      height = height > 640 ? Math.max(640, Math.round(height * 0.85)) : height;
      quality = Math.min(quality, 0.72);
      renderImage();
    }

    if (estimateStringBytes(result) > maxBytes) {
      throw createPostUploadError('post/image-too-large', '이미지 용량이 너무 큽니다.');
    }

    return result;
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

  function toggleUserSpectrumSection(visible) {
    if (!userSpectrumSection) return;
    userSpectrumSection.classList.toggle('is-visible', visible);
  }

  function toggleUserStorageSection(visible) {
    if (!userStorageSection) return;
    userStorageSection.classList.toggle('is-visible', visible);
  }

  function setAdminView(view) {
    const nextView = view === 'users' || view === 'spectrum-users' || view === 'storage-users' ? view : 'approval';
    activeAdminView = nextView;

    if (adminOpenApprovalButton) {
      adminOpenApprovalButton.classList.toggle('is-active', nextView === 'approval');
      adminOpenApprovalButton.setAttribute('aria-pressed', nextView === 'approval' ? 'true' : 'false');
    }
    if (adminOpenUserPostsButton) {
      adminOpenUserPostsButton.classList.toggle('is-active', nextView === 'users');
      adminOpenUserPostsButton.setAttribute('aria-pressed', nextView === 'users' ? 'true' : 'false');
    }
    if (adminOpenSpectrumUsersButton) {
      adminOpenSpectrumUsersButton.classList.toggle('is-active', nextView === 'spectrum-users');
      adminOpenSpectrumUsersButton.setAttribute('aria-pressed', nextView === 'spectrum-users' ? 'true' : 'false');
    }
    if (adminOpenStorageUsersButton) {
      adminOpenStorageUsersButton.classList.toggle('is-active', nextView === 'storage-users');
      adminOpenStorageUsersButton.setAttribute('aria-pressed', nextView === 'storage-users' ? 'true' : 'false');
    }
    if (adminApprovalView) {
      adminApprovalView.classList.toggle('is-active', nextView === 'approval');
    }
    if (adminUserBrowserView) {
      adminUserBrowserView.classList.toggle('is-active', nextView === 'users');
    }
    if (adminSpectrumUsersView) {
      adminSpectrumUsersView.classList.toggle('is-active', nextView === 'spectrum-users');
    }
    if (adminStorageUsersView) {
      adminStorageUsersView.classList.toggle('is-active', nextView === 'storage-users');
    }
  }

  function setAdminUserStatus(message = '') {
    if (!adminUserStatus) return;
    adminUserStatus.textContent = message;
    adminUserStatus.style.display = message ? 'block' : 'none';
  }

  function setAdminSpectrumUserStatus(message = '') {
    if (!adminSpectrumUserStatus) return;
    adminSpectrumUserStatus.textContent = message;
    adminSpectrumUserStatus.style.display = message ? 'block' : 'none';
  }

  function setAdminStorageUserStatus(message = '') {
    if (!adminStorageUserStatus) return;
    adminStorageUserStatus.textContent = message;
    adminStorageUserStatus.style.display = message ? 'block' : 'none';
  }

  function syncUserStoragePanel() {
    const canUseStorage = Boolean(currentUser) && canUserUseStorage();
    toggleUserStorageSection(canUseStorage);

    if (!userStorageStatus || !userStorageQuota || !userStorageUsed || !userStorageCopy) {
      return;
    }

    const quotaMb = getStorageQuotaMb();
    const usedMb = getStorageUsedMb();
    userStorageQuota.textContent = formatStorageAmount(quotaMb);
    userStorageUsed.textContent = formatStorageAmount(usedMb);

    if (!currentUser) {
      userStorageStatus.textContent = '로그인 후 할당량 정보를 확인할 수 있습니다.';
      userStorageCopy.textContent = '스토리지 서버가 준비되면 이 할당량 기준으로 업로드 제한을 적용할 수 있습니다.';
      return;
    }

    if (!canUseStorage) {
      userStorageStatus.textContent = '아직 할당된 스토리지 공간이 없습니다. 필요하면 관리자에게 요청하세요.';
      userStorageCopy.textContent = '스토리지 서버가 연결되면 여기 표시된 할당량이 개인 업로드 한도로 사용됩니다.';
      return;
    }

    const remainingMb = Math.max(0, quotaMb - usedMb);
    userStorageStatus.textContent = `현재 ${formatStorageAmount(quotaMb)} 중 ${formatStorageAmount(remainingMb)}를 남겨두고 있습니다.`;
    userStorageCopy.textContent = '지금은 할당량만 저장되며, 실제 파일 업로드와 사용량 증가는 나중에 스토리지 서버를 연결할 때 적용됩니다.';
  }

  function syncUserSpectrumToggle() {
    if (!userSpectrumToggle) return;

    const enabled = Boolean(window.seolhwaThemeController?.isSpectrumEnabled?.());
    const canUse = Boolean(currentUser) && !isAdminUserId(currentUser) && canUserUseSpectrumTheme();

    toggleUserSpectrumSection(canUse);
    userSpectrumToggle.checked = enabled;
    userSpectrumToggle.setAttribute('aria-checked', enabled ? 'true' : 'false');
    userSpectrumToggle.disabled = !canUse;

    if (userSpectrumToggleCopy) {
      userSpectrumToggleCopy.textContent = enabled ? '현재 켜짐' : '현재 꺼짐';
      userSpectrumToggleCopy.style.color = enabled ? 'var(--text)' : 'var(--muted)';
    }
  }

  function syncAdminSpectrumToggle() {
    if (!adminSpectrumToggle) return;

    const enabled = Boolean(window.seolhwaThemeController?.isSpectrumEnabled?.());
    adminSpectrumToggle.checked = enabled;
    adminSpectrumToggle.setAttribute('aria-checked', enabled ? 'true' : 'false');
    adminSpectrumToggle.disabled = !isAdminUserId(currentUser);
    if (adminSpectrumToggleCopy) {
      adminSpectrumToggleCopy.textContent = enabled ? '현재 켜짐' : '현재 꺼짐';
      adminSpectrumToggleCopy.style.color = enabled ? 'var(--text)' : 'var(--muted)';
    }

    syncUserSpectrumToggle();
    syncUserStoragePanel();
  }

  function setCurrentUserProfile(profile = null) {
    currentUserProfile = profile && typeof profile === 'object'
      ? { ...profile, userId: normalizeUserId(profile.userId || currentUser) }
      : null;

    if (!canUserUseSpectrumTheme()) {
      if (window.seolhwaThemeController?.isSpectrumEnabled?.()) {
        window.seolhwaThemeController.applyAdminSpectrumTheme(false);
        return;
      }
    }

    syncAdminSpectrumToggle();
  }

  function clearAdminSpectrumTheme() {
    window.seolhwaThemeController?.applyAdminSpectrumTheme?.(false);
    syncAdminSpectrumToggle();
  }

  function clearAdminUserBrowser() {
    selectedAdminUserId = '';
    if (adminUserList) {
      adminUserList.innerHTML = '';
    }
    if (adminUserPostsList) {
      adminUserPostsList.innerHTML = '';
    }
    if (adminUserPostsTitle) {
      adminUserPostsTitle.textContent = '선택한 사용자 없음';
    }
    if (adminUserPostsCopy) {
      adminUserPostsCopy.textContent = '왼쪽에서 사용자를 선택하면 해당 사용자의 글을 여기서 확인할 수 있습니다.';
    }
    setAdminUserStatus('');
  }

  function clearAdminSpectrumUserManager() {
    selectedSpectrumUserId = '';
    if (adminSpectrumUserList) {
      adminSpectrumUserList.innerHTML = '';
    }
    if (adminSpectrumSelectedUser) {
      adminSpectrumSelectedUser.textContent = '선택한 사용자 없음';
    }
    if (adminSpectrumSelectedCopy) {
      adminSpectrumSelectedCopy.textContent = '왼쪽에서 사용자를 선택하면 권한 상태를 확인하고 바로 부여하거나 회수할 수 있습니다.';
    }
    if (adminSpectrumSelectedStatus) {
      adminSpectrumSelectedStatus.textContent = '미허용';
    }
    if (adminSpectrumSelectedMeta) {
      adminSpectrumSelectedMeta.textContent = '승인 상태와 이메일 정보가 이 영역에 함께 표시됩니다.';
    }
    if (adminSpectrumSelectedHelper) {
      adminSpectrumSelectedHelper.textContent = '가입 승인된 사용자만 새로 권한을 받을 수 있습니다.';
    }
    if (adminSpectrumSelectedUpdated) {
      adminSpectrumSelectedUpdated.textContent = '권한 변경 이력이 아직 없습니다.';
    }
    if (adminSpectrumGrantButton) {
      adminSpectrumGrantButton.disabled = true;
    }
    if (adminSpectrumRevokeButton) {
      adminSpectrumRevokeButton.disabled = true;
    }
    setAdminSpectrumUserStatus('');
  }

  function renderAdminSelectedSpectrumUser(profile) {
    const normalizedProfile = profile && typeof profile === 'object' ? profile : null;
    const hasSelection = Boolean(normalizedProfile?.userId);
    const approved = normalizedProfile?.status === 'approved' || normalizedProfile?.approved === true;
    const allowed = Boolean(normalizedProfile?.spectrumThemeAllowed);

    if (adminSpectrumSelectedUser) {
      adminSpectrumSelectedUser.textContent = hasSelection ? normalizedProfile.userId : '선택한 사용자 없음';
    }
    if (adminSpectrumSelectedCopy) {
      adminSpectrumSelectedCopy.textContent = hasSelection
        ? `${normalizedProfile.email || '이메일 없음'} · 현재 승인 상태 ${normalizedProfile.status || '정보 없음'}`
        : '왼쪽에서 사용자를 선택하면 권한 상태를 확인하고 바로 부여하거나 회수할 수 있습니다.';
    }
    if (adminSpectrumSelectedStatus) {
      adminSpectrumSelectedStatus.textContent = allowed ? '허용됨' : '미허용';
      adminSpectrumSelectedStatus.style.color = allowed ? '#166534' : 'var(--text)';
    }
    if (adminSpectrumSelectedMeta) {
      if (!hasSelection) {
        adminSpectrumSelectedMeta.textContent = '승인 상태와 이메일 정보가 이 영역에 함께 표시됩니다.';
      } else {
        adminSpectrumSelectedMeta.textContent = `${approved ? '가입 승인 완료' : '가입 승인 대기 또는 거절'} · ${allowed ? '스펙트럼 사용 가능' : '일반 테마만 사용'}`;
      }
    }
    if (adminSpectrumSelectedHelper) {
      if (!hasSelection) {
        adminSpectrumSelectedHelper.textContent = '가입 승인된 사용자만 새로 권한을 받을 수 있습니다.';
      } else if (allowed) {
        adminSpectrumSelectedHelper.textContent = '권한을 회수하면 사용자는 본인 화면의 스펙트럼 토글을 더 이상 사용할 수 없습니다.';
      } else if (approved) {
        adminSpectrumSelectedHelper.textContent = '이 사용자는 승인된 상태라서 지금 바로 스펙트럼 권한을 부여할 수 있습니다.';
      } else {
        adminSpectrumSelectedHelper.textContent = '가입 승인 후에만 새 스펙트럼 권한을 부여할 수 있습니다.';
      }
    }
    if (adminSpectrumSelectedUpdated) {
      if (!hasSelection) {
        adminSpectrumSelectedUpdated.textContent = '권한 변경 이력이 아직 없습니다.';
      } else if (normalizedProfile.spectrumThemeUpdatedAt) {
        adminSpectrumSelectedUpdated.textContent = `마지막 권한 변경: ${formatApprovalDate(normalizedProfile.spectrumThemeUpdatedAt)} · 담당자 ${normalizedProfile.spectrumThemeUpdatedBy || '관리자'}`;
      } else {
        adminSpectrumSelectedUpdated.textContent = '권한 변경 이력이 아직 없습니다.';
      }
    }
    if (adminSpectrumGrantButton) {
      adminSpectrumGrantButton.disabled = !hasSelection || allowed || !approved;
    }
    if (adminSpectrumRevokeButton) {
      adminSpectrumRevokeButton.disabled = !hasSelection || !allowed;
    }
  }

  function clearAdminStorageManager() {
    selectedStorageUserId = '';
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
    setAdminStorageUserStatus('');
  }

  function getAdminUserSummaries(profiles = latestAdminProfiles) {
    const profileMap = new Map();
    const normalizedProfiles = Array.isArray(profiles) ? profiles : [];

    normalizedProfiles.forEach((profile) => {
      const userId = normalizeUserId(profile?.userId);
      if (!userId) {
        return;
      }
      profileMap.set(userId, {
        userId,
        email: profile.email || '',
        status: profile.status || '',
        updatedAt: profile.updatedAt || profile.requestedAt || '',
        postCount: 0
      });
    });

    currentPosts.forEach((post) => {
      const userId = normalizeUserId(post.ownerId || post.user || '');
      if (!userId) {
        return;
      }
      const existing = profileMap.get(userId) || {
        userId,
        email: '',
        status: '',
        updatedAt: '',
        postCount: 0
      };
      existing.postCount += 1;
      profileMap.set(userId, existing);
    });

    return Array.from(profileMap.values()).sort((left, right) => {
      if (right.postCount !== left.postCount) {
        return right.postCount - left.postCount;
      }
      return left.userId.localeCompare(right.userId, 'ko');
    });
  }

  function renderAdminSelectedUserPosts(userId) {
    if (!adminUserPostsList || !adminUserPostsTitle || !adminUserPostsCopy) {
      return;
    }

    adminUserPostsList.innerHTML = '';

    if (!userId) {
      adminUserPostsTitle.textContent = '선택한 사용자 없음';
      adminUserPostsCopy.textContent = '왼쪽에서 사용자를 선택하면 해당 사용자의 글을 여기서 확인할 수 있습니다.';
      renderPostEmptyState(adminUserPostsList, '아직 선택된 사용자가 없습니다.');
      return;
    }

    const targetPosts = currentPosts.filter((post) => normalizeUserId(post.ownerId) === normalizeUserId(userId));
    adminUserPostsTitle.textContent = `${userId}의 글`;
    adminUserPostsCopy.textContent = `총 ${targetPosts.length}개의 글이 있습니다. 비공개 글도 관리자 뷰에서 함께 확인할 수 있습니다.`;

    if (!targetPosts.length) {
      renderPostEmptyState(adminUserPostsList, '이 사용자가 작성한 글이 없습니다.');
      return;
    }

    targetPosts.forEach((post) => {
      addPostToDOM(post, adminUserPostsList, { showPrivateBadge: !isPublicPost(post) });
    });
  }

  function renderAdminUserBrowser(profiles = latestAdminProfiles) {
    if (!adminUserList || !isAdminUserId(currentUser)) {
      clearAdminUserBrowser();
      return;
    }

    latestAdminProfiles = Array.isArray(profiles) ? profiles : [];
    const userSummaries = getAdminUserSummaries(latestAdminProfiles);

    if (!userSummaries.length) {
      adminUserList.innerHTML = '';
      selectedAdminUserId = '';
      setAdminUserStatus('표시할 사용자가 없습니다.');
      renderAdminSelectedUserPosts('');
      return;
    }

    setAdminUserStatus(`사용자 ${userSummaries.length}명을 불러왔습니다.`);

    if (!selectedAdminUserId || !userSummaries.some((item) => item.userId === selectedAdminUserId)) {
      selectedAdminUserId = userSummaries[0].userId;
    }

    adminUserList.innerHTML = userSummaries.map((summary) => {
      const statusLabel = summary.status ? `상태: ${summary.status}` : '상태 정보 없음';
      const emailLabel = summary.email || '이메일 없음';
      return `
        <button class="admin-user-button${summary.userId === selectedAdminUserId ? ' is-active' : ''}" type="button" data-admin-user-id="${summary.userId}">
          <span class="admin-user-name">${summary.userId}</span>
          <span class="admin-user-meta">${emailLabel}</span>
          <span class="admin-user-meta">${statusLabel} · 글 ${summary.postCount}개</span>
        </button>
      `;
    }).join('');

    renderAdminSelectedUserPosts(selectedAdminUserId);
  }

  function renderAdminSpectrumUserManager(profiles = latestAdminProfiles) {
    if (!adminSpectrumUserList || !isAdminUserId(currentUser)) {
      clearAdminSpectrumUserManager();
      return;
    }

    latestAdminProfiles = Array.isArray(profiles) ? profiles : [];
    const manageableProfiles = latestAdminProfiles
      .filter((profile) => profile && profile.userId && !isAdminUserId(profile.userId))
      .sort((left, right) => normalizeUserId(left.userId).localeCompare(normalizeUserId(right.userId), 'ko'));

    if (!manageableProfiles.length) {
      clearAdminSpectrumUserManager();
      setAdminSpectrumUserStatus('권한을 관리할 사용자가 없습니다.');
      return;
    }

    const grantedCount = manageableProfiles.filter((profile) => profile.spectrumThemeAllowed).length;
    setAdminSpectrumUserStatus(`전체 ${manageableProfiles.length}명 중 ${grantedCount}명에게 스펙트럼 테마 권한이 있습니다.`);

    if (!selectedSpectrumUserId || !manageableProfiles.some((profile) => normalizeUserId(profile.userId) === selectedSpectrumUserId)) {
      selectedSpectrumUserId = normalizeUserId(manageableProfiles[0].userId);
    }

    adminSpectrumUserList.innerHTML = manageableProfiles.map((profile) => {
      const userId = normalizeUserId(profile.userId);
      const approved = profile.status === 'approved' || profile.approved === true;
      const allowed = Boolean(profile.spectrumThemeAllowed);
      const statusLabel = profile.status ? `상태: ${profile.status}` : '상태 정보 없음';
      const permissionLabel = allowed ? '스펙트럼 허용됨' : '스펙트럼 미허용';

      return `
        <button class="admin-permission-item${userId === selectedSpectrumUserId ? ' is-active' : ''}" type="button" data-spectrum-user-id="${userId}">
          <span class="admin-user-name">${profile.userId}</span>
          <span class="admin-user-meta">${profile.email || '이메일 없음'}</span>
          <span class="admin-user-meta">${statusLabel} · ${permissionLabel}</span>
          <div class="admin-permission-actions">
            <span class="admin-permission-badge${allowed ? ' is-enabled' : ''}">${allowed ? '허용됨' : '미허용'}</span>
            <span class="admin-permission-badge${approved ? ' is-enabled' : ''}">${approved ? '승인 완료' : '미승인'}</span>
          </div>
        </button>
      `;
    }).join('');

    const selectedProfile = manageableProfiles.find((profile) => normalizeUserId(profile.userId) === selectedSpectrumUserId) || null;
    renderAdminSelectedSpectrumUser(selectedProfile);
  }

  async function updateSelectedSpectrumPermission(allowed) {
    if (!isAdminUserId(currentUser) || !selectedSpectrumUserId) {
      return;
    }

    try {
      if (adminSpectrumGrantButton) {
        adminSpectrumGrantButton.disabled = true;
      }
      if (adminSpectrumRevokeButton) {
        adminSpectrumRevokeButton.disabled = true;
      }

      setAdminSpectrumUserStatus(`${selectedSpectrumUserId} 사용자의 스펙트럼 권한을 ${allowed ? '부여' : '회수'}하는 중입니다.`);
      await updateSpectrumThemePermission(selectedSpectrumUserId, allowed);
      latestAdminProfiles = latestAdminProfiles.map((profile) => (
        normalizeUserId(profile?.userId) === selectedSpectrumUserId
          ? {
            ...profile,
            spectrumThemeAllowed: allowed,
            spectrumThemeUpdatedAt: new Date().toISOString(),
            spectrumThemeUpdatedBy: ADMIN_ACCOUNT.id
          }
          : profile
      ));
      renderAdminSpectrumUserManager(latestAdminProfiles);
      setAdminSpectrumUserStatus(`${selectedSpectrumUserId} 사용자에게 스펙트럼 권한을 ${allowed ? '부여' : '회수'}했습니다.`);
    } catch (error) {
      console.error('[Spectrum] permission update error', error);
      setAdminSpectrumUserStatus('스펙트럼 권한을 변경하는 중 오류가 발생했습니다.');
      renderAdminSpectrumUserManager(latestAdminProfiles);
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
      console.error('[Profile] listener error', error);
      syncAdminSpectrumToggle();
    });
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

  function updateMyPostsVisibility() {
    if (!myPostsSection) return;
    myPostsSection.classList.toggle('is-visible', Boolean(currentUser));
  }

  function isPostOwner(post, userId = currentUser) {
    return Boolean(post && userId && normalizeUserId(post.ownerId) === normalizeUserId(userId));
  }

  function isPublicPost(post) {
    return Boolean(post && post.visibility === 'public');
  }

  function canViewPost(post, options = {}) {
    if (!post) return false;
    if (isAdminUserId(currentUser)) return true;
    if (isPublicPost(post)) return true;
    if (isPostOwner(post)) return true;
    if (options.shareToken && post.sharedToken && post.sharedToken === options.shareToken) return true;
    return false;
  }

  function getRouteState() {
    const url = new URL(window.location.href);
    return {
      postSlug: url.searchParams.get('post'),
      shareToken: url.searchParams.get('share')
    };
  }

  function findPostByShareToken(shareToken) {
    return currentPosts.find((post) => post.sharedToken === shareToken) || null;
  }

  function buildShareUrl(shareToken) {
    const url = new URL(window.location.href);
    url.searchParams.delete('post');
    if (shareToken) {
      url.searchParams.set('share', shareToken);
    } else {
      url.searchParams.delete('share');
    }
    return url.toString();
  }

  function setShareMessage(message = '', type = 'info') {
    if (!shareMessage) return;
    shareMessage.textContent = message;
    shareMessage.style.color = type === 'error'
      ? '#dc2626'
      : type === 'success'
        ? '#16a34a'
        : 'var(--muted)';
  }

  function openShareModal() {
    if (!shareModal) return;
    shareModal.classList.add('is-open');
    shareModal.setAttribute('aria-hidden', 'false');
  }

  function closeShareModal() {
    if (!shareModal) return;
    shareModal.classList.remove('is-open');
    shareModal.setAttribute('aria-hidden', 'true');
  }

  function updateShareModalState(post) {
    if (!post || !shareLinkInput) return;
    shareLinkInput.value = post.sharedToken ? buildShareUrl(post.sharedToken) : '';
    if (shareDisable) {
      shareDisable.style.display = post.sharedToken ? 'inline-flex' : 'none';
    }
    if (shareCreate) {
      shareCreate.textContent = post.sharedToken ? '공유 링크 다시 만들기' : '공유 링크 만들기';
    }
  }

  function stopApprovalListener() {
    if (typeof approvalUnsubscribe === 'function') {
      approvalUnsubscribe();
      approvalUnsubscribe = null;
    }

    if (approvalList) {
      approvalList.innerHTML = '';
    }
    latestAdminProfiles = [];
    clearAdminUserBrowser();
    clearAdminSpectrumUserManager();
    clearAdminStorageManager();
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
      spectrumThemeAllowed: false,
      storageQuotaMb: 0,
      storageUsedMb: 0,
      storageAccessEnabled: false,
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

  async function updateSpectrumThemePermission(userId, allowed) {
    const normalizedId = normalizeUserId(userId);
    const existingProfile = await getUserProfile(normalizedId, { preferFresh: true });
    const email = existingProfile?.email || getCachedEmailById(normalizedId) || idToEmail(normalizedId);

    await saveUserProfile(normalizedId, email, {
      spectrumThemeAllowed: Boolean(allowed),
      spectrumThemeUpdatedAt: new Date().toISOString(),
      spectrumThemeUpdatedBy: ADMIN_ACCOUNT.id
    });
  }

  async function updateStorageQuota(userId, quotaMb) {
    const normalizedId = normalizeUserId(userId);
    const existingProfile = await getUserProfile(normalizedId, { preferFresh: true });
    const email = existingProfile?.email || getCachedEmailById(normalizedId) || idToEmail(normalizedId);
    const normalizedQuotaMb = normalizeStorageQuotaMb(quotaMb);

    await saveUserProfile(normalizedId, email, {
      storageQuotaMb: normalizedQuotaMb,
      storageUsedMb: normalizeStorageQuotaMb(existingProfile?.storageUsedMb),
      storageAccessEnabled: normalizedQuotaMb > 0,
      storageQuotaAssignedAt: new Date().toISOString(),
      storageQuotaAssignedBy: ADMIN_ACCOUNT.id
    });
  }

  function applyPendingUser(userId, profile = {}) {
    currentUser = null;
    stopCurrentUserProfileListener();
    setCurrentUserProfile(null);
    setPostFormEnabled(false);
    resetPostForm();
    setAdminView('approval');
    clearAdminSpectrumTheme();
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
    updateMyPostsVisibility();
    syncAdminSpectrumToggle();
    renderPostLists();
    closeAuthModal();
  }

  async function startApprovalListener() {
    toggleApprovalAdminSection(true);

    if (authMode !== 'firebase') {
      setApprovalAdminStatus('로컬 관리자 모드에서는 승인 목록을 불러올 수 없습니다.', 'error');
      renderAdminUserBrowser();
      renderAdminSpectrumUserManager();
      renderAdminStorageUserManager();
      syncAdminSpectrumToggle();
      return;
    }

    if (!window.onSnapshot || !window.collection || !window.db) {
      setApprovalAdminStatus('승인 목록을 불러올 수 없습니다.', 'error');
      renderAdminSpectrumUserManager();
      renderAdminStorageUserManager();
      syncAdminSpectrumToggle();
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
      renderAdminUserBrowser(profiles);
      renderAdminSpectrumUserManager(profiles);
      renderAdminStorageUserManager(profiles);
      syncAdminSpectrumToggle();
    }, (error) => {
      console.error('[Approval] listener error', error);
      setApprovalAdminStatus('승인 요청 목록을 불러오는 중 오류가 발생했습니다.', 'error');
      renderAdminUserBrowser();
      renderAdminSpectrumUserManager();
      renderAdminStorageUserManager();
      syncAdminSpectrumToggle();
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
        applyAuthenticatedUser(displayId, { profile });
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
    startCurrentUserProfileListener(userId, options.profile || null);
    setPostFormEnabled(true);
    resetPostForm();
    const adminLabel = isAdminUserId(userId) ? '관리자 ' : '';

    if (!canUserUseSpectrumTheme(userId, options.profile || currentUserProfile)) {
      clearAdminSpectrumTheme();
    } else {
      syncAdminSpectrumToggle();
    }

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
    updateMyPostsVisibility();
    syncAdminSpectrumToggle();
    renderPostLists();
    if (isAdminUserId(userId)) {
      setAdminView('approval');
      startApprovalListener();
    } else {
      setAdminView('approval');
      stopApprovalListener();
    }
    closeAuthModal();
  }

  function resetAuthUI() {
    currentUser = null;
    stopCurrentUserProfileListener();
    setCurrentUserProfile(null);
    setPostFormEnabled(false);
    resetPostForm();
    setAdminView('approval');
    clearAdminSpectrumTheme();

    setAuthInputsDisabled(false);
    if (openLoginButton) openLoginButton.style.display = 'inline-flex';
    if (openSignupButton) openSignupButton.style.display = 'inline-flex';
    if (logoutSubmit) logoutSubmit.style.display = 'none';
    setProviderButtonsDisabled(false);
    setApprovalStatus('', 'info');
    updateMyPostsVisibility();
    syncAdminSpectrumToggle();
    renderPostLists();
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
            applyAuthenticatedUser(normalizedUserId, { profile });
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
    const postId = String(post.id || createPostId());
    const suffix = slugify(postId || String(timestamp)).slice(0, 16);
    const ownerId = normalizeUserId(post.ownerId || post.user || '');
    const visibility = post.visibility || (isAdminUserId(ownerId) ? 'public' : 'private');

    return {
      ...post,
      id: postId,
      createdAt,
      ownerId,
      visibility,
      sharedToken: post.sharedToken || '',
      slug: post.slug || `${baseSlug}-${timestamp}-${suffix}`
    };
  }

  function setCurrentPosts(posts) {
    currentPosts = posts
      .map(normalizePost)
      .slice()
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
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

  function upsertLocalPost(post) {
    try {
      const existing = JSON.parse(localStorage.getItem(postsStorageKey) || '[]');
      const filtered = existing.filter((item) => String(item.id || '') !== String(post.id || ''));
      filtered.unshift(post);
      localStorage.setItem(postsStorageKey, JSON.stringify(filtered));
    } catch (localError) {
      console.error('[PostWriter] localStorage upsert error', localError);
    }
  }

  function removeLocalPost(postId) {
    try {
      const existing = JSON.parse(localStorage.getItem(postsStorageKey) || '[]');
      const filtered = existing.filter((item) => String(item.id || '') !== String(postId || ''));
      localStorage.setItem(postsStorageKey, JSON.stringify(filtered));
    } catch (localError) {
      console.error('[PostWriter] localStorage remove error', localError);
    }
  }

  async function savePostToFirebase(post) {
    const payloadBytes = getPostPayloadBytes(post);
    if (payloadBytes > MAX_POST_DOCUMENT_BYTES) {
      throw createPostUploadError('post/payload-too-large', '게시물 크기가 Firestore 저장 한도를 초과했습니다.');
    }

    try {
      await waitForFirebase();
      if (window.doc && window.setDoc && post.id) {
        await window.setDoc(window.doc(window.db, 'posts', String(post.id)), post, { merge: true });
        console.log('[PostWriter] Post saved to Firebase with fixed ID:', post.id);
        upsertLocalPost(post);
        return { id: post.id, synced: true };
      }

      const docRef = await window.addDoc(window.collection(window.db, 'posts'), post);
      console.log('[PostWriter] Post saved to Firebase with ID:', docRef.id);
      upsertLocalPost({ ...post, id: docRef.id });
      return { id: docRef.id, synced: true };
    } catch (error) {
      console.error('[PostWriter] savePostToFirebase error', error);

      if (shouldFallbackToLocalPostSave(error)) {
        upsertLocalPost(post);
        console.log('[PostWriter] Saved to localStorage as offline fallback');
        return { id: post.id, synced: false };
      }

      throw error;
    }
  }

  async function deletePostFromFirebase(postId) {
    try {
      await waitForFirebase();
      if (window.deleteDoc && window.doc && window.db) {
        await window.deleteDoc(window.doc(window.db, 'posts', String(postId)));
      }
    } catch (error) {
      console.error('[PostWriter] deletePostFromFirebase error', error);
    } finally {
      removeLocalPost(postId);
    }
  }

  function showMainSections() {
    const sectionIds = ['auth', 'home', 'contact', 'approval-admin', 'post-write', 'public-posts', 'my-posts'];
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
    if (myPostsList) {
      myPostsList.innerHTML = '';
    }
  }

  function renderPostEmptyState(container, message) {
    if (!container) return;
    const empty = document.createElement('p');
    empty.className = 'posts-empty';
    empty.textContent = message;
    container.appendChild(empty);
  }

  function renderPostLists() {
    clearPosts();
    updateMyPostsVisibility();

    const publicPosts = currentPosts.filter((post) => isPublicPost(post));
    const personalPosts = currentUser
      ? currentPosts.filter((post) => isPostOwner(post))
      : [];

    if (!publicPosts.length && postsList) {
      renderPostEmptyState(postsList, '아직 공개된 글이 없습니다.');
    } else {
      publicPosts.forEach((post) => {
        addPostToDOM(post, postsList);
      });
    }

    if (currentUser && myPostsList) {
      if (!personalPosts.length) {
        renderPostEmptyState(myPostsList, '아직 작성한 글이 없습니다.');
      } else {
        personalPosts.forEach((post) => {
          addPostToDOM(post, myPostsList, { showPrivateBadge: !isPublicPost(post) });
        });
      }
    }

    if (isAdminUserId(currentUser)) {
      renderAdminUserBrowser();
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
        querySnapshot.forEach((doc) => {
          const post = normalizePost({ id: doc.id, ...doc.data() });
          posts.push(post);
        });
        setCurrentPosts(posts);
        renderPostLists();
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
        setCurrentPosts(sorted);
        renderPostLists();
        syncViewFromRoute();
      } catch (localError) {
        console.error('[PostWriter] localStorage fallback render error', localError);
      }
    }
  }

  function addPostToDOM(post, container, options = {}) {
    if (!container) return;

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
    const badge = options.showPrivateBadge ? '<p class="post-preview-subtitle" style="font-size:0.85rem; color:var(--accent);">비공개 글</p>' : '';

    card.innerHTML = `
      <div class="post-preview-body">
        <h3 class="post-preview-title">${titleText}</h3>
        <p class="post-preview-subtitle">${safeSubtitle}</p>
        ${badge}
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

    container.appendChild(card);
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
  const detailActions = document.getElementById('detail-actions');
  const detailEdit = document.getElementById('detail-edit');
  const detailDelete = document.getElementById('detail-delete');
  const detailShareOpen = document.getElementById('detail-share-open');
  const detailShareOpenLink = document.getElementById('detail-share-open-link');
  const shareModal = document.getElementById('share-modal');
  const shareClose = document.getElementById('share-close');
  const shareCreate = document.getElementById('share-create');
  const shareCopy = document.getElementById('share-copy');
  const shareDisable = document.getElementById('share-disable');
  const shareLinkInput = document.getElementById('share-link-input');
  const shareMessage = document.getElementById('share-message');
  let currentDetailPost = null;

  function syncViewFromRoute() {
    const routeState = getRouteState();
    if (!routeState.postSlug && !routeState.shareToken) {
      showMainSections();
      return;
    }

    const post = routeState.shareToken
      ? findPostByShareToken(routeState.shareToken)
      : findPostBySlug(routeState.postSlug);

    if (!post || !canViewPost(post, { shareToken: routeState.shareToken })) {
      showMainSections();
      return;
    }

    renderDetail(post, routeState);
  }

  function setPostRoute(route = {}, replace = false) {
    const url = new URL(window.location.href);
    if (route.postSlug) {
      url.searchParams.set('post', route.postSlug);
    } else {
      url.searchParams.delete('post');
    }

    if (route.shareToken) {
      url.searchParams.set('share', route.shareToken);
    } else {
      url.searchParams.delete('share');
    }

    const state = { ...route };
    window.history[replace ? 'replaceState' : 'pushState'](state, '', url);
  }

  function renderDetail(post, options = {}) {
    showMainSections();
    if (!detailView) return;

    const sectionIds = ['auth', 'home', 'contact', 'approval-admin', 'post-write', 'public-posts', 'my-posts'];
    sectionIds.forEach((sectionId) => {
      const section = document.getElementById(sectionId);
      if (section) {
        section.style.display = 'none';
      }
    });

    detailTitle.textContent = post.title || '제목 없음';
    detailSubtitle.textContent = post.subtitle || '';
    detailSubtitle.style.display = post.subtitle ? 'block' : 'none';
    detailMeta.textContent = `${post.user || '익명'} • ${new Date(post.createdAt).toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric', weekday:'short' })}${options.shareToken ? ' • 공유 링크' : ''}`;
    detailContent.innerHTML = (post.content || '').replace(/\n/g, '<br>');
    detailImageWrapper.innerHTML = post.imageDataUrl ? `<img src="${post.imageDataUrl}" alt="상세 이미지" style="max-width:100%; max-height:70vh; width:100%; object-fit:contain; border-radius:12px;" />` : '';
    currentDetailPost = post;

    if (detailActions) {
      const canShare = canManagePost(post);
      const canEdit = canManagePost(post);
      detailActions.style.display = canShare || canEdit ? 'flex' : 'none';
      if (detailEdit) {
        detailEdit.style.display = canEdit ? 'inline-flex' : 'none';
      }
      if (detailDelete) {
        detailDelete.style.display = canEdit ? 'inline-flex' : 'none';
      }
      if (detailShareOpen) {
        detailShareOpen.style.display = canShare ? 'inline-flex' : 'none';
      }
      if (detailShareOpenLink) {
        detailShareOpenLink.style.display = canShare && post.sharedToken ? 'inline-flex' : 'none';
      }
    }
    updateShareModalState(post);

    if (detailEmpty) {
      detailEmpty.style.display = post.imageDataUrl || post.content ? 'none' : 'block';
    }

    detailView.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  const openDetail = (post, options = {}) => {
    const normalizedPost = normalizePost(post);
    const shouldReplace = options.replace === true;
    const route = options.shareToken
      ? { shareToken: options.shareToken }
      : { postSlug: normalizedPost.slug };

    setPostRoute(route, shouldReplace);
    renderDetail(normalizedPost, route);
  };

  function clearPostRoute(replace = false) {
    currentDetailPost = null;
    closeShareModal();
    setPostRoute({}, replace);
    showMainSections();
  }

  window.clearPostRoute = clearPostRoute;
  window.addEventListener('popstate', syncViewFromRoute);

  if (detailBack) {
    detailBack.addEventListener('click', () => {
      clearPostRoute(false);
    });
  }

  async function updateCurrentDetailShare(sharedToken = '') {
    if (!currentDetailPost || !isPostOwner(currentDetailPost) && !isAdminUserId(currentUser)) {
      return;
    }

    const updatedPost = normalizePost({
      ...currentDetailPost,
      sharedToken
    });

    currentDetailPost = updatedPost;
    currentPosts = currentPosts.map((post) => post.id === updatedPost.id ? updatedPost : post);
    renderPostLists();
    renderDetail(updatedPost, sharedToken ? { shareToken: sharedToken } : {});
    updateShareModalState(updatedPost);
    await savePostToFirebase(updatedPost);
  }

  async function updateExistingPost(post, updates = {}) {
    const updatedPost = normalizePost({
      ...post,
      ...updates,
      id: post.id,
      ownerId: post.ownerId,
      user: post.user,
      createdAt: post.createdAt,
      visibility: post.visibility,
      sharedToken: Object.prototype.hasOwnProperty.call(updates, 'sharedToken') ? updates.sharedToken : post.sharedToken,
      slug: post.slug
    });

    const saveResult = await savePostToFirebase(updatedPost);

    currentPosts = currentPosts.map((item) => item.id === updatedPost.id ? updatedPost : item);
    currentDetailPost = updatedPost;
    renderPostLists();

    const routeState = getRouteState();
    if (routeState.postSlug === post.slug || routeState.shareToken === post.sharedToken || routeState.shareToken === updatedPost.sharedToken) {
      renderDetail(updatedPost, routeState.shareToken ? { shareToken: routeState.shareToken } : {});
    }

    return { post: updatedPost, saveResult };
  }

  async function handleDeletePost(post) {
    if (!post || !canManagePost(post)) {
      return;
    }

    const confirmed = window.confirm('이 글을 삭제하시겠습니까? 삭제 후에는 되돌릴 수 없습니다.');
    if (!confirmed) {
      return;
    }

    await deletePostFromFirebase(post.id);
    currentPosts = currentPosts.filter((item) => item.id !== post.id);

    if (editingPostId === post.id) {
      resetPostForm();
    }

    if (currentDetailPost?.id === post.id) {
      clearPostRoute(true);
    }

    renderPostLists();
    setPostFormStatus('글을 삭제했습니다.', 'success');
  }

  if (detailEdit) {
    detailEdit.addEventListener('click', () => {
      if (!currentDetailPost) {
        return;
      }

      enterEditMode(currentDetailPost);
    });
  }

  if (detailDelete) {
    detailDelete.addEventListener('click', async () => {
      if (!currentDetailPost) {
        return;
      }

      try {
        await handleDeletePost(currentDetailPost);
      } catch (error) {
        console.error('[PostWriter] delete post error', error);
        setPostFormStatus('글을 삭제하는 중 오류가 발생했습니다.', 'error');
      }
    });
  }

  if (detailShareOpen) {
    detailShareOpen.addEventListener('click', () => {
      if (!currentDetailPost) {
        return;
      }
      updateShareModalState(currentDetailPost);
      setShareMessage(currentDetailPost.sharedToken ? '이미 공유 링크가 있습니다. 필요하면 다시 만들 수 있습니다.' : '이 글은 아직 공유 링크가 없습니다.', 'info');
      openShareModal();
    });
  }

  if (detailShareOpenLink) {
    detailShareOpenLink.addEventListener('click', () => {
      if (!currentDetailPost?.sharedToken) {
        return;
      }
      window.open(buildShareUrl(currentDetailPost.sharedToken), '_blank', 'noopener');
    });
  }

  if (shareClose) {
    shareClose.addEventListener('click', closeShareModal);
  }

  if (shareModal) {
    shareModal.addEventListener('click', (event) => {
      if (event.target === shareModal) {
        closeShareModal();
      }
    });
  }

  if (shareCreate) {
    shareCreate.addEventListener('click', async () => {
      if (!currentDetailPost) {
        return;
      }

      try {
        await updateCurrentDetailShare(createShareToken());
        setShareMessage('공유 링크가 생성되었습니다.', 'success');
      } catch (error) {
        console.error('[Share] create error', error);
        setShareMessage('공유 링크를 만드는 중 오류가 발생했습니다.', 'error');
      }
    });
  }

  if (shareDisable) {
    shareDisable.addEventListener('click', async () => {
      if (!currentDetailPost?.sharedToken) {
        return;
      }

      try {
        await updateCurrentDetailShare('');
        setShareMessage('공유 링크를 해제했습니다.', 'success');
      } catch (error) {
        console.error('[Share] disable error', error);
        setShareMessage('공유 링크를 끄는 중 오류가 발생했습니다.', 'error');
      }
    });
  }

  if (shareCopy) {
    shareCopy.addEventListener('click', async () => {
      if (!shareLinkInput?.value) {
        setShareMessage('먼저 공유 링크를 만들어주세요.', 'error');
        return;
      }

      try {
        await navigator.clipboard.writeText(shareLinkInput.value);
        setShareMessage('링크를 복사했습니다.', 'success');
      } catch (error) {
        console.error('[Share] copy error', error);
        setShareMessage('링크 복사에 실패했습니다.', 'error');
      }
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
    const ownerId = normalizeUserId(user || '');

    const postData = {
      id: createPostId(),
      user: user || '익명',
      ownerId,
      visibility: isAdminUserId(ownerId) ? 'public' : 'private',
      title: titleText,
      subtitle: subtitleText,
      content,
      imageDataUrl,
      createdAt: now.toISOString()
    };

    const normalizedPost = normalizePost(postData);

    let saveResult = { id: normalizedPost.id, synced: false };
    if (shouldPersist) {
      saveResult = await savePostToFirebase(normalizedPost);
    }

    currentPosts = [normalizedPost, ...currentPosts.filter((post) => post.id !== normalizedPost.id)];
    renderPostLists();
    return { post: normalizedPost, saveResult };
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
      resetPostForm();
    });
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

  if (adminUserList) {
    adminUserList.addEventListener('click', (event) => {
      const targetButton = event.target.closest('[data-admin-user-id]');
      if (!targetButton || !isAdminUserId(currentUser)) {
        return;
      }

      selectedAdminUserId = normalizeUserId(targetButton.dataset.adminUserId);
      renderAdminUserBrowser();
    });
  }

  if (adminSpectrumUserList) {
    adminSpectrumUserList.addEventListener('click', (event) => {
      const targetButton = event.target.closest('[data-spectrum-user-id]');
      if (!targetButton || !isAdminUserId(currentUser)) {
        return;
      }

      selectedSpectrumUserId = normalizeUserId(targetButton.dataset.spectrumUserId);
      renderAdminSpectrumUserManager();
    });
  }

  if (adminSpectrumGrantButton) {
    adminSpectrumGrantButton.addEventListener('click', async () => {
      await updateSelectedSpectrumPermission(true);
    });
  }

  if (adminSpectrumRevokeButton) {
    adminSpectrumRevokeButton.addEventListener('click', async () => {
      await updateSelectedSpectrumPermission(false);
    });
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

  if (adminOpenApprovalButton) {
    adminOpenApprovalButton.addEventListener('click', () => {
      if (!isAdminUserId(currentUser)) {
        return;
      }
      setAdminView('approval');
    });
  }

  if (adminOpenUserPostsButton) {
    adminOpenUserPostsButton.addEventListener('click', () => {
      if (!isAdminUserId(currentUser)) {
        return;
      }
      setAdminView('users');
    });
  }

  if (adminOpenSpectrumUsersButton) {
    adminOpenSpectrumUsersButton.addEventListener('click', () => {
      if (!isAdminUserId(currentUser)) {
        return;
      }
      setAdminView('spectrum-users');
    });
  }

  if (adminOpenStorageUsersButton) {
    adminOpenStorageUsersButton.addEventListener('click', () => {
      if (!isAdminUserId(currentUser)) {
        return;
      }
      setAdminView('storage-users');
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
              storageAccessEnabled: nextQuota > 0,
              storageQuotaAssignedAt: new Date().toISOString(),
              storageQuotaAssignedBy: ADMIN_ACCOUNT.id
            }
            : profile
        ));

        renderAdminStorageUserManager(latestAdminProfiles);
        setAdminStorageUserStatus(`${selectedStorageUserId} 사용자에게 ${formatStorageAmount(nextQuota)}를 할당했습니다.`);
      } catch (error) {
        console.error('[Storage] quota update error', error);
        setAdminStorageUserStatus('스토리지 할당량을 저장하는 중 오류가 발생했습니다.');
      } finally {
        if (adminStorageSaveButton) {
          adminStorageSaveButton.disabled = false;
        }
        if (adminStorageClearButton) {
          adminStorageClearButton.disabled = false;
        }
      }
    });
  }

  if (adminStorageClearButton) {
    adminStorageClearButton.addEventListener('click', async () => {
      if (!isAdminUserId(currentUser) || !selectedStorageUserId) {
        return;
      }

      try {
        adminStorageClearButton.disabled = true;
        if (adminStorageSaveButton) {
          adminStorageSaveButton.disabled = true;
        }

        setAdminStorageUserStatus(`${selectedStorageUserId} 사용자의 스토리지 할당을 해제하는 중입니다.`);
        await updateStorageQuota(selectedStorageUserId, 0);

        latestAdminProfiles = latestAdminProfiles.map((profile) => (
          normalizeUserId(profile?.userId) === selectedStorageUserId
            ? {
              ...profile,
              storageQuotaMb: 0,
              storageUsedMb: normalizeStorageQuotaMb(profile?.storageUsedMb),
              storageAccessEnabled: false,
              storageQuotaAssignedAt: new Date().toISOString(),
              storageQuotaAssignedBy: ADMIN_ACCOUNT.id
            }
            : profile
        ));

        renderAdminStorageUserManager(latestAdminProfiles);
        setAdminStorageUserStatus(`${selectedStorageUserId} 사용자의 스토리지 할당을 해제했습니다.`);
      } catch (error) {
        console.error('[Storage] quota clear error', error);
        setAdminStorageUserStatus('스토리지 할당을 해제하는 중 오류가 발생했습니다.');
      } finally {
        adminStorageClearButton.disabled = false;
        if (adminStorageSaveButton) {
          adminStorageSaveButton.disabled = false;
        }
      }
    });
  }

  if (adminSpectrumToggle) {
    adminSpectrumToggle.addEventListener('change', () => {
      if (!canUserUseSpectrumTheme()) {
        return;
      }

      window.seolhwaThemeController?.applyAdminSpectrumTheme?.(adminSpectrumToggle.checked);
      syncAdminSpectrumToggle();
    });
  }

  if (userSpectrumToggle) {
    userSpectrumToggle.addEventListener('change', () => {
      if (!canUserUseSpectrumTheme()) {
        return;
      }

      window.seolhwaThemeController?.applyAdminSpectrumTheme?.(userSpectrumToggle.checked);
      syncAdminSpectrumToggle();
    });
  }

  window.addEventListener('seolhwa-spectrum-change', () => {
    syncAdminSpectrumToggle();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && authModal && authModal.classList.contains('is-open')) {
      closeAuthModal();
      return;
    }

    if (event.key === 'Escape' && shareModal && shareModal.classList.contains('is-open')) {
      closeShareModal();
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
        applyAuthenticatedUser(displayId, { profile });
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
          const normalizedPost = normalizePost({
            id: post.id || createPostId(),
            user: post.user || '익명',
            ownerId: post.ownerId || normalizeUserId(post.user || ''),
            visibility: post.visibility,
            title: post.title || '제목 없음',
            subtitle: post.subtitle || '',
            content: post.content || '',
            imageDataUrl: post.imageDataUrl || null,
            createdAt: post.createdAt,
            sharedToken: post.sharedToken || '',
            slug: post.slug || ''
          });
          await savePostToFirebase(normalizedPost);
        }
      });

      alert('게시물 가져오기가 완료되었습니다.');
    } catch (e) {
      alert('가져오기 실패: 올바른 JSON 파일인지 확인해 주세요.');
      console.error('[PostWriter] importPostsFromJson error', e);
    }
  }

  setPostFormEnabled(false);
  setAdminView(activeAdminView);
  syncAdminSpectrumToggle();
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
          setCurrentPosts(localPosts);
          renderPostLists();
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

  submitBtn.addEventListener('click', async () => {
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

    const editingPost = editingPostId ? getPostById(editingPostId) : null;
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.6';
    submitBtn.style.cursor = 'wait';

    const submitWithImage = async (imageDataUrl) => {
      try {
        if (editingPost) {
          const result = await updateExistingPost(editingPost, {
            title: title.trim() || '제목 없음',
            subtitle: subtitle.trim(),
            content: value,
            imageDataUrl: imageDataUrl === undefined ? (editingPost.imageDataUrl || null) : imageDataUrl
          });
          resetPostForm();
          setPostFormStatus(
            result?.saveResult?.synced === false
              ? '글이 현재 기기에만 임시 저장되었습니다. 네트워크가 복구되면 다시 저장해주세요.'
              : '글이 수정되었습니다.',
            result?.saveResult?.synced === false ? 'info' : 'success'
          );
          return;
        }

        const result = await addPost(value, imageDataUrl ?? null, currentUser, null, true, title, subtitle);
        resetPostForm();
        setPostFormStatus(
          result?.saveResult?.synced === false
            ? '글이 현재 기기에만 임시 저장되었습니다. 다른 기기에서 보이게 하려면 네트워크 연결 후 다시 저장해주세요.'
            : '글이 저장되었습니다.',
          result?.saveResult?.synced === false ? 'info' : 'success'
        );
      } catch (error) {
        console.error('[PostWriter] submit error', error);
        setPostFormStatus(
          getSubmitErrorMessage(error, editingPost ? '글 수정 중 오류가 발생했습니다.' : '글 저장 중 오류가 발생했습니다.'),
          'error'
        );
      } finally {
        if (currentUser) {
          setPostFormEnabled(true);
        }
      }
    };

    if (file) {
      try {
        setPostFormStatus('이미지를 최적화해서 업로드하는 중입니다...', 'info');
        const imageBudgetBytes = getImageBudgetBytesForPostDraft({
          title,
          subtitle,
          content: value,
          user: currentUser,
          existingPost: editingPost
        });
        const optimizedImageDataUrl = await buildPostImageDataUrl(file, { maxBytes: imageBudgetBytes });
        await submitWithImage(optimizedImageDataUrl);
      } catch (error) {
        console.error('[PostWriter] image optimize error', error);
        setPostFormStatus(getSubmitErrorMessage(error, '이미지를 처리하는 중 오류가 발생했습니다.'), 'error');
        if (currentUser) {
          setPostFormEnabled(true);
        }
      }
      return;
    }

    await submitWithImage(editingPost ? undefined : null);
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

