'use server';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Box, Flex, Heading, Link, Text } from '@radix-ui/themes';
import type { Breadcrumb } from './models';
import styles from './styles.module.css';

type Props = {
  breadcrumbs: Breadcrumb[];
};

export async function ContentHeader({ breadcrumbs }: Props) {
  return (
    <Flex justify={'between'} align={'center'} className={styles.contentHeader}>
      <Box className={styles.breadcrumbs}>
        {breadcrumbs.map((breadcrumb, idx) => (
          <Tooltip.Provider delayDuration={100} key={`${breadcrumb.label}-${idx}`}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <Flex direction='row' gap='1' align='center' className={styles.breadcrumb}>
                  {breadcrumb.href ? (
                    <Link href={breadcrumb.href} className={styles.breadcrumb}>
                      <Heading
                        weight={'bold'}
                        as={breadcrumb.as ?? 'h6'}
                        style={{ fontSize: '12px' }}
                        className={styles.breadcrumbText}
                      >
                        {breadcrumb.label}
                      </Heading>
                    </Link>
                  ) : (
                    <Heading
                      weight={'bold'}
                      as={breadcrumb.as ?? 'h6'}
                      style={{ fontSize: '12px' }}
                      className={styles.breadcrumbText}
                    >
                      {breadcrumb.label}
                    </Heading>
                  )}
                  {(() => {
                    const next = breadcrumbs[idx + 1];
                    if (!next) return null;
                    if (breadcrumb.group && next.group && breadcrumb.group === next.group) {
                      return <span className={styles.commaSeparator}>,</span>;
                    }
                    return (
                      <span
                        className={`material-symbols-outlined ${styles.arrowIcon}`}
                        translate='no'
                        aria-hidden='true'
                      >
                        keyboard_arrow_right
                      </span>
                    );
                  })()}
                </Flex>
              </Tooltip.Trigger>
              <Tooltip.Content className={styles.tooltip} side='top' align='start'>
                <Text>{breadcrumb.label}</Text>
              </Tooltip.Content>
            </Tooltip.Root>
          </Tooltip.Provider>
        ))}
      </Box>
    </Flex>
  );
}
