import { Box, Flex, Text } from '@radix-ui/themes';
import AppTooltip from '@/app/_components/tooltip/AppTooltip';
import { AppRadio } from '@/components/radiobutton/AppRadio';
import styles from './styles.module.css';

type Props = {
  value: boolean | undefined;
  onChange: (value: boolean | undefined) => void;
};

export const OfficeRequiredSelect = ({ value, onChange }: Props) => {
  const options = [
    { value: true, label: 'あり' },
    { value: false, label: 'なし' },
  ];

  return (
    <Box className={styles.formBox}>
      <Box className={styles.formTitleBox}>
        <Text className={styles.formTitle}>事業所要件</Text>
        <AppTooltip
          triggerChildren={
            <span className={`material-icons ${styles.tooltipIcon}`}>help_outline</span>
          }
          content={
            <Box className={styles.tooltip}>
              <Text>
                応募要件において、事業所を有する必要がある案件か、無い案件かを検索することができます。
              </Text>
              <Text>2025年5月以降の案件からデータ取得しています。</Text>
            </Box>
          }
        />
      </Box>
      <Flex direction={'row'} wrap={'wrap'} gap={'12px'}>
        {options.map((option) => (
          <AppRadio
            key={option.value.toString()}
            inputClassName={styles.input}
            name='officeRequired'
            value={option.value.toString()}
            label={option.label}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            onClick={() => onChange(value === option.value ? undefined : option.value)}
          />
        ))}
      </Flex>
      <Text className={styles.noteText}>
        ※上記の条件は[落札案件]では適用できません。[受付中]、[受付終了]にのみご利用いただけます。
      </Text>
    </Box>
  );
};
