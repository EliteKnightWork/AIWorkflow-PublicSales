import { Box, Flex, Text } from '@radix-ui/themes';
import { SearchFilterPresetFilterProjectSecurityQualificationsItem } from '@/api/generated/models';
import { AppCheckbox } from '@/components/checkbox/AppCheckbox';
import styles from './styles.module.css';

type Props = {
  value: SearchFilterPresetFilterProjectSecurityQualificationsItem[] | undefined;
  onChange: (
    value: SearchFilterPresetFilterProjectSecurityQualificationsItem[] | undefined
  ) => void;
};

export const SecurityQualificationsSelect = ({ value, onChange }: Props) => {
  return (
    <Box className={styles.formBox}>
      <Text className={styles.formTitle}>情報セキュリティ</Text>
      <Flex direction={'row'} className={styles.selectGroupBox}>
        {Object.values(SearchFilterPresetFilterProjectSecurityQualificationsItem).map(
          (cert: SearchFilterPresetFilterProjectSecurityQualificationsItem) => (
            <Box key={cert} style={{ width: 'calc(25% - 12px)' }}>
              <AppCheckbox
                label={cert}
                parentBoxCheckedClassName={styles.checkBoxParentBoxChecked}
                checkBoxCheckedClassName={styles.checkBoxChecked}
                checkedTextClassName={styles.checkBoxCheckedText}
                checked={value?.includes(cert) || false}
                onChange={(checked: boolean) => {
                  const currentCerts = value || [];
                  const newCerts = checked
                    ? [...currentCerts, cert]
                    : currentCerts.filter((c) => c !== cert);
                  onChange(newCerts.length > 0 ? newCerts : undefined);
                }}
              />
            </Box>
          )
        )}
      </Flex>
    </Box>
  );
};
