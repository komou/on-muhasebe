import { useState } from 'react';
import { urunListesi_global } from './Urunler';

const kartStil = { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '16px' };
const inputStil = { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', width: '100%', boxSizing: 'border-box' };
const labelStil = { fontSize: '12px', color: '#64748b', marginBottom: '4px', display: 'block', fontWeight: '600' };

const durumRenk = {
  'Taslak': { bg: '#f1f5f9', renk: '#475569' },
  'Değerlendiriliyor': { bg: '#fef9c3', renk: '#854d0e' },
  'Onaylandı': { bg: '#dcfce7', renk: '#166534' },
  'Reddedildi': { bg: '#fee2e2', renk: '#991b1b' },
};

export let alimTalepleri = [
  {
    id: 1, no: 'TAL-2026-001', tarih: '2026-03-01', talipEden: 'Ahmet Yılmaz',
    aciklama: 'Ofis bilgisayar ihtiyacı', durum: 'Onaylandı',
    satirlar: [
      { urunKod: 'URN001', urunAd: 'Laptop', miktar: 2, birim: 'Adet', aciklama: 'Geliştirici için' },
      { urunKod: 'URN002', urunAd: 'Mouse', miktar: 2, birim: 'Adet', aciklama: '' },
    ]
  },
  {
    id: 2, no: 'TAL-2026-002', tarih: '2026-03-05', talipEden: 'Mehmet Demir',
    aciklama: 'Stok takviyesi', durum: 'Değerlendiriliyor',
    satirlar: [
      { urunKod: 'URN002', urunAd: 'Mouse', miktar: 10, birim: 'Adet', aciklama: '' },
    ]
  },
];

function AlimTalepleri() {
  const [talepler, setTalepler] = useState(alimTalepleri);
  const [arama, setArama] = useState('');
  const [formAcik, setFormAcik] = useState(false);
  const [yeni, setYeni] = useState({ talipEden: '', aciklama: '', tarih: '' });
  const [satirlar, setSatirlar] = useState([{ urunKod: '', urunAd: '', miktar: 1, birim: 'Adet', aciklama: '' }]);

  const satinAlinanUrunler = urunListesi_global.filter(u => u.tedarik === 'Satın Alma' || u.tedarik === 'Satın Alma ve Üretim');

  const satirEkle = () => setSatirlar([...satirlar, { urunKod: '', urunAd: '', miktar: 1, birim: 'Adet', aciklama: '' }]);
  const satirSil = (i) => setSatirlar(satirlar.filter((_, idx) => idx !== i));
  const satirGuncelle = (i, alan, deger) => {
    const y = [...satirlar];
    y[i][alan] = deger;
    if (alan === 'urunAd') {
      const bulunan = satinAlinanUrunler.find(u => u.ad === deger);
      if (bulunan) { y[i].urunKod = bulunan.kod; y[i].birim = bulunan.birim; }
    }
    setSatirlar(y);
  };

  const kaydet = () => {
    if (!yeni.talipEden) return alert('Talep eden kişiyi giriniz!');
    if (satirlar.every(s => !s.urunAd)) return alert('En az bir ürün giriniz!');
    const no = `TAL-2026-00${talepler.length + 1}`;
    const yeniTalep = {
      id: Date.now(), no,
      tarih: yeni.tarih || new Date().toISOString().split('T')[0],
      talipEden: yeni.talipEden, aciklama: yeni.aciklama,
      durum: 'Taslak', satirlar: [...satirlar]
    };
    setTalepler([...talepler, yeniTalep]);
    alimTalepleri = [...talepler, yeniTalep];
    setYeni({ talipEden: '', aciklama: '', tarih: '' });
    setSatirlar([{ urunKod: '', urunAd: '', miktar: 1, birim: 'Adet', aciklama: '' }]);
    setFormAcik(false);
  };

  const durumDegistir = (id, durum) => {
    const guncellenmis = talepler.map(t => t.id === id ? { ...t, durum } : t);
    setTalepler(guncellenmis);
    alimTalepleri = guncellenmis;
  };

  const filtrelenmis = talepler.filter(t =>
    t.no.toLowerCase().includes(arama.toLowerCase()) ||
    t.talipEden.toLowerCase().includes(arama.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <input placeholder="🔍 Talep veya kişi ara..." value={arama} onChange={e => setArama(e.target.value)} style={{ ...inputStil, width: '280px' }} />
        <button onClick={() => setFormAcik(!formAcik)} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
          + Yeni Talep
        </button>
      </div>

      {formAcik && (
        <div style={kartStil}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>📋 Yeni Alım Talebi</h3>

          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>TALEP BİLGİLERİ</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStil}>Talep Eden *</label>
                <input placeholder="Ad Soyad" value={yeni.talipEden} onChange={e => setYeni({ ...yeni, talipEden: e.target.value })} style={inputStil} />
              </div>
              <div>
                <label style={labelStil}>Talep Tarihi</label>
                <input type="date" value={yeni.tarih} onChange={e => setYeni({ ...yeni, tarih: e.target.value })} style={inputStil} />
              </div>
              <div>
                <label style={labelStil}>Açıklama</label>
                <input placeholder="Talep açıklaması..." value={yeni.aciklama} onChange={e => setYeni({ ...yeni, aciklama: e.target.value })} style={inputStil} />
              </div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
              ÜRÜN SATIRLARI
              <span style={{ fontSize: '11px', fontWeight: '400', color: '#94a3b8', marginLeft: '8px' }}>Sadece "Satın Alma" tedarikli ürünler listelenir</span>
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  {['Ürün Kodu', 'Ürün Adı', 'Miktar', 'Birim', 'Açıklama', ''].map(b => (
                    <th key={b} style={{ padding: '8px', textAlign: 'left', color: '#64748b', fontSize: '12px' }}>{b}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {satirlar.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px', width: '120px' }}>
                      <input placeholder="Kod" value={s.urunKod} onChange={e => satirGuncelle(i, 'urunKod', e.target.value)} style={inputStil} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <select value={s.urunAd} onChange={e => satirGuncelle(i, 'urunAd', e.target.value)} style={inputStil}>
                        <option value="">-- Ürün Seçiniz --</option>
                        {satinAlinanUrunler.map(u => <option key={u.id}>{u.ad}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '8px', width: '90px' }}>
                      <input type="number" min="1" value={s.miktar} onChange={e => satirGuncelle(i, 'miktar', e.target.value)} style={inputStil} />
                    </td>
                    <td style={{ padding: '8px', width: '100px' }}>
                      <select value={s.birim} onChange={e => satirGuncelle(i, 'birim', e.target.value)} style={inputStil}>
                        {['Adet', 'Kg', 'Lt', 'Metre', 'Saat', 'Paket'].map(b => <option key={b}>{b}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input placeholder="Açıklama..." value={s.aciklama} onChange={e => satirGuncelle(i, 'aciklama', e.target.value)} style={inputStil} />
                    </td>
                    <td style={{ padding: '8px', width: '50px' }}>
                      {satirlar.length > 1 && <button onClick={() => satirSil(i)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}>✕</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={satirEkle} style={{ marginTop: '12px', background: 'white', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', color: '#64748b' }}>
              + Satır Ekle
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <button onClick={kaydet} style={{ padding: '10px 28px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>✓ Kaydet</button>
            <button onClick={() => setFormAcik(false)} style={{ padding: '10px 28px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>İptal</button>
          </div>
        </div>
      )}

      <div style={kartStil}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              {['Talep No', 'Tarih', 'Talep Eden', 'Ürün Sayısı', 'Açıklama', 'Durum', 'İşlem'].map(b => (
                <th key={b} style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>{b}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrelenmis.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px', fontWeight: '500', color: '#3b82f6' }}>{t.no}</td>
                <td style={{ padding: '12px', color: '#64748b' }}>{t.tarih}</td>
                <td style={{ padding: '12px' }}>{t.talipEden}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', background: '#f1f5f9', color: '#475569' }}>
                    {t.satirlar?.length || 0} kalem
                  </span>
                </td>
                <td style={{ padding: '12px', color: '#64748b' }}>{t.aciklama || '—'}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', background: durumRenk[t.durum]?.bg, color: durumRenk[t.durum]?.renk }}>
                    {t.durum}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <select value={t.durum} onChange={e => durumDegistir(t.id, e.target.value)} style={{ ...inputStil, fontSize: '12px', padding: '4px 8px', width: 'auto' }}>
                    <option>Taslak</option>
                    <option>Değerlendiriliyor</option>
                    <option>Onaylandı</option>
                    <option>Reddedildi</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrelenmis.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>Talep bulunamadı</p>}
      </div>
    </div>
  );
}

export default AlimTalepleri;