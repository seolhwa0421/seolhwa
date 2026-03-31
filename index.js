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
  const signupId = document.getElementById('signup-id');
  const signupPassword = document.getElementById('signup-password');
  const signupSubmit = document.getElementById('signup-submit');
  const signupMessage = document.getElementById('signup-message');
  const authStatus = document.getElementById('auth-status');

  const defaultAuthUser = {
    id: 'seolhwa0508',
    password: 'seolhwa0508?@'
  };

  let currentUser = null;
  let currentPosts = [];
  const usersStorageKey = 'seolhwa-users';
  const authSessionKey = 'seolhwa-current-user';
  const postsStorageKey = 'seolhwa-posts';

  function loadUsers() {
    try {
      const raw = localStorage.getItem(usersStorageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      const users = Array.isArray(parsed) ? parsed : [];
      const hasDefault = users.some((user) => user.id === defaultAuthUser.id);
      return hasDefault ? users : [defaultAuthUser, ...users];
    } catch (error) {
      console.error('[Auth] loadUsers error', error);
      return [defaultAuthUser];
    }
  }

  function saveUsers(users) {
    const usersWithoutDefault = users.filter((user) => user.id !== defaultAuthUser.id);
    localStorage.setItem(usersStorageKey, JSON.stringify(usersWithoutDefault));
  }

  function findUserById(id) {
    return loadUsers().find((user) => user.id === id) || null;
  }

  function setAuthStatus(message, type = 'info') {
    if (!authStatus) return;
    authStatus.textContent = message;
    authStatus.style.display = message ? 'block' : 'none';
    authStatus.style.color = type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : 'var(--muted)';
  }

  function applyAuthenticatedUser(userId) {
    currentUser = userId;
    localStorage.setItem(authSessionKey, userId);
    setPostFormEnabled(true);

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
    if (signupMessage) signupMessage.textContent = '';

    setAuthStatus(`${userId} 계정으로 로그인됨`, 'success');
  }

  function restoreAuthenticatedUser() {
    const savedUserId = localStorage.getItem(authSessionKey);
    if (!savedUserId) return;

    const user = findUserById(savedUserId);
    if (user) {
      applyAuthenticatedUser(user.id);
    } else {
      localStorage.removeItem(authSessionKey);
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
    if (window.firebaseReadyPromise) {
      await window.firebaseReadyPromise;
      return;
    }

    let attempts = 0;
    const maxAttempts = 20; // 2초 대기
    while (!window.db && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    if (!window.db) {
      throw new Error('Firebase가 초기화되지 않았습니다.');
    }
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
      updateFirebaseStatus('⚠️ Firebase 연결 실패 - 현재 기기에서만 저장됨', 'error');
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
    const sectionIds = ['auth', 'home', 'contact', 'post-write'];
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

    const sectionIds = ['auth', 'home', 'contact', 'post-write'];
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

  loginSubmit.addEventListener('click', () => {
    const id = loginId.value.trim();
    const password = loginPassword.value.trim();

    if (!id || !password) {
      loginMessage.textContent = '아이디와 비밀번호를 모두 입력해주세요.';
      return;
    }

    const user = findUserById(id);
    if (user && user.password === password) {
      applyAuthenticatedUser(id);
    } else {
      loginMessage.style.color = '#db2777';
      loginMessage.textContent = '아이디 또는 비밀번호가 틀렸습니다.';
    }
  });

  if (signupSubmit) {
    signupSubmit.addEventListener('click', () => {
      const id = signupId.value.trim();
      const password = signupPassword.value.trim();

      if (!id || !password) {
        signupMessage.style.color = '#ef4444';
        signupMessage.textContent = '회원가입할 아이디와 비밀번호를 모두 입력해주세요.';
        return;
      }

      if (id.length < 4 || password.length < 4) {
        signupMessage.style.color = '#ef4444';
        signupMessage.textContent = '아이디와 비밀번호는 4자 이상으로 입력해주세요.';
        return;
      }

      const users = loadUsers();
      const duplicated = users.some((user) => user.id === id);
      if (duplicated) {
        signupMessage.style.color = '#ef4444';
        signupMessage.textContent = '이미 사용 중인 아이디입니다.';
        return;
      }

      const newUser = { id, password };
      users.push(newUser);
      saveUsers(users);

      signupMessage.style.color = '#22c55e';
      signupMessage.textContent = '회원가입이 완료되어 자동으로 로그인합니다.';
      applyAuthenticatedUser(id);

      signupId.value = '';
      signupPassword.value = '';
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
  restoreAuthenticatedUser();
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
  const importBtn = document.getElementById('import-posts');
  const importInput = document.getElementById('import-file');

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

  if (importBtn) {
    importBtn.addEventListener('click', () => {
      if (importInput) {
        importInput.click();
      }
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

