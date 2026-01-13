'use client';

import { Check, Clock, FlaskConical, Package, FileCheck } from 'lucide-react';

type ProjectStatus = 'concept' | 'lab' | 'samples' | 'approved';

interface ProjectTimelineProps {
    briefing: any; // We'll type this properly based on the include
}

export default function ProjectTimeline({ briefing }: ProjectTimelineProps) {

    // 1. Determine Current Phase
    let currentPhase = 0; // 0: Concept, 1: Lab, 2: Samples, 3: Approved

    // Logic:
    // Concept: Default
    // Lab: Briefing Accepted (internal status) OR Formulas exist
    // Samples: Samples exist
    // Approved: Sample Approved OR Offer Accepted

    const isConcept = true; // Always true if it exists
    const isLab = briefing.status === 'Aceptado' || (briefing.formulas && briefing.formulas.length > 0);

    const hasSamples = briefing.formulas?.some((f: any) => f.samples && f.samples.length > 0);
    const isSamples = hasSamples;

    const isApproved = briefing.formulas?.some((f: any) =>
        f.samples?.some((s: any) => s.status === 'Approved')
    ) || briefing.offers?.some((o: any) => o.status === 'Aceptada' || o.status === 'Adjudicada');

    if (isConcept) currentPhase = 0;
    if (isLab) currentPhase = 1;
    if (isSamples) currentPhase = 2;
    if (isApproved) currentPhase = 3;

    // Force "Lab" if status is explicitly Aceptado even if no formulas yet? Yes.

    const STEPS = [
        { id: 'concept', label: 'Concepto', icon: Clock },
        { id: 'lab', label: 'Laboratorio', icon: FlaskConical },
        { id: 'samples', label: 'Muestras', icon: Package },
        { id: 'approved', label: 'Aprobado', icon: FileCheck },
    ];

    return (
        <div style={{ width: '100%', padding: '1rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>

                {/* Connecting Line */}
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '0',
                    right: '0',
                    height: '2px',
                    background: '#e2e8f0',
                    zIndex: 0
                }}>
                    <div style={{
                        width: `${(currentPhase / (STEPS.length - 1)) * 100}%`,
                        height: '100%',
                        background: '#3E6AD8', // Primary Blue
                        transition: 'width 0.5s ease'
                    }} />
                </div>

                {STEPS.map((step, index) => {
                    const isActive = index <= currentPhase;
                    const isCurrent = index === currentPhase;
                    const Icon = step.icon;

                    return (
                        <div key={step.id} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: isActive ? '#3E6AD8' : 'white',
                                border: isActive ? 'none' : '2px solid #e2e8f0',
                                color: isActive ? 'white' : '#94a3b8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: isCurrent ? '0 0 0 4px rgba(62, 106, 216, 0.2)' : 'none',
                                transition: 'all 0.3s ease'
                            }}>
                                {isActive && !isCurrent ? <Check size={20} /> : <Icon size={20} />}
                            </div>
                            <span style={{
                                fontSize: '0.8rem',
                                fontWeight: isActive ? 600 : 500,
                                color: isActive ? '#1e293b' : '#94a3b8'
                            }}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Context Message based on Phase */}
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', fontSize: '0.9rem', color: '#64748b', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                {currentPhase === 0 && "Estamos definiendo el alcance y las especificaciones de tu proyecto."}
                {currentPhase === 1 && "Nuestro equipo de I+D está trabajando en la formulación de tu producto."}
                {currentPhase === 2 && "Te hemos enviado muestras. Por favor, revísalas y danos tu feedback."}
                {currentPhase === 3 && "¡Proyecto aprobado! Preparando la oferta comercial final."}
            </div>
        </div>
    );
}
