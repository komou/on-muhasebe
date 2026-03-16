import { useState, useEffect } from 'react';
import { cariListesi } from './CariHesaplar';
import { alisIrsaliyeListesi, alisIrsaliyeFaturalandir } from './AlisIrsaliyeleri';
import { urunListesi_global } from './Urunler';
import { supabase } from './supabase';

const kartStil = { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '16px' };
const inputStil = { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', width: '100%', boxSizing: 'border-box' };
const labelStil = { fontSize: '12px', color: '#64748b', marginBottom: '4px', display: 'block', fontWeight: '600' };
const maliyetYontemleri = ['FIFO', 'LIFO', 'Ağırlıklı Ortalama'];

export let alisFaturaListesi = [];

function AlisFaturalari() {
  const [faturalar, setFaturalar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [arama, setArama] = useState('');
  const [durumFiltre, setDurumFiltre] = useState('');
  const [formAcik, setFormAcik] = useState(false);
  const [yeni, setYeni] = useState({ tedarikci: '', tarih: '', vade: '', maliyetYontemi: 'FIFO', notlar: '' });
  const [seciliIrsaliyeler, setSeciliIrsaliyeler] = useState([]);
  const [satirlar, setSatirlar] = useState([{ urunKod: '', urunAd: '', miktar: 1, fiyat: '', kdv: 20, kaynakIrs: '' }]);

  useEffect(() => {
    faturalariYukle();
  }, []);

  const faturalariYukle = async () => {
    setYukleniyor(true);
    const { data, error } = await supabase
      .from('alis_faturalari')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Alış fatura yükleme hatası:', error);
    } else {
      const donusturulmus = data.map(f => ({
        id: f.id, no: f.no, tarih: f.tarih, vade: f.vade,
        tedarikci: f.tedarikci,
        maliyetYontemi: f.maliyet_yontemi,
        tutar: Number(f.tutar), kdv: Number(f.kdv), toplam: Number(f.toplam),
        durum: f.durum,
        irsaliyeler: f.irsaliyeler || [],
        satirlar: f.satirlar || [],
      }));
      setFaturalar(donusturulmus);
      alisFaturaListesi.splice(0, alisFaturaListesi.length, ...donusturulmus);
    }
    setYukleniyor(false);
  };

  const tedarikciListesi = cariListesi.filter(c => c.tip === 'Tedarikçi' || c.tip === 'Müşteri / Tedarikçi');
  const satinAlinanUrunler = urunListesi_global.filter(u => u.tedarik === 'SATIN' || u.tedarik === 'HER_IKISI');

  const tedarikciIrsaliyeleri = alisIrsaliyeListesi.filter(i =>
    i.tedarikci === yeni.tedarikci && !['Faturalandı', 'İptal'].includes(i.durum)
  );

  const tedarikciSec = (unvan) => {
    setYeni({ ...yeni, tedarikci: unvan });
    setSeciliIrsaliyeler([]);
    setSatirlar([{ urunKod: '', urunAd: '', miktar: 1, fiyat: '', kdv: 20, kaynakIrs: '' }]);
  };

  const irsaliyeToggle = (irsNo) => {
    const irsaliye = alisIrsaliyeListesi.find(i => i.no === irsNo);
    if (!irsaliye) return;
    if (seciliIrsaliyeler.includes(irsNo)) {
      setSeciliIrsaliyeler(seciliIrsaliyeler.filter(i => i !== irsNo));
      setSatirlar(satirlar.filter(s => s.kaynakIrs !== irsNo));
    } else {
      setSeciliIrsaliyeler([...seciliIrsaliyeler, irsNo]);
      const yeniSatirlar = irsaliye.satirlar.map(s => {
        const urun = urunListesi_global.find(u => u.ad === (s.urunAd || s.urun) || u.kod === s.urunKod);
        return {
          urunKod: s.urunKod || s.kod || '',
          urunAd: s.urunAd || s.urun || '',
          miktar: s.miktar || 1,
          fiyat: urun?.alisFiyat || '',
          kdv: urun?.kdv || 20,
          kaynakIrs: irsNo,
        };
      });
      setSatirlar(prev => [...prev.filter(s => s.urunAd !== ''), ...yeniSatirlar]);
    }
  };

  const satirEkle = () => setSatirlar([...satirlar, { urunKod: '', urunAd: '', miktar: 1, fiyat: '', kdv: 20, kaynakIrs: '' }]);
  const satirSil = (i) => setSatirlar(satirlar.filter((_, idx) => idx !== i));
  const satirGuncelle = (i, alan, deger) => {
    const y = [...satirlar];
    y[i][alan] = deger;
    if (alan === 'urunAd') {
      const b = satinAlinanUrunler.find(u => u.ad === deger);
      if (b) { y[i].urunKod = b.kod; y[i].fiyat = b.alisFiyat; y[i].kdv = b.kdv; }
    }
    setSatirlar(y);
  };

  const toplamHesapla = () => {
    const tutar = satirlar.reduce((t, s) => t + (Number(s.fiyat) * Number(s.miktar)), 0);
    const kdv = satirlar.reduce((t, s) => t + (Number(s.fiyat) * Number(s.miktar) * Number(s.kdv) / 100), 0);
    return { tutar, kdv, toplam: tutar + kdv };
  };

  const kaydet = async () => {
    if (!yeni.tedarikci) return alert('Tedarikçi seçiniz!');
    if (satirlar.every(s => !s.urunAd)) return alert('En az bir ürün giriniz!');
    const { tutar, kdv, toplam } = toplamHesapla();

    const { count } = await supabase.from('alis_faturalari').select('*', { count: 'exact', head: true });
    const no = `AFAT-2026-${String((count || 0) + 1).padStart(3, '0')}`;

    // İrsaliyeleri faturalandı yap
    for (const irsNo of seciliIrsaliyeler) {
      await alisIrsaliyeFaturalandir(irsNo);
    }

    const { error } = await supabase.from('alis_faturalari').insert({
      no,
      tarih: yeni.tarih || new Date().toISOString().split('T')[0],
      vade: yeni.vade || null,
      tedarikci: yeni.tedarikci,
      maliyet_yontemi: yeni.maliyetYontemi,
      tutar, kdv, toplam,
      durum: 'Beklemede',
      irsaliyeler: seciliIrsaliyeler,
      satirlar,
    });

    if (error) return alert('Kayıt hatası: ' + error.message);

    await faturalariYukle();
    setYeni({ tedarikci: '', tarih: '', vade: '', maliyetYontemi: 'FIFO', notlar: '' });
    setSeciliIrsaliyeler([]);
    setSatirlar([{ urunKod: '', urunAd: '', miktar: 1, fiyat: '', kdv: 20, kaynakIrs: '' }]);
    setFormAcik(false);
    alert(`✅ Alış faturası kaydedildi!${seciliIrsaliyeler.length > 0 ? `\n${seciliIrsaliyeler.join(', ')} irsaliyeleri faturalandı.` : ''}`);
  };

  const durumDegistir = async (id, durum) => {
    await supabase.from('alis_faturalari').update({ durum }).eq('id', id);
    await faturalariYukle();
  };

  const filtrelenmis = faturalar.filter(f => {
    const aramaUygun = f.tedarikci.toLowerCase().includes(arama.toLowerCase()) || f.no.toLowerCase().includes(arama.toLowerCase());
    const durumUygun = durumFiltre === '' || f.durum === durumFiltre;
    return aramaUygun && durumUygun;
  });

  const { tutar, kdv, toplam } = toplamHesapla();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input placeholder="🔍 Fatura veya tedarikçi ara..." value={arama} onChange={e => setArama(e.target.value)} style={{ ...inputStil, width: '280px' }} />
          <select value={durumFiltre} onChange={e => setDurumFiltre(e.target.value)} style={{ ...inputStil, width: '160px' }}>
            <option value="">Tüm Durumlar</option>
            <option>Beklemede</option>
            <option>Onaylandı</option>
            <option>Ödendi</option>
            <option>İptal</option>
          </select>
        </div>
        <button onClick={() => setFormAcik(!formAcik)} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
          + Yeni Alış Faturası
        </button>
      </div>

      {formAcik && (
        <div style={kartStil}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>🛒 Yeni Alış Faturası</h3>

          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>FATURA BİLGİLERİ</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStil}>Tedarikçi *</label>
                <select value={yeni.tedarikci} onChange={e => tedarikciSec(e.target.value)} style={inputStil}>
                  <option value="">-- Seçiniz --</option>
                  {tedarikciListesi.map(c => <option key={c.id}>{c.unvan}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStil}>Fatura Tarihi</label>
                <input type="date" value={yeni.tarih} onChange={e => setYeni({ ...yeni, tarih: e.target.value })} style={inputStil} />
              </div>
              <div>
                <label style={labelStil}>Vade Tarihi</label>
                <input type="date" value={yeni.vade} onChange={e => setYeni({ ...yeni, vade: e.target.value })} style={inputStil} />
              </div>
              <div>
                <label style={labelStil}>Maliyet Yöntemi</label>
                <select value={yeni.maliyetYontemi} onChange={e => setYeni({ ...yeni, maliyetYontemi: e.target.value })} style={inputStil}>
                  {maliyetYontemleri.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '2 / -1' }}>
                <label style={labelStil}>Notlar</label>
                <input placeholder="Fatura notu..." value={yeni.notlar} onChange={e => setYeni({ ...yeni, notlar: e.target.value })} style={inputStil} />
              </div>
            </div>
          </div>

          {yeni.tedarikci && (
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                BAĞLI ALIŞ İRSALİYELERİ
                <span style={{ fontSize: '11px', fontWeight: '400', color: '#94a3b8', marginLeft: '8px' }}>Sadece faturalanmamış irsaliyeler görünür</span>
              </p>
              {tedarikciIrsaliyeleri.length === 0
                ? <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Bu tedarikçiye ait faturalanmamış irsaliye yok</p>
                : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {tedarikciIrsaliyeleri.map(irs => (
                      <div key={irs.no} onClick={() => irsaliyeToggle(irs.no)} style={{
                        padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
                        border: `2px solid ${seciliIrsaliyeler.includes(irs.no) ? '#3b82f6' : '#e2e8f0'}`,
                        background: seciliIrsaliyeler.includes(irs.no) ? '#dbeafe' : 'white',
                        color: seciliIrsaliyeler.includes(irs.no) ? '#1d4ed8' : '#475569',
                      }}>
                        <div style={{ fontWeight: '600' }}>{irs.no}</div>
                        <div style={{ fontSize: '11px', marginTop: '2px', color: '#94a3b8' }}>
                          {irs.tarih} · {irs.satirlar?.length || 0} kalem · {irs.durum}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          )}

          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>ÜRÜN / HİZMET SATIRLARI</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  {['Kod', 'Ürün Adı', 'Miktar', 'Birim Fiyat (₺)', 'KDV %', 'Tutar (₺)', 'Kaynak', ''].map(b => (
                    <th key={b} style={{ padding: '8px', textAlign: 'left', color: '#64748b', fontSize: '12px' }}>{b}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {satirlar.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', background: s.kaynakIrs ? '#f0f9ff' : 'white' }}>
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
                      {s.kaynakIrs && <span style={{ fontSize: '11px', padding: '2px 8px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '20px' }}>{s.kaynakIrs}</span>}
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

      {yukleniyor ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
          <p style={{ fontSize: '32px', margin: '0 0 12px' }}>⏳</p>
          <p>Yükleniyor...</p>
        </div>
      ) : (
        <div style={kartStil}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                {['Fatura No', 'Tarih', 'Vade', 'Tedarikçi', 'Maliyet Y.', 'İrsaliyeler', 'Tutar', 'Toplam', 'Durum'].map(b => (
                  <th key={b} style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>{b}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrelenmis.map(f => (
                <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: '500', color: '#3b82f6' }}>{f.no}</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{f.tarih}</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{f.vade || '—'}</td>
                  <td style={{ padding: '12px' }}>{f.tedarikci}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '11px', background: '#ede9fe', color: '#6d28d9' }}>{f.maliyetYontemi}</span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {f.irsaliyeler?.length > 0
                      ? f.irsaliyeler.map(i => <span key={i} style={{ fontSize: '11px', padding: '2px 6px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '20px', marginRight: '4px' }}>{i}</span>)
                      : <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px', color: '#64748b' }}>₺{f.tutar.toLocaleString()}</td>
                  <td style={{ padding: '12px', fontWeight: '600', color: '#ef4444' }}>₺{f.toplam.toLocaleString()}</td>
                  <td style={{ padding: '12px' }}>
                    <select value={f.durum} onChange={e => durumDegistir(f.id, e.target.value)} style={{ ...inputStil, fontSize: '12px', padding: '4px 8px', width: 'auto' }}>
                      <option>Beklemede</option>
                      <option>Onaylandı</option>
                      <option>Ödendi</option>
                      <option>İptal</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtrelenmis.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>Fatura bulunamadı</p>}
        </div>
      )}
    </div>
  );
}

export default AlisFaturalari;