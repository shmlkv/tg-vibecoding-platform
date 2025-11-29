'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Tabbar } from '@telegram-apps/telegram-ui';

const tabs = [
  { href: '/posts', label: 'Feed', icon: '📰' },
  { href: '/generate', label: 'Create', icon: '✨' },
  { href: '/profile', label: 'Profile', icon: '👤' },
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

        return (
          <Tabbar.Item
            key={tab.href}
            selected={isSelected}
            text={tab.label}
            onClick={() => router.push(tab.href)}
          >
            <span aria-hidden>{tab.icon}</span>
          </Tabbar.Item>
        );
      })}
    </Tabbar>
  );
}
