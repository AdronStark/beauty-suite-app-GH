import { UseFormRegister, FieldErrors } from 'react-hook-form';
import styles from './tabs.module.css';

interface TabGeneralProps {
    register: UseFormRegister<any>;
    errors: FieldErrors<any>;
}

export default function TabGeneral({ register, errors }: TabGeneralProps) {
    return (
        <div className={styles.tabContent}>
            <div className={styles.sectionTitle}>Información del Proyecto</div>
            <div className={styles.grid2}>
                <div className={styles.field}>
                    <label>Cliente / Marca</label>
                    <input {...register('client', { required: 'El cliente es obligatorio' })} />
                    {errors.client && <span className={styles.error}>{errors.client.message as string}</span>}
                </div>
                <div className={styles.field}>
                    <label>Nombre del Producto</label>
                    <input {...register('product', { required: 'El producto es obligatorio' })} />
                    {errors.product && <span className={styles.error}>{errors.product.message as string}</span>}
                </div>
            </div>

            <div className={styles.sectionTitle}>Definición de Lote</div>
            <div className={styles.grid3}>
                <div className={styles.field}>
                    <label>Unidades a Fabricar</label>
                    <input type="number" {...register('units')} />
                </div>
                <div className={styles.field}>
                    <label>Capacidad Envase (ml)</label>
                    <input type="number" {...register('unitSize')} placeholder="ej. 50" />
                </div>
                <div className={styles.field}>
                    <label>Densidad (g/ml)</label>
                    <input type="number" step="0.01" {...register('density')} defaultValue={1.0} />
                </div>
            </div>

            <div className={styles.infoBox}>
                <strong>Cálculo Automático:</strong>
                <p>Tamaño de Lote (Kg) = Unidades × Capacidad × Densidad / 1000</p>
                {/* This would ideally connect to a watched value to show the result live, 
                     but for now we keep it purely purely presentational or managed by parent */}
            </div>

            <div className={styles.sectionTitle}>Objetivos Comerciales</div>
            <div className={styles.grid3}>
                <div className={styles.field}>
                    <label>Margen Objetivo (%)</label>
                    <input type="number" {...register('marginPercent')} />
                </div>
                <div className={styles.field}>
                    <label>Discount / Rappel (%)</label>
                    <input type="number" {...register('discountPercent')} defaultValue={0} />
                </div>
            </div>
        </div>
    );
}
