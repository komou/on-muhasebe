import { useState, useCallback } from 'react';
import './App.css';
import CariHesaplar from './CariHesaplar';
import Urunler from './Urunler';
import Siparisler from './Siparisler';
import Irsaliyeler from './Irsaliyeler';
import SatisFaturalari from './SatisFaturalari';
import AlimTalepleri from './AlimTalepleri';
import AlimTeklifleri from './AlimTeklifleri';
import AlimSiparisleri from './AlimSiparisleri';
import AlisIrsaliyeleri from './AlisIrsaliyeleri';
import AlisFaturalari from './AlisFaturalari';
import Finans from './Finans';
import FinansalRaporlar from './FinansalRaporlar';
import BakiyeRaporlar from './BakiyeRaporlar';
import StokRaporlar from './StokRaporlar';
import { dashboardVerisi } from './veriAkisi';
import { urunListesi_global } from './Urunler';

function App() {
  const [aktifMenu, setAktifMenu] = useState('dashboard');
  const [acikMenu, setAcikMenu] = useState('');
  const [globalState, setGlobalState] = useState({ seciliCari: null, formAc: false });

  const handleFormAcildi = useCallback(() => {
    setGlobalState(p => ({ ...p, formAc: false }));
  }, []);

  const menuler = [
    { id: 'cari', ad: '👥 Cari Hesaplar', altlar: [{ id: 'cari-liste', ad: 'Cari Hesap Listesi' }] },
    {
      id: 'stoklar', ad: '📦 Stoklar',
      altlar: [
        { id: 'urunler', ad: 'Ürün ve Hizmet Listesi' },
        { id: 'depolar', ad: 'Depolar' },
        { id: 'stok-hareketleri', ad: 'Stok Hareketleri' },
        { id: 'fiyat-listeleri', ad: 'Fiyat Listeleri' },
        { id: 'giderler', ad: 'Gider Listesi' },
      ]
    },
    {
      id: 'satislar', ad: '🧾 Satışlar',
      altlar: [
        { id: 'siparisler', ad: 'Siparişler' },
        { id: 'irsaliyeler', ad: 'İrsaliyeler' },
        { id: 'satis-faturalari', ad: 'Satış Faturaları' },
        { id: 'e-fatura', ad: 'e-Fatura / e-Arşiv' },
      ]
    },
    {
      id: 'alimlar', ad: '🛒 Alımlar',
      altlar: [
        { id: 'alim-talepleri', ad: 'Alım Talepleri' },
        { id: 'alim-teklifleri', ad: 'Alım Teklifleri' },
        { id: 'alim-siparisleri', ad: 'Alım Siparişleri' },
        { id: 'alis-irsaliyeleri', ad: 'Alış İrsaliyeleri' },
        { id: 'alis-faturalari', ad: 'Alış Faturaları' },
      ]
    },
    {
      id: 'finans', ad: '💰 Finans',
      altlar: [
        { id: 'kasalar', ad: 'Kasalar' },
        { id: 'bankalar', ad: 'Bankalar' },
        { id: 'kredi-kartlari', ad: 'Kredi Kartları' },
        { id: 'pos', ad: 'POS' },
        { id: 'cek-senet', ad: 'Çekler ve Senetler' },
        { id: 'virman', ad: 'Virman' },
      ]
    },
    {
      id: 'raporlar', ad: '📈 Raporlar',
      altlar: [
        { id: 'finansal-raporlar', ad: 'Finansal Raporlar' },
        { id: 'bakiye-raporlar', ad: 'Bakiye ve Analiz Raporları' },
        { id: 'stok-raporlar', ad: 'Stok Raporları' },
      ]
    },
    {
      id: 'ayarlar', ad: '⚙️ Ayarlar',
      altlar: [
        { id: 'firma-bilgileri', ad: 'Firma Bilgileri' },
        { id: 'kullanici', ad: 'Kullanıcı Yetkilendirme' },
        { id: 'evrak-tasarim', ad: 'Evrak Tasarımı' },
        { id: 'islem-gecmisi', ad: 'İşlem Geçmişi' },
        { id: 'temel-veriler', ad: 'Temel Veriler' },
      ]
    },
    {
      id: 'entegrasyonlar', ad: '🔗 Entegrasyonlar',
      altlar: [
        { id: 'e-fatura-entegrator', ad: 'e-Fatura Entegratör' },
        { id: 'banka-api', ad: 'Banka API' },
        { id: 'pazaryeri', ad: 'Pazaryeri' },
      ]
    },
  ];

  const finansAltlari = ['kasalar', 'bankalar', 'kredi-kartlari', 'pos', 'cek-senet', 'virman'];
  const tumAltlar = menuler.flatMap(m => m.altlar);
  const aktifBaslik = tumAltlar.find(a => a.id === aktifMenu)?.ad || 'Dashboard';

  const baglananlar = [
    'cari-liste', 'urunler', 'siparisler', 'irsaliyeler', 'satis-faturalari',
    'alim-talepleri', 'alim-teklifleri', 'alim-siparisleri',
    'alis-irsaliyeleri', 'alis-faturalari', 'finansal-raporlar', 'bakiye-raporlar', 'stok-raporlar',
    ...finansAltlari,
  ];

  const menuGit = (menu, cari = null) => {
    setGlobalState({ seciliCari: cari, formAc: cari !== null });
    setAktifMenu(menu);
    const anaMenu = menuler.find(m => m.altlar.some(a => a.id === menu));
    if (anaMenu) setAcikMenu(anaMenu.id);
  };

  const veri = dashboardVerisi();
  const kritikUrunler = urunListesi_global.filter(u => u.stok <= (u.minStok || 5) && u.tur !== 'HIZMET');

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>

      {/* Sol Menü */}
      <div style={{ width: '240px', background: '#1e293b', color: 'white', padding: '0', overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #334155' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 'bold', letterSpacing: '2px' }}>
              <span style={{ color: '#38bdf8' }}>ALT</span>
              <span style={{ color: '#f59e0b' }}>ÜST</span>
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', letterSpacing: '4px', marginTop: '2px' }}>ÖN MUHASEBE</div>
          </div>
        </div>

        <div
          onClick={() => { setAktifMenu('dashboard'); setAcikMenu(''); }}
          style={{
            padding: '12px 20px', cursor: 'pointer',
            background: aktifMenu === 'dashboard' ? '#0f172a' : 'transparent',
            borderLeft: aktifMenu === 'dashboard' ? '3px solid #38bdf8' : '3px solid transparent',
            fontSize: '14px',
            color: aktifMenu === 'dashboard' ? '#38bdf8' : '#cbd5e1',
          }}
        >
          📊 Dashboard
        </div>

        {menuler.map(menu => (
          <div key={menu.id}>
            <div
              onClick={() => setAcikMenu(acikMenu === menu.id ? '' : menu.id)}
              style={{
                padding: '12px 20px', cursor: 'pointer', fontSize: '14px', color: '#cbd5e1',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderLeft: '3px solid transparent',
                background: acikMenu === menu.id ? '#0f172a' : 'transparent',
              }}
            >
              <span>{menu.ad}</span>
              <span style={{ fontSize: '10px', color: '#64748b' }}>{acikMenu === menu.id ? '▲' : '▼'}</span>
            </div>

            {acikMenu === menu.id && menu.altlar.map(alt => (
              <div
                key={alt.id}
                onClick={() => menuGit(alt.id)}
                style={{
                  padding: '9px 20px 9px 36px', cursor: 'pointer', fontSize: '13px',
                  background: aktifMenu === alt.id ? '#1e40af' : '#0f172a',
                  borderLeft: aktifMenu === alt.id ? '3px solid #38bdf8' : '3px solid transparent',
                  color: aktifMenu === alt.id ? '#bfdbfe' : '#94a3b8',
                }}
              >
                {alt.ad}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Sağ İçerik */}
      <div style={{ flex: 1, background: '#f1f5f9', padding: '30px', overflowY: 'auto' }}>
        <h1 style={{ margin: '0 0 24px', fontSize: '24px', color: '#1e293b' }}>
          {aktifMenu === 'dashboard' ? '📊 Dashboard' : aktifBaslik}
        </h1>

        {/* Dashboard */}
        {aktifMenu === 'dashboard' && (
          <div>
            {/* Özet Kartlar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {[
                { baslik: 'Toplam Alacak', deger: `₺${veri.toplamAlacak.toLocaleString()}`, renk: '#22c55e', alt: 'Müşterilerden alacak' },
                { baslik: 'Toplam Borç', deger: `₺${veri.toplamBorc.toLocaleString()}`, renk: '#ef4444', alt: 'Tedarikçilere borç' },
                { baslik: 'Net Bakiye', deger: `₺${veri.netBakiye.toLocaleString()}`, renk: veri.netBakiye >= 0 ? '#3b82f6' : '#ef4444', alt: 'Alacak - Borç' },
                { baslik: 'Nakit Pozisyon', deger: `₺${veri.nakitPozisyon.toLocaleString()}`, renk: '#f59e0b', alt: 'Kasa + Banka toplamı' },
                { baslik: 'Stok Değeri', deger: `₺${veri.stokDegeri.toLocaleString()}`, renk: '#06b6d4', alt: 'Satış fiyatından hesaplı' },
                { baslik: 'Kritik Stok', deger: `${veri.kritikStokSayisi} Ürün`, renk: veri.kritikStokSayisi > 0 ? '#ef4444' : '#22c55e', alt: veri.kritikStokSayisi > 0 ? 'Acil sipariş gerekli' : 'Tüm stoklar yeterli' },
              ].map((kart, i) => (
                <div key={i} style={{
                  background: 'white', borderRadius: '12px', padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderTop: `4px solid ${kart.renk}`
                }}>
                  <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#64748b' }}>{kart.baslik}</p>
                  <p style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 'bold', color: kart.renk }}>{kart.deger}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{kart.alt}</p>
                </div>
              ))}
            </div>

            {/* Alt Satır */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

              {/* Nakit Akışı */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#1e293b' }}>💵 Nakit Akışı</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#dcfce7', borderRadius: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#166534' }}>Toplam Giriş</span>
                  <span style={{ fontWeight: '700', color: '#166534' }}>₺{veri.buAyGiris.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#fee2e2', borderRadius: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#991b1b' }}>Toplam Çıkış</span>
                  <span style={{ fontWeight: '700', color: '#991b1b' }}>₺{veri.buAyCikis.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#1e293b', borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'white', fontWeight: '600' }}>Net</span>
                  <span style={{ fontWeight: '700', color: (veri.buAyGiris - veri.buAyCikis) >= 0 ? '#22c55e' : '#ef4444' }}>
                    ₺{(veri.buAyGiris - veri.buAyCikis).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Kritik Stoklar */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#1e293b' }}>⚠️ Kritik Stoklar</h3>
                {kritikUrunler.length === 0
                  ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#22c55e' }}>
                      <p style={{ fontSize: '32px', margin: '0 0 8px' }}>✅</p>
                      <p style={{ fontSize: '13px', margin: 0 }}>Tüm stoklar yeterli seviyede</p>
                    </div>
                  )
                  : kritikUrunler.slice(0, 5).map(u => (
                    <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>{u.ad}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{u.kod}</div>
                      </div>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                        background: u.stok === 0 ? '#fee2e2' : '#fef9c3',
                        color: u.stok === 0 ? '#991b1b' : '#854d0e',
                      }}>
                        {u.stok === 0 ? 'Tükendi' : `${u.stok} adet`}
                      </span>
                    </div>
                  ))
                }
                {kritikUrunler.length > 5 && (
                  <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginTop: '8px' }}>
                    +{kritikUrunler.length - 5} ürün daha
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {aktifMenu === 'cari-liste' && (
          <CariHesaplar onMenuGit={(menu, cari) => menuGit(menu, cari)} />
        )}
        {aktifMenu === 'urunler' && <Urunler />}
        {aktifMenu === 'siparisler' && (
          <Siparisler
            seciliCari={globalState.seciliCari}
            formAc={globalState.formAc}
            onFormAcildi={handleFormAcildi}
          />
        )}
        {aktifMenu === 'irsaliyeler' && <Irsaliyeler />}
        {aktifMenu === 'satis-faturalari' && <SatisFaturalari />}
        {aktifMenu === 'alim-talepleri' && <AlimTalepleri />}
        {aktifMenu === 'alim-teklifleri' && <AlimTeklifleri />}
        {aktifMenu === 'alim-siparisleri' && <AlimSiparisleri />}
        {aktifMenu === 'alis-irsaliyeleri' && <AlisIrsaliyeleri />}
        {aktifMenu === 'alis-faturalari' && <AlisFaturalari />}
        {finansAltlari.includes(aktifMenu) && (
          <Finans
            aktifAlt={aktifMenu}
            seciliCari={globalState.seciliCari}
            formAc={globalState.formAc}
            onFormAcildi={handleFormAcildi}
          />
        )}
        {aktifMenu === 'finansal-raporlar' && <FinansalRaporlar />}
        {aktifMenu === 'bakiye-raporlar' && <BakiyeRaporlar />}
        {aktifMenu === 'stok-raporlar' && <StokRaporlar />}

        {aktifMenu !== 'dashboard' && !baglananlar.includes(aktifMenu) && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            <p style={{ fontSize: '48px', margin: '0 0 16px' }}>🚧</p>
            <p style={{ fontSize: '18px', margin: 0 }}>Bu modül yakında eklenecek</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;