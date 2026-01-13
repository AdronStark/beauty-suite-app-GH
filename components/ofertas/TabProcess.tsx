import { UseFormRegister, useWatch, Control } from 'react-hook-form';
import styles from './tabs.module.css';

interface TabProcessProps {
    register: UseFormRegister<any>;
    control: Control<any>;
}

export default function TabProcess({ register, control }: TabProcessProps) {
    const values = useWatch({ control });

    // Constants (In future, fetch from DB)
    const RATE_MANUFACTURING = 45.00; // €/hr
    const RATE_FILLING = 35.00; // €/hr
    const RATE_LABOUR = 22.00; // €/hr

    // Time calculations
    const units = parseFloat(values.units) || 0;

    // Manufacturing
    const batchTime = parseFloat(values.process?.manufacturingTime) || 0;
    const manufacturingCostTotal = batchTime * RATE_MANUFACTURING;
    const manufacturingCostUnit = units > 0 ? manufacturingCostTotal / units : 0;

    // Filling
    const fillingSpeed = parseFloat(values.process?.fillingSpeed) || 0; // Units/hour
    const fillingTime = fillingSpeed > 0 ? units / fillingSpeed : 0;
    const fillingPeople = parseFloat(values.process?.fillingPeople) || 1;
    const fillingCostTotal = fillingTime * (RATE_FILLING + (fillingPeople * RATE_LABOUR));
    const fillingCostUnit = units > 0 ? fillingCostTotal / units : 0;

    return (
        <div className={styles.tabContent}>
            <div className={styles.grid2}>
                <div>
                    <div className={styles.sectionTitle}>Fabricación (Granel)</div>
                    <div className={styles.infoBox}>
                        Tarifa Reactor: <strong>{RATE_MANUFACTURING} €/h</strong>
                    </div>
                    <div className={styles.field}>
                        <label>Tiempo de Fabricación (Horas)</label>
                        <input type="number" step="0.5" {...register('process.manufacturingTime')} placeholder="ej. 4" />
                    </div>
                    <div className={styles.metricCard} style={{ marginTop: '1rem', background: '#f8fafc' }}>
                        <div className={styles.metricLabel}>Coste Fabricación Unitario</div>
                        <div className={styles.metricValue}>{manufacturingCostUnit.toFixed(4)} €</div>
                    </div>
                </div>

                <div>
                    <div className={styles.sectionTitle}>Envasado</div>
                    <div className={styles.infoBox}>
                        Tarifa Línea: <strong>{RATE_FILLING} €/h</strong> | Operario: <strong>{RATE_LABOUR} €/h</strong>
                    </div>
                    <div className={styles.field} style={{ marginBottom: '1rem' }}>
                        <label>Velocidad de Línea (Uds/Hora)</label>
                        <input type="number" {...register('process.fillingSpeed')} placeholder="ej. 1500" />
                    </div>
                    <div className={styles.field}>
                        <label>Nº Operarios Extra</label>
                        <input type="number" {...register('process.fillingPeople')} defaultValue={1} />
                    </div>
                    <div className={styles.metricCard} style={{ marginTop: '1rem', background: '#f8fafc' }}>
                        <div className={styles.metricLabel}>Coste Envasado Unitario</div>
                        <div className={styles.metricValue}>{fillingCostUnit.toFixed(4)} €</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
