import { useState } from 'react';
import { cariListesi } from './CariHesaplar';
import { alimTalepleri } from './AlimTalepleri';
import { urunListesi_global } from './Urunler';

const kartStil = { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '16px' };
const inputStil = { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', width: '100%', boxSizing: 'border-box' };
const labelStil = { fontSize: '12px', color: '#64748b', marginBottom: '4px', display: 'block', fontWeight: '600' };

const durumRenk = {
  'Beklemede': { bg: '#fef9c3', renk: '#854d0e' },
  'Onaylandı': { bg: '#dcfce7', renk: '#166534' },
  'Reddedildi': { bg: '#fee2e2', renk: '#991b1b' },
  'Siparişe Dönüştürüldü': { bg: '#dbeafe', renk: '#1d4ed8' },
};

export let alimTeklifleri = [
  {
    id: 1, no: 'ATK-2026-001', tarih: '2026-03-02', gecerlilik: '2026-03-16',
    tedarikci: 'XYZ Gıda A.Ş.', talepNo: 'TAL-2026-001',
    durum: 'Onaylandı', tutar: 26360, kdv: 5272, toplam: 31632,
    satirlar: [
      { urunKod: 'URN001', urunAd: 'Laptop', miktar: 2, birim: 'Adet', fiyat: 13000, kdv: 20 },
      { urunKod: 'URN002', urunAd: 'Mouse', miktar: 2, birim: 'Adet', fiyat: 180, kdv: 20 },
    ]
  },
];

function AlimTeklifleri() {
  const [teklifler, setTeklifler] = useState(alimTeklifleri);
  const [arama, setArama] = useState('');
  const [formAcik, setFormAcik] = useState(false);
  const [yeni, setYeni] = useState({ tedarikci: '', tarih: '', gecerlilik: '', talepNo: '', notlar: '' });
  const [satirlar, setSatirlar] = useState([{ urunKod: '', urunAd: '', miktar: 1, birim: 'Adet', fiyat: '', kdv: 20 }]);

  const tedarikciListesi = cariListesi.filter(c => c.tip === 'Tedarikçi' || c.tip === 'Müşteri / Tedarikçi');
  const onaylananTalepler = alimTalepleri.filter(t => t.durum === 'Onaylandı');
  const satinAlinanUrunler = urunListesi_global.filter(u => u.tedarik === 'Satın Alma' || u.tedarik === 'Satın Alma ve Üretim');

  const talepSec = (talepNo) => {
    const talep = alimTalepleri.find(t => t.no === talepNo);
    if (!talep) { setYeni({ ...yeni, talepNo }); return; }
    const yeniSatirlar = talep.satirlar.map(s => ({
      urunKod: s.urunKod, urunAd: s.urunAd,
      miktar: s.miktar, birim: s.birim, fiyat: '', kdv: 20
    }));
    setSatirlar(yeniSatirlar);
    setYeni({ ...yeni, talepNo });
  };

  const satirEkle = () => setSatirlar([...satirlar, { urunKod: '', urunAd: '', miktar: 1, birim: 'Adet', fiyat: '', kdv: 20 }]);
  const satirSil = (i) => setSatirlar(satirlar.filter((_, idx) => idx !== i));
  const satirGuncelle = (i, alan, deger) => {
    const y = [...satirlar];
    y[i][alan] = deger;
    if (alan === 'urunAd') {
      const b = satinAlinanUrunler.find(u => u.ad === deger);
      if (b) { y[i].urunKod = b.kod; y[i].birim = b.birim; }
    }
    setSatirlar(y);
  };

  const toplamHesapla = () => {
    const tutar = satirlar.reduce((t, s) => t + (Number(s.fiyat) * Number(s.miktar)), 0);
    const kdv = satirlar.reduce((t, s) => t + (Number(s.fiyat) * Number(s.miktar) * Number(s.kdv) / 100), 0);
    return { tutar, kdv, toplam: tutar + kdv };
  };

  const kaydet = () => {
    if (!yeni.tedarikci) return alert('Tedarikçi seçiniz!');
    if (satirlar.every(s => !s.urunAd)) return alert('En az bir ürün giriniz!');
    const { tutar, kdv, toplam } = toplamHesapla();
    const no = `ATK-2026-00${teklifler.length + 1}`;
    const yeniTeklif = {
      id: Date.now(), no,
      tarih: yeni.tarih || new Date().toISOString().split('T')[0],
      gecerlilik: yeni.gecerlilik, tedarikci: yeni.tedarikci,
      talepNo: yeni.talepNo, durum: 'Beklemede',
      tutar, kdv, toplam, satirlar: [...satirlar]
    };
    setTeklifler([...teklifler, yeniTeklif]);
    alimTeklifleri = [...teklifler, yeniTeklif];
    setYeni({ tedarikci: '', tarih: '', gecerlilik: '', talepNo: '', notlar: '' });
    setSatirlar([{ urunKod: '', urunAd: '', miktar: 1, birim: 'Adet', fiyat: '', kdv: 20 }]);
    setFormAcik(false);
  };

  const durumDegistir = (id, durum) => {
    const guncellenmis = teklifler.map(t => t.id === id ? { ...t, durum } : t);
    setTeklifler(guncellenmis);
    alimTeklifleri = guncellenmis;
  };

  const filtrelenmis = teklifler.filter(t =>
    t.tedarikci.toLowerCase().includes(arama.toLowerCase()) ||
    t.no.toLowerCase().includes(arama.toLowerCase())
  );

  const { tutar, kdv, toplam } = toplamHesapla();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <input placeholder="🔍 Teklif veya tedarikçi ara..." value={arama} onChange={e => setArama(e.target.value)} style={{ ...inputStil, width: '280px' }} />
        <button onClick={() => setFormAcik(!formAcik)} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
          + Yeni Teklif
        </button>
      </div>

      {formAcik && (
        <div style={kartStil}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>📋 Yeni Alım Teklifi</h3>

          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>TEKLİF BİLGİLERİ</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStil}>Tedarikçi *</label>
                <select value={yeni.tedarikci} onChange={e => setYeni({ ...yeni, tedarikci: e.target.value })} style={inputStil}>
                  <option value="">-- Seçiniz --</option>
                  {tedarikciListesi.map(c => <option key={c.id}>{c.unvan}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStil}>Teklif Tarihi</label>
                <input type="date" value={yeni.tarih} onChange={e => setYeni({ ...yeni, tarih: e.target.value })} style={inputStil} />
              </div>
              <div>
                <label style={labelStil}>Geçerlilik Tarihi</label>
                <input type="date" value={yeni.gecerlilik} onChange={e => setYeni({ ...yeni, gecerlilik: e.target.value })} style={inputStil} />
              </div>
              <div>
                <label style={labelStil}>Bağlı Talep</label>
                <select value={yeni.talepNo} onChange={e => talepSec(e.target.value)} style={inputStil}>
                  <option value="">-- Talep Seçiniz (opsiyonel) --</option>
                  {onaylananTalepler.map(t => <option key={t.no}>{t.no} — {t.talipEden}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '2 / -1' }}>
                <label style={labelStil}>Notlar</label>
                <input placeholder="Teklif notu..." value={yeni.notlar} onChange={e => setYeni({ ...yeni, notlar: e.target.value })} style={inputStil} />
              </div>
            </div>
          </div>

          {yeni.talepNo && (
            <div style={{ background: '#dbeafe', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#1d4ed8' }}>
              ℹ️ Talep satırları otomatik yüklendi. Fiyatları giriniz.
            </div>
          )}

          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>ÜRÜN SATIRLARI</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  {['Kod', 'Ürün Adı', 'Miktar', 'Birim', 'Birim Fiyat (₺)', 'KDV %', 'Tutar (₺)', ''].map(b => (
                    <th key={b} style={{ padding: '8px', textAlign: 'left', color: '#64748b', fontSize: '12px' }}>{b}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {satirlar.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px', width: '100px' }}><input placeholder="Kod" value={s.urunKod} onChange={e => satirGuncelle(i, 'urunKod', e.target.value)} style={inputStil} /></td>
                    <td style={{ padding: '8px' }}>
                      <select value={s.urunAd} onChange={e => satirGuncelle(i, 'urunAd', e.target.value)} style={inputStil}>
                        <option value="">-- Seçiniz --</option>
                        {satinAlinanUrunler.map(u => <option key={u.id}>{u.ad}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '8px', width: '80px' }}><input type="number" min="1" value={s.miktar} onChange={e => satirGuncelle(i, 'miktar', e.target.value)} style={inputStil} /></td>
                    <td style={{ padding: '8px', width: '100px' }}>
                      <select value={s.birim} onChange={e => satirGuncelle(i, 'birim', e.target.value)} style={inputStil}>
                        {['Adet', 'Kg', 'Lt', 'Metre', 'Saat', 'Paket'].map(b => <option key={b}>{b}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '8px', width: '130px' }}><input type="number" placeholder="0.00" value={s.fiyat} onChange={e => satirGuncelle(i, 'fiyat', e.target.value)} style={inputStil} /></td>
                    <td style={{ padding: '8px', width: '90px' }}>
                      <select value={s.kdv} onChange={e => satirGuncelle(i, 'kdv', e.target.value)} style={inputStil}>
                        {[0, 1, 10, 20].map(k => <option key={k} value={k}>%{k}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '8px', width: '120px', fontWeight: '600', color: '#ef4444' }}>₺{(Number(s.fiyat) * Number(s.miktar)).toLocaleString()}</td>
                    <td style={{ padding: '8px', width: '50px' }}>
                      {satirlar.length > 1 && <button onClick={() => satirSil(i)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}>✕</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={satirEkle} style={{ marginTop: '12px', background: 'white', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', color: '#64748b' }}>+ Satır Ekle</button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', minWidth: '260px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '8px' }}><span>Ara Toplam</span><span>₺{tutar.toLocaleString()}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '12px' }}><span>KDV Tutarı</span><span>₺{kdv.toLocaleString()}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', color: '#1e293b', borderTop: '2px solid #e2e8f0', paddingTop: '12px' }}><span>Genel Toplam</span><span style={{ color: '#ef4444' }}>₺{toplam.toLocaleString()}</span></div>
            </div>
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
              {['Teklif No', 'Tarih', 'Geçerlilik', 'Tedarikçi', 'Bağlı Talep', 'Tutar', 'Toplam', 'Durum', 'İşlem'].map(b => (
                <th key={b} style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>{b}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrelenmis.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px', fontWeight: '500', color: '#3b82f6' }}>{t.no}</td>
                <td style={{ padding: '12px', color: '#64748b' }}>{t.tarih}</td>
                <td style={{ padding: '12px', color: '#64748b' }}>{t.gecerlilik}</td>
                <td style={{ padding: '12px' }}>{t.tedarikci}</td>
                <td style={{ padding: '12px' }}>
                  {t.talepNo ? <span style={{ fontSize: '12px', padding: '2px 8px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '20px' }}>{t.talepNo}</span> : <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>}
                </td>
                <td style={{ padding: '12px', color: '#64748b' }}>₺{t.tutar.toLocaleString()}</td>
                <td style={{ padding: '12px', fontWeight: '600', color: '#ef4444' }}>₺{t.toplam.toLocaleString()}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', background: durumRenk[t.durum]?.bg, color: durumRenk[t.durum]?.renk }}>{t.durum}</span>
                </td>
                <td style={{ padding: '12px', display: 'flex', gap: '6px' }}>
                  <select value={t.durum} onChange={e => durumDegistir(t.id, e.target.value)} style={{ ...inputStil, fontSize: '12px', padding: '4px 8px', width: 'auto' }}>
                    <option>Beklemede</option>
                    <option>Onaylandı</option>
                    <option>Reddedildi</option>
                    <option>Siparişe Dönüştürüldü</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrelenmis.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>Teklif bulunamadı</p>}
      </div>
    </div>
  );
}

export default AlimTeklifleri;