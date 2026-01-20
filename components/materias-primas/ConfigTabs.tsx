import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileSpreadsheet, CheckCircle, Loader2, AlertCircle, Trash2, UserX, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function ConfigTabs() {
    const [activeTab, setActiveTab] = useState<'import' | 'rules'>('import');

    return (
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            {/* Tabs Header */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
                <button
                    onClick={() => setActiveTab('import')}
                    style={{
                        padding: '16px 24px',
                        background: activeTab === 'import' ? 'white' : '#f8fafc',
                        border: 'none',
                        borderBottom: activeTab === 'import' ? '2px solid #3b82f6' : '2px solid transparent',
                        color: activeTab === 'import' ? '#3b82f6' : '#64748b',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        transition: 'all 0.2s'
                    }}
                >
                    Carga de Datos
                </button>
                <button
                    onClick={() => setActiveTab('rules')}
                    style={{
                        padding: '16px 24px',
                        background: activeTab === 'rules' ? 'white' : '#f8fafc',
                        border: 'none',
                        borderBottom: activeTab === 'rules' ? '2px solid #3b82f6' : '2px solid transparent',
                        color: activeTab === 'rules' ? '#3b82f6' : '#64748b',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        transition: 'all 0.2s'
                    }}
                >
                    Definición de Reglas
                </button>
            </div>

            {/* Tab Content */}
            <div style={{ padding: '24px' }}>
                {activeTab === 'import' && <ImportPanel />}
                {activeTab === 'rules' && <RulesPanel />}
            </div>
        </div>
    );
}

function ImportPanel() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [lastImportDate, setLastImportDate] = useState<string | null>(null);
    const router = useRouter();

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/configuration');
            if (res.ok) {
                const data = await res.json();
                if (data.LAST_RAW_MATERIALS_IMPORT) {
                    setLastImportDate(data.LAST_RAW_MATERIALS_IMPORT);
                }
            }
        } catch (e) {
            console.error('Failed to fetch config');
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/materias-primas/import', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (res.ok) {
                setResult(data);
                setFile(null); // Clear file input after success
                fetchConfig(); // Refresh last date
                router.refresh();
            } else {
                alert('Error al importar: ' + data.error);
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>Importar Pedidos ERP</h3>
            <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Sube el archivo Excel ("Bruto MP") exportado desde el ERP. El sistema actualizará las líneas existentes, creará las nuevas y cerrará aquellas que ya no aparezcan en el listado activo.
            </p>

            {lastImportDate && (
                <div style={{
                    marginBottom: '24px', padding: '8px 12px', background: '#eff6ff',
                    border: '1px solid #bfdbfe', borderRadius: '8px', display: 'flex',
                    alignItems: 'center', gap: '8px', color: '#1e40af', fontSize: '0.85rem'
                }}>
                    <Clock size={16} />
                    <span>
                        Última actualización: <strong>{new Date(lastImportDate).toLocaleString()}</strong>
                    </span>
                </div>
            )}

            {!result ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div
                        onClick={() => document.getElementById('configFileInput')?.click()}
                        style={{
                            border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '40px', textAlign: 'center',
                            cursor: 'pointer', background: '#f8fafc', transition: 'border-color 0.2s', position: 'relative'
                        }}
                    >
                        <input
                            id="configFileInput"
                            type="file"
                            accept=".xlsx, .xls"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />
                        <FileSpreadsheet size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
                        {file ? (
                            <div>
                                <p style={{ fontWeight: 600, color: '#334155', marginBottom: '4px' }}>{file.name}</p>
                                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                        ) : (
                            <div>
                                <p style={{ fontWeight: 500, color: '#64748b' }}>Haz clic para seleccionar el archivo</p>
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>Formatos soportados: .xlsx, .xls</p>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            style={{
                                padding: '10px 24px', borderRadius: '8px', border: 'none',
                                background: file ? '#3b82f6' : '#94a3b8', color: 'white', fontWeight: 600,
                                cursor: file ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px',
                                boxShadow: file ? '0 4px 6px -1px rgba(59, 130, 246, 0.2)' : 'none'
                            }}
                        >
                            {uploading && <Loader2 size={18} className="animate-spin" />}
                            {uploading ? 'Procesando...' : 'Iniciar Importación'}
                        </button>
                    </div>

                    {/* Clear Data Section */}
                    <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #e2e8f0' }}>
                        <h4 style={{ fontWeight: 600, color: '#ef4444', marginBottom: '8px' }}>Zona de Peligro</h4>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
                            Esta acción eliminará permanentemente todos los pedidos de materia prima registrados. Esta acción no se puede deshacer.
                        </p>
                        <button
                            onClick={async () => {
                                if (window.confirm('¿Estás SEGURO de que quieres borrar TODOS los datos de Materias Primas? Esta acción es irreversible.')) {
                                    try {
                                        const res = await fetch('/api/materias-primas/clear', { method: 'DELETE' });
                                        if (res.ok) {
                                            toast.success('Base de datos vaciada correctamente');
                                            setResult(null);
                                            setFile(null);
                                            router.refresh();
                                        } else {
                                            toast.error('Error al borrar los datos');
                                        }
                                    } catch (e) {
                                        console.error(e);
                                        toast.error('Error de conexión');
                                    }
                                }
                            }}
                            style={{
                                padding: '10px 24px', borderRadius: '8px', border: '1px solid #fca5a5',
                                background: '#fef2f2', color: '#dc2626', fontWeight: 600,
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            className="hover:bg-red-100"
                        >
                            Borrar todos los datos
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <CheckCircle size={32} color="#16a34a" />
                        <div>
                            <h4 style={{ fontWeight: 600, color: '#166534', fontSize: '1.1rem' }}>Importación Completada</h4>
                            <p style={{ color: '#15803d', fontSize: '0.9rem' }}>Los datos se han sincronizado correctamente.</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a' }}>{result.stats.created}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Nuevos</div>
                        </div>
                        <div style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#eab308' }}>{result.stats.updated}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Actualizados</div>
                        </div>
                        <div style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#64748b' }}>{result.stats.completed}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Cerrados</div>
                        </div>
                    </div>

                    <button
                        onClick={() => setResult(null)}
                        style={{
                            width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #16a34a',
                            background: 'white', color: '#16a34a', fontWeight: 600, cursor: 'pointer'
                        }}
                    >
                        Realizar otra importación
                    </button>
                </div>
            )
            }
        </div >
    );
}

function RulesPanel() {
    const [excludedSuppliers, setExcludedSuppliers] = useState<any[]>([]);
    const [availableSuppliers, setAvailableSuppliers] = useState<string[]>([]);
    const [excludedTerms, setExcludedTerms] = useState<any[]>([]); // New State
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [loading, setLoading] = useState(true);

    // New Rule State
    const [term, setTerm] = useState('');
    const [field, setField] = useState('CODE'); // CODE | NAME
    const [matchType, setMatchType] = useState('CONTAINS'); // CONTAINS | EXACT

    const fetchData = async () => {
        setLoading(true);
        try {
            const [excludedRes, availableRes, termsRes] = await Promise.all([
                fetch('/api/materias-primas/config/excluded-suppliers'),
                fetch('/api/materias-primas/suppliers'),
                fetch('/api/materias-primas/config/excluded-terms')
            ]);

            if (excludedRes.ok) setExcludedSuppliers(await excludedRes.json());
            if (availableRes.ok) setAvailableSuppliers(await availableRes.json());
            if (termsRes.ok) setExcludedTerms(await termsRes.json());
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdd = async () => {
        if (!selectedSupplier) return;

        try {
            const res = await fetch('/api/materias-primas/config/excluded-suppliers', {
                method: 'POST',
                body: JSON.stringify({ name: selectedSupplier })
            });

            if (res.ok) {
                toast.success('Proveedor excluido correctamente');
                setSelectedSupplier('');
                fetchData();
            } else {
                toast.error('Error al guardar');
            }
        } catch (e) {
            toast.error('Error de conexión');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Desbloquear este proveedor?')) return;
        try {
            const res = await fetch('/api/materias-primas/config/excluded-suppliers', {
                method: 'DELETE',
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                toast.success('Proveedor desbloqueado');
                fetchData();
            }
        } catch (e) {
            toast.error('Error al eliminar');
        }
    };

    const handleAddTerm = async () => {
        if (!term) return;
        try {
            const res = await fetch('/api/materias-primas/config/excluded-terms', {
                method: 'POST',
                body: JSON.stringify({ term, field, matchType })
            });

            if (res.ok) {
                toast.success('Regla de texto añadida');
                setTerm('');
                fetchData();
            } else {
                toast.error('Error al guardar regla');
            }
        } catch (e) {
            toast.error('Error de conexión');
        }
    };

    const handleDeleteTerm = async (id: string) => {
        if (!confirm('¿Eliminar esta regla?')) return;
        try {
            const res = await fetch('/api/materias-primas/config/excluded-terms', {
                method: 'DELETE',
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                toast.success('Regla eliminada');
                fetchData();
            }
        } catch (e) {
            toast.error('Error al eliminar');
        }
    };

    const handleApplyRules = async () => {
        if (!confirm('¿Aplicar las reglas de exclusión a los datos YA EXISTENTES? Esto eliminará los pedidos de los proveedores excluidos que estén actualmente en la base de datos.')) return;

        setLoading(true);
        try {
            const res = await fetch('/api/materias-primas/config/apply-rules', {
                method: 'POST'
            });
            const data = await res.json();

            if (res.ok) {
                if (data.deletedCount > 0) {
                    const supplierList = data.suppliersAffected && data.suppliersAffected.length > 0
                        ? `: ${data.suppliersAffected.join(', ')}`
                        : '';
                    toast.success(`Se han eliminado ${data.deletedCount} registros antiguos de${supplierList}`);
                } else {
                    toast.info('No se encontraron registros para eliminar.');
                }
            } else {
                toast.error('Error al aplicar reglas');
            }
        } catch (e) {
            console.error(e);
            toast.error('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '24px', color: '#1e293b' }}>Reglas de Importación</h3>

            {/* Exclusion Card */}
            <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '12px', padding: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: 'white', padding: '12px', borderRadius: '50%', height: 'fit-content' }}>
                        <UserX size={24} color="#e11d48" />
                    </div>
                    <div>
                        <h4 style={{ fontWeight: 600, color: '#be123c', fontSize: '1rem', marginBottom: '4px' }}>Exclusión de Proveedores</h4>
                        <p style={{ fontSize: '0.9rem', color: '#9f1239' }}>Los pedidos de estos proveedores serán ignorados automáticamente durante la importación.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                    <select
                        value={selectedSupplier}
                        onChange={(e) => setSelectedSupplier(e.target.value)}
                        style={{
                            flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1',
                            outline: 'none', background: 'white'
                        }}
                    >
                        <option value="">Seleccionar proveedor del histórico...</option>
                        {availableSuppliers.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleAdd}
                        disabled={!selectedSupplier}
                        style={{
                            padding: '10px 20px', borderRadius: '8px', border: 'none',
                            background: selectedSupplier ? '#e11d48' : '#fda4af', color: 'white', fontWeight: 600,
                            cursor: selectedSupplier ? 'pointer' : 'not-allowed'
                        }}
                    >
                        Excluir
                    </button>
                </div>

                {loading ? (
                    <p>Cargando...</p>
                ) : excludedSuppliers.length > 0 ? (
                    <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead style={{ background: '#f8fafc' }}>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b' }}>Proveedor</th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b' }}>Fecha Exclusión</th>
                                    <th style={{ width: '50px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {excludedSuppliers.map(item => (
                                    <tr key={item.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '12px 16px', fontWeight: 500 }}>{item.name}</td>
                                        <td style={{ padding: '12px 16px', color: '#64748b' }}>
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}
                                            >
                                                <Trash2 size={18} className="text-gray-400 hover:text-red-500" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem', padding: '20px' }}>
                        No hay proveedores excluidos
                    </p>
                )}
            </div>

            {/* Exclusion Card: Text */}
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: 'white', padding: '12px', borderRadius: '50%', height: 'fit-content' }}>
                        <AlertCircle size={24} color="#2563eb" />
                    </div>
                    <div>
                        <h4 style={{ fontWeight: 600, color: '#1e40af', fontSize: '1rem', marginBottom: '4px' }}>Exclusión por Texto</h4>
                        <p style={{ fontSize: '0.9rem', color: '#1e3a8a' }}>Filtra pedidos que contengan texto específico en su código o descripción.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Texto a buscar..."
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                    />
                    <select
                        value={field}
                        onChange={(e) => setField(e.target.value)}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white' }}
                    >
                        <option value="CODE">Código Art.</option>
                        <option value="NAME">Descripción</option>
                    </select>
                    <select
                        value={matchType}
                        onChange={(e) => setMatchType(e.target.value)}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white' }}
                    >
                        <option value="CONTAINS">Contiene</option>
                        <option value="EXACT">Es Igual A</option>
                    </select>
                    <button
                        onClick={handleAddTerm}
                        disabled={!term}
                        style={{
                            padding: '10px 20px', borderRadius: '8px', border: 'none',
                            background: term ? '#2563eb' : '#93c5fd', color: 'white', fontWeight: 600,
                            cursor: term ? 'pointer' : 'not-allowed'
                        }}
                    >
                        Añadir Regla
                    </button>
                </div>

                {excludedTerms.length > 0 ? (
                    <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead style={{ background: '#f8fafc' }}>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b' }}>Término</th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b' }}>Campo</th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b' }}>Tipo</th>
                                    <th style={{ width: '50px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {excludedTerms.map(item => (
                                    <tr key={item.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '12px 16px', fontWeight: 500 }}>"{item.term}"</td>
                                        <td style={{ padding: '12px 16px', color: '#64748b' }}>
                                            {item.field === 'CODE' ? 'Código' : 'Descripción'}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{
                                                background: item.matchType === 'EXACT' ? '#f0fdf4' : '#fff7ed',
                                                color: item.matchType === 'EXACT' ? '#166534' : '#c2410c',
                                                padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600
                                            }}>
                                                {item.matchType === 'EXACT' ? 'EXACTO' : 'CONTIENE'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <button
                                                onClick={() => handleDeleteTerm(item.id)}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}
                                            >
                                                <Trash2 size={18} className="text-gray-400 hover:text-red-500" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                        Sin reglas de texto
                    </p>
                )}

                {/* Retroactive Action */}
                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #fecdd3', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={handleApplyRules}
                        style={{
                            background: 'white', border: '1px solid #e11d48', color: '#e11d48',
                            padding: '8px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        <UserX size={16} />
                        Aplicar reglas a datos actuales
                    </button>
                </div>
            </div>
        </div>
    );
}
