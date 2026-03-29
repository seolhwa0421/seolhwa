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

  function loadSavedPosts() {
    try {
      const raw = localStorage.getItem(postsStorageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('[PostWriter] loadSavedPosts parse error', e);
      return [];
    }
  }

  function savePosts(posts) {
    try {
      localStorage.setItem(postsStorageKey, JSON.stringify(posts));
    } catch (e) {
      console.warn('[PostWriter] savePosts failed', e);
    }
  }

  function clearPosts() {
    if (postsList) {
      postsList.innerHTML = '';
    }
  }

  function renderSavedPosts() {
    if (!postsList) return;

    const saved = loadSavedPosts();
    const sorted = saved.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    clearPosts();
    sorted.forEach((post) => {
      addPost(post.content, post.imageDataUrl, post.user, post.createdAt, false, post.title);
    });
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

    detailImageWrapper.innerHTML = post.imageDataUrl ? `<img src="${post.imageDataUrl}" alt="상세 이미지" style="width:100%; height:auto; border-radius:8px;" />` : '';

    detailModal.style.display = 'flex';
  };

  const closeDetail = () => {
    detailModal.style.display = 'none';
  };

  detailClose.addEventListener('click', closeDetail);
  detailModal.addEventListener('click', (event) => {
    if (event.target === detailModal) closeDetail();
  });

  function addPost(content, imageDataUrl, user = currentUser, createdAt = null, shouldPersist = true, title = '') {
    if (!content.trim() && !imageDataUrl) return;

    const now = createdAt ? new Date(createdAt) : new Date();
    const dateString = now.toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric', weekday:'short' });

    const card = document.createElement('article');
    card.className = 'card';
    card.style.marginTop = '0.75rem';

    let imageSection = '';
    if (imageDataUrl) {
      imageSection = `
        <div style="margin-bottom:0.75rem; border-radius:10px; overflow:hidden;">
          <img src="${imageDataUrl}" alt="사용자 업로드 이미지" style="width:100%; height:auto; display:block; object-fit:cover;" />
        </div>
      `;
    }

    const titleText = title && title.trim() ? title.trim() : '제목 없음';

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.6rem; gap:0.6rem; flex-wrap:wrap;">
        <h3 style="margin:0; font-size:1.05rem;">
          <a href="#" class="post-title-link" style="color:var(--accent); text-decoration:none;">${titleText}</a>
        </h3>
        <small style="color:var(--muted);">${user || '익명'} • ${dateString}</small>
      </div>
      ${imageSection}
      <p style="margin:0; color:var(--text); line-height:1.6; white-space:pre-wrap;">${content.replace(/\n/g, '<br>')}</p>
    `;

    const titleAnchor = card.querySelector('.post-title-link');
    if (titleAnchor) {
      titleAnchor.addEventListener('click', (event) => {
        event.preventDefault();
        openDetail({
          title: titleText,
          user: user || '익명',
          content,
          imageDataUrl,
          createdAt: now.toISOString(),
        });
      });
    }

    postsList.prepend(card);

    if (!shouldPersist) return;

    const allPosts = loadSavedPosts();
    allPosts.push({
      user: user || '익명',
      title: titleText,
      content,
      imageDataUrl,
      createdAt: now.toISOString()
    });
    savePosts(allPosts);
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

  window.addEventListener('storage', (event) => {
    if (event.key === postsStorageKey) {
      renderSavedPosts();
    }
  });

  function exportPostsAsJson() {
    const all = loadSavedPosts();
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'seolhwa-posts.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function importPostsFromJson(jsonText) {
    try {
      const imported = JSON.parse(jsonText);
      if (!Array.isArray(imported)) throw new Error('JSON은 게시물 목록이어야 합니다.');

      const existing = loadSavedPosts();
      const mergedMap = new Map();

      existing.concat(imported).forEach((post) => {
        if (!post || !post.createdAt) return;
        const key = `${post.createdAt}-${post.user}-${post.title}-${post.content}`;
        mergedMap.set(key, post);
      });

      const merged = Array.from(mergedMap.values()).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      savePosts(merged);
      renderSavedPosts();
      alert('게시물 가져오기가 완료되었습니다.');
    } catch (e) {
      alert('가져오기 실패: 올바른 JSON 파일인지 확인해 주세요.');
      console.error('[PostWriter] importPostsFromJson error', e);
    }
  }

  setPostFormEnabled(false);
  renderSavedPosts();

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
