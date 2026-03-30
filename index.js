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
  const postInput = document.getElementById('user-post');
  const postImageInput = document.getElementById('post-image');
  const submitBtn = document.getElementById('post-submit');
  const postsList = document.getElementById('posts-list');
  const loginId = document.getElementById('login-id');
  const loginPassword = document.getElementById('login-password');
  const loginSubmit = document.getElementById('login-submit');
  const loginMessage = document.getElementById('login-message');

  const authUser = {
    id: 'seolhwa0508',
    password: 'seolhwa0508?@'
  };

  let currentUser = null;
  const postsStorageKey = 'seolhwa-posts';

  // Firebase 준비 상태 확인
  async function waitForFirebase() {
    let attempts = 0;
    const maxAttempts = 50; // 5초 대기
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
      // 간단한 테스트 쿼리 실행
      const testQuery = window.query(window.collection(window.db, "posts"), window.orderBy("createdAt", "desc"));
      await window.getDocs(testQuery);
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
        posts.push({ id: doc.id, ...doc.data() });
      });
      return posts;
    } catch (e) {
      console.error('[PostWriter] loadSavedPosts error', e);
      // Firebase 실패시 localStorage 폴백
      try {
        const raw = localStorage.getItem(postsStorageKey);
        return raw ? JSON.parse(raw) : [];
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
        clearPosts();
        querySnapshot.forEach((doc) => {
          const post = { id: doc.id, ...doc.data() };
          addPostToDOM(post, false);
        });
      });
    } catch (e) {
      console.error('[PostWriter] renderSavedPosts Firebase error', e);
      // Firebase 실패시 localStorage에서 로드
      try {
        const saved = JSON.parse(localStorage.getItem(postsStorageKey) || '[]');
        const sorted = saved.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        clearPosts();
        sorted.forEach((post) => {
          addPostToDOM(post, false);
        });
      } catch (localError) {
        console.error('[PostWriter] localStorage fallback render error', localError);
      }
    }
  }

  function addPostToDOM(post, prepend = true) {
    const dateString = new Date(post.createdAt).toLocaleDateString('ko-KR', {
      year:'numeric', month:'long', day:'numeric', weekday:'short'
    });

    const card = document.createElement('article');
    card.className = 'card';
    card.style.marginTop = '0.75rem';

    let imageSection = '';
    if (post.imageDataUrl) {
      imageSection = `
        <div style="margin-bottom:0.75rem; border-radius:10px; overflow:hidden; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.02);">
          <img src="${post.imageDataUrl}" alt="사용자 업로드 이미지" style="width:100%; height:auto; display:block; object-fit:contain;" />
        </div>
      `;
    }

    const titleText = post.title && post.title.trim() ? post.title.trim() : '제목 없음';

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.6rem; gap:0.6rem; flex-wrap:wrap;">
        <h3 style="margin:0; font-size:1.05rem;">
          <a href="#" class="post-title-link" style="color:var(--accent); text-decoration:none;">${titleText}</a>
        </h3>
        <small style="color:var(--muted);">${post.user || '익명'} • ${dateString}</small>
      </div>
      ${imageSection}
      <p style="margin:0; color:var(--text); line-height:1.6; white-space:pre-wrap;">${(post.content || '').replace(/\n/g, '<br>')}</p>
    `;

    const titleAnchor = card.querySelector('.post-title-link');
    if (titleAnchor) {
      titleAnchor.addEventListener('click', (event) => {
        event.preventDefault();
        openDetail(post);
      });
    }

    if (prepend) {
      postsList.prepend(card);
    } else {
      postsList.appendChild(card);
    }
  }

  function setPostFormEnabled(enabled) {
    postTitleInput.disabled = !enabled;
    postInput.disabled = !enabled;
    postImageInput.disabled = !enabled;
    submitBtn.disabled = !enabled;

    // theme-driven form styles (dark/light)
    postTitleInput.style.background = '';
    postTitleInput.style.color = '';
    postInput.style.background = '';
    postInput.style.color = '';
    postImageInput.style.background = '';
    postImageInput.style.color = '';

    submitBtn.style.opacity = enabled ? '1' : '0.6';
    submitBtn.style.cursor = enabled ? 'pointer' : 'not-allowed';
  }

  const detailModal = document.getElementById('post-detail-modal');
  const detailTitle = document.getElementById('detail-title');
  const detailMeta = document.getElementById('detail-meta');
  const detailImageWrapper = document.getElementById('detail-image-wrapper');
  const detailContent = document.getElementById('detail-content');
  const detailClose = document.getElementById('detail-close');

  const openDetail = (post) => {
    detailTitle.textContent = post.title || '제목 없음';
    detailMeta.textContent = `${post.user || '익명'} • ${new Date(post.createdAt).toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric', weekday:'short' })}`;
    detailContent.innerHTML = (post.content || '').replace(/\n/g, '<br>');

    detailImageWrapper.innerHTML = post.imageDataUrl ? `<div style="display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.02); border-radius:8px; padding:1rem;"><img src="${post.imageDataUrl}" alt="상세 이미지" style="width:100%; height:auto; border-radius:8px; object-fit:contain;" /></div>` : '';

    detailModal.style.display = 'flex';
  };

  const closeDetail = () => {
    detailModal.style.display = 'none';
  };

  detailClose.addEventListener('click', closeDetail);
  detailModal.addEventListener('click', (event) => {
    if (event.target === detailModal) closeDetail();
  });

  async function addPost(content, imageDataUrl, user = currentUser, createdAt = null, shouldPersist = true, title = '') {
    if (!content.trim() && !imageDataUrl) return;

    const now = createdAt ? new Date(createdAt) : new Date();
    const titleText = title && title.trim() ? title.trim() : '제목 없음';

    const postData = {
      user: user || '익명',
      title: titleText,
      content,
      imageDataUrl,
      createdAt: now.toISOString()
    };

    // DOM에 즉시 추가 (Firebase 저장 전에도 표시)
    addPostToDOM(postData, true);

    if (shouldPersist) {
      await savePostToFirebase(postData);
    }
  }

  loginSubmit.addEventListener('click', () => {
    const id = loginId.value.trim();
    const password = loginPassword.value.trim();

    if (!id || !password) {
      loginMessage.textContent = '아이디와 비밀번호를 모두 입력해주세요.';
      return;
    }

    if (id === authUser.id && password === authUser.password) {
      currentUser = id;
      loginMessage.style.color = '#22c55e';
      loginMessage.textContent = `${id}님 환영합니다! 이제 글을 작성할 수 있습니다.`;
      setPostFormEnabled(true);
      loginId.disabled = true;
      loginPassword.disabled = true;
      loginSubmit.disabled = true;
    } else {
      loginMessage.style.color = '#db2777';
      loginMessage.textContent = '아이디 또는 비밀번호가 틀렸습니다.';
    }
  });

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
  // Firebase 연결 확인 후 게시물 로드
  checkFirebaseConnection().then(isConnected => {
    if (isConnected) {
      console.log('Firebase 연결됨: 모든 기기에서 글 공유 가능');
    } else {
      console.log('Firebase 연결 실패: 현재 기기에서만 글 저장됨');
      // localStorage에서 기존 데이터 로드
      try {
        const localPosts = JSON.parse(localStorage.getItem(postsStorageKey) || '[]');
        if (localPosts.length > 0) {
          clearPosts();
          localPosts.forEach(post => addPostToDOM(post, false));
        }
      } catch (e) {
        console.error('localStorage 로드 실패:', e);
      }
    }
    renderSavedPosts();
  });

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
    const value = postInput.value;
    const file = postImageInput.files && postImageInput.files[0];

    if (!title.trim() && !value.trim() && !file) {
      alert('제목 또는 본문 또는 이미지를 입력해 주세요.');
      return;
    }

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        addPost(value, reader.result, currentUser, null, true, title);
        postTitleInput.value = '';
        postInput.value = '';
        postImageInput.value = '';
      };
      reader.onerror = () => {
        alert('이미지를 불러오는 중 오류가 발생했습니다.');
      };
      reader.readAsDataURL(file);
    } else {
      addPost(value, null, currentUser, null, true, title);
      postTitleInput.value = '';
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

