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
        position: 'sticky',
        bottom: 0,
        background: 'var(--tg-theme-bg-color, #fff)',
      }}
    >
      {tabs.map((tab) => (
        <Tabbar.Item
          key={tab.href}
          selected={pathname === tab.href}
          text={tab.label}
          onClick={() => router.push(tab.href)}
        >
          <span aria-hidden>{tab.icon}</span>
        </Tabbar.Item>
      ))}
    </Tabbar>
  );
}
