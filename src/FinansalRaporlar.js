import { useState } from 'react';
import { kasalar, bankalar, kasaHareketleri, bankaHareketleri } from './Finans';

const kartStil = { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '16px' };

export default function FinansalRaporlar() {
  const [donem, setDonem] = useState('bu-ay');

  const aylar = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

  const aylikGelir = [28000, 34000, 45800, 38000, 52000, 41000, 36000, 48000, 55000, 43000, 39000, 62000];
  const aylikGider = [18000, 22000, 28400, 24000, 31000, 27000, 23000, 29000, 34000, 28000, 25000, 38000];

  const toplamGelir = aylikGelir.reduce((a, b) => a + b, 0);
  const toplamGider = aylikGider.reduce((a, b) => a + b, 0);
  const netKar = toplamGelir - toplamGider;
  const karMarji = ((netKar / toplamGelir) * 100).toFixed(1);

  const maxDeger = Math.max(...aylikGelir, ...aylikGider);

  const toplamKasaBakiye = kasalar.reduce((t, k) => t + (k.paraBirimi === 'TRY' ? k.bakiye : 0), 0);
  const toplamBankaBakiye = bankalar.reduce((t, b) => t + (b.paraBirimi === 'TRY' ? b.bakiye : 0), 0);
  const toplamNakit = toplamKasaBakiye + toplamBankaBakiye;

  const kasaGiris = kasaHareketleri.filter(h => h.islem === 'Para Girişi').reduce((t, h) => t + h.alacak, 0);
  const kasaCikis = kasaHareketleri.filter(h => h.islem === 'Para Çıkışı').reduce((t, h) => t + h.borc, 0);
  const bankaGiris = bankaHareketleri.filter(h => h.islem === 'Para Girişi').reduce((t, h) => t + h.alacak, 0);
  const bankaCikis = bankaHareketleri.filter(h => h.islem === 'Para Çıkışı').reduce((t, h) => t + h.borc, 0);

  const giderKategorileri = [
    { ad: 'Personel Giderleri', tutar: 85000, oran: 35, renk: '#3b82f6' },
    { ad: 'Kira & Faturalar', tutar: 42000, oran: 17, renk: '#8b5cf6' },
    { ad: 'Hammadde & Malzeme', tutar: 68000, oran: 28, renk: '#f59e0b' },
    { ad: 'Pazarlama', tutar: 24000, oran: 10, renk: '#22c55e' },
    { ad: 'Diğer', tutar: 25000, oran: 10, renk: '#94a3b8' },
  ];

  return (
    <div>
      {/* Dönem Seçimi */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'white', padding: '8px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', width: 'fit-content' }}>
        {[
          { id: 'bu-ay', ad: 'Bu Ay' },
          { id: 'gecen-ay', ad: 'Geçen Ay' },
          { id: 'bu-yil', ad: 'Bu Yıl' },
          { id: 'gecen-yil', ad: 'Geçen Yıl' },
        ].map(d => (
          <button key={d.id} onClick={() => setDonem(d.id)} style={{
            padding: '7px 16px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px',
            background: donem === d.id ? '#1e293b' : 'transparent',
            color: donem === d.id ? 'white' : '#64748b',
            border: 'none', fontWeight: donem === d.id ? '600' : '400',
          }}>{d.ad}</button>
        ))}
      </div>

      {/* Özet Kartlar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { baslik: 'Toplam Gelir', tutar: toplamGelir, renk: '#22c55e', ikon: '📈', alt: 'Tüm tahsilatlar' },
          { baslik: 'Toplam Gider', tutar: toplamGider, renk: '#ef4444', ikon: '📉', alt: 'Tüm ödemeler' },
          { baslik: 'Net Kar', tutar: netKar, renk: '#3b82f6', ikon: '💰', alt: `Kar marjı: %${karMarji}` },
          { baslik: 'Nakit Pozisyon', tutar: toplamNakit, renk: '#8b5cf6', ikon: '🏦', alt: 'Kasa + Banka' },
        ].map((k, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderTop: `4px solid ${k.renk}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{k.baslik}</p>
              <span style={{ fontSize: '20px' }}>{k.ikon}</span>
            </div>
            <p style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 'bold', color: k.renk }}>
              ₺{k.tutar.toLocaleString()}
            </p>
            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{k.alt}</p>
          </div>
        ))}
      </div>

      {/* Gelir / Gider Grafiği */}
      <div style={kartStil}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>📊 Aylık Gelir / Gider</h3>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', background: '#22c55e', borderRadius: '3px', display: 'inline-block' }} />
              Gelir
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '3px', display: 'inline-block' }} />
              Gider
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '200px', padding: '0 8px' }}>
          {aylar.map((ay, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ width: '100%', display: 'flex', gap: '2px', alignItems: 'flex-end', height: '180px', justifyContent: 'center' }}>
                <div style={{
                  width: '45%', background: '#22c55e', borderRadius: '4px 4px 0 0',
                  height: `${(aylikGelir[i] / maxDeger) * 100}%`,
                  transition: 'height 0.3s',
                  minHeight: '4px',
                }} title={`Gelir: ₺${aylikGelir[i].toLocaleString()}`} />
                <div style={{
                  width: '45%', background: '#ef4444', borderRadius: '4px 4px 0 0',
                  height: `${(aylikGider[i] / maxDeger) * 100}%`,
                  transition: 'height 0.3s',
                  minHeight: '4px',
                }} title={`Gider: ₺${aylikGider[i].toLocaleString()}`} />
              </div>
              <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>{ay}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alt Satır: Nakit Akışı + Gider Dağılımı */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Nakit Akışı */}
        <div style={kartStil}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', color: '#1e293b' }}>💵 Nakit Akışı</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { baslik: 'Kasa Girişleri', tutar: kasaGiris, renk: '#22c55e' },
              { baslik: 'Kasa Çıkışları', tutar: kasaCikis, renk: '#ef4444' },
              { baslik: 'Banka Girişleri', tutar: bankaGiris, renk: '#3b82f6' },
              { baslik: 'Banka Çıkışları', tutar: bankaCikis, renk: '#f59e0b' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '8px', borderLeft: `4px solid ${item.renk}` }}>
                <span style={{ fontSize: '13px', color: '#475569' }}>{item.baslik}</span>
                <span style={{ fontSize: '15px', fontWeight: '700', color: item.renk }}>₺{item.tutar.toLocaleString()}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#1e293b', borderRadius: '8px' }}>
              <span style={{ fontSize: '13px', color: 'white', fontWeight: '600' }}>Net Nakit Akışı</span>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#22c55e' }}>
                ₺{(kasaGiris - kasaCikis + bankaGiris - bankaCikis).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Gider Dağılımı */}
        <div style={kartStil}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', color: '#1e293b' }}>📊 Gider Dağılımı</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {giderKategorileri.map((g, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span style={{ color: '#475569' }}>{g.ad}</span>
                  <span style={{ fontWeight: '600', color: '#1e293b' }}>₺{g.tutar.toLocaleString()} <span style={{ color: '#94a3b8', fontWeight: '400' }}>(%{g.oran})</span></span>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                  <div style={{ width: `${g.oran}%`, background: g.renk, height: '100%', borderRadius: '4px', transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hesap Bazlı Bakiyeler */}
      <div style={kartStil}>
        <h3 style={{ margin: '0 0 20px', fontSize: '16px', color: '#1e293b' }}>🏦 Hesap Bazlı Bakiyeler</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[...kasalar.map(k => ({ ...k, tip: 'Kasa', renk: k.renk || '#22c55e' })),
            ...bankalar.map(b => ({ ...b, tip: 'Banka', renk: '#3b82f6' }))
          ].map((h, i) => (
            <div key={i} style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', borderLeft: `3px solid ${h.renk}` }}>
              <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>{h.tip}</span>
              </div>
              <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{h.ad}</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: h.renk }}>
                {h.paraBirimi !== 'TRY' ? h.paraBirimi + ' ' : '₺'}{Number(h.bakiye).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}