'use client';

import { useCompany } from '@/context/CompanyContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import styles from './page.module.css';

export default function SelectCompanyPage() {
    const { availableCompanies, setCompany, selectedCompanyId } = useCompany();
    const router = useRouter();

    useEffect(() => {
        // If only one company, we shouldn't be here ideally, but if we are, auto-select
        if (availableCompanies.length === 1) {
            setCompany(availableCompanies[0].id);
            router.push('/');
        }
    }, [availableCompanies, setCompany, router]);

    const handleSelect = (companyId: string) => {
        setCompany(companyId);
        router.push('/');
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Seleccionar Entorno</h1>
                <p className={styles.subtitle}>Elige la empresa a la que deseas acceder</p>

                <div className={styles.grid}>
                    {availableCompanies.map((company) => (
                        <button
                            key={company.id}
                            className={styles.companyButton}
                            onClick={() => handleSelect(company.id)}
                        >
                            <div className={styles.logoContainer}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={company.logoPath} alt={company.name} className={styles.logo} />
                            </div>
                            <span className={styles.companyName}>{company.name}</span>
                            <span className={styles.companyDesc}>{company.description}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
