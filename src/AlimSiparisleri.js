import { useState } from 'react';
import { cariListesi } from './CariHesaplar';
import { alimTeklifleri } from './AlimTeklifleri';
import { urunListesi_global } from './Urunler';

const kartStil = { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '16px' };
const inputStil = { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', width: '100%', boxSizing: 'border-box' };
const labelStil = { fontSize: '12px', color: '#64748b', marginBottom: '4px', display: 'block', fontWeight: '600' };

const durumRenk = {
  'Beklemede': { bg: '#fef9c3', renk: '#854d0e' },
  'Kısmi Karşılandı': { bg: '#dbeafe', renk: '#1d4ed8' },
  'Karşılandı': { bg: '#dcfce7', renk: '#166534' },
  'İptal': { bg: '#fee2e2', renk: '#991b1b' },
};

export let alimSiparisleri = [
  {
    id: 1, no: 'ASP-2026-001', tarih: '2026-03-03', teslimTarihi: '2026-03-17',
    tedarikci: 'XYZ Gıda A.Ş.', teklifNo: 'ATK-2026-001',
    durum: 'Beklemede', tutar: 26360, kdv: 5272, toplam: 31632,
    satirlar: [
      { urunKod: 'URN001', urunAd: 'Laptop', miktar: 2, teslimatMiktar: 0, birim: 'Adet', fiyat: 13000, kdv: 20 },
      { urunKod: 'URN002', urunAd: 'Mouse', miktar: 2, teslimatMiktar: 0, birim: 'Adet', fiyat: 180, kdv: 20 },
    ]
  },
];

// Alış irsaliyesi kaydedilince siparişi güncelle
export function alimSiparisIrsaliyeGuncelle(siparisNo, teslimEdilen) {
  const siparis = alimSiparisleri.find(s => s.no === siparisNo);
  if (!siparis) return;

  teslimEdilen.forEach(({ urunKod, miktar }) => {
    const satir = siparis.satirlar.find(s => s.urunKod === urunKod);
    if (satir) satir.teslimatMiktar = (satir.teslimatMiktar || 0) + Number(miktar);
  });

  const tumTeslim = siparis.satirlar.every(s => s.teslimatMiktar >= s.miktar);
  const kismiTeslim = siparis.satirlar.some(s => (s.teslimatMiktar || 0) > 0);

  if (tumTeslim) siparis.durum = 'Karşılandı';
  else if (kismiTeslim) siparis.durum = 'Kısmi Karşılandı';
}

function AlimSiparisleri() {
  const [siparisler, setSiparisler] = useState(alimSiparisleri);
  const [arama, setArama] = useState('');
  const [durumFiltre, setDurumFiltre] = useState('');
  const [formAcik, setFormAcik] = useState(false);
  const [yeni, setYeni] = useState({ tedarikci: '', tarih: '', teslimTarihi: '', notlar: '' });
  const [seciliTeklifler, setSeciliTeklifler] = useState([]);
  const [satirlar, setSatirlar] = useState([{ urunKod: '', urunAd: '', miktar: 1, teslimatMiktar: 0, birim: 'Adet', fiyat: '', kdv: 20 }]);

  const tedarikciListesi = cariListesi.filter(c => c.tip === 'Tedarikçi' || c.tip === 'Müşteri / Tedarikçi');
  const satinAlinanUrunler = urunListesi_global.filter(u => u.tedarik === 'SATIN' || u.tedarik === 'HER_IKISI');

  const tedarikciTeklifleri = alimTeklifleri.filter(t =>
    t.tedarikci === yeni.tedarikci && (t.durum === 'Onaylandı' || t.durum === 'Beklemede')
  );

  const teklifToggle = (teklifNo) => {
    const teklif = alimTeklifleri.find(t => t.no === teklifNo);
    if (!teklif) return;
    if (seciliTeklifler.includes(teklifNo)) {
      setSeciliTeklifler(seciliTeklifler.filter(t => t !== teklifNo));
      setSatirlar(satirlar.filter(s => s.kaynakTeklif !== teklifNo));
    } else {
      setSeciliTeklifler([...seciliTeklifler, teklifNo]);
      const yeniSatirlar = teklif.satirlar.map(s => ({
        urunKod: s.urunKod, urunAd: s.urunAd,
        miktar: s.miktar, teslimatMiktar: 0,
        birim: s.birim, fiyat: s.fiyat, kdv: s.kdv,
        kaynakTeklif: teklifNo,
      }));
      setSatirlar(prev => [...prev.filter(s => s.urunAd !== ''), ...yeniSatirlar]);
    }
  };

  const tedarikciSec = (unvan) => {
    setYeni({ ...yeni, tedarikci: unvan });
    setSeciliTeklifler([]);
    setSatirlar([{ urunKod: '', urunAd: '', miktar: 1, teslimatMiktar: 0, birim: 'Adet', fiyat: '', kdv: 20 }]);
  };

  const satirEkle = () => setSatirlar([...satirlar, { urunKod: '', urunAd: '', miktar: 1, teslimatMiktar: 0, birim: 'Adet', fiyat: '', kdv: 20 }]);
  const satirSil = (i) => setSatirlar(satirlar.filter((_, idx) => idx !== i));
  const satirGuncelle = (i, alan, deger) => {
    const y = [...satirlar];
    y[i][alan] = deger;
    if (alan === 'urunAd') {
      const b = satinAlinanUrunler.find(u => u.ad === deger);
      if (b) { y[i].urunKod = b.kod; y[i].birim = b.birim || 'Adet'; }
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
    const no = `ASP-2026-00${siparisler.length + 1}`;
    const yeniSiparis = {
      id: Date.now(), no,
      tarih: yeni.tarih || new Date().toISOString().split('T')[0],
      teslimTarihi: yeni.teslimTarihi,
      tedarikci: yeni.tedarikci,
      teklifNo: seciliTeklifler.join(', '),
      durum: 'Beklemede', tutar, kdv, toplam,
      satirlar: satirlar.map(s => ({ ...s, teslimatMiktar: 0 })),
    };
    const guncellenmis = [...siparisler, yeniSiparis];
    setSiparisler(guncellenmis);
    alimSiparisleri.splice(0, alimSiparisleri.length, ...guncellenmis);
    setYeni({ tedarikci: '', tarih: '', teslimTarihi: '', notlar: '' });
    setSeciliTeklifler([]);
    setSatirlar([{ urunKod: '', urunAd: '', miktar: 1, teslimatMiktar: 0, birim: 'Adet', fiyat: '', kdv: 20 }]);
    setFormAcik(false);
  };

  const durumDegistir = (id, durum) => {
    const guncellenmis = siparisler.map(s => s.id === id ? { ...s, durum } : s);
    setSiparisler(guncellenmis);
    alimSiparisleri.splice(0, alimSiparisleri.length, ...guncellenmis);
  };

  const filtrelenmis = siparisler.filter(s => {
    const aramaUygun = s.tedarikci.toLowerCase().includes(arama.toLowerCase()) || s.no.toLowerCase().includes(arama.toLowerCase());
    const durumUygun = durumFiltre === '' || s.durum === durumFiltre;
    return aramaUygun && durumUygun;
  });

  const { tutar, kdv, toplam } = toplamHesapla();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input placeholder="🔍 Sipariş veya tedarikçi ara..." value={arama} onChange={e => setArama(e.target.value)} style={{ ...inputStil, width: '280px' }} />
          <select value={durumFiltre} onChange={e => setDurumFiltre(e.target.value)} style={{ ...inputStil, width: '160px' }}>
            <option value="">Tüm Durumlar</option>
            <option>Beklemede</option>
            <option>Kısmi Karşılandı</option>
            <option>Karşılandı</option>
            <option>İptal</option>
          </select>
        </div>
        <button onClick={() => setFormAcik(!formAcik)} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
          + Yeni Alım Siparişi
        </button>
      </div>

      {formAcik && (
        <div style={kartStil}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>🛒 Yeni Alım Siparişi</h3>

          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>SİPARİŞ BİLGİLERİ</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStil}>Tedarikçi *</label>
                <select value={yeni.tedarikci} onChange={e => tedarikciSec(e.target.value)} style={inputStil}>
                  <option value="">-- Seçiniz --</option>
                  {tedarikciListesi.map(c => <option key={c.id}>{c.unvan}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStil}>Sipariş Tarihi</label>
                <input type="date" value={yeni.tarih} onChange={e => setYeni({ ...yeni, tarih: e.target.value })} style={inputStil} />
              </div>
              <div>
                <label style={labelStil}>Teslim Tarihi</label>
                <input type="date" value={yeni.teslimTarihi} onChange={e => setYeni({ ...yeni, teslimTarihi: e.target.value })} style={inputStil} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStil}>Notlar</label>
                <input placeholder="Sipariş notu..." value={yeni.notlar} onChange={e => setYeni({ ...yeni, notlar: e.target.value })} style={inputStil} />
              </div>
            </div>
          </div>

          {yeni.tedarikci && (
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                BAĞLI TEKLİFLER
                <span style={{ fontSize: '11px', fontWeight: '400', color: '#94a3b8', marginLeft: '8px' }}>Birden fazla seçebilirsiniz</span>
              </p>
              {tedarikciTeklifleri.length === 0
                ? <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Bu tedarikçiye ait onaylı teklif bulunamadı</p>
                : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {tedarikciTeklifleri.map(t => (
                      <div key={t.no} onClick={() => teklifToggle(t.no)} style={{
                        padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
                        border: `2px solid ${seciliTeklifler.includes(t.no) ? '#3b82f6' : '#e2e8f0'}`,
                        background: seciliTeklifler.includes(t.no) ? '#dbeafe' : 'white',
                        color: seciliTeklifler.includes(t.no) ? '#1d4ed8' : '#475569',
                      }}>
                        <div style={{ fontWeight: '600' }}>{t.no}</div>
                        <div style={{ fontSize: '11px', marginTop: '2px', color: '#94a3b8' }}>
                          {t.tarih} · {t.satirlar?.length || 0} kalem · ₺{t.toplam?.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          )}

          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>ÜRÜN SATIRLARI</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  {['Kod', 'Ürün Adı', 'Miktar', 'Birim', 'Birim Fiyat (₺)', 'KDV %', 'Tutar (₺)', 'Kaynak', ''].map(b => (
                    <th key={b} style={{ padding: '8px', textAlign: 'left', color: '#64748b', fontSize: '12px' }}>{b}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {satirlar.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', background: s.kaynakTeklif ? '#f0f9ff' : 'white' }}>
                    <td style={{ padding: '8px', width: '100px' }}>
                      <input placeholder="Kod" value={s.urunKod} onChange={e => satirGuncelle(i, 'urunKod', e.target.value)} style={inputStil} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <select value={s.urunAd} onChange={e => satirGuncelle(i, 'urunAd', e.target.value)} style={inputStil}>
                        <option value="">-- Seçiniz --</option>
                        {satinAlinanUrunler.map(u => <option key={u.id}>{u.ad}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '8px', width: '80px' }}>
                      <input type="number" min="1" value={s.miktar} onChange={e => satirGuncelle(i, 'miktar', e.target.value)} style={inputStil} />
                    </td>
                    <td style={{ padding: '8px', width: '100px' }}>
                      <select value={s.birim} onChange={e => satirGuncelle(i, 'birim', e.target.value)} style={inputStil}>
                        {['Adet', 'Kg', 'Lt', 'Metre', 'Saat', 'Paket'].map(b => <option key={b}>{b}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '8px', width: '130px' }}>
                      <input type="number" placeholder="0.00" value={s.fiyat} onChange={e => satirGuncelle(i, 'fiyat', e.target.value)} style={inputStil} />
                    </td>
                    <td style={{ padding: '8px', width: '90px' }}>
                      <select value={s.kdv} onChange={e => satirGuncelle(i, 'kdv', e.target.value)} style={inputStil}>
                        {[0, 1, 10, 20].map(k => <option key={k} value={k}>%{k}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '8px', width: '120px', fontWeight: '600', color: '#ef4444' }}>
                      ₺{(Number(s.fiyat) * Number(s.miktar)).toLocaleString()}
                    </td>
                    <td style={{ padding: '8px', width: '100px' }}>
                      {s.kaynakTeklif && (
                        <span style={{ fontSize: '11px', padding: '2px 8px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '20px' }}>{s.kaynakTeklif}</span>
                      )}
                    </td>
                    <td style={{ padding: '8px', width: '50px' }}>
                      {satirlar.length > 1 && <button onClick={() => satirSil(i)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}>✕</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={satirEkle} style={{ marginTop: '12px', background: 'white', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', color: '#64748b' }}>
              + Manuel Satır Ekle
            </button>
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
              {['Sipariş No', 'Tarih', 'Teslim Tarihi', 'Tedarikçi', 'Bağlı Teklif', 'Toplam', 'Teslimat', 'Durum', 'İşlem'].map(b => (
                <th key={b} style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>{b}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrelenmis.map(s => {
              const toplamMiktar = s.satirlar?.reduce((t, sat) => t + Number(sat.miktar), 0) || 0;
              const teslimatMiktar = s.satirlar?.reduce((t, sat) => t + Number(sat.teslimatMiktar || 0), 0) || 0;
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: '500', color: '#3b82f6' }}>{s.no}</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{s.tarih}</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{s.teslimTarihi || '—'}</td>
                  <td style={{ padding: '12px' }}>{s.tedarikci}</td>
                  <td style={{ padding: '12px' }}>
                    {s.teklifNo
                      ? <span style={{ fontSize: '12px', padding: '2px 8px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '20px' }}>{s.teklifNo}</span>
                      : <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px', fontWeight: '600', color: '#ef4444' }}>₺{s.toplam.toLocaleString()}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{teslimatMiktar}/{toplamMiktar} kalem</div>
                    <div style={{ background: '#f1f5f9', borderRadius: '4px', height: '6px', marginTop: '4px', overflow: 'hidden' }}>
                      <div style={{ width: toplamMiktar > 0 ? `${Math.min((teslimatMiktar / toplamMiktar) * 100, 100)}%` : '0%', background: '#3b82f6', height: '100%', borderRadius: '4px' }} />
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', background: durumRenk[s.durum]?.bg, color: durumRenk[s.durum]?.renk }}>
                      {s.durum}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <select value={s.durum} onChange={e => durumDegistir(s.id, e.target.value)} style={{ ...inputStil, fontSize: '12px', padding: '4px 8px', width: 'auto' }}>
                      <option>Beklemede</option>
                      <option>Kısmi Karşılandı</option>
                      <option>Karşılandı</option>
                      <option>İptal</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtrelenmis.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>Sipariş bulunamadı</p>}
      </div>
    </div>
  );
}

export default AlimSiparisleri;