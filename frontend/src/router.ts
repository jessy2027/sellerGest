// Simple router basé sur le hash

type RouteHandler = () => void;

interface Route {
  path: string;
  handler: RouteHandler;
}

class Router {
  private routes: Route[] = [];
  private notFoundHandler: RouteHandler = () => {};

  addRoute(path: string, handler: RouteHandler) {
    this.routes.push({ path, handler });
    return this;
  }

  setNotFound(handler: RouteHandler) {
    this.notFoundHandler = handler;
    return this;
  }

  navigate(path: string) {
    window.location.hash = path;
  }

  getCurrentPath(): string {
    return window.location.hash.slice(1) || '/';
  }

  private matchRoute(path: string): Route | null {
    for (const route of this.routes) {
      if (route.path === path) {
        return route;
      }
      // Simple pattern matching for routes like /products/:id
      const routeParts = route.path.split('/');
      const pathParts = path.split('/');
      
      if (routeParts.length === pathParts.length) {
        let match = true;
        for (let i = 0; i < routeParts.length; i++) {
          if (routeParts[i].startsWith(':')) continue;
          if (routeParts[i] !== pathParts[i]) {
            match = false;
            break;
          }
        }
        if (match) return route;
      }
    }
    return null;
  }

  handleRoute() {
    const path = this.getCurrentPath();
    const route = this.matchRoute(path);
    
    if (route) {
      route.handler();
    } else {
      this.notFoundHandler();
    }
  }

  start() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  }
}

export const router = new Router();

