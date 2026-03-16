import { urunListesi_global } from './Urunler';
import { cariListesi } from './CariHesaplar';
import { kasalar, bankalar, kasaHareketleri, bankaHareketleri } from './Finans';

export let stokHareketleri = [];

export function stokDus(urunKod, miktar, aciklama = '') {
  const urun = urunListesi_global.find(u => u.kod === urunKod);
  if (!urun) return { basarili: false, mesaj: `Ürün bulunamadı: ${urunKod}` };
  if (urun.stok < miktar) return { basarili: false, mesaj: `Yetersiz stok! Mevcut: ${urun.stok}, İstenen: ${miktar}` };
  urun.stok -= miktar;
  stokHareketleri.unshift({
    id: Date.now(), tarih: new Date().toISOString().split('T')[0],
    urunKod, urunAd: urun.ad, tip: 'Çıkış', miktar,
    oncekiStok: urun.stok + miktar, sonrakiStok: urun.stok, aciklama,
  });
  return { basarili: true, yeniStok: urun.stok };
}

export function stokArt(urunKod, miktar, aciklama = '') {
  const urun = urunListesi_global.find(u => u.kod === urunKod);
  if (!urun) return { basarili: false, mesaj: `Ürün bulunamadı: ${urunKod}` };
  urun.stok += miktar;
  stokHareketleri.unshift({
    id: Date.now(), tarih: new Date().toISOString().split('T')[0],
    urunKod, urunAd: urun.ad, tip: 'Giriş', miktar,
    oncekiStok: urun.stok - miktar, sonrakiStok: urun.stok, aciklama,
  });
  return { basarili: true, yeniStok: urun.stok };
}

export function cariBakiyeGuncelle(cariUnvan, tutar, tip, aciklama = '') {
  const cari = cariListesi.find(c => c.unvan === cariUnvan);
  if (!cari) return { basarili: false, mesaj: `Cari bulunamadı: ${cariUnvan}` };
  const eskiBakiye = cari.bakiye;
  cari.bakiye = tip === 'alacak' ? cari.bakiye + tutar : cari.bakiye - tutar;
  return { basarili: true, eskiBakiye, yeniBakiye: cari.bakiye };
}

export function irsaliyedenStokDus(satirlar, cariUnvan, irsaliyeNo) {
  const hatalar = [];
  const basarililar = [];
  for (const satir of satirlar) {
    if (!satir.urun || !satir.miktar) continue;
    const urun = urunListesi_global.find(u => u.ad === satir.urun || u.kod === satir.kod);
    if (!urun) { hatalar.push(`${satir.urun}: ürün listesinde bulunamadı`); continue; }
    if (urun.tur === 'HIZMET') continue;
    const sonuc = stokDus(urun.kod, Number(satir.miktar), `${irsaliyeNo} - ${cariUnvan}`);
    if (sonuc.basarili) basarililar.push(`${urun.ad}: ${satir.miktar} adet düşüldü (Kalan: ${sonuc.yeniStok})`);
    else hatalar.push(`${urun.ad}: ${sonuc.mesaj}`);
  }
  return { basarililar, hatalar };
}

export function alisIrsaliyedenStokArt(satirlar, cariUnvan, evrakNo) {
  const hatalar = [];
  const basarililar = [];
  for (const satir of satirlar) {
    if (!satir.urun || !satir.miktar) continue;
    const urun = urunListesi_global.find(u => u.ad === satir.urun || u.kod === satir.kod);
    if (!urun) { hatalar.push(`${satir.urun}: ürün listesinde bulunamadı`); continue; }
    if (urun.tur === 'HIZMET') continue;
    const sonuc = stokArt(urun.kod, Number(satir.miktar), `${evrakNo} - ${cariUnvan}`);
    if (sonuc.basarili) {
      basarililar.push(`${urun.ad}: ${satir.miktar} adet eklendi (Yeni stok: ${sonuc.yeniStok})`);
      if (satir.fiyat) urun.alisFiyat = Number(satir.fiyat);
    } else {
      hatalar.push(`${urun.ad}: ${sonuc.mesaj}`);
    }
  }
  if (cariUnvan) {
    const alisToplam = satirlar.reduce((t, s) => t + (Number(s.fiyat || 0) * Number(s.miktar || 1)), 0);
    cariBakiyeGuncelle(cariUnvan, alisToplam, 'borc', evrakNo);
  }
  return { basarililar, hatalar };
}

export function satiseFaturaCari(cariUnvan, toplam, faturaNo) {
  return cariBakiyeGuncelle(cariUnvan, toplam, 'alacak', faturaNo);
}

export function tahsilat(cariUnvan, tutar, hesapTip, hesapId, aciklama = '') {
  const hedefHesaplar = hesapTip === 'kasa' ? kasalar : bankalar;
  const hesap = hedefHesaplar.find(h => h.id === hesapId);
  if (!hesap) return { basarili: false, mesaj: 'Hesap bulunamadı' };
  hesap.bakiye += tutar;
  const yeniHareket = {
    id: Date.now(), tarih: new Date().toISOString().split('T')[0],
    islem: 'Para Girişi',
    [hesapTip === 'kasa' ? 'kasaId' : 'bankaId']: hesapId,
    alacak: tutar, borc: 0, bakiye: hesap.bakiye,
    aciklama: aciklama || `${cariUnvan} tahsilatı`,
    cari: cariUnvan, kullanici: 'Admin',
  };
  if (hesapTip === 'kasa') kasaHareketleri.unshift(yeniHareket);
  else bankaHareketleri.unshift(yeniHareket);
  cariBakiyeGuncelle(cariUnvan, tutar, 'borc', aciklama);
  return { basarili: true, yeniBakiye: hesap.bakiye };
}

export function odeme(cariUnvan, tutar, hesapTip, hesapId, aciklama = '') {
  const hedefHesaplar = hesapTip === 'kasa' ? kasalar : bankalar;
  const hesap = hedefHesaplar.find(h => h.id === hesapId);
  if (!hesap) return { basarili: false, mesaj: 'Hesap bulunamadı' };
  if (hesap.bakiye < tutar) return { basarili: false, mesaj: 'Yetersiz bakiye!' };
  hesap.bakiye -= tutar;
  const yeniHareket = {
    id: Date.now(), tarih: new Date().toISOString().split('T')[0],
    islem: 'Para Çıkışı',
    [hesapTip === 'kasa' ? 'kasaId' : 'bankaId']: hesapId,
    alacak: 0, borc: tutar, bakiye: hesap.bakiye,
    aciklama: aciklama || `${cariUnvan} ödemesi`,
    cari: cariUnvan, kullanici: 'Admin',
  };
  if (hesapTip === 'kasa') kasaHareketleri.unshift(yeniHareket);
  else bankaHareketleri.unshift(yeniHareket);
  cariBakiyeGuncelle(cariUnvan, tutar, 'alacak', aciklama);
  return { basarili: true, yeniBakiye: hesap.bakiye };
}

export function dashboardVerisi() {
  const toplamAlacak = cariListesi.filter(c => c.bakiye > 0).reduce((t, c) => t + c.bakiye, 0);
  const toplamBorc = Math.abs(cariListesi.filter(c => c.bakiye < 0).reduce((t, c) => t + c.bakiye, 0));
  const netBakiye = toplamAlacak - toplamBorc;
  const kasaBakiye = kasalar.filter(k => k.paraBirimi === 'TRY').reduce((t, k) => t + k.bakiye, 0);
  const bankaBakiye = bankalar.filter(b => b.paraBirimi === 'TRY').reduce((t, b) => t + b.bakiye, 0);
  const nakitPozisyon = kasaBakiye + bankaBakiye;
  const stokDegeri = urunListesi_global.reduce((t, u) => t + (u.satisFiyat * u.stok), 0);
  const kritikStokSayisi = urunListesi_global.filter(u => u.stok <= (u.minStok || 5) && u.tur !== 'HIZMET').length;
  const buAyGiris = [
    ...kasaHareketleri.filter(h => h.islem === 'Para Girişi'),
    ...bankaHareketleri.filter(h => h.islem === 'Para Girişi'),
  ].reduce((t, h) => t + h.alacak, 0);
  const buAyCikis = [
    ...kasaHareketleri.filter(h => h.islem === 'Para Çıkışı'),
    ...bankaHareketleri.filter(h => h.islem === 'Para Çıkışı'),
  ].reduce((t, h) => t + h.borc, 0);
  return { toplamAlacak, toplamBorc, netBakiye, nakitPozisyon, stokDegeri, kritikStokSayisi, buAyGiris, buAyCikis };
}