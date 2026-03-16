// =============================================
// ALTÜST ÖN MUHASEBE - TEMEL VERİLER
// =============================================

// KDV KODLARI
export const kdvKodlari = [
  { kod: 'KDV0', oran: 0, aciklama: 'KDV Muaf', hesapKodu: '391.00' },
  { kod: 'KDV1', oran: 1, aciklama: 'İndirimli KDV %1', hesapKodu: '391.01' },
  { kod: 'KDV10', oran: 10, aciklama: 'İndirimli KDV %10', hesapKodu: '391.10' },
  { kod: 'KDV20', oran: 20, aciklama: 'Standart KDV %20', hesapKodu: '391.20' },
];

// PARA BİRİMLERİ
export const paraBirimleri = [
  { kod: 'TRY', sembol: '₺', ad: 'Türk Lirası', kur: 1 },
  { kod: 'USD', sembol: '$', ad: 'Amerikan Doları', kur: 32.5 },
  { kod: 'EUR', sembol: '€', ad: 'Euro', kur: 35.2 },
  { kod: 'GBP', sembol: '£', ad: 'İngiliz Sterlini', kur: 41.8 },
];

// ÖDEME KOŞULLARI
export const odemeKosullari = [
  { kod: 'PESIN', ad: 'Peşin', gun: 0 },
  { kod: '15GUN', ad: '15 Gün Vadeli', gun: 15 },
  { kod: '30GUN', ad: '30 Gün Vadeli', gun: 30 },
  { kod: '45GUN', ad: '45 Gün Vadeli', gun: 45 },
  { kod: '60GUN', ad: '60 Gün Vadeli', gun: 60 },
  { kod: '90GUN', ad: '90 Gün Vadeli', gun: 90 },
];

// ÖDEME YÖNTEMLERİ
export const odemeYontemleri = [
  { kod: 'NAKIT', ad: 'Nakit' },
  { kod: 'HAVALE', ad: 'Havale / EFT' },
  { kod: 'CEK', ad: 'Çek' },
  { kod: 'SENET', ad: 'Senet' },
  { kod: 'KK', ad: 'Kredi Kartı' },
  { kod: 'POS', ad: 'POS' },
];

// MALZEME TÜRLERİ
export const malzemeTurleri = [
  { kod: 'HAM', ad: 'Hammadde' },
  { kod: 'YARI', ad: 'Yarı Mamul' },
  { kod: 'MAMUL', ad: 'Mamul' },
  { kod: 'HIZMET', ad: 'Hizmet' },
  { kod: 'SARF', ad: 'Sarf Malzemesi' },
  { kod: 'TICARI', ad: 'Ticari Mal' },
];

// MALZEME KATEGORİLERİ
export const malzemeKategorileri = [
  { kod: 'ELEK', ad: 'Elektronik', tur: 'TICARI' },
  { kod: 'GIDA', ad: 'Gıda', tur: 'TICARI' },
  { kod: 'TEK', ad: 'Tekstil', tur: 'TICARI' },
  { kod: 'INS', ad: 'İnşaat', tur: 'HAM' },
  { kod: 'KIM', ad: 'Kimyasal', tur: 'HAM' },
  { kod: 'BIL', ad: 'Bilişim', tur: 'HIZMET' },
  { kod: 'DAN', ad: 'Danışmanlık', tur: 'HIZMET' },
  { kod: 'OFIS', ad: 'Ofis Malzemeleri', tur: 'SARF' },
];

// BİRİMLER
export const birimler = [
  { kod: 'ADET', ad: 'Adet', kisaltma: 'Adet' },
  { kod: 'KG', ad: 'Kilogram', kisaltma: 'Kg' },
  { kod: 'GR', ad: 'Gram', kisaltma: 'gr' },
  { kod: 'LT', ad: 'Litre', kisaltma: 'Lt' },
  { kod: 'ML', ad: 'Mililitre', kisaltma: 'ml' },
  { kod: 'MT', ad: 'Metre', kisaltma: 'mt' },
  { kod: 'CM', ad: 'Santimetre', kisaltma: 'cm' },
  { kod: 'M2', ad: 'Metrekare', kisaltma: 'm²' },
  { kod: 'M3', ad: 'Metreküp', kisaltma: 'm³' },
  { kod: 'SAAT', ad: 'Saat', kisaltma: 'Saat' },
  { kod: 'GUN', ad: 'Gün', kisaltma: 'Gün' },
  { kod: 'PAKET', ad: 'Paket', kisaltma: 'Paket' },
  { kod: 'KUTU', ad: 'Kutu', kisaltma: 'Kutu' },
  { kod: 'KOLI', ad: 'Koli', kisaltma: 'Koli' },
  { kod: 'TON', ad: 'Ton', kisaltma: 'Ton' },
];

// CARİ KATEGORİLERİ
export const cariKategorileri = [
  { kod: 'VIP', ad: 'VIP Müşteri' },
  { kod: 'BAYI', ad: 'Bayi' },
  { kod: 'PERAK', ad: 'Perakende' },
  { kod: 'IHRAC', ad: 'İhracat Müşterisi' },
  { kod: 'YURT', ad: 'Yurt İçi Tedarikçi' },
  { kod: 'YURTD', ad: 'Yurt Dışı Tedarikçi' },
];

// MASRAF MERKEZLERİ
export const masrafMerkezleri = [
  { kod: 'GENEL', ad: 'Genel Yönetim' },
  { kod: 'SATIS', ad: 'Satış ve Pazarlama' },
  { kod: 'ARGE', ad: 'Ar-Ge' },
  { kod: 'URETIM', ad: 'Üretim' },
  { kod: 'LOJISTIK', ad: 'Lojistik' },
  { kod: 'IT', ad: 'Bilgi Teknolojileri' },
  { kod: 'IK', ad: 'İnsan Kaynakları' },
];

// DEPO / AMBAR TANIMLARI
export const depolar = [
  { kod: 'MERKEZ', ad: 'Merkez Depo', adres: 'İstanbul', aktif: true },
  { kod: 'SUBE1', ad: 'Şube 1 Deposu', adres: 'Ankara', aktif: true },
  { kod: 'FIRE', ad: 'Fire / Hurda Deposu', adres: 'İstanbul', aktif: true },
];

// BANKA TANIMLARI
export const bankaTanimlari = [
  { kod: 'ZIRAAT', ad: 'Ziraat Bankası' },
  { kod: 'IS', ad: 'İş Bankası' },
  { kod: 'GARANTI', ad: 'Garanti BBVA' },
  { kod: 'YAPI', ad: 'Yapı Kredi' },
  { kod: 'AKBANK', ad: 'Akbank' },
  { kod: 'VAKIF', ad: 'VakıfBank' },
  { kod: 'HALK', ad: 'Halkbank' },
  { kod: 'DENIZ', ad: 'Denizbank' },
  { kod: 'ING', ad: 'ING Bank' },
  { kod: 'QNB', ad: 'QNB Finansbank' },
];

// EVRAK SERİ NUMARALARI
export let evrakSerileri = {
  satisSiparisi: { prefix: 'SIP', yil: '2026', sayac: 3 },
  satisIrsaliyesi: { prefix: 'IRS', yil: '2026', sayac: 2 },
  satisFaturasi: { prefix: 'FAT', yil: '2026', sayac: 3 },
  alimTalebi: { prefix: 'TAL', yil: '2026', sayac: 2 },
  alimTeklifi: { prefix: 'ATK', yil: '2026', sayac: 1 },
  alimSiparisi: { prefix: 'ASP', yil: '2026', sayac: 1 },
  alisIrsaliyesi: { prefix: 'AIRS', yil: '2026', sayac: 1 },
  alisFaturasi: { prefix: 'AFAT', yil: '2026', sayac: 1 },
  kasaFisi: { prefix: 'KAS', yil: '2026', sayac: 0 },
  bankaFisi: { prefix: 'BNK', yil: '2026', sayac: 0 },
};

export const yeniEvrakNo = (tip) => {
  const seri = evrakSerileri[tip];
  if (!seri) return '';
  seri.sayac += 1;
  const no = String(seri.sayac).padStart(3, '0');
  return `${seri.prefix}-${seri.yil}-${no}`;
};

// TEDARİK ŞEKİLLERİ
export const tedarikSekilleri = [
  { kod: 'SATIN', ad: 'Satın Alma' },
  { kod: 'URETIM', ad: 'Üretim' },
  { kod: 'HER_IKISI', ad: 'Satın Alma ve Üretim' },
];

// STOK HAREKET TÜRLERİ
export const stokHareketTurleri = [
  { kod: 'GIRIS_ALIS', ad: 'Alış Girişi' },
  { kod: 'CIKIS_SATIS', ad: 'Satış Çıkışı' },
  { kod: 'GIRIS_IADE', ad: 'İade Girişi' },
  { kod: 'CIKIS_IADE', ad: 'İade Çıkışı' },
  { kod: 'TRANSFER', ad: 'Depo Transferi' },
  { kod: 'SAYIM_FAZLA', ad: 'Sayım Fazlası' },
  { kod: 'SAYIM_EKSIK', ad: 'Sayım Eksiği' },
  { kod: 'FIRE', ad: 'Fire / Zayi' },
];

// KULLANICI ROLLERİ
export const kullaniciRolleri = [
  { kod: 'ADMIN', ad: 'Sistem Yöneticisi', yetkiler: ['hepsi'] },
  { kod: 'MUHASEBE', ad: 'Muhasebe', yetkiler: ['finans', 'raporlar', 'cariler'] },
  { kod: 'SATIS', ad: 'Satış Temsilcisi', yetkiler: ['satislar', 'cariler'] },
  { kod: 'DEPO', ad: 'Depo Görevlisi', yetkiler: ['stoklar', 'irsaliyeler'] },
  { kod: 'SATINALMA', ad: 'Satın Alma', yetkiler: ['alimlar', 'cariler'] },
  { kod: 'READONLY', ad: 'Sadece Görüntüleme', yetkiler: ['goruntule'] },
];

// FİRMA BİLGİLERİ (Ayarlardan değiştirilebilir)
export let firmaBilgileri = {
  unvan: 'ALTÜST Ticaret Ltd. Şti.',
  vergiDairesi: 'Kadıköy',
  vergiNo: '1234567890',
  mersis: '0123456789012345',
  adres: 'Kadıköy / İstanbul',
  telefon: '0212 000 00 00',
  email: 'info@altust.com',
  website: 'www.altust.com',
  logo: null,
  eFaturaEtkin: true,
  eArsivEtkin: true,
};