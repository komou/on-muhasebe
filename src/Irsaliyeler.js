import { useState, useEffect } from 'react';
import { cariListesi } from './CariHesaplar';
import { urunListesi_global } from './Urunler';
import { irsaliyedenStokDus } from './veriAkisi';
import { satisSimarisleri, siparisIrsaliyeGuncelle } from './Siparisler';
import { supabase } from './supabase';

const kartStil = { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '16px' };
const inputStil = { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', width: '100%', boxSizing: 'border-box' };
const labelStil = { fontSize: '12px', color: '#64748b', marginBottom: '4px', display: 'block', fontWeight: '600' };

const durumRenk = {
  'Beklemede': { bg: '#fef9c3', renk: '#854d0e' },
  'Teslim Edildi': { bg: '#dcfce7', renk: '#166534' },
  'Faturalandı': { bg: '#dbeafe', renk: '#1d4ed8' },
  'İptal': { bg: '#fee2e2', renk: '#991b1b' },
};

export let irsaliyeListesi = [];

export async function irsaliyeFaturalandir(irsaliyeNo) {
  const irs = irsaliyeListesi.find(i => i.no === irsaliyeNo);
  if (irs) irs.durum = 'Faturalandı';
  await supabase.from('irsaliyeler').update({ durum: 'Faturalandı' }).eq('no', irsaliyeNo);
}

function Irsaliyeler() {
  const [irsaliyeler, setIrsaliyeler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [arama, setArama] = useState('');
  const [durumFiltre, setDurumFiltre] = useState('');
  const [formAcik, setFormAcik] = useState(false);
  const [yeni, setYeni] = useState({ cari: '', tarih: '', adres: '', notlar: '' });
  const [seciliSiparisler, setSeciliSiparisler] = useState([]);
  const [siparisSatirlari, setSiparisSatirlari] = useState({});
  const [manuelSatirlar, setManuelSatirlar] = useState([]);

  useEffect(() => {
    irsaliyeleriYukle();
  }, []);

  const irsaliyeleriYukle = async () => {
    setYukleniyor(true);
    const { data, error } = await supabase
      .from('irsaliyeler')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('İrsaliye yükleme hatası:', error);
    } else {
      const donusturulmus = data.map(i => ({
        id: i.id,
        no: i.no,
        tarih: i.tarih,
        cari: i.cari,
        sipNo: i.sip_no || '',
        adres: i.adres || '',
        durum: i.durum,
        stokDusuldu: i.stok_dusuldu || false,
        satirlar: i.satirlar || [],
      }));
      setIrsaliyeler(donusturulmus);
      irsaliyeListesi.splice(0, irsaliyeListesi.length, ...donusturulmus);
    }
    setYukleniyor(false);
  };

  const cariSiparisleri = satisSimarisleri.filter(s =>
    s.cari === yeni.cari && !['Teslim Edildi', 'İptal'].includes(s.durum)
  );

  const cariSec = (unvan) => {
    setYeni({ ...yeni, cari: unvan });
    setSeciliSiparisler([]);
    setSiparisSatirlari({});
    setManuelSatirlar([]);
  };

  const siparisToggle = (siparisNo) => {
    const siparis = satisSimarisleri.find(s => s.no === siparisNo);
    if (!siparis) return;
    if (seciliSiparisler.includes(siparisNo)) {
      setSeciliSiparisler(seciliSiparisler.filter(s => s !== siparisNo));
      const guncellenmis = { ...siparisSatirlari };
      delete guncellenmis[siparisNo];
      setSiparisSatirlari(guncellenmis);
    } else {
      setSeciliSiparisler([...seciliSiparisler, siparisNo]);
      const satirlar = siparis.satirlar
        .filter(s => (s.sevkMiktar || 0) < s.miktar)
        .map((s, i) => ({
          ...s, secili: true,
          sevkEdilecekMiktar: s.miktar - (s.sevkMiktar || 0),
          maxMiktar: s.miktar - (s.sevkMiktar || 0),
          satirId: `${siparisNo}-${i}`,
        }));
      setSiparisSatirlari({ ...siparisSatirlari, [siparisNo]: satirlar });
    }
  };

  const satirSecimToggle = (siparisNo, satirId) => {
    setSiparisSatirlari(prev => ({
      ...prev,
      [siparisNo]: prev[siparisNo].map(s => s.satirId === satirId ? { ...s, secili: !s.secili } : s)
    }));
  };

  const sevkMiktarGuncelle = (siparisNo, satirId, miktar) => {
    setSiparisSatirlari(prev => ({
      ...prev,
      [siparisNo]: prev[siparisNo].map(s => s.satirId === satirId ? { ...s, sevkEdilecekMiktar: miktar } : s)
    }));
  };

  const manuelSatirEkle = () => setManuelSatirlar([...manuelSatirlar, { kod: '', urun: '', miktar: 1, birim: 'Adet' }]);
  const manuelSatirSil = (i) => setManuelSatirlar(manuelSatirlar.filter((_, idx) => idx !== i));
  const manuelSatirGuncelle = (i, alan, deger) => {
    const y = [...manuelSatirlar];
    y[i][alan] = deger;
    if (alan === 'urun') {
      const b = urunListesi_global.find(u => u.ad === deger);
      if (b) { y[i].kod = b.kod; y[i].birim = b.birim || 'Adet'; }
    }
    setManuelSatirlar(y);
  };

  const seciliSatirlarHesapla = () => {
    const siparisSat = Object.entries(siparisSatirlari).flatMap(([siparisNo, satirlar]) =>
      satirlar.filter(s => s.secili).map(s => ({
        kod: s.kod, urun: s.urun,
        miktar: Number(s.sevkEdilecekMiktar),
        birim: s.birim, kaynakSiparis: siparisNo,
      }))
    );
    const manuelSat = manuelSatirlar.filter(s => s.urun).map(s => ({ ...s, kaynakSiparis: 'Manuel' }));
    return [...siparisSat, ...manuelSat];
  };

  const kaydet = async () => {
    if (!yeni.cari) return alert('Cari seçiniz!');
    const satirlar = seciliSatirlarHesapla();
    if (satirlar.length === 0) return alert('En az bir ürün satırı seçiniz!');

    const { count } = await supabase.from('irsaliyeler').select('*', { count: 'exact', head: true });
    const no = `IRS-2026-${String((count || 0) + 1).padStart(3, '0')}`;

    // Stok düş
    const sonuc = await irsaliyedenStokDus(satirlar, yeni.cari, no);
    if (sonuc.hatalar.length > 0) {
      const devamEt = window.confirm(`⚠️ Stok uyarısı:\n${sonuc.hatalar.join('\n')}\n\nYine de kaydetmek istiyor musunuz?`);
      if (!devamEt) return;
    }

    // Sipariş sevk miktarlarını güncelle
    for (const [siparisNo, satirlarArr] of Object.entries(siparisSatirlari)) {
      const sevkEdilenler = satirlarArr
        .filter(s => s.secili)
        .map(s => ({ urunKod: s.kod, miktar: Number(s.sevkEdilecekMiktar) }));
      if (sevkEdilenler.length > 0) await siparisIrsaliyeGuncelle(siparisNo, sevkEdilenler);
    }

    // Supabase'e kaydet
    const { error } = await supabase.from('irsaliyeler').insert({
      no,
      tarih: yeni.tarih || new Date().toISOString().split('T')[0],
      cari: yeni.cari,
      sip_no: seciliSiparisler.join(', '),
      adres: yeni.adres || '',
      durum: 'Beklemede',
      stok_dusuldu: true,
      satirlar,
    });

    if (error) return alert('Kayıt hatası: ' + error.message);

    await irsaliyeleriYukle();
    setYeni({ cari: '', tarih: '', adres: '', notlar: '' });
    setSeciliSiparisler([]);
    setSiparisSatirlari({});
    setManuelSatirlar([]);
    setFormAcik(false);

    if (sonuc.basarililar.length > 0) {
      alert(`✅ İrsaliye kaydedildi!\n${sonuc.basarililar.join('\n')}`);
    }
  };

  const durumGuncelle = async (id, durum) => {
    await supabase.from('irsaliyeler').update({ durum }).eq('id', id);
    await irsaliyeleriYukle();
  };

  const filtrelenmis = irsaliyeler.filter(s => {
    const aramaUygun = s.cari.toLowerCase().includes(arama.toLowerCase()) || s.no.toLowerCase().includes(arama.toLowerCase());
    const durumUygun = durumFiltre === '' || s.durum === durumFiltre;
    return aramaUygun && durumUygun;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input placeholder="🔍 İrsaliye veya cari ara..." value={arama} onChange={e => setArama(e.target.value)} style={{ ...inputStil, width: '280px' }} />
          <select value={durumFiltre} onChange={e => setDurumFiltre(e.target.value)} style={{ ...inputStil, width: '160px' }}>
            <option value="">Tüm Durumlar</option>
            <option>Beklemede</option>
            <option>Teslim Edildi</option>
            <option>Faturalandı</option>
            <option>İptal</option>
          </select>
        </div>
        <button onClick={() => setFormAcik(!formAcik)}
          style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
          + Yeni İrsaliye
        </button>
      </div>

      {formAcik && (
        <div style={kartStil}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>🚚 Yeni Satış İrsaliyesi</h3>

          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>İRSALİYE BİLGİLERİ</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStil}>Cari *</label>
                <select value={yeni.cari} onChange={e => cariSec(e.target.value)} style={inputStil}>
                  <option value="">-- Seçiniz --</option>
                  {cariListesi.map(c => <option key={c.id}>{c.unvan}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStil}>Tarih</label>
                <input type="date" value={yeni.tarih} onChange={e => setYeni({ ...yeni, tarih: e.target.value })} style={inputStil} />
              </div>
              <div>
                <label style={labelStil}>Teslimat Adresi</label>
                <input placeholder="Adres..." value={yeni.adres} onChange={e => setYeni({ ...yeni, adres: e.target.value })} style={inputStil} />
              </div>
            </div>
          </div>

          {yeni.cari && (
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                SİPARİŞ SEÇİMİ
                <span style={{ fontSize: '11px', fontWeight: '400', color: '#94a3b8', marginLeft: '8px' }}>Birden fazla seçebilirsiniz</span>
              </p>
              {cariSiparisleri.length === 0
                ? <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Bu cariye ait açık sipariş bulunamadı</p>
                : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {cariSiparisleri.map(s => (
                      <div key={s.no} onClick={() => siparisToggle(s.no)} style={{
                        padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
                        border: `2px solid ${seciliSiparisler.includes(s.no) ? '#22c55e' : '#e2e8f0'}`,
                        background: seciliSiparisler.includes(s.no) ? '#dcfce7' : 'white',
                        color: seciliSiparisler.includes(s.no) ? '#166534' : '#475569',
                      }}>
                        <div style={{ fontWeight: '600' }}>{s.no}</div>
                        <div style={{ fontSize: '11px', marginTop: '2px', color: '#94a3b8' }}>
                          {s.tarih} · {s.satirlar?.length || 0} kalem · ₺{s.toplam?.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '11px', marginTop: '2px' }}>
                          <span style={{ padding: '1px 6px', borderRadius: '10px', background: durumRenk[s.durum]?.bg, color: durumRenk[s.durum]?.renk }}>{s.durum}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          )}

          {seciliSiparisler.map(siparisNo => (
            <div key={siparisNo} style={{ background: '#f0fdf4', borderRadius: '8px', padding: '16px', marginBottom: '16px', border: '1px solid #bbf7d0' }}>
              <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#166534' }}>
                {siparisNo} — Sevk Edilecek Satırları Seçin
                <span style={{ fontSize: '11px', fontWeight: '400', color: '#94a3b8', marginLeft: '8px' }}>Kısmi sevk için miktarı düzenleyebilirsiniz</span>
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '8px', width: '40px' }}></th>
                    {['Ürün Kodu', 'Ürün Adı', 'Sipariş Miktarı', 'Kalan', 'Sevk Miktarı', 'Birim', 'Mevcut Stok'].map(b => (
                      <th key={b} style={{ padding: '8px', textAlign: 'left', color: '#64748b', fontSize: '12px' }}>{b}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(siparisSatirlari[siparisNo] || []).map(satir => {
                    const urun = urunListesi_global.find(u => u.kod === satir.kod);
                    const stok = urun ? urun.stok : null;
                    const stokYetersiz = stok !== null && Number(satir.sevkEdilecekMiktar) > stok;
                    return (
                      <tr key={satir.satirId} style={{ borderBottom: '1px solid #e2e8f0', background: satir.secili ? '#f0fdf4' : 'white' }}>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <input type="checkbox" checked={satir.secili} onChange={() => satirSecimToggle(siparisNo, satir.satirId)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                        </td>
                        <td style={{ padding: '8px', color: '#64748b', fontSize: '12px' }}>{satir.kod}</td>
                        <td style={{ padding: '8px', fontWeight: satir.secili ? '500' : '400' }}>{satir.urun}</td>
                        <td style={{ padding: '8px', color: '#64748b' }}>{satir.miktar}</td>
                        <td style={{ padding: '8px', color: '#166534', fontWeight: '600' }}>{satir.maxMiktar}</td>
                        <td style={{ padding: '8px', width: '120px' }}>
                          <input type="number" min="1" max={satir.maxMiktar}
                            value={satir.sevkEdilecekMiktar}
                            disabled={!satir.secili}
                            onChange={e => sevkMiktarGuncelle(siparisNo, satir.satirId, e.target.value)}
                            style={{ ...inputStil, borderColor: stokYetersiz ? '#ef4444' : '#e2e8f0', background: satir.secili ? 'white' : '#f1f5f9' }}
                          />
                        </td>
                        <td style={{ padding: '8px', color: '#64748b' }}>{satir.birim}</td>
                        <td style={{ padding: '8px' }}>
                          {stok !== null ? (
                            <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', background: stokYetersiz ? '#fee2e2' : '#dcfce7', color: stokYetersiz ? '#991b1b' : '#166534' }}>
                              {stok} adet
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}

          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
              MANUEL SATIR
              <span style={{ fontSize: '11px', fontWeight: '400', color: '#94a3b8', marginLeft: '8px' }}>Siparişe bağlı olmayan sevkiyatlar için</span>
            </p>
            {manuelSatirlar.length === 0
              ? <button onClick={manuelSatirEkle} style={{ background: 'white', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', color: '#64748b' }}>+ Manuel Satır Ekle</button>
              : (
                <>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                        {['Ürün Kodu', 'Ürün / Hizmet', 'Miktar', 'Birim', ''].map(b => (
                          <th key={b} style={{ padding: '8px', textAlign: 'left', color: '#64748b', fontSize: '12px' }}>{b}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {manuelSatirlar.map((s, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '8px', width: '120px' }}>
                            <input placeholder="Kod" value={s.kod} onChange={e => manuelSatirGuncelle(i, 'kod', e.target.value)} style={inputStil} />
                          </td>
                          <td style={{ padding: '8px' }}>
                            <select value={s.urun} onChange={e => manuelSatirGuncelle(i, 'urun', e.target.value)} style={inputStil}>
                              <option value="">-- Seçiniz --</option>
                              {urunListesi_global.map(u => <option key={u.kod}>{u.ad}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: '8px', width: '100px' }}>
                            <input type="number" min="1" value={s.miktar} onChange={e => manuelSatirGuncelle(i, 'miktar', e.target.value)} style={inputStil} />
                          </td>
                          <td style={{ padding: '8px', width: '100px' }}>
                            <input value={s.birim} readOnly style={{ ...inputStil, background: '#f8fafc', color: '#64748b' }} />
                          </td>
                          <td style={{ padding: '8px' }}>
                            <button onClick={() => manuelSatirSil(i)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button onClick={manuelSatirEkle} style={{ marginTop: '12px', background: 'white', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', color: '#64748b' }}>+ Satır Ekle</button>
                </>
              )
            }
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
          <p>İrsaliyeler yükleniyor...</p>
        </div>
      ) : (
        <div style={kartStil}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                {['İrsaliye No', 'Tarih', 'Cari', 'Bağlı Sipariş', 'Ürün Sayısı', 'Adres', 'Stok', 'Durum'].map(b => (
                  <th key={b} style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>{b}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrelenmis.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: s.durum === 'İptal' ? 0.5 : 1 }}>
                  <td style={{ padding: '12px', fontWeight: '500', color: '#3b82f6' }}>{s.no}</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{s.tarih}</td>
                  <td style={{ padding: '12px' }}>{s.cari}</td>
                  <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>{s.sipNo || '—'}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', background: '#f1f5f9', color: '#475569' }}>
                      {s.satirlar?.length || 0} kalem
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>{s.adres || '—'}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '11px', background: s.stokDusuldu ? '#dcfce7' : '#fef9c3', color: s.stokDusuldu ? '#166534' : '#854d0e' }}>
                      {s.stokDusuldu ? '✓ Düşüldü' : 'Bekliyor'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {s.durum === 'Faturalandı'
                      ? <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', background: durumRenk['Faturalandı'].bg, color: durumRenk['Faturalandı'].renk }}>Faturalandı</span>
                      : (
                        <select value={s.durum} onChange={e => durumGuncelle(s.id, e.target.value)}
                          style={{ ...inputStil, fontSize: '12px', padding: '4px 8px', width: 'auto' }}>
                          <option>Beklemede</option>
                          <option>Teslim Edildi</option>
                          <option>İptal</option>
                        </select>
                      )
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtrelenmis.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>İrsaliye bulunamadı</p>}
        </div>
      )}
    </div>
  );
}

export default Irsaliyeler;