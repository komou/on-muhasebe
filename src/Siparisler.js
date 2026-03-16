import { useState, useEffect } from 'react';
import { cariListesi } from './CariHesaplar';
import { urunListesi_global } from './Urunler';
import { supabase } from './supabase';

const kartStil = { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '16px' };
const inputStil = { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', width: '100%', boxSizing: 'border-box' };
const labelStil = { fontSize: '12px', color: '#64748b', marginBottom: '4px', display: 'block', fontWeight: '600' };

const durumRenk = {
  'Beklemede': { bg: '#fef9c3', renk: '#854d0e' },
  'Onaylandı': { bg: '#dbeafe', renk: '#1d4ed8' },
  'Kısmi Sevk': { bg: '#e0f2fe', renk: '#0369a1' },
  'Teslim Edildi': { bg: '#dcfce7', renk: '#166534' },
  'İptal': { bg: '#fee2e2', renk: '#991b1b' },
};

export let satisSimarisleri = [];

// İrsaliye kaydedilince siparişi güncelle + Supabase'e yaz
export async function siparisIrsaliyeGuncelle(siparisNo, sevkEdilen) {
  const siparis = satisSimarisleri.find(s => s.no === siparisNo);
  if (!siparis) return;

  sevkEdilen.forEach(({ urunKod, miktar }) => {
    const satir = siparis.satirlar.find(s => s.kod === urunKod);
    if (satir) satir.sevkMiktar = (satir.sevkMiktar || 0) + Number(miktar);
  });

  const tumTeslim = siparis.satirlar.every(s => s.sevkMiktar >= s.miktar);
  const kismiTeslim = siparis.satirlar.some(s => (s.sevkMiktar || 0) > 0);

  if (tumTeslim) siparis.durum = 'Teslim Edildi';
  else if (kismiTeslim) siparis.durum = 'Kısmi Sevk';

  await supabase.from('siparisler')
    .update({ durum: siparis.durum, satirlar: siparis.satirlar })
    .eq('no', siparisNo);
}

function AramaliSecim({ deger, onChange, liste, placeholder, alanlar }) {
  const [arama, setArama] = useState('');
  const [acik, setAcik] = useState(false);
  const filtrelenmis = liste.filter(item =>
    alanlar.some(alan => item[alan]?.toLowerCase().includes(arama.toLowerCase()))
  );
  const sec = (item) => { onChange(item); setArama(''); setAcik(false); };
  return (
    <div style={{ position: 'relative' }}>
      <input
        placeholder={placeholder}
        value={acik ? arama : deger}
        onChange={e => { setArama(e.target.value); setAcik(true); }}
        onFocus={() => setAcik(true)}
        onBlur={() => setTimeout(() => setAcik(false), 200)}
        style={inputStil}
      />
      {acik && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto' }}>
          {filtrelenmis.length === 0 && <div style={{ padding: '12px', color: '#94a3b8', fontSize: '13px' }}>Sonuç bulunamadı</div>}
          {filtrelenmis.map((item, i) => (
            <div key={i} onMouseDown={() => sec(item)}
              style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #f1f5f9' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              {alanlar.map(alan => (
                <span key={alan} style={{ marginRight: '8px', color: alan === alanlar[0] ? '#1e293b' : '#94a3b8' }}>{item[alan]}</span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Siparisler({ seciliCari, formAc, onFormAcildi }) {
  const [siparisler, setSiparisler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [arama, setArama] = useState('');
  const [durumFiltre, setDurumFiltre] = useState('');
  const [formAcik, setFormAcik] = useState(false);
  const [satirlar, setSatirlar] = useState([{ kod: '', urun: '', miktar: 1, sevkMiktar: 0, fiyat: '', kdv: 20 }]);
  const [yeniSiparis, setYeniSiparis] = useState({ cari: '', tarih: '', notlar: '' });

  useEffect(() => {
    siparisleriYukle();
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (formAc && seciliCari) {
      setYeniSiparis({ cari: seciliCari.unvan, tarih: '', notlar: '' });
      setFormAcik(true);
      setSatirlar([{ kod: '', urun: '', miktar: 1, sevkMiktar: 0, fiyat: '', kdv: 20 }]);
      if (onFormAcildi) onFormAcildi();
    }
  }, [formAc, seciliCari]);

  const siparisleriYukle = async () => {
    setYukleniyor(true);
    const { data, error } = await supabase
      .from('siparisler')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Sipariş yükleme hatası:', error);
    } else {
      const donusturulmus = data.map(s => ({
        id: s.id,
        no: s.no,
        tarih: s.tarih,
        cari: s.cari,
        tutar: Number(s.tutar),
        kdv: Number(s.kdv),
        toplam: Number(s.toplam),
        durum: s.durum,
        notlar: s.notlar || '',
        satirlar: s.satirlar || [],
      }));
      setSiparisler(donusturulmus);
      satisSimarisleri.splice(0, satisSimarisleri.length, ...donusturulmus);
    }
    setYukleniyor(false);
  };

  const satirEkle = () => setSatirlar([...satirlar, { kod: '', urun: '', miktar: 1, sevkMiktar: 0, fiyat: '', kdv: 20 }]);
  const satirSil = (i) => setSatirlar(satirlar.filter((_, idx) => idx !== i));
  const satirGuncelle = (i, alan, deger) => {
    const yeni = [...satirlar];
    yeni[i][alan] = deger;
    setSatirlar(yeni);
  };
  const urunSec = (i, urun) => {
    const yeni = [...satirlar];
    yeni[i] = { ...yeni[i], kod: urun.kod, urun: urun.ad, fiyat: urun.satisFiyat || urun.fiyat || '', kdv: urun.kdv };
    setSatirlar(yeni);
  };

  const toplamHesapla = () => {
    const tutar = satirlar.reduce((t, s) => t + (Number(s.fiyat) * Number(s.miktar)), 0);
    const kdv = satirlar.reduce((t, s) => t + (Number(s.fiyat) * Number(s.miktar) * Number(s.kdv) / 100), 0);
    return { tutar, kdv, toplam: tutar + kdv };
  };

  const siparisKaydet = async () => {
    if (!yeniSiparis.cari) return alert('Lütfen cari seçiniz!');
    if (satirlar.every(s => !s.urun)) return alert('En az bir ürün giriniz!');
    const { tutar, kdv, toplam } = toplamHesapla();

    // Sipariş no oluştur
    const { count } = await supabase.from('siparisler').select('*', { count: 'exact', head: true });
    const no = `SIP-2026-${String((count || 0) + 1).padStart(3, '0')}`;

    const { error } = await supabase.from('siparisler').insert({
      no,
      tarih: yeniSiparis.tarih || new Date().toISOString().split('T')[0],
      cari: yeniSiparis.cari,
      tutar, kdv, toplam,
      durum: 'Beklemede',
      notlar: yeniSiparis.notlar || '',
      satirlar: satirlar.map(s => ({ ...s, sevkMiktar: 0 })),
    });

    if (error) return alert('Kayıt hatası: ' + error.message);

    await siparisleriYukle();
    setYeniSiparis({ cari: '', tarih: '', notlar: '' });
    setSatirlar([{ kod: '', urun: '', miktar: 1, sevkMiktar: 0, fiyat: '', kdv: 20 }]);
    setFormAcik(false);
  };

  const durumDegistir = async (id, durum) => {
    await supabase.from('siparisler').update({ durum }).eq('id', id);
    await siparisleriYukle();
  };

  const filtrelenmis = siparisler.filter(s => {
    const aramaUygun = s.cari.toLowerCase().includes(arama.toLowerCase()) || s.no.toLowerCase().includes(arama.toLowerCase());
    const durumUygun = durumFiltre === '' || s.durum === durumFiltre;
    return aramaUygun && durumUygun;
  });

  const { tutar, kdv, toplam } = toplamHesapla();

  return (
    <div>
      {seciliCari && formAcik && (
        <div style={{ background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', fontSize: '13px', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '8px' }}>
          👥 <strong>{seciliCari.unvan}</strong> için yeni sipariş oluşturuluyor
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input placeholder="🔍 Sipariş veya cari ara..." value={arama} onChange={e => setArama(e.target.value)} style={{ ...inputStil, width: '280px' }} />
          <select value={durumFiltre} onChange={e => setDurumFiltre(e.target.value)} style={{ ...inputStil, width: '160px' }}>
            <option value="">Tüm Durumlar</option>
            <option>Beklemede</option>
            <option>Onaylandı</option>
            <option>Kısmi Sevk</option>
            <option>Teslim Edildi</option>
            <option>İptal</option>
          </select>
        </div>
        <button onClick={() => { setYeniSiparis({ cari: '', tarih: '', notlar: '' }); setFormAcik(!formAcik); }}
          style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
          + Yeni Sipariş
        </button>
      </div>

      {formAcik && (
        <div style={kartStil}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>📋 Yeni Sipariş Oluştur</h3>

          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>SİPARİŞ BİLGİLERİ</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStil}>Cari *</label>
                <AramaliSecim
                  deger={yeniSiparis.cari}
                  onChange={item => setYeniSiparis({ ...yeniSiparis, cari: item.unvan })}
                  liste={cariListesi}
                  placeholder="Cari ara veya seç..."
                  alanlar={['unvan', 'vergiNo']}
                />
              </div>
              <div>
                <label style={labelStil}>Sipariş Tarihi</label>
                <input type="date" value={yeniSiparis.tarih} onChange={e => setYeniSiparis({ ...yeniSiparis, tarih: e.target.value })} style={inputStil} />
              </div>
              <div>
                <label style={labelStil}>Notlar</label>
                <input placeholder="Sipariş notu..." value={yeniSiparis.notlar} onChange={e => setYeniSiparis({ ...yeniSiparis, notlar: e.target.value })} style={inputStil} />
              </div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>ÜRÜN / HİZMET SATIRLARI</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '8px', textAlign: 'left', color: '#64748b', fontSize: '12px', width: '12%' }}>Ürün Kodu</th>
                  <th style={{ padding: '8px', textAlign: 'left', color: '#64748b', fontSize: '12px', width: '28%' }}>Ürün / Hizmet</th>
                  <th style={{ padding: '8px', textAlign: 'left', color: '#64748b', fontSize: '12px', width: '10%' }}>Miktar</th>
                  <th style={{ padding: '8px', textAlign: 'left', color: '#64748b', fontSize: '12px', width: '16%' }}>Birim Fiyat (₺)</th>
                  <th style={{ padding: '8px', textAlign: 'left', color: '#64748b', fontSize: '12px', width: '10%' }}>KDV %</th>
                  <th style={{ padding: '8px', textAlign: 'left', color: '#64748b', fontSize: '12px', width: '14%' }}>Tutar (₺)</th>
                  <th style={{ width: '10%' }}></th>
                </tr>
              </thead>
              <tbody>
                {satirlar.map((satir, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px' }}>
                      <input placeholder="Kod" value={satir.kod}
                        onChange={e => {
                          satirGuncelle(i, 'kod', e.target.value);
                          const b = urunListesi_global.find(u => u.kod.toLowerCase() === e.target.value.toLowerCase());
                          if (b) urunSec(i, b);
                        }} style={inputStil} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <AramaliSecim
                        deger={satir.urun}
                        onChange={item => urunSec(i, item)}
                        liste={urunListesi_global}
                        placeholder="Ürün ara veya seç..."
                        alanlar={['ad', 'kod']}
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input type="number" min="1" value={satir.miktar} onChange={e => satirGuncelle(i, 'miktar', e.target.value)} style={inputStil} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input type="number" placeholder="0.00" value={satir.fiyat} onChange={e => satirGuncelle(i, 'fiyat', e.target.value)} style={inputStil} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <select value={satir.kdv} onChange={e => satirGuncelle(i, 'kdv', e.target.value)} style={inputStil}>
                        {[0, 1, 10, 20].map(k => <option key={k} value={k}>%{k}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '8px', fontWeight: '600', color: '#22c55e' }}>
                      ₺{(Number(satir.fiyat) * Number(satir.miktar)).toLocaleString()}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {satirlar.length > 1 && (
                        <button onClick={() => satirSil(i)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}>✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={satirEkle} style={{ marginTop: '12px', background: 'white', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', color: '#64748b' }}>
              + Satır Ekle
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', minWidth: '260px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                <span>Ara Toplam</span><span>₺{tutar.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                <span>KDV Tutarı</span><span>₺{kdv.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', color: '#1e293b', borderTop: '2px solid #e2e8f0', paddingTop: '12px' }}>
                <span>Genel Toplam</span><span style={{ color: '#22c55e' }}>₺{toplam.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <button onClick={siparisKaydet} style={{ padding: '10px 28px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>✓ Kaydet</button>
            <button onClick={() => setFormAcik(false)} style={{ padding: '10px 28px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>İptal</button>
          </div>
        </div>
      )}

      {yukleniyor ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
          <p style={{ fontSize: '32px', margin: '0 0 12px' }}>⏳</p>
          <p>Siparişler yükleniyor...</p>
        </div>
      ) : (
        <div style={kartStil}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                {['Sipariş No', 'Tarih', 'Cari', 'Toplam', 'Sevk Durumu', 'Durum', 'İşlem'].map(b => (
                  <th key={b} style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>{b}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrelenmis.map(s => {
                const toplamMiktar = s.satirlar?.reduce((t, sat) => t + Number(sat.miktar), 0) || 0;
                const sevkMiktar = s.satirlar?.reduce((t, sat) => t + Number(sat.sevkMiktar || 0), 0) || 0;
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: '500', color: '#3b82f6' }}>{s.no}</td>
                    <td style={{ padding: '12px', color: '#64748b' }}>{s.tarih}</td>
                    <td style={{ padding: '12px' }}>{s.cari}</td>
                    <td style={{ padding: '12px', fontWeight: '600' }}>₺{s.toplam.toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{sevkMiktar}/{toplamMiktar} kalem</div>
                      <div style={{ background: '#f1f5f9', borderRadius: '4px', height: '6px', marginTop: '4px', overflow: 'hidden' }}>
                        <div style={{ width: toplamMiktar > 0 ? `${Math.min((sevkMiktar / toplamMiktar) * 100, 100)}%` : '0%', background: '#22c55e', height: '100%', borderRadius: '4px' }} />
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
                        <option>Onaylandı</option>
                        <option>Kısmi Sevk</option>
                        <option>Teslim Edildi</option>
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
      )}
    </div>
  );
}

export default Siparisler;