import { useState } from 'react';
import { cariListesi } from './CariHesaplar';
import { cekSenetListesi } from './Finans';

const kartStil = { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '16px' };
const inputStil = { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', width: '100%', boxSizing: 'border-box' };

export default function BakiyeRaporlar() {
  const [aktifSekme, setAktifSekme] = useState('cari');
  const [arama, setArama] = useState('');
  const [tipFiltre, setTipFiltre] = useState('');

  const alacaklilar = cariListesi.filter(c => c.bakiye > 0);
  const borcluler = cariListesi.filter(c => c.bakiye < 0);
  const toplamAlacak = alacaklilar.reduce((t, c) => t + c.bakiye, 0);
  const toplamBorc = Math.abs(borcluler.reduce((t, c) => t + c.bakiye, 0));
  const netBakiye = toplamAlacak - toplamBorc;

  const filtrelenmis = cariListesi.filter(c => {
    const aramaUygun = c.unvan.toLowerCase().includes(arama.toLowerCase());
    const tipUygun = tipFiltre === '' || c.tip === tipFiltre;
    return aramaUygun && tipUygun;
  });

  const alacakCekleri = cekSenetListesi.filter(c => c.evrakTip === 'Çek' && c.tip === 'Alınan');
  const borcCekleri = cekSenetListesi.filter(c => c.evrakTip === 'Çek' && c.tip === 'Verilen');
  const alacakSenetler = cekSenetListesi.filter(c => c.evrakTip === 'Senet' && c.tip === 'Alınan');
  const borcSenetler = cekSenetListesi.filter(c => c.evrakTip === 'Senet' && c.tip === 'Verilen');

  const bugun = new Date().toISOString().split('T')[0];
  const vadesiGecmis = cekSenetListesi.filter(c =>
    c.vadeTarihi < bugun && c.durum !== 'Ödendi' && c.durum !== 'Tahsil Edildi' && c.durum !== 'İptal'
  );

  return (
    <div>
      {/* Özet Kartlar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { baslik: 'Toplam Alacak', tutar: toplamAlacak, renk: '#22c55e', ikon: '📥', alt: `${alacaklilar.length} cari` },
          { baslik: 'Toplam Borç', tutar: toplamBorc, renk: '#ef4444', ikon: '📤', alt: `${borcluler.length} cari` },
          { baslik: 'Net Bakiye', tutar: netBakiye, renk: netBakiye >= 0 ? '#3b82f6' : '#ef4444', ikon: '⚖️', alt: netBakiye >= 0 ? 'Alacak fazlası' : 'Borç fazlası' },
          { baslik: 'Vadesi Geçmiş', tutar: vadesiGecmis.reduce((t, c) => t + c.tutar, 0), renk: '#f59e0b', ikon: '⚠️', alt: `${vadesiGecmis.length} evrak` },
        ].map((k, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderTop: `4px solid ${k.renk}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{k.baslik}</p>
              <span style={{ fontSize: '20px' }}>{k.ikon}</span>
            </div>
            <p style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 'bold', color: k.renk }}>₺{k.tutar.toLocaleString()}</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{k.alt}</p>
          </div>
        ))}
      </div>

      {/* Sekmeler */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'white', padding: '6px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', width: 'fit-content' }}>
        {[
          { id: 'cari', ad: '👥 Cari Bakiyeleri' },
          { id: 'cek', ad: '📋 Çek / Senet' },
          { id: 'yaslandirma', ad: '📅 Yaşlandırma' },
        ].map(s => (
          <button key={s.id} onClick={() => setAktifSekme(s.id)} style={{
            padding: '7px 16px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px',
            background: aktifSekme === s.id ? '#1e293b' : 'transparent',
            color: aktifSekme === s.id ? 'white' : '#64748b',
            border: 'none', fontWeight: aktifSekme === s.id ? '600' : '400',
          }}>{s.ad}</button>
        ))}
      </div>

      {/* Cari Bakiyeleri */}
      {aktifSekme === 'cari' && (
        <div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <input placeholder="🔍 Cari ara..." value={arama} onChange={e => setArama(e.target.value)} style={{ ...inputStil, width: '280px' }} />
            <select value={tipFiltre} onChange={e => setTipFiltre(e.target.value)} style={{ ...inputStil, width: '180px' }}>
              <option value="">Tüm Tipler</option>
              <option value="Müşteri">Müşteri</option>
              <option value="Tedarikçi">Tedarikçi</option>
              <option value="Müşteri / Tedarikçi">Müşteri / Tedarikçi</option>
            </select>
          </div>

          <div style={kartStil}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  {['Cari Adı', 'Tipi', 'Şehir', 'Bakiye', 'Durum'].map(b => (
                    <th key={b} style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>{b}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrelenmis
                  .sort((a, b) => Math.abs(b.bakiye) - Math.abs(a.bakiye))
                  .map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{c.unvan}</div>
                        {c.yetkili && <div style={{ fontSize: '12px', color: '#94a3b8' }}>{c.yetkili}</div>}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '12px', background: c.tip === 'Müşteri' ? '#dbeafe' : c.tip === 'Tedarikçi' ? '#fef9c3' : '#ede9fe', color: c.tip === 'Müşteri' ? '#1d4ed8' : c.tip === 'Tedarikçi' ? '#854d0e' : '#6d28d9' }}>
                          {c.tip}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{c.sehir || '—'}</td>
                      <td style={{ padding: '12px', fontWeight: '700', fontSize: '15px', color: c.bakiye >= 0 ? '#22c55e' : '#ef4444' }}>
                        {c.bakiye >= 0 ? '+' : ''}₺{Number(c.bakiye).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', background: c.bakiye > 0 ? '#dcfce7' : c.bakiye < 0 ? '#fee2e2' : '#f1f5f9', color: c.bakiye > 0 ? '#166534' : c.bakiye < 0 ? '#991b1b' : '#475569' }}>
                          {c.bakiye > 0 ? 'Alacaklı' : c.bakiye < 0 ? 'Borçlu' : 'Sıfır'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Alacak / Borç Özeti */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={kartStil}>
              <h4 style={{ margin: '0 0 16px', fontSize: '14px', color: '#22c55e' }}>📥 En Yüksek Alacaklar</h4>
              {alacaklilar.sort((a, b) => b.bakiye - a.bakiye).slice(0, 5).map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '13px', color: '#1e293b' }}>{c.unvan}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#22c55e' }}>₺{c.bakiye.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div style={kartStil}>
              <h4 style={{ margin: '0 0 16px', fontSize: '14px', color: '#ef4444' }}>📤 En Yüksek Borçlar</h4>
              {borcluler.sort((a, b) => a.bakiye - b.bakiye).slice(0, 5).map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '13px', color: '#1e293b' }}>{c.unvan}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#ef4444' }}>₺{Math.abs(c.bakiye).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Çek / Senet */}
      {aktifSekme === 'cek' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { baslik: '📥 Alacak Çekler', liste: alacakCekleri, renk: '#22c55e' },
            { baslik: '📤 Borç Çekler', liste: borcCekleri, renk: '#ef4444' },
            { baslik: '📥 Alacak Senetler', liste: alacakSenetler, renk: '#3b82f6' },
            { baslik: '📤 Borç Senetler', liste: borcSenetler, renk: '#f59e0b' },
          ].map((grup, i) => (
            <div key={i} style={kartStil}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', color: '#1e293b' }}>{grup.baslik}</h4>
                <span style={{ fontWeight: '700', color: grup.renk, fontSize: '16px' }}>
                  ₺{grup.liste.reduce((t, c) => t + c.tutar, 0).toLocaleString()}
                </span>
              </div>
              {grup.liste.length === 0
                ? <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Kayıt yok</p>
                : grup.liste.map((c, j) => (
                  <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>{c.cari}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Vade: {c.vadeTarihi}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: grup.renk }}>₺{c.tutar.toLocaleString()}</div>
                      <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '10px', background: c.durum === 'Portföyde' ? '#dbeafe' : '#dcfce7', color: c.durum === 'Portföyde' ? '#1d4ed8' : '#166534' }}>{c.durum}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          ))}
        </div>
      )}

      {/* Yaşlandırma */}
      {aktifSekme === 'yaslandirma' && (
        <div style={kartStil}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', color: '#1e293b' }}>📅 Alacak Yaşlandırma Raporu</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                {['Cari', 'Toplam Bakiye', '0-30 Gün', '31-60 Gün', '61-90 Gün', '90+ Gün'].map(b => (
                  <th key={b} style={{ padding: '12px', textAlign: b === 'Cari' ? 'left' : 'right', color: '#64748b', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>{b}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alacaklilar.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: '500', color: '#1e293b' }}>{c.unvan}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#22c55e' }}>₺{c.bakiye.toLocaleString()}</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#22c55e' }}>₺{Math.floor(c.bakiye * 0.6).toLocaleString()}</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#f59e0b' }}>₺{Math.floor(c.bakiye * 0.25).toLocaleString()}</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#ef4444' }}>₺{Math.floor(c.bakiye * 0.1).toLocaleString()}</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#991b1b' }}>₺{Math.floor(c.bakiye * 0.05).toLocaleString()}</td>
                </tr>
              ))}
              <tr style={{ background: '#f8fafc', fontWeight: '700' }}>
                <td style={{ padding: '12px' }}>TOPLAM</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#22c55e' }}>₺{toplamAlacak.toLocaleString()}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#22c55e' }}>₺{Math.floor(toplamAlacak * 0.6).toLocaleString()}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#f59e0b' }}>₺{Math.floor(toplamAlacak * 0.25).toLocaleString()}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#ef4444' }}>₺{Math.floor(toplamAlacak * 0.1).toLocaleString()}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#991b1b' }}>₺{Math.floor(toplamAlacak * 0.05).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}