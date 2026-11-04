// Seolhwa Archive Upload - dedicated popup uploader

(function initializeArchiveUploadPage() {
  const ADMIN_ACCOUNT = {
    id: 'seolhwa0508'
  };
  const STORAGE_MB_BYTES = 1024 * 1024;
  const MAX_UPLOAD_SIZE_BYTES = 100 * STORAGE_MB_BYTES;
  const ALLOWED_EXTENSIONS = new Set([
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'json', 'zip', 'rar',
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'mp4', 'avi', 'mov', 'mkv', 'flv',
    'mp3', 'wav', 'aac', 'flac'
  ]);
  const OCI_API_BASE_URL = 'http://161.33.16.111:3000';
  const UPLOAD_ENDPOINT = `${OCI_API_BASE_URL}/api/upload`;
  const archiveFilesCollectionName = 'archiveFiles';
  const localAuthStorageKey = 'seolhwa-local-auth';
  const userProfilesStorageKey = 'seolhwa-user-profiles';
  const themeStorageKey = 'theme';

  const uploadAuthStatus = document.getElementById('upload-auth-status');
  const uploadStatus = document.getElementById('upload-status');
  const uploadResultBox = document.getElementById('upload-result');
  const uploadResultCopy = document.getElementById('upload-result-copy');
  const uploadResultLink = document.getElementById('upload-result-link');
  const uploadCurrentUser = document.getElementById('upload-current-user');
  const uploadQuota = document.getElementById('upload-quota');
  const uploadRemaining = document.getElementById('upload-remaining');
  const uploadDropzone = document.getElementById('upload-dropzone');
  const uploadFileInput = document.getElementById('upload-file-input');
  const uploadOpenMain = document.getElementById('upload-open-main');
  const uploadCloseWindow = document.getElementById('upload-close-window');
  const uploadThemeToggle = document.getElementById('upload-theme-toggle');
  const uploadProgressBox = document.getElementById('upload-progress-box');
  const uploadProgressLabel = document.getElementById('upload-progress-label');
  const uploadProgressFill = document.getElementById('upload-progress-fill');
  const uploadProgressCopy = document.getElementById('upload-progress-copy');
  const uploadQueueEmpty = document.getElementById('upload-queue-empty');
  const uploadQueueList = document.getElementById('upload-queue-list');

  let currentUser = '';
  let currentUserProfile = null;
  let currentFiles = [];
  let authMode = 'firebase';
  let isUploading = false;
  let dragDepth = 0;
  let archiveFilesUnsubscribe = null;

  function normalizeUserId(userId) {
    return String(userId || '').trim().toLowerCase();
  }

  function idToEmail(id) {
    return `${normalizeUserId(id)}@seolhwa.dev`;
  }

  function isAdminUserId(userId) {
    return normalizeUserId(userId) === ADMIN_ACCOUNT.id;
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

  function canUseUploadWindow(userId = currentUser, profile = currentUserProfile) {
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

  function createArchiveFileId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }

    return `archive-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function getFileExtension(fileName) {
    return String(fileName || '').split('.').pop().toLowerCase();
  }

  function uploadFileWithProgress(file, folder, onProgress) {
    return new Promise((resolve, reject) => {
      if (!UPLOAD_ENDPOINT) {
        reject(new Error('업로드 API 주소가 설정되지 않았습니다.'));
        return;
      }

      const apiUrl = new URL(UPLOAD_ENDPOINT, window.location.href);
      if (window.location.protocol === 'https:' && apiUrl.protocol !== 'https:') {
        reject(new Error('HTTPS 사이트에서는 HTTP 업로드 서버를 호출할 수 없습니다. OCI 서버에 HTTPS 인증서를 설정하고 업로드 주소를 https://로 변경해 주세요.'));
        return;
      }

      const request = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('folder', folder);
      formData.append('file', file);

      request.open('POST', apiUrl.href);
      request.timeout = Math.min(600000, 60000 + Math.ceil(file.size / (10 * STORAGE_MB_BYTES)) * 60000);
      request.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      });
      request.addEventListener('load', () => {
        let response = null;
        try {
          response = JSON.parse(request.responseText);
        } catch (error) {
          response = { message: request.responseText };
        }

        if (request.status < 200 || request.status >= 300 || response?.success !== true) {
          reject(new Error(response?.error || response?.message || response?.detail || '파일 업로드에 실패했습니다.'));
          return;
        }
        resolve(response);
      });
      request.addEventListener('error', () => reject(new Error('업로드 서버에 연결할 수 없습니다. CORS와 HTTPS 설정을 확인해 주세요.')));
      request.addEventListener('timeout', () => reject(new Error('업로드 시간이 초과되었습니다.')));
      request.addEventListener('abort', () => reject(new Error('업로드가 취소되었습니다.')));
      request.send(formData);
    });
  }

  function applyTheme(theme) {
    const nextTheme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem(themeStorageKey, nextTheme);
    if (uploadThemeToggle) {
      uploadThemeToggle.textContent = nextTheme === 'dark' ? '라이트 모드' : '다크 모드';
    }
  }

  function setStatus(element, message = '', type = 'info') {
    if (!element) {
      return;
    }

    element.textContent = message;
    element.classList.remove('is-error', 'is-success');
    if (type === 'error') {
      element.classList.add('is-error');
    }
    if (type === 'success') {
      element.classList.add('is-success');
    }
  }

  function readUserProfiles() {
    try {
      const raw = localStorage.getItem(userProfilesStorageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      console.warn('[ArchiveUpload] read profiles error', error);
      return {};
    }
  }

  function getCachedProfileById(userId) {
    const normalizedId = normalizeUserId(userId);
    if (!normalizedId) {
      return null;
    }
    return readUserProfiles()[normalizedId] || null;
  }

  function getCurrentFilesTotalBytes() {
    return currentFiles.reduce((sum, file) => sum + Math.max(0, Number(file?.sizeBytes) || 0), 0);
  }

  function renderKpis() {
    if (uploadCurrentUser) {
      uploadCurrentUser.textContent = currentUser || '-';
    }

    if (!currentUser) {
      if (uploadQuota) {
        uploadQuota.textContent = '0 MB';
      }
      if (uploadRemaining) {
        uploadRemaining.textContent = '0 MB';
      }
      return;
    }

    if (isAdminUserId(currentUser)) {
      if (uploadQuota) {
        uploadQuota.textContent = '무제한';
      }
      if (uploadRemaining) {
        uploadRemaining.textContent = '무제한';
      }
      return;
    }

    const quotaMb = getStorageQuotaMb(currentUserProfile);
    const totalBytes = getCurrentFilesTotalBytes();
    if (uploadQuota) {
      uploadQuota.textContent = formatStorageAmount(quotaMb);
    }
    if (uploadRemaining) {
      uploadRemaining.textContent = quotaMb > 0
        ? formatFileSize(Math.max(0, quotaMb * STORAGE_MB_BYTES - totalBytes))
        : '0 MB';
    }
  }

  function renderQueue(files = []) {
    if (!uploadQueueList || !uploadQueueEmpty) {
      return;
    }

    if (!files.length) {
      uploadQueueList.innerHTML = '';
      uploadQueueEmpty.hidden = false;
      return;
    }

    uploadQueueEmpty.hidden = true;
    uploadQueueList.innerHTML = files.map((file) => `
      <article class="queue-item">
        <div>
          <p class="queue-name">${String(file.name || '이름 없는 파일')}</p>
          <p class="queue-meta">${formatFileSize(file.size || file.sizeBytes || 0)} · ${String(file.type || file.mimeType || 'application/octet-stream')}</p>
        </div>
      </article>
    `).join('');
  }

  function setProgress(visible, options = {}) {
    if (!uploadProgressBox || !uploadProgressLabel || !uploadProgressFill || !uploadProgressCopy) {
      return;
    }

    uploadProgressBox.hidden = !visible;
    if (!visible) {
      uploadProgressLabel.textContent = '업로드 준비 중';
      uploadProgressFill.style.width = '0%';
      uploadProgressCopy.textContent = '대기 중입니다.';
      return;
    }

    const percent = Math.max(0, Math.min(100, Number(options.percent) || 0));
    uploadProgressLabel.textContent = options.label || '업로드 중';
    uploadProgressFill.style.width = `${percent}%`;
    uploadProgressCopy.textContent = options.copy || '업로드를 처리하고 있습니다.';
  }

  function renderDropzoneState() {
    if (!uploadDropzone) {
      return;
    }

    uploadDropzone.classList.toggle('is-disabled', isUploading || !canUseUploadWindow());
  }

  function resetDragState() {
    dragDepth = 0;
    if (uploadDropzone) {
      uploadDropzone.classList.remove('is-dragover');
    }
  }

  async function waitForCondition(predicate, errorMessage, options = {}) {
    const maxAttempts = Number(options.maxAttempts) || 20;
    const intervalMs = Number(options.intervalMs) || 150;
    let attempts = 0;

    while (!predicate() && attempts < maxAttempts) {
      await new Promise((resolve) => window.setTimeout(resolve, intervalMs));
      attempts += 1;
    }

    if (!predicate()) {
      throw new Error(errorMessage);
    }
  }

  async function waitForAuth() {
    if (window.firebaseAuthReadyPromise) {
      await window.firebaseAuthReadyPromise;
    }

    await waitForCondition(
      () => Boolean(window.auth && window.onAuthStateChanged),
      'Firebase Auth가 초기화되지 않았습니다.'
    );
  }

  async function waitForFirestore() {
    if (window.firebaseDataReadyPromise) {
      await window.firebaseDataReadyPromise;
    }

    await waitForCondition(
      () => Boolean(window.db && window.collection && window.onSnapshot && window.doc && window.setDoc && window.getDoc),
      'Firebase DB가 초기화되지 않았습니다.'
    );
  }

  async function getUserProfile(userId) {
    const normalizedId = normalizeUserId(userId);
    if (!normalizedId) {
      return null;
    }

    const cached = getCachedProfileById(normalizedId);
    if (cached) {
      return cached;
    }

    try {
      await waitForFirestore();
      const snapshot = await window.getDoc(window.doc(window.db, 'userProfiles', normalizedId));
      return snapshot.exists() ? { userId: normalizedId, ...snapshot.data() } : null;
    } catch (error) {
      console.warn('[ArchiveUpload] get user profile error', error);
      return null;
    }
  }

  async function startArchiveFilesListener() {
    if (typeof archiveFilesUnsubscribe === 'function') {
      archiveFilesUnsubscribe();
      archiveFilesUnsubscribe = null;
    }

    currentFiles = [];
    renderKpis();

    if (!currentUser || !canUseUploadWindow()) {
      return;
    }

    try {
      await waitForFirestore();
      archiveFilesUnsubscribe = window.onSnapshot(window.collection(window.db, archiveFilesCollectionName), (snapshot) => {
        const files = [];
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data() || {};
          if (normalizeUserId(data.ownerId) === currentUser) {
            files.push({ id: docSnapshot.id, ...data });
          }
        });
        currentFiles = files;
        renderKpis();
      }, (error) => {
        console.error('[ArchiveUpload] archive files listener error', error);
      });
    } catch (error) {
      console.error('[ArchiveUpload] start files listener error', error);
    }
  }

  function applyAuthenticatedUser(userId, options = {}) {
    const normalizedUserId = normalizeUserId(userId);
    currentUser = normalizedUserId;
    currentUserProfile = options.profile || null;

    renderKpis();
    renderDropzoneState();

    if (!canUseUploadWindow()) {
      setStatus(uploadAuthStatus, `${normalizedUserId} 계정은 아직 Archive 업로드 권한이 없습니다.`, 'error');
      setStatus(uploadStatus, '관리자에게 Archive 접근 권한과 할당량을 받아야 업로드할 수 있습니다.', 'error');
      return;
    }

    const successMessage = options.successMessage || `${normalizedUserId} 계정으로 업로드 창에 연결되었습니다.`;
    setStatus(uploadAuthStatus, successMessage, 'success');
    setStatus(uploadStatus, '파일을 끌어다 놓거나 파일 선택 버튼으로 업로드할 수 있습니다.');
    startArchiveFilesListener();
  }

  function resetUploadSession() {
    currentUser = '';
    currentUserProfile = null;
    currentFiles = [];
    if (typeof archiveFilesUnsubscribe === 'function') {
      archiveFilesUnsubscribe();
      archiveFilesUnsubscribe = null;
    }
    renderKpis();
    renderQueue();
    renderDropzoneState();
    resetDragState();
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

      applyAuthenticatedUser(session.userId, {
        profile: {
          userId: normalizeUserId(session.userId),
          email: idToEmail(session.userId),
          storageQuotaMb: 0
        },
        successMessage: '로컬 관리자 세션으로 업로드 창에 연결되었습니다.'
      });
      return true;
    } catch (error) {
      console.warn('[ArchiveUpload] local session restore error', error);
      return false;
    }
  }

  async function uploadOneFile(file, position, totalCount) {
    const fileId = createArchiveFileId();

    setProgress(true, {
      label: `${position}/${totalCount} 업로드 중`,
      percent: 0,
      copy: `${file.name} 업로드를 시작합니다.`
    });

    try {
      const uploadResponse = await uploadFileWithProgress(file, `archive/${currentUser}`, (percent) => {
        setProgress(true, {
          label: `${position}/${totalCount} 업로드 중`,
          percent,
          copy: `${file.name} ${percent}% 업로드됨`
        });
      });
      const responseFile = uploadResponse?.file && typeof uploadResponse.file === 'object'
        ? { ...uploadResponse, ...uploadResponse.file }
        : uploadResponse;
      const responseFileName = responseFile?.file_name || responseFile?.filename || responseFile?.fileName || responseFile?.name || file.name;
      const responseFilePath = responseFile?.path || responseFile?.file_path || responseFile?.filePath || responseFile?.storagePath || responseFile?.file_name || responseFile?.filename || '';
      const responseUrl = responseFile?.public_url || responseFile?.url || responseFile?.fileUrl || responseFile?.file_url || responseFile?.downloadUrl || responseFile?.download_url || '';
      let publicUrl = '';
      if (responseUrl) {
        try {
          const apiOrigin = new URL(UPLOAD_ENDPOINT, window.location.href).origin;
          const parsedUrl = new URL(responseUrl, apiOrigin);
          if (['http:', 'https:'].includes(parsedUrl.protocol)) {
            publicUrl = parsedUrl.href;
          }
        } catch (error) {
          console.warn('[ArchiveUpload] invalid file URL in upload response', error);
        }
      }
      if (!publicUrl) {
        throw new Error('업로드 서버 응답에 유효한 public_url이 없습니다.');
      }

      setProgress(true, {
        label: `${position}/${totalCount} 업로드 완료`,
        percent: 100,
        copy: `${file.name} 업로드를 마쳤습니다.`
      });

      if (uploadResultBox && uploadResultCopy && uploadResultLink) {
        uploadResultCopy.textContent = responseFilePath
          ? `업로드 완료 · ${responseFilePath}`
          : `업로드 완료 · ${responseFileName}`;
        uploadResultLink.hidden = !publicUrl;
        if (publicUrl) {
          uploadResultLink.href = publicUrl;
          uploadResultLink.textContent = '파일 열기';
        } else {
          uploadResultLink.removeAttribute('href');
        }
        uploadResultBox.hidden = false;
      }

      try {
        await waitForFirestore();
        const now = new Date().toISOString();
        await window.setDoc(window.doc(window.db, archiveFilesCollectionName, fileId), {
          id: fileId,
          ownerId: currentUser,
          ownerEmail: currentUserProfile?.email || idToEmail(currentUser),
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: Number(file.size) || 0,
          storagePath: responseFilePath || responseFileName,
          downloadUrl: publicUrl,
          createdAt: now,
          updatedAt: now,
          isShared: false,
          shareUpdatedAt: ''
        }, { merge: true });
      } catch (firestoreError) {
        console.error('[ArchiveUpload] Firestore save error', firestoreError);
        throw new Error(`${file.name}은 서버에 업로드됐지만 Archive 목록에 저장하지 못했습니다: ${firestoreError.message}`);
      }
      return { fileName: responseFileName, filePath: responseFilePath, publicUrl };
    } catch (error) {
      console.error('[ArchiveUpload] upload error', error);
      throw error;
    }
  }

  async function handleUploadSelection(fileList) {
    const selectedFiles = Array.from(fileList || []).filter(Boolean);
    const invalidFiles = selectedFiles.filter((file) => (
      file.size > MAX_UPLOAD_SIZE_BYTES || !ALLOWED_EXTENSIONS.has(getFileExtension(file.name))
    ));
    const files = selectedFiles.filter((file) => !invalidFiles.includes(file));
    renderQueue(files);
    if (uploadResultBox) {
      uploadResultBox.hidden = true;
    }

    if (!selectedFiles.length) {
      return;
    }

    if (invalidFiles.length) {
      const reasons = invalidFiles.map((file) => (
        file.size > MAX_UPLOAD_SIZE_BYTES ? `${file.name} (100MB 초과)` : `${file.name} (허용되지 않는 확장자)`
      ));
      setStatus(uploadStatus, `${reasons.join(', ')} 파일은 업로드할 수 없습니다.`, 'error');
      if (!files.length) {
        return;
      }
    }

    if (!currentUser) {
      setStatus(uploadStatus, '로그인 세션을 확인한 뒤 다시 시도하세요.', 'error');
      return;
    }

    if (!canUseUploadWindow()) {
      setStatus(uploadStatus, 'Archive 접근 권한과 스토리지 할당량이 있어야 업로드할 수 있습니다.', 'error');
      return;
    }

    const quotaBytes = isAdminUserId(currentUser) ? Number.POSITIVE_INFINITY : getStorageQuotaMb(currentUserProfile) * STORAGE_MB_BYTES;
    let usedBytes = getCurrentFilesTotalBytes();
    const skipped = [];

    isUploading = true;
    renderDropzoneState();

    try {
      const uploadedFiles = [];
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        if (!isAdminUserId(currentUser) && quotaBytes > 0 && usedBytes + file.size > quotaBytes) {
          skipped.push(file.name);
          continue;
        }

        uploadedFiles.push(await uploadOneFile(file, index + 1, files.length));
        usedBytes += Number(file.size) || 0;
      }

      if (uploadedFiles.length && invalidFiles.length) {
        setStatus(uploadStatus, `${uploadedFiles.length}개 파일 업로드 완료, ${invalidFiles.length}개는 형식 또는 용량 제한으로 제외했습니다.`, 'success');
      } else if (uploadedFiles.length) {
        setStatus(uploadStatus, `${uploadedFiles.length}개 파일 업로드를 완료했습니다. 메인 Archive에도 바로 반영됩니다.`, 'success');
      }
      if (skipped.length && skipped.length === files.length) {
        setStatus(uploadStatus, '남은 공간이 부족해서 업로드할 수 없습니다.', 'error');
      } else if (skipped.length) {
        setStatus(uploadStatus, `일부 파일만 업로드했고 ${skipped.length}개는 공간 부족으로 건너뛰었습니다.`, 'success');
      }
    } catch (error) {
      console.error('[ArchiveUpload] upload error', error);
      setStatus(uploadStatus, error?.message || '파일 업로드 중 오류가 발생했습니다.', 'error');
    } finally {
      isUploading = false;
      renderDropzoneState();
      renderKpis();
      setProgress(false);
      if (uploadFileInput) {
        uploadFileInput.value = '';
      }
    }
  }

  async function initializeAuth() {
    setStatus(uploadAuthStatus, '세션을 확인하는 중입니다.');

    try {
      await waitForAuth();
      if (!window.auth || !window.onAuthStateChanged) {
        throw new Error('Firebase Auth 객체를 찾을 수 없습니다.');
      }

      authMode = 'firebase';
      window.onAuthStateChanged(window.auth, async (user) => {
        if (!user) {
          resetUploadSession();
          if (restoreLocalAuthSession()) {
            return;
          }
          setStatus(uploadAuthStatus, '메인 페이지에서 로그인한 뒤 다시 열어주세요.', 'error');
          setStatus(uploadStatus, '로그인 세션이 없어서 업로드할 수 없습니다.', 'error');
          return;
        }

        const normalizedUserId = normalizeUserId(user.displayName || user.email?.split('@')[0] || '익명');
        const profile = isAdminUserId(normalizedUserId)
          ? { userId: normalizedUserId, email: user.email || idToEmail(normalizedUserId), storageQuotaMb: 0 }
          : await getUserProfile(normalizedUserId);
        applyAuthenticatedUser(normalizedUserId, { profile });
      });
    } catch (error) {
      console.error('[ArchiveUpload] initialize auth error', error);
      authMode = 'local';
      resetUploadSession();
      if (restoreLocalAuthSession()) {
        return;
      }
      setStatus(uploadAuthStatus, '인증 정보를 확인하지 못했습니다.', 'error');
      setStatus(uploadStatus, '이 창에서는 업로드를 진행할 수 없습니다.', 'error');
    }
  }

  applyTheme(localStorage.getItem(themeStorageKey) || 'light');

  if (uploadThemeToggle) {
    uploadThemeToggle.addEventListener('click', () => {
      const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
    });
  }

  if (uploadCloseWindow) {
    uploadCloseWindow.addEventListener('click', () => {
      window.close();
    });
  }

  if (uploadOpenMain) {
    uploadOpenMain.addEventListener('click', () => {
      if (window.opener && !window.opener.closed) {
        window.opener.focus();
        return;
      }
      window.open('archive.html', '_blank', 'noopener');
    });
  }

  if (uploadFileInput) {
    uploadFileInput.addEventListener('change', (event) => {
      handleUploadSelection(event.target.files);
    });
  }

  if (uploadDropzone) {
    uploadDropzone.addEventListener('dragenter', (event) => {
      if (isUploading || !canUseUploadWindow()) {
        return;
      }
      event.preventDefault();
      dragDepth += 1;
      uploadDropzone.classList.add('is-dragover');
    });

    uploadDropzone.addEventListener('dragover', (event) => {
      if (isUploading || !canUseUploadWindow()) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      uploadDropzone.classList.add('is-dragover');
    });

    uploadDropzone.addEventListener('dragleave', (event) => {
      if (isUploading || !canUseUploadWindow()) {
        return;
      }
      event.preventDefault();
      dragDepth = Math.max(0, dragDepth - 1);
      if (dragDepth === 0) {
        uploadDropzone.classList.remove('is-dragover');
      }
    });

    uploadDropzone.addEventListener('drop', (event) => {
      if (isUploading || !canUseUploadWindow()) {
        return;
      }
      event.preventDefault();
      const files = event.dataTransfer?.files;
      resetDragState();
      if (files?.length) {
        handleUploadSelection(files);
      }
    });
  }

  window.addEventListener('dragend', resetDragState);
  window.addEventListener('drop', (event) => {
    if (event.target === document.documentElement || event.target === document.body) {
      event.preventDefault();
      resetDragState();
    }
  });

  renderKpis();
  renderQueue();
  renderDropzoneState();
  initializeAuth();
})();