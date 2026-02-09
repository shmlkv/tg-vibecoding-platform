'use client';

import { Cell, Section, Text, Title } from '@telegram-apps/telegram-ui';

import { Page } from '@/components/Page';
import { TabNavigation } from '@/components/TabNavigation';
import { LocaleSwitcher } from '@/components/LocaleSwitcher/LocaleSwitcher';

export default function Home() {
  return (
    <Page back={false}>
      <div style={{ padding: '24px 20px 96px' }}>
        <Title level="1" weight="1">
          Components Starter
        </Title>
        <Text style={{ marginTop: 8 }}>
          A clean, data-free base for building a new Telegram Mini App UI.
        </Text>

        <Section header="Quick Setup" style={{ marginTop: 24 }}>
          <Cell readOnly multiline>
            Edit the pages under <code>src/app</code> and reuse components from{' '}
            <code>src/components</code>.
          </Cell>
          <Cell readOnly multiline>
            Use the locale switcher below to test i18n without any backend data.
          </Cell>
        </Section>

        <Section header="Locale" style={{ marginTop: 24 }}>
          <LocaleSwitcher />
        </Section>
      </div>

      <TabNavigation />
    </Page>
  );
}
