import { useState } from 'react';
import { urunListesi_global } from './Urunler';

const kartStil = { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '16px' };
const inputStil = { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', width: '100%', boxSizing: 'border-box' };

export default function StokRaporlar() {
  const [arama, setArama] = useState('');
  const [aktifSekme, setAktifSekme] = useState('genel');

  const urunler = urunListesi_global || [];

  const toplamStokDegeri = urunler.reduce((t, u) => t + ((u.satisFiyati || 0) * (u.stokMiktari || 0)), 0);
  const toplamMaliyetDegeri = urunler.reduce((t, u) => t + ((u.alisFiyati || 0) * (u.stokMiktari || 0)), 0);
  const kritikStoklar = urunler.filter(u => u.stokMiktari <= (u.minStok || 5));
  const stokluUrunler = urunler.filter(u => u.stokMiktari > 0);

  const filtrelenmis = urunler.filter(u =>
    u.ad?.toLowerCase().includes(arama.toLowerCase()) ||
    u.kod?.toLowerCase().includes(arama.toLowerCase())
  );

  const kategoriDagilim = urunler.reduce((acc, u) => {
    const kat = u.kategori || 'Diğer';
    if (!acc[kat]) acc[kat] = { adet: 0, deger: 0 };
    acc[kat].adet++;
    acc[kat].deger += (u.satisFiyati || 0) * (u.stokMiktari || 0);
    return acc;
  }, {});

  const renkler = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

  return (
    <div>
      {/* Özet Kartlar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { baslik: 'Toplam Stok Değeri', tutar: toplamStokDegeri, renk: '#3b82f6', ikon: '📦', alt: 'Satış fiyatından' },
          { baslik: 'Maliyet Değeri', tutar: toplamMaliyetDegeri, renk: '#22c55e', ikon: '💰', alt: 'Alış fiyatından' },
          { baslik: 'Kritik Stok', tutar: kritikStoklar.length, renk: '#ef4444', ikon: '⚠️', alt: 'Acil sipariş gerekli', birim: 'ürün' },
          { baslik: 'Stoklu Ürün', tutar: stokluUrunler.length, renk: '#8b5cf6', ikon: '✅', alt: `Toplam ${urunler.length} üründen`, birim: 'ürün' },
        ].map((k, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderTop: `4px solid ${k.renk}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{k.baslik}</p>
              <span style={{ fontSize: '20px' }}>{k.ikon}</span>
            </div>
            <p style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 'bold', color: k.renk }}>
              {k.birim ? k.tutar : `₺${k.tutar.toLocaleString()}`}
              {k.birim && <span style={{ fontSize: '14px', marginLeft: '4px' }}>{k.birim}</span>}
            </p>
            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{k.alt}</p>
          </div>
        ))}
      </div>

      {/* Sekmeler */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'white', padding: '6px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', width: 'fit-content' }}>
        {[
          { id: 'genel', ad: '📊 Genel Stok' },
          { id: 'kritik', ad: '⚠️ Kritik Stoklar' },
          { id: 'kategori', ad: '🏷️ Kategori Analizi' },
        ].map(s => (
          <button key={s.id} onClick={() => setAktifSekme(s.id)} style={{
            padding: '7px 16px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px',
            background: aktifSekme === s.id ? '#1e293b' : 'transparent',
            color: aktifSekme === s.id ? 'white' : '#64748b',
            border: 'none', fontWeight: aktifSekme === s.id ? '600' : '400',
          }}>{s.ad}</button>
        ))}
      </div>

      {/* Genel Stok Listesi */}
      {aktifSekme === 'genel' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <input placeholder="🔍 Ürün adı veya kodu ara..." value={arama} onChange={e => setArama(e.target.value)} style={{ ...inputStil, width: '300px' }} />
          </div>
          <div style={kartStil}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  {['Ürün Kodu', 'Ürün Adı', 'Kategori', 'Stok Miktarı', 'Birim', 'Alış Fiyatı', 'Satış Fiyatı', 'Stok Değeri', 'Durum'].map(b => (
                    <th key={b} style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '12px' }}>{b}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrelenmis.map(u => {
                  const stokDurum = u.stokMiktari <= 0 ? 'Tükendi' : u.stokMiktari <= (u.minStok || 5) ? 'Kritik' : u.stokMiktari >= (u.maxStok || 100) ? 'Fazla Stok' : 'Normal';
                  const durumRenk = stokDurum === 'Tükendi' ? { bg: '#fee2e2', renk: '#991b1b' } : stokDurum === 'Kritik' ? { bg: '#fef9c3', renk: '#854d0e' } : stokDurum === 'Fazla Stok' ? { bg: '#dbeafe', renk: '#1d4ed8' } : { bg: '#dcfce7', renk: '#166534' };
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', color: '#3b82f6', fontWeight: '500', fontSize: '12px' }}>{u.kod}</td>
                      <td style={{ padding: '12px', fontWeight: '500', color: '#1e293b' }}>{u.ad}</td>
                      <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>{u.kategori || '—'}</td>
                      <td style={{ padding: '12px', fontWeight: '700', color: u.stokMiktari <= (u.minStok || 5) ? '#ef4444' : '#1e293b' }}>{u.stokMiktari ?? 0}</td>
                      <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>{u.birim || 'Adet'}</td>
                      <td style={{ padding: '12px', color: '#64748b' }}>₺{(u.alisFiyati || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px', fontWeight: '600', color: '#1e293b' }}>₺{(u.satisFiyati || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px', fontWeight: '600', color: '#3b82f6' }}>₺{((u.satisFiyati || 0) * (u.stokMiktari || 0)).toLocaleString()}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '11px', background: durumRenk.bg, color: durumRenk.renk }}>{stokDurum}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtrelenmis.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>Ürün bulunamadı</p>}
          </div>
        </div>
      )}

      {/* Kritik Stoklar */}
      {aktifSekme === 'kritik' && (
        <div>
          {kritikStoklar.length === 0
            ? (
              <div style={{ ...kartStil, textAlign: 'center', padding: '60px' }}>
                <p style={{ fontSize: '48px', margin: '0 0 16px' }}>✅</p>
                <p style={{ fontSize: '18px', color: '#22c55e', fontWeight: '600' }}>Tüm stoklar yeterli seviyede!</p>
              </div>
            )
            : (
              <div style={kartStil}>
                <div style={{ background: '#fef9c3', border: '1px solid #fef08a', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#854d0e' }}>
                  ⚠️ Aşağıdaki ürünlerin stoku minimum seviyenin altına düşmüştür. Acil sipariş önerilir.
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      {['Ürün', 'Mevcut Stok', 'Min. Stok', 'Fark', 'Durum'].map(b => (
                        <th key={b} style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>{b}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {kritikStoklar.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>{u.ad}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{u.kod}</div>
                        </td>
                        <td style={{ padding: '12px', fontWeight: '700', color: u.stokMiktari <= 0 ? '#ef4444' : '#f59e0b' }}>{u.stokMiktari ?? 0} {u.birim || 'Adet'}</td>
                        <td style={{ padding: '12px', color: '#64748b' }}>{u.minStok || 5} {u.birim || 'Adet'}</td>
                        <td style={{ padding: '12px', fontWeight: '600', color: '#ef4444' }}>-{Math.max(0, (u.minStok || 5) - (u.stokMiktari || 0))} {u.birim || 'Adet'}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '11px', background: u.stokMiktari <= 0 ? '#fee2e2' : '#fef9c3', color: u.stokMiktari <= 0 ? '#991b1b' : '#854d0e' }}>
                            {u.stokMiktari <= 0 ? 'Tükendi' : 'Kritik'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      )}

      {/* Kategori Analizi */}
      {aktifSekme === 'kategori' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
            {Object.entries(kategoriDagilim).map(([kat, veri], i) => (
              <div key={kat} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: `4px solid ${renkler[i % renkler.length]}` }}>
                <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#64748b' }}>{kat}</p>
                <p style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 'bold', color: renkler[i % renkler.length] }}>₺{veri.deger.toLocaleString()}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{veri.adet} ürün</p>
              </div>
            ))}
          </div>

          <div style={kartStil}>
            <h3 style={{ margin: '0 0 20px', fontSize: '16px', color: '#1e293b' }}>Kategori Stok Dağılımı</h3>
            {Object.entries(kategoriDagilim).map(([kat, veri], i) => {
              const toplamDeger = Object.values(kategoriDagilim).reduce((t, v) => t + v.deger, 0);
              const oran = toplamDeger > 0 ? ((veri.deger / toplamDeger) * 100).toFixed(1) : 0;
              return (
                <div key={kat} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: '#475569', fontWeight: '500' }}>{kat}</span>
                    <span style={{ color: '#1e293b', fontWeight: '600' }}>₺{veri.deger.toLocaleString()} <span style={{ color: '#94a3b8', fontWeight: '400' }}>(%{oran})</span></span>
                  </div>
                  <div style={{ background: '#f1f5f9', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${oran}%`, background: renkler[i % renkler.length], height: '100%', borderRadius: '4px', transition: 'width 0.5s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}