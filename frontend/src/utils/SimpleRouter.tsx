/**
 * Simple Router implementation to avoid React version conflicts
 * Provides basic routing functionality without external dependencies
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface RouterContextType {
  currentPath: string;
  navigate: (path: string) => void;
  params: Record<string, string>;
}

const RouterContext = createContext<RouterContextType | null>(null);

interface SimpleRouterProps {
  children: ReactNode;
}

export const SimpleRouter: React.FC<SimpleRouterProps> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [params] = useState<Record<string, string>>({});

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
  };

  const value: RouterContextType = {
    currentPath,
    navigate,
    params,
  };

  return (
    <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
  );
};

export const useNavigate = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useNavigate must be used within a SimpleRouter");
  }
  return context.navigate;
};

export const useLocation = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useLocation must be used within a SimpleRouter");
  }
  return { pathname: context.currentPath };
};

interface RouteProps {
  path: string;
  children: ReactNode;
}

export const Route: React.FC<RouteProps> = ({ path, children }) => {
  const context = useContext(RouterContext);
  if (!context) {
    return null;
  }

  const { currentPath } = context;

  // Simple path matching
  if (path === currentPath) {
    return <>{children}</>;
  }

  // Handle root redirect
  if (path === "/" && currentPath === "/") {
    return <>{children}</>;
  }

  return null;
};

interface NavigateProps {
  to: string;
  replace?: boolean;
}

export const Navigate: React.FC<NavigateProps> = ({ to }) => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(to);
  }, [to, navigate]);

  return null;
};

interface LinkProps {
  to: string;
  children: ReactNode;
  className?: string;
}

export const Link: React.FC<LinkProps> = ({ to, children, className }) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(to);
  };

  return (
    <a href={to} onClick={handleClick} className={className}>
      {children}
    </a>
  );
};
