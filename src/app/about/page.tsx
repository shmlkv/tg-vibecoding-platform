'use client';

import { Cell, Section, Text, Title } from '@telegram-apps/telegram-ui';

import { Page } from '@/components/Page';
import { TabNavigation } from '@/components/TabNavigation';

export default function AboutPage() {
  return (
    <Page>
      <div style={{ padding: '24px 20px 96px' }}>
        <Title level="1" weight="1">
          About This Starter
        </Title>
        <Text style={{ marginTop: 8 }}>
          This project is intentionally minimal and contains only UI components and
          static pages. Add your own data layer when you are ready.
        </Text>

        <Section header="What is included" style={{ marginTop: 24 }}>
          <Cell readOnly multiline>Reusable components in <code>src/components</code></Cell>
          <Cell readOnly multiline>Telegram Mini App UI wrapper</Cell>
          <Cell readOnly multiline>Basic i18n wiring without data sources</Cell>
        </Section>
      </div>

      <TabNavigation />
    </Page>
  );
}
