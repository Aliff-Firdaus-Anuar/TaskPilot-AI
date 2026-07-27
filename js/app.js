(function() {
  const ROUTES = {
    auth: ['login', 'register'],
    app: ['dashboard', 'projects', 'projects/:id', 'ai-assist', 'guide', 'profile', 'invite/:token']
  };

  let currentUser = null;

  function setupAllRoutes() {
    ROUTES.app.forEach(p => {
      const parts = p.split('/');
      if (parts.length === 1) {
        router.addRoute(p, () => ModuleRouter[parts[0]]());
      } else if (parts.length === 2) {
        router.addRoute(p, (id) => ModuleRouter[parts[0]](id));
      }
    });
    ROUTES.auth.forEach(r => router.addRoute(r, () => Auth[r === 'login' ? 'showLogin' : 'showRegister']()));
  }

  function reshape(user) {
    currentUser = user;
    Auth.currentUser = user;
    Auth.updateUI(user);
    router.routes = {};
    setupAllRoutes();
    if (user) {
      const hash = window.location.hash.slice(1);
      const target = hash && !ROUTES.auth.includes(hash) ? hash : 'dashboard';
      router.navigate(target);
      setTimeout(() => Notifications.updateBell(), 1000);
    } else {
      router.navigate('login');
    }
  }

  setupAllRoutes();

  sb.storage.createBucket('task-files', { public: true }).catch(() => {});
  sb.storage.createBucket('avatars', { public: true }).catch(() => {});

  sb.auth.getSession().then(({ data: { session } }) => {
    reshape(session?.user || null);
  }).catch(() => reshape(null));

  sb.auth.onAuthStateChange((event, session) => {
    const user = session?.user || null;
    if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
      reshape(null);
    } else if (user && user.id !== currentUser?.id) {
      reshape(user);
    } else if (user && !currentUser) {
      reshape(user);
    }
  });

  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      router.navigate(link.dataset.route);
      document.getElementById('sidebar').classList.remove('open');
    });
  });

  const darkToggle = document.getElementById('darkModeToggle');
  if (darkToggle) {
    const saved = localStorage.getItem('tp-dark') === 'true';
    if (saved) document.body.classList.add('dark');
    darkToggle.textContent = saved ? '\u2600' : '\u25D0';
    darkToggle.addEventListener('click', () => {
      const on = document.body.classList.toggle('dark');
      localStorage.setItem('tp-dark', on);
      darkToggle.textContent = on ? '\u2600' : '\u25D0';
    });
  }

  const notifBell = document.getElementById('notificationBell');
  if (notifBell) {
    notifBell.addEventListener('click', () => Notifications.showDropdown());
  }
})();

const ModuleRouter = {
  dashboard: () => Dashboard.show(),
  projects: (id) => id ? Projects.showDetail(id) : Projects.showList(),
  'ai-assist': () => AI.showAssist(),
  guide: () => Guide.show(),
  profile: () => Profile.show(),
  invite: (token) => Team.acceptInvite(token)
};
