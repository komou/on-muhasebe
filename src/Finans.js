import { useState, useEffect } from 'react';
import { bankaTanimlari, paraBirimleri } from './TemelVeriler';
import { cariListesi } from './CariHesaplar';
import { supabase } from './supabase';

const kartStil = { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '16px' };
const inputStil = { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', width: '100%', boxSizing: 'border-box' };
const labelStil = { fontSize: '12px', color: '#64748b', marginBottom: '4px', display: 'block', fontWeight: '600' };
const btnStil = (renk) => ({ padding: '8px 16px', background: renk, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' });

export let kasalar = [];
export let bankalar = [];
export let krediKartlari = [
  { id: 1, kod: 'KK001', ad: 'Ziraat İşletme Kartı', banka: 'ZIRAAT', limit: 50000, kullanilanLimit: 12500, ekstreGunu: 15, sonOdemeTarihi: '2026-04-15' },
  { id: 2, kod: 'KK002', ad: 'Garanti Business Kart', banka: 'GARANTI', limit: 75000, kullanilanLimit: 8200, ekstreGunu: 20, sonOdemeTarihi: '2026-04-20' },
];
export let poslar = [
  { id: 1, kod: 'POS001', ad: 'Merkez POS', banka: 'ZIRAAT', terminaNo: 'T123456', komisyonOrani: 1.5, bagliHesap: 'BNK001', bakiye: 0 },
];
export let cekSenetListesi = [
  { id: 1, evrakTip: 'Çek', tip: 'Alınan', no: 'CEK001', cari: 'ABC Ticaret Ltd.', tutar: 15000, paraBirimi: 'TRY', vadeTarihi: '2026-04-15', alindigiTarih: '2026-03-01', banka: 'ZIRAAT', aciklama: 'Alınan çek', durum: 'Portföyde' },
  { id: 2, evrakTip: 'Çek', tip: 'Verilen', no: 'CEK002', cari: 'XYZ Gıda A.Ş.', tutar: 8500, paraBirimi: 'TRY', vadeTarihi: '2026-04-30', alindigiTarih: '2026-03-05', banka: 'IS', aciklama: 'Verilen çek', durum: 'Verildi' },
  { id: 3, evrakTip: 'Senet', tip: 'Alınan', no: 'SNT001', cari: 'ABC Ticaret Ltd.', tutar: 20000, paraBirimi: 'TRY', vadeTarihi: '2026-05-01', alindigiTarih: '2026-03-10', banka: '', aciklama: 'Alınan senet', durum: 'Portföyde' },
];
export let kasaHareketleri = [];
export let bankaHareketleri = [];
export let kkHareketleri = [];
export let posHareketleri = [];

// ===================== HESAP DETAY =====================
function HesapDetay({ hesap, tip, hareketler, onGeri, onGiris, onCikis, onTransfer }) {
  const [arama, setArama] = useState('');
  const sembol = paraBirimleri.find(p => p.kod === hesap.paraBirimi)?.sembol || '₺';

  const filtreli = hareketler.filter(h => {
    const hesapId = tip === 'Kasa' ? h.kasaId || h.kasa_id : h.bankaId || h.banka_id;
    return hesapId === hesap.id && (
      h.aciklama?.toLowerCase().includes(arama.toLowerCase()) ||
      h.cari?.toLowerCase().includes(arama.toLowerCase()) ||
      h.islem?.toLowerCase().includes(arama.toLowerCase())
    );
  });

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', borderRadius: '12px', padding: '24px', marginBottom: '20px', color: 'white' }}>
        <button onClick={onGeri} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', marginBottom: '16px' }}>← Geri</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
            {tip === 'Kasa' ? '💵' : '🏦'}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>{hesap.ad}</h2>
            <p style={{ margin: '4px 0 0', fontSize: '14px', opacity: 0.7 }}>
              Bakiye: <strong style={{ fontSize: '18px' }}>{sembol}{Number(hesap.bakiye).toLocaleString()}</strong>
            </p>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button onClick={onGiris} style={btnStil('#22c55e')}>↓ Para Girişi</button>
        <button onClick={onCikis} style={btnStil('#ef4444')}>↑ Para Çıkışı</button>
        <button onClick={onTransfer} style={btnStil('#f59e0b')}>→ Transfer</button>
      </div>
      <div style={kartStil}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>HESAP HAREKETLERİ</h4>
          <input placeholder="Ara..." value={arama} onChange={e => setArama(e.target.value)} style={{ ...inputStil, width: '220px' }} />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {['Tarih', 'İşlem', 'Cari', 'Açıklama', 'Borç', 'Alacak', 'Bakiye'].map(b => (
                <th key={b} style={{ padding: '10px 12px', textAlign: ['Borç', 'Alacak', 'Bakiye'].includes(b) ? 'right' : 'left', color: '#64748b', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>{b}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtreli.length === 0
              ? <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Kayıt bulunamadı</td></tr>
              : filtreli.map(h => (
                <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>{h.tarih}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', background: h.islem === 'Para Girişi' ? '#dcfce7' : '#fee2e2', color: h.islem === 'Para Girişi' ? '#166534' : '#991b1b' }}>{h.islem}</span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#475569' }}>{h.cari || '—'}</td>
                  <td style={{ padding: '10px 12px' }}>{h.aciklama}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#ef4444', fontWeight: h.borc > 0 ? '600' : '400' }}>{h.borc > 0 ? `${sembol}${h.borc.toLocaleString()}` : ''}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#22c55e', fontWeight: h.alacak > 0 ? '600' : '400' }}>{h.alacak > 0 ? `${sembol}${h.alacak.toLocaleString()}` : ''}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600' }}>{sembol}{Number(h.bakiye).toLocaleString()}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===================== İŞLEM FORMU =====================
function IslemFormu({ hesap, islemTip, onKaydet, onIptal, onSeciliCari }) {
  const [form, setForm] = useState({
    tutar: '', aciklama: '',
    cari: onSeciliCari || '',
    tarih: new Date().toISOString().split('T')[0],
  });

  const kaydet = () => {
    if (!form.tutar) return alert('Tutar giriniz!');
    onKaydet({ ...form, tutar: Number(form.tutar), islemTip });
    onIptal();
  };

  return (
    <div style={{ ...kartStil, border: `2px solid ${islemTip === 'Giriş' ? '#22c55e' : '#ef4444'}` }}>
      <h3 style={{ margin: '0 0 20px', fontSize: '15px', color: islemTip === 'Giriş' ? '#166534' : '#991b1b', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
        {islemTip === 'Giriş' ? '↓ Para Girişi' : '↑ Para Çıkışı'} — {hesap.ad}
      </h3>
      {onSeciliCari && (
        <div style={{ background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', fontSize: '13px', color: '#1d4ed8' }}>
          👥 <strong>{onSeciliCari}</strong> için işlem yapılıyor
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStil}>Tarih</label>
          <input type="date" value={form.tarih} onChange={e => setForm({ ...form, tarih: e.target.value })} style={inputStil} />
        </div>
        <div>
          <label style={labelStil}>Tutar *</label>
          <input type="number" placeholder="0.00" value={form.tutar} onChange={e => setForm({ ...form, tutar: e.target.value })} style={inputStil} />
        </div>
        <div>
          <label style={labelStil}>Cari</label>
          <select value={form.cari} onChange={e => setForm({ ...form, cari: e.target.value })} style={inputStil}>
            <option value="">-- Opsiyonel --</option>
            {cariListesi.map(c => <option key={c.id} value={c.unvan}>{c.unvan}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStil}>Açıklama</label>
          <input placeholder="İşlem açıklaması..." value={form.aciklama} onChange={e => setForm({ ...form, aciklama: e.target.value })} style={inputStil} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
        <button onClick={kaydet} style={btnStil(islemTip === 'Giriş' ? '#22c55e' : '#ef4444')}>✓ Kaydet</button>
        <button onClick={onIptal} style={{ padding: '8px 20px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>İptal</button>
      </div>
    </div>
  );
}

// ===================== KASA MODÜLÜ =====================
function KasaModulu({ seciliCari, formAc, onFormAcildi }) {
  const [kasaListesi, setKasaListesi] = useState([]);
  const [hareketler, setHareketler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [seciliKasa, setSeciliKasa] = useState(null);
  const [aktifForm, setAktifForm] = useState(null);
  const [kasaFormu, setKasaFormu] = useState(false);
  const [yeniKasa, setYeniKasa] = useState({ ad: '', paraBirimi: 'TRY', bakiye: 0, aciklama: '', renk: '#22c55e' });

  useEffect(() => {
    kasalariYukle();
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (formAc && seciliCari && kasaListesi.length > 0) {
      setSeciliKasa(kasaListesi[0]);
      setAktifForm('Giriş');
      if (onFormAcildi) onFormAcildi();
    }
  }, [formAc, seciliCari]);

  const kasalariYukle = async () => {
    setYukleniyor(true);
    const { data: kasaData } = await supabase.from('kasalar').select('*').order('id');
    const { data: hareketData } = await supabase.from('kasa_hareketleri').select('*').order('created_at', { ascending: false });

    if (kasaData) {
      const donusturulmus = kasaData.map(k => ({
        id: k.id, kod: `KAS00${k.id}`, ad: k.ad,
        paraBirimi: k.para_birimi, bakiye: Number(k.bakiye),
        aciklama: k.aciklama || '', renk: k.renk || '#22c55e',
      }));
      setKasaListesi(donusturulmus);
      kasalar.splice(0, kasalar.length, ...donusturulmus);
    }

    if (hareketData) {
      const donusturulmus = hareketData.map(h => ({
        id: h.id, tarih: h.tarih, islem: h.islem,
        kasaId: h.kasa_id, kasa_id: h.kasa_id,
        alacak: Number(h.alacak), borc: Number(h.borc),
        bakiye: Number(h.bakiye), aciklama: h.aciklama,
        cari: h.cari, kullanici: h.kullanici,
      }));
      setHareketler(donusturulmus);
      kasaHareketleri.splice(0, kasaHareketleri.length, ...donusturulmus);
    }
    setYukleniyor(false);
  };

  const kasaEkle = async () => {
    if (!yeniKasa.ad) return alert('Kasa adı giriniz!');
    const { error } = await supabase.from('kasalar').insert({
      ad: yeniKasa.ad, para_birimi: yeniKasa.paraBirimi,
      bakiye: Number(yeniKasa.bakiye), renk: yeniKasa.renk,
    });
    if (error) return alert('Hata: ' + error.message);
    await kasalariYukle();
    setYeniKasa({ ad: '', paraBirimi: 'TRY', bakiye: 0, aciklama: '', renk: '#22c55e' });
    setKasaFormu(false);
  };

  const islemKaydet = async (form) => {
    const fark = form.islemTip === 'Giriş' ? form.tutar : -form.tutar;
    const yeniBakiye = seciliKasa.bakiye + fark;

    // Supabase kasa bakiyesini güncelle
    await supabase.from('kasalar').update({ bakiye: yeniBakiye }).eq('id', seciliKasa.id);

    // Hareket ekle
    await supabase.from('kasa_hareketleri').insert({
      tarih: form.tarih,
      kasa_id: seciliKasa.id,
      islem: form.islemTip === 'Giriş' ? 'Para Girişi' : 'Para Çıkışı',
      alacak: form.islemTip === 'Giriş' ? form.tutar : 0,
      borc: form.islemTip === 'Çıkış' ? form.tutar : 0,
      bakiye: yeniBakiye,
      aciklama: form.aciklama,
      cari: form.cari,
      kullanici: 'Admin',
    });

    await kasalariYukle();
    setSeciliKasa({ ...seciliKasa, bakiye: yeniBakiye });
    setAktifForm(null);
  };

  if (yukleniyor) return <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}><p style={{ fontSize: '32px' }}>⏳</p><p>Yükleniyor...</p></div>;

  if (seciliKasa) {
    if (aktifForm) return <IslemFormu hesap={seciliKasa} islemTip={aktifForm} onKaydet={islemKaydet} onIptal={() => setAktifForm(null)} onSeciliCari={seciliCari?.unvan} />;
    return <HesapDetay hesap={seciliKasa} tip="Kasa" hareketler={hareketler} onGeri={() => setSeciliKasa(null)} onGiris={() => setAktifForm('Giriş')} onCikis={() => setAktifForm('Çıkış')} onTransfer={() => setAktifForm('Transfer')} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button onClick={() => setKasaFormu(!kasaFormu)} style={btnStil('#3b82f6')}>+ Yeni Kasa Tanımla</button>
      </div>
      {kasaFormu && (
        <div style={kartStil}>
          <h3 style={{ margin: '0 0 20px', fontSize: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>💵 Yeni Kasa</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div><label style={labelStil}>Kasa Adı *</label><input placeholder="Merkez Kasa" value={yeniKasa.ad} onChange={e => setYeniKasa({ ...yeniKasa, ad: e.target.value })} style={inputStil} /></div>
            <div>
              <label style={labelStil}>Para Birimi</label>
              <select value={yeniKasa.paraBirimi} onChange={e => setYeniKasa({ ...yeniKasa, paraBirimi: e.target.value })} style={inputStil}>
                {paraBirimleri.map(p => <option key={p.kod} value={p.kod}>{p.sembol} {p.ad}</option>)}
              </select>
            </div>
            <div><label style={labelStil}>Açılış Bakiyesi</label><input type="number" placeholder="0.00" value={yeniKasa.bakiye} onChange={e => setYeniKasa({ ...yeniKasa, bakiye: e.target.value })} style={inputStil} /></div>
            <div><label style={labelStil}>Renk</label><input type="color" value={yeniKasa.renk} onChange={e => setYeniKasa({ ...yeniKasa, renk: e.target.value })} style={{ ...inputStil, height: '42px', padding: '4px' }} /></div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <button onClick={kasaEkle} style={btnStil('#22c55e')}>✓ Kaydet</button>
            <button onClick={() => setKasaFormu(false)} style={{ padding: '8px 20px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>İptal</button>
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {kasaListesi.map(k => (
          <div key={k.id} onClick={() => setSeciliKasa(k)} style={{ background: 'white', borderRadius: '12px', padding: '20px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderTop: `4px solid ${k.renk || '#22c55e'}` }}>
            <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>{k.ad}</p>
            <p style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 'bold', color: k.renk || '#22c55e' }}>
              {paraBirimleri.find(p => p.kod === k.paraBirimi)?.sembol || '₺'}{Number(k.bakiye).toLocaleString()}
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{k.paraBirimi}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== BANKA MODÜLÜ =====================
function BankaModulu({ seciliCari, formAc, onFormAcildi }) {
  const [bankaListesi, setBankaListesi] = useState([]);
  const [hareketler, setHareketler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [seciliBanka, setSeciliBanka] = useState(null);
  const [aktifForm, setAktifForm] = useState(null);
  const [bankaFormu, setBankaFormu] = useState(false);
  const [yeniBanka, setYeniBanka] = useState({ ad: '', banka: '', sube: '', hesapNo: '', iban: '', paraBirimi: 'TRY', bakiye: 0 });

  useEffect(() => {
    bankalariYukle();
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (formAc && seciliCari && bankaListesi.length > 0) {
      setSeciliBanka(bankaListesi[0]);
      setAktifForm('Giriş');
      if (onFormAcildi) onFormAcildi();
    }
  }, [formAc, seciliCari]);

  const bankalariYukle = async () => {
    setYukleniyor(true);
    const { data: bankaData } = await supabase.from('bankalar').select('*').order('id');
    const { data: hareketData } = await supabase.from('banka_hareketleri').select('*').order('created_at', { ascending: false });

    if (bankaData) {
      const donusturulmus = bankaData.map(b => ({
        id: b.id, kod: `BNK00${b.id}`, ad: b.ad,
        banka: b.banka_adi, sube: b.sube, hesapNo: b.hesap_no,
        iban: b.iban, paraBirimi: b.para_birimi, bakiye: Number(b.bakiye),
      }));
      setBankaListesi(donusturulmus);
      bankalar.splice(0, bankalar.length, ...donusturulmus);
    }

    if (hareketData) {
      const donusturulmus = hareketData.map(h => ({
        id: h.id, tarih: h.tarih, islem: h.islem,
        bankaId: h.banka_id, banka_id: h.banka_id,
        alacak: Number(h.alacak), borc: Number(h.borc),
        bakiye: Number(h.bakiye), aciklama: h.aciklama,
        cari: h.cari, kullanici: h.kullanici,
      }));
      setHareketler(donusturulmus);
      bankaHareketleri.splice(0, bankaHareketleri.length, ...donusturulmus);
    }
    setYukleniyor(false);
  };

  const bankaEkle = async () => {
    if (!yeniBanka.ad) return alert('Hesap adı zorunludur!');
    const { error } = await supabase.from('bankalar').insert({
      ad: yeniBanka.ad, banka_adi: yeniBanka.banka,
      sube: yeniBanka.sube, hesap_no: yeniBanka.hesapNo,
      iban: yeniBanka.iban, para_birimi: yeniBanka.paraBirimi,
      bakiye: Number(yeniBanka.bakiye),
    });
    if (error) return alert('Hata: ' + error.message);
    await bankalariYukle();
    setYeniBanka({ ad: '', banka: '', sube: '', hesapNo: '', iban: '', paraBirimi: 'TRY', bakiye: 0 });
    setBankaFormu(false);
  };

  const islemKaydet = async (form) => {
    const fark = form.islemTip === 'Giriş' ? form.tutar : -form.tutar;
    const yeniBakiye = seciliBanka.bakiye + fark;

    await supabase.from('bankalar').update({ bakiye: yeniBakiye }).eq('id', seciliBanka.id);
    await supabase.from('banka_hareketleri').insert({
      tarih: form.tarih,
      banka_id: seciliBanka.id,
      islem: form.islemTip === 'Giriş' ? 'Para Girişi' : 'Para Çıkışı',
      alacak: form.islemTip === 'Giriş' ? form.tutar : 0,
      borc: form.islemTip === 'Çıkış' ? form.tutar : 0,
      bakiye: yeniBakiye,
      aciklama: form.aciklama,
      cari: form.cari,
      kullanici: 'Admin',
    });

    await bankalariYukle();
    setSeciliBanka({ ...seciliBanka, bakiye: yeniBakiye });
    setAktifForm(null);
  };

  if (yukleniyor) return <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}><p style={{ fontSize: '32px' }}>⏳</p><p>Yükleniyor...</p></div>;

  if (seciliBanka) {
    if (aktifForm) return <IslemFormu hesap={seciliBanka} islemTip={aktifForm} onKaydet={islemKaydet} onIptal={() => setAktifForm(null)} onSeciliCari={seciliCari?.unvan} />;
    return <HesapDetay hesap={seciliBanka} tip="Banka" hareketler={hareketler} onGeri={() => setSeciliBanka(null)} onGiris={() => setAktifForm('Giriş')} onCikis={() => setAktifForm('Çıkış')} onTransfer={() => setAktifForm('Transfer')} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button onClick={() => setBankaFormu(!bankaFormu)} style={btnStil('#3b82f6')}>+ Yeni Banka Hesabı</button>
      </div>
      {bankaFormu && (
        <div style={kartStil}>
          <h3 style={{ margin: '0 0 20px', fontSize: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>🏦 Yeni Banka Hesabı</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div><label style={labelStil}>Hesap Adı *</label><input placeholder="Ziraat TL Hesabı" value={yeniBanka.ad} onChange={e => setYeniBanka({ ...yeniBanka, ad: e.target.value })} style={inputStil} /></div>
            <div>
              <label style={labelStil}>Banka</label>
              <select value={yeniBanka.banka} onChange={e => setYeniBanka({ ...yeniBanka, banka: e.target.value })} style={inputStil}>
                <option value="">-- Seçiniz --</option>
                {bankaTanimlari.map(b => <option key={b.kod} value={b.ad}>{b.ad}</option>)}
              </select>
            </div>
            <div><label style={labelStil}>Şube</label><input placeholder="Şube adı" value={yeniBanka.sube} onChange={e => setYeniBanka({ ...yeniBanka, sube: e.target.value })} style={inputStil} /></div>
            <div><label style={labelStil}>Hesap No</label><input placeholder="Hesap numarası" value={yeniBanka.hesapNo} onChange={e => setYeniBanka({ ...yeniBanka, hesapNo: e.target.value })} style={inputStil} /></div>
            <div><label style={labelStil}>IBAN</label><input placeholder="TR00 0000..." value={yeniBanka.iban} onChange={e => setYeniBanka({ ...yeniBanka, iban: e.target.value })} style={inputStil} /></div>
            <div>
              <label style={labelStil}>Para Birimi</label>
              <select value={yeniBanka.paraBirimi} onChange={e => setYeniBanka({ ...yeniBanka, paraBirimi: e.target.value })} style={inputStil}>
                {paraBirimleri.map(p => <option key={p.kod} value={p.kod}>{p.sembol} {p.ad}</option>)}
              </select>
            </div>
            <div><label style={labelStil}>Açılış Bakiyesi</label><input type="number" placeholder="0.00" value={yeniBanka.bakiye} onChange={e => setYeniBanka({ ...yeniBanka, bakiye: e.target.value })} style={inputStil} /></div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <button onClick={bankaEkle} style={btnStil('#22c55e')}>✓ Kaydet</button>
            <button onClick={() => setBankaFormu(false)} style={{ padding: '8px 20px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>İptal</button>
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {bankaListesi.map(b => (
          <div key={b.id} onClick={() => setSeciliBanka(b)} style={{ background: 'white', borderRadius: '12px', padding: '20px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderTop: '4px solid #3b82f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>{b.ad}</p>
              <span style={{ fontSize: '11px', padding: '2px 8px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '20px' }}>{b.banka}</span>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 'bold', color: '#3b82f6' }}>
              {paraBirimleri.find(p => p.kod === b.paraBirimi)?.sembol || '₺'}{Number(b.bakiye).toLocaleString()}
            </p>
            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>{b.iban}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== KREDİ KARTI (Memory) =====================
function KrediKartiModulu() {
  const [kartlar, setKartlar] = useState(krediKartlari);
  const [kartFormu, setKartFormu] = useState(false);
  const [yeniKart, setYeniKart] = useState({ ad: '', banka: '', limit: '', ekstreGunu: '', sonOdemeTarihi: '' });

  const kartEkle = () => {
    if (!yeniKart.ad || !yeniKart.banka) return alert('Kart adı ve banka zorunludur!');
    const yeni = { ...yeniKart, id: Date.now(), kod: `KK00${kartlar.length + 1}`, kullanilanLimit: 0, limit: Number(yeniKart.limit) };
    setKartlar([...kartlar, yeni]);
    krediKartlari.push(yeni);
    setYeniKart({ ad: '', banka: '', limit: '', ekstreGunu: '', sonOdemeTarihi: '' });
    setKartFormu(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button onClick={() => setKartFormu(!kartFormu)} style={btnStil('#8b5cf6')}>+ Yeni Kredi Kartı</button>
      </div>
      {kartFormu && (
        <div style={kartStil}>
          <h3 style={{ margin: '0 0 20px', fontSize: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>💳 Yeni Kredi Kartı</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div><label style={labelStil}>Kart Adı *</label><input placeholder="Ziraat İşletme Kartı" value={yeniKart.ad} onChange={e => setYeniKart({ ...yeniKart, ad: e.target.value })} style={inputStil} /></div>
            <div>
              <label style={labelStil}>Banka *</label>
              <select value={yeniKart.banka} onChange={e => setYeniKart({ ...yeniKart, banka: e.target.value })} style={inputStil}>
                <option value="">-- Seçiniz --</option>
                {bankaTanimlari.map(b => <option key={b.kod} value={b.kod}>{b.ad}</option>)}
              </select>
            </div>
            <div><label style={labelStil}>Limit (₺)</label><input type="number" placeholder="50000" value={yeniKart.limit} onChange={e => setYeniKart({ ...yeniKart, limit: e.target.value })} style={inputStil} /></div>
            <div><label style={labelStil}>Ekstre Günü</label><input type="number" placeholder="15" value={yeniKart.ekstreGunu} onChange={e => setYeniKart({ ...yeniKart, ekstreGunu: e.target.value })} style={inputStil} /></div>
            <div><label style={labelStil}>Son Ödeme Tarihi</label><input type="date" value={yeniKart.sonOdemeTarihi} onChange={e => setYeniKart({ ...yeniKart, sonOdemeTarihi: e.target.value })} style={inputStil} /></div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <button onClick={kartEkle} style={btnStil('#22c55e')}>✓ Kaydet</button>
            <button onClick={() => setKartFormu(false)} style={{ padding: '8px 20px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>İptal</button>
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {kartlar.map(k => {
          const kullanimOrani = k.limit > 0 ? (k.kullanilanLimit / k.limit) * 100 : 0;
          return (
            <div key={k.id} style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderTop: '4px solid #8b5cf6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#94a3b8' }}>{bankaTanimlari.find(b => b.kod === k.banka)?.ad}</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{k.ad}</p>
                </div>
                <span style={{ padding: '4px 12px', background: '#ede9fe', color: '#6d28d9', borderRadius: '20px', fontSize: '12px', height: 'fit-content' }}>Kredi Kartı</span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                  <span>Kullanılan / Limit</span>
                  <span style={{ fontWeight: '600', color: '#8b5cf6' }}>₺{k.kullanilanLimit.toLocaleString()} / ₺{k.limit.toLocaleString()}</span>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                  <div style={{ width: `${kullanimOrani}%`, background: kullanimOrani > 80 ? '#ef4444' : '#8b5cf6', height: '100%', borderRadius: '4px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <span>Ekstre: {k.ekstreGunu}. gün</span>
                <span>Son Ödeme: {k.sonOdemeTarihi}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===================== POS (Memory) =====================
function PosModulu() {
  const [posListesi] = useState(poslar);
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {posListesi.map(p => (
          <div key={p.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderTop: '4px solid #06b6d4' }}>
            <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>{p.ad}</p>
            <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#64748b' }}>Terminal: {p.terminaNo}</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Komisyon: %{p.komisyonOrani}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== ÇEK / SENET (Memory) =====================
function CekSenetModulu() {
  const [liste, setListe] = useState(cekSenetListesi);
  const [evrakTip, setEvrakTip] = useState('Çek');
  const [aktifFiltre, setAktifFiltre] = useState('Tümü');
  const [arama, setArama] = useState('');
  const [formAcik, setFormAcik] = useState(false);
  const [yeni, setYeni] = useState({ tip: 'Alınan', no: '', cari: '', tutar: '', paraBirimi: 'TRY', vadeTarihi: '', alindigiTarih: new Date().toISOString().split('T')[0], banka: '', aciklama: '' });

  const bugun = new Date().toISOString().split('T')[0];
  const filtreler = ['Tümü', 'Portföydekiler', 'Verilenler', 'Ödenmişler', 'İptaller'];

  const filtrelenmis = liste.filter(i => {
    if (i.evrakTip !== evrakTip) return false;
    if (arama && !i.cari?.toLowerCase().includes(arama.toLowerCase()) && !i.no?.toLowerCase().includes(arama.toLowerCase())) return false;
    if (aktifFiltre === 'Tümü') return true;
    if (aktifFiltre === 'Portföydekiler') return i.durum === 'Portföyde';
    if (aktifFiltre === 'Verilenler') return i.durum === 'Verildi';
    if (aktifFiltre === 'Ödenmişler') return i.durum === 'Ödendi' || i.durum === 'Tahsil Edildi';
    if (aktifFiltre === 'İptaller') return i.durum === 'İptal';
    return true;
  });

  const toplamTutar = filtrelenmis.reduce((t, i) => t + i.tutar, 0);

  const kaydet = () => {
    if (!yeni.cari || !yeni.tutar || !yeni.vadeTarihi) return alert('Zorunlu alanları doldurunuz!');
    const yeniEvrak = { ...yeni, id: Date.now(), evrakTip, tutar: Number(yeni.tutar), durum: yeni.tip === 'Alınan' ? 'Portföyde' : 'Verildi' };
    setListe([...liste, yeniEvrak]);
    cekSenetListesi.push(yeniEvrak);
    setYeni({ tip: 'Alınan', no: '', cari: '', tutar: '', paraBirimi: 'TRY', vadeTarihi: '', alindigiTarih: new Date().toISOString().split('T')[0], banka: '', aciklama: '' });
    setFormAcik(false);
  };

  const durumDegistir = (id, durum) => {
    const guncellenmis = liste.map(i => i.id === id ? { ...i, durum } : i);
    setListe(guncellenmis);
    cekSenetListesi.splice(0, cekSenetListesi.length, ...guncellenmis);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['Çek', 'Senet'].map(t => (
          <button key={t} onClick={() => { setEvrakTip(t); setAktifFiltre('Tümü'); }} style={{ padding: '8px 28px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', background: evrakTip === t ? '#1e293b' : 'white', color: evrakTip === t ? 'white' : '#64748b', border: `1px solid ${evrakTip === t ? '#1e293b' : '#e2e8f0'}` }}>{t}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#3b82f6', borderRadius: '12px', padding: '20px', color: 'white' }}>
          <p style={{ margin: '0 0 4px', fontSize: '13px', opacity: 0.85 }}>{evrakTip} Sayısı</p>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>{filtrelenmis.length}</p>
        </div>
        <div style={{ background: '#22c55e', borderRadius: '12px', padding: '20px', color: 'white' }}>
          <p style={{ margin: '0 0 4px', fontSize: '13px', opacity: 0.85 }}>Toplam Tutar</p>
          <p style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>₺{toplamTutar.toLocaleString()}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap', background: 'white', padding: '8px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {filtreler.map(f => (
          <button key={f} onClick={() => setAktifFiltre(f)} style={{ padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', background: aktifFiltre === f ? '#1e293b' : 'transparent', color: aktifFiltre === f ? 'white' : '#64748b', border: 'none', fontWeight: aktifFiltre === f ? '600' : '400' }}>{f}</button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <input placeholder="Ara..." value={arama} onChange={e => setArama(e.target.value)} style={{ ...inputStil, width: '280px' }} />
        <button onClick={() => setFormAcik(!formAcik)} style={btnStil('#3b82f6')}>+ Yeni {evrakTip}</button>
      </div>
      {formAcik && (
        <div style={kartStil}>
          <h3 style={{ margin: '0 0 20px', fontSize: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>📋 Yeni {evrakTip}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div><label style={labelStil}>Tip</label><select value={yeni.tip} onChange={e => setYeni({ ...yeni, tip: e.target.value })} style={inputStil}><option>Alınan</option><option>Verilen</option></select></div>
            <div><label style={labelStil}>No</label><input placeholder="Evrak no" value={yeni.no} onChange={e => setYeni({ ...yeni, no: e.target.value })} style={inputStil} /></div>
            <div>
              <label style={labelStil}>Cari *</label>
              <select value={yeni.cari} onChange={e => setYeni({ ...yeni, cari: e.target.value })} style={inputStil}>
                <option value="">-- Seçiniz --</option>
                {cariListesi.map(c => <option key={c.id}>{c.unvan}</option>)}
              </select>
            </div>
            <div><label style={labelStil}>Tutar *</label><input type="number" placeholder="0.00" value={yeni.tutar} onChange={e => setYeni({ ...yeni, tutar: e.target.value })} style={inputStil} /></div>
            <div><label style={labelStil}>Alındığı Tarih</label><input type="date" value={yeni.alindigiTarih} onChange={e => setYeni({ ...yeni, alindigiTarih: e.target.value })} style={inputStil} /></div>
            <div><label style={labelStil}>Vade Tarihi *</label><input type="date" value={yeni.vadeTarihi} onChange={e => setYeni({ ...yeni, vadeTarihi: e.target.value })} style={inputStil} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={labelStil}>Açıklama</label><input placeholder="Açıklama..." value={yeni.aciklama} onChange={e => setYeni({ ...yeni, aciklama: e.target.value })} style={inputStil} /></div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <button onClick={kaydet} style={btnStil('#22c55e')}>✓ Kaydet</button>
            <button onClick={() => setFormAcik(false)} style={{ padding: '8px 20px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>İptal</button>
          </div>
        </div>
      )}
      <div style={kartStil}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {['Cari', 'Alındığı', 'Vade', 'No', 'Tutar', 'Durum', ''].map(b => (
                <th key={b} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>{b}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrelenmis.length === 0
              ? <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Kayıt bulunamadı</td></tr>
              : filtrelenmis.map(i => {
                const vadeGecti = i.vadeTarihi < bugun && !['Ödendi', 'Tahsil Edildi', 'İptal'].includes(i.durum);
                return (
                  <tr key={i.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', color: '#3b82f6', fontWeight: '500' }}>{i.cari}</td>
                    <td style={{ padding: '10px 12px', color: '#64748b' }}>{i.alindigiTarih}</td>
                    <td style={{ padding: '10px 12px', color: vadeGecti ? '#ef4444' : '#64748b', fontWeight: vadeGecti ? '600' : '400' }}>{i.vadeTarihi}</td>
                    <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '12px' }}>{i.no}</td>
                    <td style={{ padding: '10px 12px', fontWeight: '600' }}>₺{i.tutar.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '11px', background: i.durum === 'Portföyde' ? '#dbeafe' : i.durum === 'Tahsil Edildi' || i.durum === 'Ödendi' ? '#dcfce7' : '#fef9c3', color: i.durum === 'Portföyde' ? '#1d4ed8' : i.durum === 'Tahsil Edildi' || i.durum === 'Ödendi' ? '#166534' : '#854d0e' }}>{i.durum}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <select value={i.durum} onChange={e => durumDegistir(i.id, e.target.value)} style={{ ...inputStil, fontSize: '12px', padding: '4px 8px', width: 'auto' }}>
                        <option>Portföyde</option><option>Tahsile Verildi</option><option>Tahsil Edildi</option>
                        <option>Verildi</option><option>Ödendi</option><option>Karşılıksız</option><option>İptal</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===================== VİRMAN =====================
function VirmanModulu() {
  const [virmanlar, setVirmanlar] = useState([]);
  const [yeni, setYeni] = useState({ kaynakTip: 'Kasa', kaynakId: '', hedefTip: 'Banka', hedefId: '', tutar: '', tarih: new Date().toISOString().split('T')[0], aciklama: '' });
  const [formAcik, setFormAcik] = useState(false);

  const kaynaklar = yeni.kaynakTip === 'Kasa' ? kasalar : bankalar;
  const hedefler = yeni.hedefTip === 'Kasa' ? kasalar : bankalar;

  const kaydet = async () => {
    if (!yeni.kaynakId || !yeni.hedefId || !yeni.tutar) return alert('Zorunlu alanları doldurunuz!');
    if (yeni.kaynakId === yeni.hedefId && yeni.kaynakTip === yeni.hedefTip) return alert('Kaynak ve hedef aynı olamaz!');

    const kaynakHesap = kaynaklar.find(k => String(k.id) === String(yeni.kaynakId));
    const hedefHesap = hedefler.find(h => String(h.id) === String(yeni.hedefId));
    const tutar = Number(yeni.tutar);

    if (kaynakHesap.bakiye < tutar) return alert('Yetersiz bakiye!');

    // Bakiyeleri güncelle
    const kaynakTablo = yeni.kaynakTip === 'Kasa' ? 'kasalar' : 'bankalar';
    const hedefTablo = yeni.hedefTip === 'Kasa' ? 'kasalar' : 'bankalar';
    await supabase.from(kaynakTablo).update({ bakiye: kaynakHesap.bakiye - tutar }).eq('id', kaynakHesap.id);
    await supabase.from(hedefTablo).update({ bakiye: hedefHesap.bakiye + tutar }).eq('id', hedefHesap.id);

    setVirmanlar([{ ...yeni, id: Date.now(), tutar, kaynakAd: kaynakHesap.ad, hedefAd: hedefHesap.ad }, ...virmanlar]);
    setYeni({ kaynakTip: 'Kasa', kaynakId: '', hedefTip: 'Banka', hedefId: '', tutar: '', tarih: new Date().toISOString().split('T')[0], aciklama: '' });
    setFormAcik(false);
    alert('✅ Transfer tamamlandı!');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button onClick={() => setFormAcik(!formAcik)} style={btnStil('#3b82f6')}>+ Yeni Virman</button>
      </div>
      {formAcik && (
        <div style={kartStil}>
          <h3 style={{ margin: '0 0 20px', fontSize: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>🔄 Hesaplar Arası Transfer</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'start', marginBottom: '16px' }}>
            <div style={{ background: '#fef9c3', borderRadius: '10px', padding: '16px', border: '1px solid #fef08a' }}>
              <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '700', color: '#854d0e' }}>KAYNAK</p>
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStil}>Tip</label>
                <select value={yeni.kaynakTip} onChange={e => setYeni({ ...yeni, kaynakTip: e.target.value, kaynakId: '' })} style={inputStil}><option>Kasa</option><option>Banka</option></select>
              </div>
              <div>
                <label style={labelStil}>Hesap *</label>
                <select value={yeni.kaynakId} onChange={e => setYeni({ ...yeni, kaynakId: e.target.value })} style={inputStil}>
                  <option value="">-- Seçiniz --</option>
                  {kaynaklar.map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
                </select>
              </div>
            </div>
            <div style={{ textAlign: 'center', paddingTop: '40px', fontSize: '28px', color: '#94a3b8' }}>→</div>
            <div style={{ background: '#dcfce7', borderRadius: '10px', padding: '16px', border: '1px solid #bbf7d0' }}>
              <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '700', color: '#166534' }}>HEDEF</p>
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStil}>Tip</label>
                <select value={yeni.hedefTip} onChange={e => setYeni({ ...yeni, hedefTip: e.target.value, hedefId: '' })} style={inputStil}><option>Kasa</option><option>Banka</option></select>
              </div>
              <div>
                <label style={labelStil}>Hesap *</label>
                <select value={yeni.hedefId} onChange={e => setYeni({ ...yeni, hedefId: e.target.value })} style={inputStil}>
                  <option value="">-- Seçiniz --</option>
                  {hedefler.map(h => <option key={h.id} value={h.id}>{h.ad}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div><label style={labelStil}>Tutar *</label><input type="number" placeholder="0.00" value={yeni.tutar} onChange={e => setYeni({ ...yeni, tutar: e.target.value })} style={inputStil} /></div>
            <div><label style={labelStil}>Tarih</label><input type="date" value={yeni.tarih} onChange={e => setYeni({ ...yeni, tarih: e.target.value })} style={inputStil} /></div>
            <div><label style={labelStil}>Açıklama</label><input placeholder="Açıklama..." value={yeni.aciklama} onChange={e => setYeni({ ...yeni, aciklama: e.target.value })} style={inputStil} /></div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <button onClick={kaydet} style={btnStil('#22c55e')}>✓ Transfer Et</button>
            <button onClick={() => setFormAcik(false)} style={{ padding: '8px 20px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>İptal</button>
          </div>
        </div>
      )}
      <div style={kartStil}>
        <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600' }}>VİRMAN GEÇMİŞİ</h4>
        {virmanlar.length === 0
          ? <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>Henüz virman yapılmadı</p>
          : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  {['Tarih', 'Kaynak', 'Hedef', 'Tutar', 'Açıklama'].map(b => (
                    <th key={b} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>{b}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {virmanlar.map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', color: '#64748b' }}>{v.tarih}</td>
                    <td style={{ padding: '10px 12px' }}><span style={{ padding: '3px 8px', background: '#fef9c3', color: '#854d0e', borderRadius: '20px', fontSize: '12px' }}>{v.kaynakTip}: {v.kaynakAd}</span></td>
                    <td style={{ padding: '10px 12px' }}><span style={{ padding: '3px 8px', background: '#dcfce7', color: '#166534', borderRadius: '20px', fontSize: '12px' }}>{v.hedefTip}: {v.hedefAd}</span></td>
                    <td style={{ padding: '10px 12px', fontWeight: '600', color: '#3b82f6' }}>₺{v.tutar.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', color: '#64748b' }}>{v.aciklama || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  );
}

// ===================== ANA EXPORT =====================
export default function Finans({ aktifAlt, seciliCari, formAc, onFormAcildi }) {
  const menuMap = {
    'kasalar': <KasaModulu seciliCari={seciliCari} formAc={formAc} onFormAcildi={onFormAcildi} />,
    'bankalar': <BankaModulu seciliCari={seciliCari} formAc={formAc} onFormAcildi={onFormAcildi} />,
    'kredi-kartlari': <KrediKartiModulu />,
    'pos': <PosModulu />,
    'cek-senet': <CekSenetModulu />,
    'virman': <VirmanModulu />,
  };
  return menuMap[aktifAlt] || null;
}