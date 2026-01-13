
import { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface GalleryModalProps {
    onClose: () => void;
    onSelect: (url: string) => void;
}

export default function GalleryModal({ onClose, onSelect }: GalleryModalProps) {
    const [images, setImages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/gallery')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setImages(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
            <div style={{
                background: 'white', padding: '1.5rem', borderRadius: '12px',
                maxWidth: '600px', width: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Galería de Referencias</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                    {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', gridColumn: '1/-1' }}><Loader2 className="spin" /></div>}

                    {!loading && images.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                            No hay imágenes guardadas.
                        </div>
                    )}

                    {images.map(img => (
                        <div
                            key={img.url}
                            onClick={() => onSelect(img.url)}
                            style={{
                                aspectRatio: '1', borderRadius: '8px', overflow: 'hidden',
                                border: '1px solid #e2e8f0', cursor: 'pointer', position: 'relative'
                            }}
                        >
                            <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
