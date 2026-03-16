import { useState, useEffect } from 'react';
import { cariKategorileri, odemeKosullari, paraBirimleri, bankaTanimlari } from './TemelVeriler';
import { supabase } from './supabase';

const inputStil = { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', width: '100%', boxSizing: 'border-box' };
const labelStil = { fontSize: '12px', color: '#64748b', marginBottom: '4px', display: 'block', fontWeight: '600' };
const kartStil = { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '16px' };

export let cariListesi = [];

const bos = {
  unvan: '', tip: 'Müşteri', kategori: '', sehir: '', eFaturaMukellef: false,
  vergiDairesi: '', vergiNo: '', telefon: '', telefon2: '',
  email: '', yetkili: '', adres: '', sevkAdresi: '',
  paraBirimi: 'TRY', riskLimiti: '', vade: '30', iskonto: '',
  acilisBakiye: '0', sinif1: '', sinif2: '', kod: '', not: '',
  subeler: [], bakiye: 0, banka: '', iban: '', vergiden_muaf: false
};

const sekmeler = ['Kimlik Bilgileri', 'İletişim', 'Cari', 'Diğer', 'Şubeler'];

// DB'den gelen snake_case → camelCase
function dbdenCari(r) {
  return {
    id: r.id,
    unvan: r.unvan,
    tip: r.tip,
    kategori: r.kategori || '',
    sehir: r.sehir || '',
    eFaturaMukellef: r.e_fatura_mukellef || false,
    vergiDairesi: r.vergi_dairesi || '',
    vergiNo: r.vergi_no || '',
    telefon: r.telefon || '',
    telefon2: '',
    email: r.email || '',
    yetkili: r.yetkili || '',
    adres: r.adres || '',
    sevkAdresi: '',
    paraBirimi: r.para_birimi || 'TRY',
    riskLimiti: r.risk_limiti || '',
    vade: String(r.vade || 30),
    iskonto: r.iskonto || '',
    acilisBakiye: '0',
    sinif1: '', sinif2: '', kod: '', not: '',
    subeler: [], bakiye: Number(r.bakiye || 0),
    banka: '', iban: '', vergiden_muaf: false,
  };
}

// camelCase → DB snake_case
function caridenDB(c) {
  return {
    unvan: c.unvan,
    tip: c.tip,
    kategori: c.kategori || null,
    sehir: c.sehir || null,
    e_fatura_mukellef: c.eFaturaMukellef || false,
    vergi_dairesi: c.vergiDairesi || null,
    vergi_no: c.vergiNo || null,
    telefon: c.telefon || null,
    email: c.email || null,
    yetkili: c.yetkili || null,
    adres: c.adres || null,
    para_birimi: c.paraBirimi || 'TRY',
    risk_limiti: Number(c.riskLimiti) || 0,
    vade: Number(c.vade) || 30,
    iskonto: Number(c.iskonto) || 0,
    bakiye: Number(c.bakiye) || 0,
  };
}

function CariForm({ veri, onChange, onKaydet, onIptal }) {
  const [aktifSekme, setAktifSekme] = useState(0);
  const [yeniSube, setYeniSube] = useState('');

  const subeEkle = () => {
    if (!yeniSube) return;
    onChange({ ...veri, subeler: [...(veri.subeler || []), yeniSube] });
    setYeniSube('');
  };
  const subeSil = (i) => onChange({ ...veri, subeler: veri.subeler.filter((_, idx) => idx !== i) });

  return (
    <div style={kartStil}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>👥 {veri.id ? veri.unvan : 'Yeni Cari Ekle'}</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onKaydet} style={{ padding: '8px 20px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>✓ Kaydet</button>
          <button onClick={onIptal} style={{ padding: '8px 20px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>Geri Dön</button>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStil}>İsim / Ünvan *</label>
            <input placeholder="Firma veya kişi adı" value={veri.unvan} onChange={e => onChange({ ...veri, unvan: e.target.value })} style={inputStil} />
          </div>
          <div>
            <label style={labelStil}>Cari Tipi</label>
            <select value={veri.tip} onChange={e => onChange({ ...veri, tip: e.target.value })} style={inputStil}>
              <option>Müşteri</option>
              <option>Tedarikçi</option>
              <option>Müşteri / Tedarikçi</option>
            </select>
          </div>
          <div>
            <label style={labelStil}>Kategori</label>
            <select value={veri.kategori} onChange={e => onChange({ ...veri, kategori: e.target.value })} style={inputStil}>
              <option value="">-- Seçiniz --</option>
              {cariKategorileri.map(k => <option key={k.kod} value={k.kod}>{k.ad}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStil}>e-Dönüşüm Durumu</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <input type="checkbox" id="efatura" checked={veri.eFaturaMukellef} onChange={e => onChange({ ...veri, eFaturaMukellef: e.target.checked })} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
              <label htmlFor="efatura" style={{ fontSize: '13px', cursor: 'pointer', color: '#1e293b', flex: 1 }}>
                e-Fatura Mükellefi
                <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8' }}>İşaretli → e-Fatura | İşaretsiz → e-Arşiv</span>
              </label>
              <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: veri.eFaturaMukellef ? '#dcfce7' : '#f1f5f9', color: veri.eFaturaMukellef ? '#166534' : '#475569' }}>
                {veri.eFaturaMukellef ? 'e-Fatura' : 'e-Arşiv'}
              </span>
            </div>
          </div>
        </div>
      )}

      {aktifSekme === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStil}>E-Posta</label>
            <input placeholder="ornek@firma.com" value={veri.email} onChange={e => onChange({ ...veri, email: e.target.value })} style={inputStil} />
          </div>
          <div>
            <label style={labelStil}>Yetkili Kişi</label>
            <input placeholder="Yetkili adı soyadı" value={veri.yetkili} onChange={e => onChange({ ...veri, yetkili: e.target.value })} style={inputStil} />
          </div>
          <div>
            <label style={labelStil}>Cep Telefonu</label>
            <input placeholder="0532 000 00 00" value={veri.telefon} onChange={e => onChange({ ...veri, telefon: e.target.value })} style={inputStil} />
          </div>
          <div>
            <label style={labelStil}>Telefon 2</label>
            <input placeholder="0212 000 00 00" value={veri.telefon2} onChange={e => onChange({ ...veri, telefon2: e.target.value })} style={inputStil} />
          </div>
          <div>
            <label style={labelStil}>Şehir</label>
            <input placeholder="İstanbul" value={veri.sehir || ''} onChange={e => onChange({ ...veri, sehir: e.target.value })} style={inputStil} />
          </div>
          <div>
            <label style={labelStil}>Fatura Adresi</label>
            <textarea placeholder="Açık adres" value={veri.adres} onChange={e => onChange({ ...veri, adres: e.target.value })} style={{ ...inputStil, height: '80px', resize: 'vertical' }} />
          </div>
          <div>
            <label style={labelStil}>Sevk Adresi (Farklıysa)</label>
            <textarea placeholder="Sevk adresi" value={veri.sevkAdresi} onChange={e => onChange({ ...veri, sevkAdresi: e.target.value })} style={{ ...inputStil, height: '80px', resize: 'vertical' }} />
          </div>
        </div>
      )}

      {aktifSekme === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStil}>Vergi Dairesi</label>
            <input placeholder="Vergi dairesi adı" value={veri.vergiDairesi} onChange={e => onChange({ ...veri, vergiDairesi: e.target.value })} style={inputStil} />
          </div>
          <div>
            <label style={labelStil}>Vergi / TC Kimlik No</label>
            <input placeholder="Vergi veya TC numarası" value={veri.vergiNo} onChange={e => onChange({ ...veri, vergiNo: e.target.value })} style={inputStil} />
          </div>
          <div>
            <label style={labelStil}>Para Birimi</label>
            <select value={veri.paraBirimi} onChange={e => onChange({ ...veri, paraBirimi: e.target.value })} style={inputStil}>
              {paraBirimleri.map(p => <option key={p.kod} value={p.kod}>{p.sembol} {p.ad}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStil}>Ödeme Koşulu</label>
            <select value={veri.vade} onChange={e => onChange({ ...veri, vade: e.target.value })} style={inputStil}>
              {odemeKosullari.map(o => <option key={o.kod} value={o.gun}>{o.ad}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStil}>Risk Limiti (₺)</label>
            <input type="number" placeholder="0.00" value={veri.riskLimiti} onChange={e => onChange({ ...veri, riskLimiti: e.target.value })} style={inputStil} />
          </div>
          <div>
            <label style={labelStil}>Sabit İskonto (%)</label>
            <input type="number" placeholder="0" value={veri.iskonto} onChange={e => onChange({ ...veri, iskonto: e.target.value })} style={inputStil} />
          </div>
          <div>
            <label style={labelStil}>Banka</label>
            <select value={veri.banka || ''} onChange={e => onChange({ ...veri, banka: e.target.value })} style={inputStil}>
              <option value="">-- Seçiniz --</option>
              {bankaTanimlari.map(b => <option key={b.kod} value={b.kod}>{b.ad}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStil}>IBAN</label>
            <input placeholder="TR00 0000 0000 0000 0000 0000 00" value={veri.iban || ''} onChange={e => onChange({ ...veri, iban: e.target.value })} style={inputStil} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStil}>Açılış Bakiyesi (₺)</label>
            <input type="number" placeholder="0" value={veri.acilisBakiye} onChange={e => onChange({ ...veri, acilisBakiye: e.target.value })} style={inputStil} />
          </div>
        </div>
      )}

      {aktifSekme === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStil}>Sınıflandırma 1</label>
            <input placeholder="Örn: A Grubu, VIP" value={veri.sinif1} onChange={e => onChange({ ...veri, sinif1: e.target.value })} style={inputStil} />
          </div>
          <div>
            <label style={labelStil}>Sınıflandırma 2</label>
            <input placeholder="Örn: Bölge, Sektör" value={veri.sinif2} onChange={e => onChange({ ...veri, sinif2: e.target.value })} style={inputStil} />
          </div>
          <div>
            <label style={labelStil}>Muhasebe Kodu</label>
            <input placeholder="Muhasebe kodu" value={veri.kod} onChange={e => onChange({ ...veri, kod: e.target.value })} style={inputStil} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStil}>Not</label>
            <textarea placeholder="Bu cariye özel notlar..." value={veri.not} onChange={e => onChange({ ...veri, not: e.target.value })} style={{ ...inputStil, height: '100px', resize: 'vertical' }} />
          </div>
        </div>
      )}

      {aktifSekme === 4 && (
        <div>
          <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#854d0e' }}>
            Birden fazla şubesi olan müşteriler için her şube adresini ayrı ekleyebilirsiniz.
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input placeholder="Şube adı ve adresi..." value={yeniSube} onChange={e => setYeniSube(e.target.value)} style={inputStil} />
            <button onClick={subeEkle} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Ekle</button>
          </div>
          {(veri.subeler || []).length === 0
            ? <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Henüz şube eklenmedi</p>
            : (veri.subeler || []).map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', marginBottom: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '13px' }}>🏢 {s}</span>
                <button onClick={() => subeSil(i)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}>Sil</button>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

function CariDetay({ cari, onGeri, onDuzenle, onSatisYap, onKasaGit }) {
  const [aktifSekme, setAktifSekme] = useState('satislar');
  const initials = cari.unvan.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const kategori = cariKategorileri.find(k => k.kod === cari.kategori);
  const odemeKosulu = odemeKosullari.find(o => String(o.gun) === String(cari.vade));

  return (
    <div>
      <button onClick={onGeri} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', marginBottom: '20px', padding: '0', display: 'flex', alignItems: 'center', gap: '6px' }}>
        ← Cari Listesine Dön
      </button>

      <div style={{ ...kartStil, padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: '700', flexShrink: 0 }}>
              {initials}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>{cari.unvan}</h2>
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: cari.tip === 'Müşteri' ? '#dbeafe' : cari.tip === 'Tedarikçi' ? '#fef9c3' : '#ede9fe', color: cari.tip === 'Müşteri' ? '#1d4ed8' : cari.tip === 'Tedarikçi' ? '#854d0e' : '#6d28d9' }}>
                  {cari.tip}
                </span>
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', background: cari.eFaturaMukellef ? '#dcfce7' : '#f1f5f9', color: cari.eFaturaMukellef ? '#166534' : '#475569' }}>
                  {cari.eFaturaMukellef ? 'e-Fatura' : 'e-Arşiv'}
                </span>
                {kategori && <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', background: '#f1f5f9', color: '#475569' }}>{kategori.ad}</span>}
              </div>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '13px', color: '#64748b' }}>
                {cari.yetkili && <span>👤 {cari.yetkili}</span>}
                {cari.telefon && <span>📞 {cari.telefon}</span>}
                {cari.email && <span>✉️ {cari.email}</span>}
                {cari.sehir && <span>📍 {cari.sehir}</span>}
                {cari.vergiNo && <span>🏛️ {cari.vergiDairesi} / {cari.vergiNo}</span>}
              </div>
            </div>
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', minWidth: '180px' }}>
            <div><strong style={{ color: '#1e293b' }}>Vade:</strong> {odemeKosulu?.ad || `${cari.vade} gün`}</div>
            <div><strong style={{ color: '#1e293b' }}>Risk Limiti:</strong> {cari.riskLimiti ? `₺${Number(cari.riskLimiti).toLocaleString()}` : '—'}</div>
            <div><strong style={{ color: '#1e293b' }}>İskonto:</strong> {cari.iskonto ? `%${cari.iskonto}` : '—'}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { baslik: 'Açık Bakiye', tutar: cari.bakiye, renk: cari.bakiye >= 0 ? '#22c55e' : '#ef4444' },
          { baslik: 'Çek Bakiyesi', tutar: 0, renk: '#3b82f6' },
          { baslik: 'Senet Bakiyesi', tutar: 0, renk: '#06b6d4' },
          { baslik: 'Toplam Ciro', tutar: 0, renk: '#8b5cf6' },
        ].map((k, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: `4px solid ${k.renk}` }}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#64748b' }}>{k.baslik}</p>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: k.renk }}>₺{Number(k.tutar).toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => onSatisYap(cari)} style={{ padding: '9px 18px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>🛒 Satış Yap</button>
        <button onClick={() => onKasaGit(cari)} style={{ padding: '9px 18px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>💰 Tahsilat / Ödeme</button>
        <button onClick={onDuzenle} style={{ padding: '9px 18px', background: 'white', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>✏️ Düzenle</button>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'white', padding: '6px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', width: 'fit-content' }}>
        {[{ id: 'satislar', ad: 'Satışlar' }, { id: 'odemeler', ad: 'Ödemeler' }, { id: 'ekstre', ad: 'Ekstre' }].map(s => (
          <button key={s.id} onClick={() => setAktifSekme(s.id)} style={{
            padding: '7px 16px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px',
            background: aktifSekme === s.id ? '#1e293b' : 'transparent',
            color: aktifSekme === s.id ? 'white' : '#64748b',
            border: 'none', fontWeight: aktifSekme === s.id ? '600' : '400',
          }}>{s.ad}</button>
        ))}
      </div>

      <div style={kartStil}>
        <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
          {aktifSekme === 'satislar' && 'Satış kayıtları Supabase entegrasyonu tamamlandıkça burada görünecek.'}
          {aktifSekme === 'odemeler' && 'Ödeme kayıtları Supabase entegrasyonu tamamlandıkça burada görünecek.'}
          {aktifSekme === 'ekstre' && 'Ekstre Supabase entegrasyonu tamamlandıkça burada görünecek.'}
        </p>
      </div>
    </div>
  );
}

function CariHesaplar({ onMenuGit }) {
  const [cariler, setCariler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [arama, setArama] = useState('');
  const [tipFiltre, setTipFiltre] = useState('');
  const [aktifEkran, setAktifEkran] = useState('liste');
  const [seciliCari, setSeciliCari] = useState(null);
  const [duzenleId, setDuzenleId] = useState(null);
  const [yeniCari, setYeniCari] = useState(bos);

  // Supabase'den carileri yükle
  useEffect(() => {
    carileriYukle();
  }, []);

  const carileriYukle = async () => {
    setYukleniyor(true);
    const { data, error } = await supabase.from('cariler').select('*').order('unvan');
    if (error) {
      console.error('Cari yükleme hatası:', error);
    } else {
      const donusturulmus = data.map(dbdenCari);
      setCariler(donusturulmus);
      cariListesi.splice(0, cariListesi.length, ...donusturulmus);
    }
    setYukleniyor(false);
  };

  const kaydet = async () => {
    if (!yeniCari.unvan) return alert('Ünvan zorunludur!');
    const dbVerisi = caridenDB(yeniCari);

    if (duzenleId) {
      const { error } = await supabase.from('cariler').update(dbVerisi).eq('id', duzenleId);
      if (error) return alert('Güncelleme hatası: ' + error.message);
    } else {
      const { error } = await supabase.from('cariler').insert(dbVerisi);
      if (error) return alert('Kayıt hatası: ' + error.message);
    }

    await carileriYukle();
    setYeniCari(bos);
    setDuzenleId(null);
    setAktifEkran('liste');
  };

  const duzenleAc = (cari) => {
    setYeniCari({ ...cari });
    setDuzenleId(cari.id);
    setAktifEkran('form');
  };

  const sil = async (id) => {
    if (!window.confirm('Bu cariyi silmek istediğinize emin misiniz?')) return;
    const { error } = await supabase.from('cariler').delete().eq('id', id);
    if (error) return alert('Silme hatası: ' + error.message);
    await carileriYukle();
  };

  const filtrelenmis = cariler.filter(c => {
    const aramaUygun = c.unvan.toLowerCase().includes(arama.toLowerCase()) ||
      c.vergiNo?.includes(arama) ||
      c.sehir?.toLowerCase().includes(arama.toLowerCase());
    const tipUygun = tipFiltre === '' || c.tip === tipFiltre;
    return aramaUygun && tipUygun;
  });

  if (aktifEkran === 'detay' && seciliCari) {
    return (
      <CariDetay
        cari={seciliCari}
        onGeri={() => setAktifEkran('liste')}
        onDuzenle={() => duzenleAc(seciliCari)}
        onSatisYap={(cari) => onMenuGit && onMenuGit('siparisler', cari)}
        onKasaGit={(cari) => onMenuGit && onMenuGit('kasalar', cari)}
      />
    );
  }

  if (aktifEkran === 'form') {
    return (
      <CariForm
        veri={yeniCari}
        onChange={setYeniCari}
        onKaydet={kaydet}
        onIptal={() => { setAktifEkran(duzenleId ? 'detay' : 'liste'); setDuzenleId(null); }}
      />
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
          <input placeholder="🔍 Cari adı, şehir veya vergi no..." value={arama} onChange={e => setArama(e.target.value)} style={{ ...inputStil, width: '300px' }} />
          <select value={tipFiltre} onChange={e => setTipFiltre(e.target.value)} style={{ ...inputStil, width: '200px' }}>
            <option value="">Tüm Tipler</option>
            <option value="Müşteri">Müşteri</option>
            <option value="Tedarikçi">Tedarikçi</option>
            <option value="Müşteri / Tedarikçi">Müşteri / Tedarikçi</option>
          </select>
        </div>
        <button onClick={() => { setYeniCari(bos); setDuzenleId(null); setAktifEkran('form'); }}
          style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap' }}>
          + Yeni Cari
        </button>
      </div>

      {yukleniyor ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
          <p style={{ fontSize: '32px', margin: '0 0 12px' }}>⏳</p>
          <p>Cariler yükleniyor...</p>
        </div>
      ) : (
        <div style={kartStil}>
          <div style={{ marginBottom: '12px', fontSize: '13px', color: '#64748b' }}>Toplam {filtrelenmis.length} cari</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                {['Ünvan', 'Tip', 'Şehir', 'e-Dönüşüm', 'Telefon', 'Vade', 'Bakiye', 'İşlem'].map(b => (
                  <th key={b} style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>{b}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrelenmis.map(c => {
                const odemeKosulu = odemeKosullari.find(o => String(o.gun) === String(c.vade));
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                    onClick={() => { setSeciliCari(c); setAktifEkran('detay'); }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{c.unvan}</div>
                      {c.yetkili && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{c.yetkili}</div>}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '12px', background: c.tip === 'Müşteri' ? '#dbeafe' : c.tip === 'Tedarikçi' ? '#fef9c3' : '#ede9fe', color: c.tip === 'Müşteri' ? '#1d4ed8' : c.tip === 'Tedarikçi' ? '#854d0e' : '#6d28d9' }}>
                        {c.tip}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#64748b' }}>{c.sehir || '—'}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '12px', background: c.eFaturaMukellef ? '#dcfce7' : '#f1f5f9', color: c.eFaturaMukellef ? '#166534' : '#475569' }}>
                        {c.eFaturaMukellef ? 'e-Fatura' : 'e-Arşiv'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#64748b' }}>{c.telefon}</td>
                    <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>{odemeKosulu?.ad || `${c.vade} gün`}</td>
                    <td style={{ padding: '12px', fontWeight: '700', color: c.bakiye >= 0 ? '#22c55e' : '#ef4444' }}>₺{Number(c.bakiye).toLocaleString()}</td>
                    <td style={{ padding: '12px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => duzenleAc(c)} style={{ background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px' }}>Düzenle</button>
                        <button onClick={() => sil(c.id)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px' }}>Sil</button>
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

export default CariHesaplar;