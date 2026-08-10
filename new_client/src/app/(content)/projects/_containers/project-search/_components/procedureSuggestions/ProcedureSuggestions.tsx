import { Box, Grid, Text } from '@radix-ui/themes';
import { AppCheckbox } from '@/components/checkbox/AppCheckbox';
import { ProcedureList } from '../../types';
import styles from './styles.module.css';

type Props = {
  selectedProcedures: string[];
  onAddProcedure: (val: string) => void;
  onRemoveProcedure: (val: string) => void;
};

export const ProcedureSuggestions = ({
  selectedProcedures,
  onAddProcedure,
  onRemoveProcedure,
}: Props) => {
  return (
    <Box>
      <Box className={styles.titleBox}>
        <Text className={styles.title}>入札方式</Text>
      </Box>
      <Grid columns={'3'} className={styles.listBox}>
        {ProcedureList.map((p) => {
          return (
            <Box key={p} className={styles.listRow}>
              <AppCheckbox
                label={p}
                checked={selectedProcedures.includes(p)}
                onChange={() => {
                  if (selectedProcedures.includes(p)) {
                    onRemoveProcedure(p);
                  } else {
                    onAddProcedure(p);
                  }
                }}
                checkboxClassName={styles.checkbox}
                labelClassName={styles.procedureText}
              />
            </Box>
          );
        })}
      </Grid>
    </Box>
  );
};
