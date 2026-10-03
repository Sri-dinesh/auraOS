import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Sparkles,
  Zap,
  Grid3X3,
  BookMarked,
  Clock,
  Settings,
  PanelTop,
} from 'lucide-react';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  shortcut?: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/', shortcut: '' },
  { icon: Sparkles, label: 'Scenes', path: '/scenes', shortcut: '' },
  { icon: Zap, label: 'Automations', path: '/automations', shortcut: '' },
  { icon: Grid3X3, label: 'Widgets', path: '/widgets', shortcut: '' },
  { icon: BookMarked, label: 'Library', path: '/library', shortcut: '' },
  { icon: Clock, label: 'Activity', path: '/activity', shortcut: '' },
];

const bottomItems: NavItem[] = [
  { icon: Settings, label: 'Settings', path: '/settings', shortcut: '' },
];

export function Sidebar() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <motion.nav
      className="flex flex-col border-r border-border bg-surface/50 h-full w-16 lg:w-56 shrink-0"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Top brand area */}
      <div className="flex items-center justify-between h-12 px-3 lg:px-4 border-b border-border/50">
        <div className="flex items-center gap-2.5 overflow-hidden hidden lg:flex">
          <div className="w-7 h-7 rounded-lg bg-gradient-aura flex items-center justify-center glow-primary shrink-0">
            <PanelTop className="w-4 h-4 text-background" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold tracking-tight whitespace-nowrap">AuraOS</span>
        </div>
        <div className="flex items-center lg:hidden w-8 h-8">
          <div className="w-7 h-7 rounded-lg bg-gradient-aura flex items-center justify-center glow-primary shrink-0">
            <PanelTop className="w-4 h-4 text-background" strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-3 px-1.5 lg:px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive: isActiveLink }) =>
              `
                ${isActiveLink ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground hover:bg-surface-hover/60'}
                flex items-center gap-3 px-2.5 py-2 rounded-lg transition-all duration-100 group relative
                ${isActive(item.path) ? 'font-medium' : ''}
              `.trim()
            }
            end={item.path === '/'}
          >
            <span className="shrink-0 w-5 h-5 flex items-center justify-center">
              <item.icon className="w-4 h-4" strokeWidth={isActive(item.path) ? 2 : 1.75} />
            </span>
            <span className="whitespace-nowrap text-sm truncate hidden lg:inline">{item.label}</span>
            {/* Active indicator */}
            <motion.div
              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-md"
              initial={{ scaleX: 0 }}
              animate={
                isActive(item.path)
                  ? { scaleX: 1 }
                  : { scaleX: 0 }
              }
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            />
          </NavLink>
        ))}
      </div>

      {/* Bottom section */}
      <div className="border-t border-border/50 py-2 px-1.5 lg:px-2 space-y-0.5">
        {bottomItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive: isActiveLink }) =>
              `
                ${isActiveLink ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground hover:bg-surface-hover/60'}
                flex items-center gap-3 px-2.5 py-2 rounded-lg transition-all duration-100 relative
                ${isActive(item.path) ? 'font-medium' : ''}
              `.trim()
            }
          >
            <span className="shrink-0 w-5 h-5 flex items-center justify-center">
              <item.icon className="w-4 h-4" strokeWidth={isActive(item.path) ? 2 : 1.75} />
            </span>
            <span className="whitespace-nowrap text-sm truncate hidden lg:inline">{item.label}</span>
            <motion.div
              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-md"
              initial={{ scaleX: 0 }}
              animate={isActive(item.path) ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            />
          </NavLink>
        ))}
      </div>
    </motion.nav>
  );
}
