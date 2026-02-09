'use client';

import { Cell, Section, Text, Title } from '@telegram-apps/telegram-ui';

import { Page } from '@/components/Page';
import { TabNavigation } from '@/components/TabNavigation';
import { RGB } from '@/components/RGB/RGB';
import { Link } from '@/components/Link/Link';

export default function ComponentsPage() {
  return (
    <Page>
      <div style={{ padding: '24px 20px 96px' }}>
        <Title level="1" weight="1">
          Components
        </Title>
        <Text style={{ marginTop: 8 }}>
          A small preview of shared UI pieces.
        </Text>

        <Section header="UI Samples" style={{ marginTop: 24 }}>
          <Cell readOnly multiline>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <RGB color="#00A4FF" />
              <span>Accent color sample</span>
            </div>
          </Cell>
          <Cell readOnly multiline>
            <Link href="https://example.com">Example link component</Link>
          </Cell>
        </Section>
      </div>

      <TabNavigation />
    </Page>
  );
}
