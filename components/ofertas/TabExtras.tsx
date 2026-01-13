import { useFieldArray, Control, UseFormRegister } from 'react-hook-form';
import styles from './tabs.module.css';
import ExtrasTable from './ExtrasTable';

interface TabExtrasProps {
    control: Control<any>;
    register: UseFormRegister<any>;
    watch: any;
    config: any;
    setValue: (name: string, value: any) => void;
}

export default function TabExtras({ control, watch, config, setValue }: TabExtrasProps) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: "extras"
    });

    // Available extras from config
    const availableExtras = config.OFFER_EXTRAS ? JSON.parse(config.OFFER_EXTRAS) : [];
    const currentExtras = watch('extras') || [];

    const handleExtrasChange = (newExtras: any[]) => {
        setValue('extras', newExtras);
    };

    return (
        <div className={styles.tabContent}>
            <div className={styles.sectionTitle}>Conceptos Extra (Oferta Principal)</div>
            <p style={{ marginBottom: '1.5rem', color: '#64748b' }}>
                Selecciona costes adicionales aplicables a esta oferta (por lote o por unidad).
            </p>

            <ExtrasTable
                availableExtras={availableExtras}
                value={currentExtras}
                onChange={handleExtrasChange}
            />
        </div>
    );
}
