class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.currentView = null;
    window.addEventListener('hashchange', () => this.resolve());
  }

  addRoute(pattern, viewFn) {
    this.routes[pattern] = viewFn;
  }

  navigate(hash) {
    window.location.hash = hash;
  }

  resolve() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    let matched = false;

    for (const [pattern, viewFn] of Object.entries(this.routes)) {
      const regex = new RegExp('^' + pattern.replace(/:\w+/g, '([^/]+)') + '$');
      const match = hash.match(regex);
      if (match) {
        const params = match.slice(1);
        if (this.currentView !== pattern) {
          this.currentView = pattern;
          viewFn(...params);
          this.reanimate();
        }
        this.updateActiveNav(hash);
        matched = true;
        break;
      }
    }

    if (!matched) {
      window.location.hash = 'dashboard';
    }
  }

  updateActiveNav(hash) {
    document.querySelectorAll('.nav-link').forEach(link => {
      const route = link.dataset.route;
      const isActive = route && (hash === route || hash.startsWith(route));
      link.classList.toggle('active', isActive);
    });
  }

  reanimate() {
    const c = document.getElementById('viewContainer');
    if (!c) return;
    c.style.animation = 'none';
    void c.offsetWidth;
    c.style.animation = '';
  }
}

const router = new Router();
