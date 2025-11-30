'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Tabbar } from '@telegram-apps/telegram-ui';

const FeedIcon = ({ isActive }: { isActive: boolean }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="7" fill={isActive ? 'currentColor' : 'none'} />
    <rect x="14" y="3" width="7" height="7" fill={isActive ? 'currentColor' : 'none'} />
    <rect x="14" y="14" width="7" height="7" fill={isActive ? 'currentColor' : 'none'} />
    <rect x="3" y="14" width="7" height="7" fill={isActive ? 'currentColor' : 'none'} />
  </svg>
);

const CreateIcon = ({ isActive }: { isActive: boolean }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" fill={isActive ? 'currentColor' : 'none'} />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const ProfileIcon = ({ isActive }: { isActive: boolean }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="8" r="5" fill={isActive ? 'currentColor' : 'none'} />
    <path d="M20 21a8 8 0 1 0-16 0" fill={isActive ? 'currentColor' : 'none'} />
  </svg>
);

const tabs = [
  { href: '/posts', label: 'Feed', icon: FeedIcon },
  { href: '/generate', label: 'Create', icon: CreateIcon },
  { href: '/profile', label: 'Profile', icon: ProfileIcon },
];

export function TabNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Tabbar
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--tg-theme-bg-color, #fff)',
        boxShadow: '0 -6px 20px rgba(0, 0, 0, 0.04)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 100,
      }}
    >
      {tabs.map((tab) => {
        const isSelected = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const Icon = tab.icon;

        return (
          <Tabbar.Item
            key={tab.href}
            selected={isSelected}
            text={tab.label}
            onClick={() => router.push(tab.href)}
          >
            <Icon isActive={isSelected} />
          </Tabbar.Item>
        );
      })}
    </Tabbar>
  );
}
