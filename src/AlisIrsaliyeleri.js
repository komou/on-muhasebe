import { useState, useEffect } from 'react';
import { cariListesi } from './CariHesaplar';
import { alimSiparisleri } from './AlimSiparisleri';
import { urunListesi_global } from './Urunler';
import { alisIrsaliyedenStokArt } from './veriAkisi';
import { supabase } from './supabase';

const kartStil = { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '16px' };
const inputStil = { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', width: '100%', boxSizing: 'border-box' };
const labelStil = { fontSize: '12px', color: '#64748b', marginBottom: '4px', display: 'block', fontWeight: '600' };

export let alisIrsaliyeListesi = [];

export async function alisIrsaliyeFaturalandir(irsaliyeNo) {
  const irs = alisIrsaliyeListesi.find(i => i.no === irsaliyeNo);
  if (irs) irs.durum = 'Faturalandı';
  await supabase.from('alis_irsaliyeleri').update({ durum: 'Faturalandı' }).eq('no', irsaliyeNo);
}

function AlisIrsaliyeleri() {
  const [irsaliyeler, setIrsaliyeler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [arama, setArama] = useState('');
  const [formAcik, setFormAcik] = useState(false);
  const [yeni, setYeni] = useState({ tedarikci: '', tarih: '', notlar: '' });
  const [seciliSiparisler, setSeciliSiparisler] = useState([]);
  const [siparisSatirlari, setSiparisSatirlari] = useState({});
  const [manuelSatirlar, setManuelSatirlar] = useState([]);

  useEffect(() => {
    irsaliyeleriYukle();
  }, []);

  const irsaliyeleriYukle = async () => {
    setYukleniyor(true);
    const { data, error } = await supabase
      .from('alis_irsaliyeleri')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Alış irsaliyesi yükleme hatası:', error);
    } else {
      const donusturulmus = data.map(i => ({
        id: i.id, no: i.no, tarih: i.tarih,
        tedarikci: i.tedarikci,
        siparisler: i.siparisler || [],
        durum: i.durum,
        stokArttirildi: i.stok_arttirildi || false,
        satirlar: i.satirlar || [],
      }));
      setIrsaliyeler(donusturulmus);
      alisIrsaliyeListesi.splice(0, alisIrsaliyeListesi.length, ...donusturulmus);
    }
    setYukleniyor(false);
  };

  const tedarikciListesi = cariListesi.filter(c => c.tip === 'Tedarikçi' || c.tip === 'Müşteri / Tedarikçi');
  const satinAlinanUrunler = urunListesi_global.filter(u => u.tedarik === 'SATIN' || u.tedarik === 'HER_IKISI');

  const tedarikciSiparisleri = alimSiparisleri.filter(s =>
    s.tedarikci === yeni.tedarikci && !['Karşılandı', 'İptal'].includes(s.durum)
  );

  const tedarikciSec = (unvan) => {
    setYeni({ ...yeni, tedarikci: unvan });
    setSeciliSiparisler([]);
    setSiparisSatirlari({});
    setManuelSatirlar([]);
  };

  const siparisToggle = (siparisNo) => {
    const siparis = alimSiparisleri.find(s => s.no === siparisNo);
    if (!siparis) return;
    if (seciliSiparisler.includes(siparisNo)) {
      setSeciliSiparisler(seciliSiparisler.filter(s => s !== siparisNo));
      const guncellenmis = { ...siparisSatirlari };
      delete guncellenmis[siparisNo];
      setSiparisSatirlari(guncellenmis);
    } else {
      setSeciliSiparisler([...seciliSiparisler, siparisNo]);
      const satirlar = siparis.satirlar.map((s, i) => ({
        ...s, secili: true, tesliMiktar: s.miktar,
        satirId: `${siparisNo}-${i}`
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

  const tesliMiktarGuncelle = (siparisNo, satirId, miktar) => {
    setSiparisSatirlari(prev => ({
      ...prev,
      [siparisNo]: prev[siparisNo].map(s => s.satirId === satirId ? { ...s, tesliMiktar: miktar } : s)
    }));
  };

  const manuelSatirEkle = () => setManuelSatirlar([...manuelSatirlar, { urunKod: '', urunAd: '', miktar: 1, birim: 'Adet' }]);
  const manuelSatirSil = (i) => setManuelSatirlar(manuelSatirlar.filter((_, idx) => idx !== i));
  const manuelSatirGuncelle = (i, alan, deger) => {
    const y = [...manuelSatirlar];
    y[i][alan] = deger;
    if (alan === 'urunAd') {
      const b = satinAlinanUrunler.find(u => u.ad === deger);
      if (b) { y[i].urunKod = b.kod; y[i].birim = b.birim || 'Adet'; }
    }
    setManuelSatirlar(y);
  };

  const seciliSatirlarHesapla = () => {
    const siparisSat = Object.entries(siparisSatirlari).flatMap(([siparisNo, satirlar]) =>
      satirlar.filter(s => s.secili).map(s => ({
        urunKod: s.urunKod, urun: s.urunAd, urunAd: s.urunAd,
        miktar: Number(s.tesliMiktar), birim: s.birim, kaynakSiparis: siparisNo,
      }))
    );
    const manuelSat = manuelSatirlar.filter(s => s.urunAd).map(s => ({
      urunKod: s.urunKod, urun: s.urunAd, urunAd: s.urunAd,
      miktar: Number(s.miktar), birim: s.birim, kaynakSiparis: 'Manuel'
    }));
    return [...siparisSat, ...manuelSat];
  };

  const kaydet = async () => {
    if (!yeni.tedarikci) return alert('Tedarikçi seçiniz!');
    const satirlar = seciliSatirlarHesapla();
    if (satirlar.length === 0) return alert('En az bir ürün satırı seçiniz!');

    const { count } = await supabase.from('alis_irsaliyeleri').select('*', { count: 'exact', head: true });
    const no = `AIRS-2026-${String((count || 0) + 1).padStart(3, '0')}`;

    // Stok artır
    const sonuc = await alisIrsaliyedenStokArt(satirlar, yeni.tedarikci, no);

    if (sonuc.hatalar.length > 0) {
      const devamEt = window.confirm(`⚠️ Bazı ürünlerde sorun var:\n${sonuc.hatalar.join('\n')}\n\nYine de kaydetmek istiyor musunuz?`);
      if (!devamEt) return;
    }

    const { error } = await supabase.from('alis_irsaliyeleri').insert({
      no,
      tarih: yeni.tarih || new Date().toISOString().split('T')[0],
      tedarikci: yeni.tedarikci,
      siparisler: seciliSiparisler,
      durum: 'Beklemede',
      stok_arttirildi: true,
      satirlar,
    });

    if (error) return alert('Kayıt hatası: ' + error.message);

    await irsaliyeleriYukle();
    setYeni({ tedarikci: '', tarih: '', notlar: '' });
    setSeciliSiparisler([]);
    setSiparisSatirlari({});
    setManuelSatirlar([]);
    setFormAcik(false);

    if (sonuc.basarililar.length > 0) {
      alert(`✅ Alış irsaliyesi kaydedildi!\n${sonuc.basarililar.join('\n')}`);
    }
  };

  const durumDegistir = async (id, durum) => {
    await supabase.from('alis_irsaliyeleri').update({ durum }).eq('id', id);
    await irsaliyeleriYukle();
  };

  const filtrelenmis = irsaliyeler.filter(i =>
    i.tedarikci.toLowerCase().includes(arama.toLowerCase()) ||
    i.no.toLowerCase().includes(arama.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <input placeholder="🔍 İrsaliye veya tedarikçi ara..." value={arama} onChange={e => setArama(e.target.value)} style={{ ...inputStil, width: '280px' }} />
        <button onClick={() => setFormAcik(!formAcik)} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
          + Yeni Alış İrsaliyesi
        </button>
      </div>

      {formAcik && (
        <div style={kartStil}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>📦 Yeni Alış İrsaliyesi</h3>

          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>İRSALİYE BİLGİLERİ</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStil}>Tedarikçi *</label>
                <select value={yeni.tedarikci} onChange={e => tedarikciSec(e.target.value)} style={inputStil}>
                  <option value="">-- Seçiniz --</option>
                  {tedarikciListesi.map(c => <option key={c.id}>{c.unvan}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStil}>Tarih</label>
                <input type="date" value={yeni.tarih} onChange={e => setYeni({ ...yeni, tarih: e.target.value })} style={inputStil} />
              </div>
              <div>
                <label style={labelStil}>Notlar</label>
                <input placeholder="Not..." value={yeni.notlar} onChange={e => setYeni({ ...yeni, notlar: e.target.value })} style={inputStil} />
              </div>
            </div>
          </div>

          {yeni.tedarikci && (
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                SİPARİŞ SEÇİMİ
                <span style={{ fontSize: '11px', fontWeight: '400', color: '#94a3b8', marginLeft: '8px' }}>Birden fazla seçebilirsiniz</span>
              </p>
              {tedarikciSiparisleri.length === 0
                ? <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Bu tedarikçiye ait açık sipariş bulunamadı</p>
                : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {tedarikciSiparisleri.map(s => (
                      <div key={s.no} onClick={() => siparisToggle(s.no)} style={{
                        padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
                        border: `2px solid ${seciliSiparisler.includes(s.no) ? '#3b82f6' : '#e2e8f0'}`,
                        background: seciliSiparisler.includes(s.no) ? '#dbeafe' : 'white',
                        color: seciliSiparisler.includes(s.no) ? '#1d4ed8' : '#475569',
                      }}>
                        <div style={{ fontWeight: '600' }}>{s.no}</div>
                        <div style={{ fontSize: '11px', marginTop: '2px', color: '#94a3b8' }}>
                          {s.tarih} · {s.satirlar?.length || 0} kalem · ₺{s.toplam?.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          )}

          {seciliSiparisler.map(siparisNo => (
            <div key={siparisNo} style={{ background: '#f0f9ff', borderRadius: '8px', padding: '16px', marginBottom: '16px', border: '1px solid #bae6fd' }}>
              <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#0369a1' }}>
                {siparisNo} — Teslim Alınacak Satırları Seçin
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '8px', width: '40px' }}></th>
                    {['Ürün Kodu', 'Ürün Adı', 'Sipariş Miktarı', 'Teslim Miktarı', 'Birim'].map(b => (
                      <th key={b} style={{ padding: '8px', textAlign: 'left', color: '#64748b', fontSize: '12px' }}>{b}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(siparisSatirlari[siparisNo] || []).map(satir => (
                    <tr key={satir.satirId} style={{ borderBottom: '1px solid #e2e8f0', background: satir.secili ? '#f0f9ff' : 'white' }}>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <input type="checkbox" checked={satir.secili} onChange={() => satirSecimToggle(siparisNo, satir.satirId)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                      </td>
                      <td style={{ padding: '8px', color: '#64748b', fontSize: '12px' }}>{satir.urunKod}</td>
                      <td style={{ padding: '8px' }}>{satir.urunAd}</td>
                      <td style={{ padding: '8px', color: '#64748b' }}>{satir.miktar} {satir.birim}</td>
                      <td style={{ padding: '8px', width: '130px' }}>
                        <input type="number" min="1" max={satir.miktar} value={satir.tesliMiktar} disabled={!satir.secili}
                          onChange={e => tesliMiktarGuncelle(siparisNo, satir.satirId, e.target.value)}
                          style={{ ...inputStil, background: satir.secili ? 'white' : '#f1f5f9' }} />
                      </td>
                      <td style={{ padding: '8px', color: '#64748b' }}>{satir.birim}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
              MANUEL SATIR
              <span style={{ fontSize: '11px', fontWeight: '400', color: '#94a3b8', marginLeft: '8px' }}>Siparişe bağlı olmayan ürünler için</span>
            </p>
            {manuelSatirlar.length === 0
              ? <button onClick={manuelSatirEkle} style={{ background: 'white', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', color: '#64748b' }}>+ Manuel Satır Ekle</button>
              : (
                <>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                        {['Ürün Kodu', 'Ürün Adı', 'Miktar', 'Birim', ''].map(b => (
                          <th key={b} style={{ padding: '8px', textAlign: 'left', color: '#64748b', fontSize: '12px' }}>{b}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {manuelSatirlar.map((s, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '8px', width: '120px' }}>
                            <input placeholder="Kod" value={s.urunKod} onChange={e => manuelSatirGuncelle(i, 'urunKod', e.target.value)} style={inputStil} />
                          </td>
                          <td style={{ padding: '8px' }}>
                            <select value={s.urunAd} onChange={e => manuelSatirGuncelle(i, 'urunAd', e.target.value)} style={inputStil}>
                              <option value="">-- Seçiniz --</option>
                              {satinAlinanUrunler.map(u => <option key={u.id}>{u.ad}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: '8px', width: '100px' }}>
                            <input type="number" min="1" value={s.miktar} onChange={e => manuelSatirGuncelle(i, 'miktar', e.target.value)} style={inputStil} />
                          </td>
                          <td style={{ padding: '8px', width: '120px' }}>
                            <select value={s.birim} onChange={e => manuelSatirGuncelle(i, 'birim', e.target.value)} style={inputStil}>
                              {['Adet', 'Kg', 'Lt', 'Metre', 'Saat', 'Paket'].map(b => <option key={b}>{b}</option>)}
                            </select>
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
          <p>Yükleniyor...</p>
        </div>
      ) : (
        <div style={kartStil}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                {['İrsaliye No', 'Tarih', 'Tedarikçi', 'Bağlı Siparişler', 'Ürün Sayısı', 'Stok', 'Durum'].map(b => (
                  <th key={b} style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>{b}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrelenmis.map(i => (
                <tr key={i.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: '500', color: '#3b82f6' }}>{i.no}</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{i.tarih}</td>
                  <td style={{ padding: '12px' }}>{i.tedarikci}</td>
                  <td style={{ padding: '12px' }}>
                    {i.siparisler?.length > 0
                      ? i.siparisler.map(s => <span key={s} style={{ fontSize: '11px', padding: '2px 6px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '20px', marginRight: '4px' }}>{s}</span>)
                      : <span style={{ color: '#94a3b8' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', background: '#f1f5f9', color: '#475569' }}>
                      {i.satirlar?.length || 0} kalem
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '11px', background: i.stokArttirildi ? '#dcfce7' : '#fef9c3', color: i.stokArttirildi ? '#166534' : '#854d0e' }}>
                      {i.stokArttirildi ? '✓ Artırıldı' : 'Bekliyor'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <select value={i.durum} onChange={e => durumDegistir(i.id, e.target.value)} style={{ ...inputStil, fontSize: '12px', padding: '4px 8px', width: 'auto' }}>
                      <option>Beklemede</option>
                      <option>Kısmi Teslim</option>
                      <option>Teslim Alındı</option>
                      <option>Faturalandı</option>
                      <option>İptal</option>
                    </select>
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

export default AlisIrsaliyeleri;