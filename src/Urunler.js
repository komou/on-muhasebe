import { useState, useEffect } from 'react';
import {
  kdvKodlari, birimler, malzemeTurleri,
  malzemeKategorileri, tedarikSekilleri, depolar
} from './TemelVeriler';
import { supabase } from './supabase';

const kartStil = { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '16px' };
const inputStil = { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', width: '100%', boxSizing: 'border-box' };
const labelStil = { fontSize: '12px', color: '#64748b', marginBottom: '4px', display: 'block', fontWeight: '600' };

export let urunListesi_global = [];

const bos = { kod: '', ad: '', tur: 'TICARI', kategori: '', birim: 'ADET', kdv: 20, alisFiyat: '', satisFiyat: '', stok: 0, minStok: 5, maxStok: 100, tedarik: 'SATIN', depo: 'MERKEZ', barkod: '', marka: '', aciklama: '' };

function dbdenUrun(r) {
  return {
    id: r.id,
    kod: r.kod,
    ad: r.ad,
    tur: r.tur || 'TICARI',
    kategori: r.kategori || '',
    birim: r.birim || 'ADET',
    kdv: Number(r.kdv || 20),
    alisFiyat: Number(r.alis_fiyat || 0),
    satisFiyat: Number(r.satis_fiyat || 0),
    stok: Number(r.stok || 0),
    minStok: Number(r.min_stok || 5),
    maxStok: Number(r.max_stok || 100),
    tedarik: r.tedarik || 'SATIN',
    depo: r.depo || '',
    barkod: r.barkod || '',
    marka: r.marka || '',
    aciklama: r.aciklama || '',
  };
}

function urundenDB(u) {
  return {
    kod: u.kod,
    ad: u.ad,
    tur: u.tur,
    kategori: u.kategori || null,
    birim: u.birim,
    kdv: Number(u.kdv),
    alis_fiyat: Number(u.alisFiyat) || 0,
    satis_fiyat: Number(u.satisFiyat) || 0,
    stok: Number(u.stok) || 0,
    min_stok: Number(u.minStok) || 5,
    max_stok: Number(u.maxStok) || 100,
    tedarik: u.tedarik,
    depo: u.depo || null,
    barkod: u.barkod || null,
    marka: u.marka || null,
    aciklama: u.aciklama || null,
  };
}

function Urunler() {
  const [urunler, setUrunler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [arama, setArama] = useState('');
  const [turFiltre, setTurFiltre] = useState('');
  const [formAcik, setFormAcik] = useState(false);
  const [duzenleId, setDuzenleId] = useState(null);
  const [yeniUrun, setYeniUrun] = useState(bos);
  const [aktifSekme, setAktifSekme] = useState(0);

  useEffect(() => {
    urunleriYukle();
  }, []);

  const urunleriYukle = async () => {
    setYukleniyor(true);
    const { data, error } = await supabase.from('urunler').select('*').order('ad');
    if (error) {
      console.error('Ürün yükleme hatası:', error);
    } else {
      const donusturulmus = data.map(dbdenUrun);
      setUrunler(donusturulmus);
      urunListesi_global.splice(0, urunListesi_global.length, ...donusturulmus);
    }
    setYukleniyor(false);
  };

  const kaydet = async () => {
    if (!yeniUrun.ad) return alert('Ürün adı zorunludur!');
    if (!yeniUrun.kod) return alert('Ürün kodu zorunludur!');
    const dbVerisi = urundenDB(yeniUrun);

    if (duzenleId) {
      const { error } = await supabase.from('urunler').update(dbVerisi).eq('id', duzenleId);
      if (error) return alert('Güncelleme hatası: ' + error.message);
    } else {
      const { error } = await supabase.from('urunler').insert(dbVerisi);
      if (error) return alert('Kayıt hatası: ' + error.message);
    }

    await urunleriYukle();
    setYeniUrun(bos);
    setFormAcik(false);
    setDuzenleId(null);
    setAktifSekme(0);
  };

  const duzenleAc = (urun) => {
    setYeniUrun({ ...urun });
    setDuzenleId(urun.id);
    setFormAcik(true);
    setAktifSekme(0);
  };

  const sil = async (id) => {
    if (!window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    const { error } = await supabase.from('urunler').delete().eq('id', id);
    if (error) return alert('Silme hatası: ' + error.message);
    await urunleriYukle();
  };

  // Stok güncelleme fonksiyonu — veriAkisi.js'den çağrılır
  const stokGuncelle = async (urunKod, yeniStok) => {
    await supabase.from('urunler').update({ stok: yeniStok }).eq('kod', urunKod);
  };
  // Global olarak erişilebilir yap
  window._stokGuncelle = stokGuncelle;

  const filtrelenmis = urunler.filter(u => {
    const aramaUygun = u.ad.toLowerCase().includes(arama.toLowerCase()) || u.kod.toLowerCase().includes(arama.toLowerCase());
    const turUygun = turFiltre === '' || u.tur === turFiltre;
    return aramaUygun && turUygun;
  });

  const kategoriFiltrelenmis = yeniUrun.tur
    ? malzemeKategorileri.filter(k => k.tur === yeniUrun.tur)
    : malzemeKategorileri;

  const sekmeler = ['Genel Bilgiler', 'Fiyat ve Stok', 'Ek Bilgiler'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
          <input placeholder="🔍 Ürün adı veya kodu ara..." value={arama} onChange={e => setArama(e.target.value)} style={{ ...inputStil, width: '280px' }} />
          <select value={turFiltre} onChange={e => setTurFiltre(e.target.value)} style={{ ...inputStil, width: '180px' }}>
            <option value="">Tüm Türler</option>
            {malzemeTurleri.map(t => <option key={t.kod} value={t.kod}>{t.ad}</option>)}
          </select>
        </div>
        <button onClick={() => { setYeniUrun(bos); setDuzenleId(null); setFormAcik(!formAcik); setAktifSekme(0); }}
          style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap' }}>
          + Yeni Ürün / Hizmet
        </button>
      </div>

      {formAcik && (
        <div style={kartStil}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>{duzenleId ? '✏️ Ürün Düzenle' : '➕ Yeni Ürün / Hizmet'}</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={kaydet} style={{ padding: '8px 20px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>✓ Kaydet</button>
              <button onClick={() => { setFormAcik(false); setDuzenleId(null); }} style={{ padding: '8px 20px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>İptal</button>
            </div>
          </div>

          <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '20px', gap: '4px' }}>
            {sekmeler.map((s, i) => (
              <div key={i} onClick={() => setAktifSekme(i)} style={{
                padding: '10px 18px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                borderRadius: '8px 8px 0 0', marginBottom: '-2px',
                background: aktifSekme === i ? '#0f172a' : 'transparent',
                color: aktifSekme === i ? 'white' : '#64748b',
                borderBottom: aktifSekme === i ? '2px solid #0f172a' : 'none',
              }}>{s}</div>
            ))}
          </div>

          {aktifSekme === 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStil}>Ürün Kodu *</label>
                <input placeholder="URN001" value={yeniUrun.kod} onChange={e => setYeniUrun({ ...yeniUrun, kod: e.target.value })} style={inputStil} />
              </div>
              <div style={{ gridColumn: '2 / -1' }}>
                <label style={labelStil}>Ürün / Hizmet Adı *</label>
                <input placeholder="Ürün adı" value={yeniUrun.ad} onChange={e => setYeniUrun({ ...yeniUrun, ad: e.target.value })} style={inputStil} />
              </div>
              <div>
                <label style={labelStil}>Malzeme Türü</label>
                <select value={yeniUrun.tur} onChange={e => setYeniUrun({ ...yeniUrun, tur: e.target.value, kategori: '' })} style={inputStil}>
                  {malzemeTurleri.map(t => <option key={t.kod} value={t.kod}>{t.ad}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStil}>Kategori</label>
                <select value={yeniUrun.kategori} onChange={e => setYeniUrun({ ...yeniUrun, kategori: e.target.value })} style={inputStil}>
                  <option value="">-- Seçiniz --</option>
                  {kategoriFiltrelenmis.map(k => <option key={k.kod} value={k.kod}>{k.ad}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStil}>Birim</label>
                <select value={yeniUrun.birim} onChange={e => setYeniUrun({ ...yeniUrun, birim: e.target.value })} style={inputStil}>
                  {birimler.map(b => <option key={b.kod} value={b.kod}>{b.ad}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStil}>KDV Oranı</label>
                <select value={yeniUrun.kdv} onChange={e => setYeniUrun({ ...yeniUrun, kdv: Number(e.target.value) })} style={inputStil}>
                  {kdvKodlari.map(k => <option key={k.kod} value={k.oran}>{k.aciklama}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStil}>Tedarik Şekli</label>
                <select value={yeniUrun.tedarik} onChange={e => setYeniUrun({ ...yeniUrun, tedarik: e.target.value })} style={inputStil}>
                  {tedarikSekilleri.map(t => <option key={t.kod} value={t.kod}>{t.ad}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStil}>Varsayılan Depo</label>
                <select value={yeniUrun.depo} onChange={e => setYeniUrun({ ...yeniUrun, depo: e.target.value })} style={inputStil}>
                  <option value="">-- Seçiniz --</option>
                  {depolar.map(d => <option key={d.kod} value={d.kod}>{d.ad}</option>)}
                </select>
              </div>
            </div>
          )}

          {aktifSekme === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStil}>Alış Fiyatı (₺)</label>
                <input type="number" placeholder="0.00" value={yeniUrun.alisFiyat} onChange={e => setYeniUrun({ ...yeniUrun, alisFiyat: e.target.value })} style={inputStil} />
              </div>
              <div>
                <label style={labelStil}>Satış Fiyatı (₺)</label>
                <input type="number" placeholder="0.00" value={yeniUrun.satisFiyat} onChange={e => setYeniUrun({ ...yeniUrun, satisFiyat: e.target.value })} style={inputStil} />
              </div>
              <div>
                <label style={labelStil}>Kar Marjı</label>
                <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', fontWeight: '600', color: '#22c55e' }}>
                  {yeniUrun.alisFiyat && yeniUrun.satisFiyat
                    ? `% ${(((Number(yeniUrun.satisFiyat) - Number(yeniUrun.alisFiyat)) / Number(yeniUrun.alisFiyat)) * 100).toFixed(1)}`
                    : '—'}
                </div>
              </div>
              <div>
                <label style={labelStil}>Mevcut Stok</label>
                <input type="number" placeholder="0" value={yeniUrun.stok} onChange={e => setYeniUrun({ ...yeniUrun, stok: e.target.value })} style={inputStil} />
              </div>
              <div>
                <label style={labelStil}>Minimum Stok Uyarısı</label>
                <input type="number" placeholder="5" value={yeniUrun.minStok} onChange={e => setYeniUrun({ ...yeniUrun, minStok: e.target.value })} style={inputStil} />
              </div>
              <div>
                <label style={labelStil}>Maximum Stok</label>
                <input type="number" placeholder="100" value={yeniUrun.maxStok} onChange={e => setYeniUrun({ ...yeniUrun, maxStok: e.target.value })} style={inputStil} />
              </div>
            </div>
          )}

          {aktifSekme === 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStil}>Barkod</label>
                <input placeholder="Barkod numarası" value={yeniUrun.barkod} onChange={e => setYeniUrun({ ...yeniUrun, barkod: e.target.value })} style={inputStil} />
              </div>
              <div>
                <label style={labelStil}>Marka</label>
                <input placeholder="Marka adı" value={yeniUrun.marka} onChange={e => setYeniUrun({ ...yeniUrun, marka: e.target.value })} style={inputStil} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStil}>Açıklama</label>
                <textarea placeholder="Ürün açıklaması..." value={yeniUrun.aciklama} onChange={e => setYeniUrun({ ...yeniUrun, aciklama: e.target.value })} style={{ ...inputStil, height: '80px', resize: 'vertical' }} />
              </div>
            </div>
          )}
        </div>
      )}

      {yukleniyor ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
          <p style={{ fontSize: '32px', margin: '0 0 12px' }}>⏳</p>
          <p>Ürünler yükleniyor...</p>
        </div>
      ) : (
        <div style={kartStil}>
          <div style={{ marginBottom: '12px', fontSize: '13px', color: '#64748b' }}>
            Toplam {filtrelenmis.length} ürün / hizmet
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                {['Kod', 'Ürün Adı', 'Tür', 'Birim', 'KDV', 'Tedarik', 'Alış', 'Satış', 'Stok', 'İşlem'].map(b => (
                  <th key={b} style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>{b}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrelenmis.map(u => {
                const tur = malzemeTurleri.find(t => t.kod === u.tur);
                const birim = birimler.find(b => b.kod === u.birim);
                const tedarik = tedarikSekilleri.find(t => t.kod === u.tedarik);
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>{u.kod}</td>
                    <td style={{ padding: '12px', fontWeight: '500' }}>{u.ad}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '11px', background: '#f1f5f9', color: '#475569' }}>{tur?.ad || u.tur}</span>
                    </td>
                    <td style={{ padding: '12px', color: '#64748b' }}>{birim?.kisaltma || u.birim}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '12px', background: '#f1f5f9', color: '#475569' }}>%{u.kdv}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '11px', background: u.tedarik === 'URETIM' ? '#fef9c3' : u.tedarik === 'HER_IKISI' ? '#ede9fe' : '#dcfce7', color: u.tedarik === 'URETIM' ? '#854d0e' : u.tedarik === 'HER_IKISI' ? '#6d28d9' : '#166534' }}>
                        {tedarik?.ad || u.tedarik}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#64748b' }}>₺{Number(u.alisFiyat).toLocaleString()}</td>
                    <td style={{ padding: '12px', fontWeight: '500', color: '#22c55e' }}>₺{Number(u.satisFiyat).toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '12px', background: u.stok > (u.minStok || 5) ? '#dcfce7' : u.stok > 0 ? '#fef9c3' : '#fee2e2', color: u.stok > (u.minStok || 5) ? '#166534' : u.stok > 0 ? '#854d0e' : '#991b1b' }}>
                        {u.stok} {birim?.kisaltma || u.birim}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => duzenleAc(u)} style={{ background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px' }}>Düzenle</button>
                        <button onClick={() => sil(u.id)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px' }}>Sil</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtrelenmis.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>Sonuç bulunamadı</p>}
        </div>
      )}
    </div>
  );
}

export default Urunler;