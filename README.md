# PZ E01 - eUčenje

## Projektna tema

**Pametna platforma za online učenje**

## Kratak opis

**Platforma za razmenu obaveštenja i materijala među studentima.**

## Asistent

**Danijel Jovanović**

---

## Opis projektnog zadatka

Potrebno je kreirati platformu koja će služiti za razmenu materijala između profesora i studenata.
I profesor i student mogu biti upisani na jedan kurs, a najveći broj kurseva koji mogu upisati je **tri**.
Kursevi su **predefinisani i proizvoljni**, a upis na iste se bira prilikom registracije korisnika.
Svaki kurs ima dve sekcije:

* **Obaveštenja**
* **Nastavni materijali**

---

## Uloge i funkcionalnosti

### Uloga: Profesor

1. Može dodavati obaveštenja za kurs (tekst ili tekst + slika)
2. Može dodavati materijale (tekstualni dokument ili PDF datoteka)
3. Može menjati obaveštenja, kao i brisati nastavne materijale za kurs

### Uloga: Student

1. Može čitati obaveštenja i na njih reagovati (like/dislike) – broj reakcija je vidljiv svima
2. Može samo preuzimati postavljene nastavne materijale
3. Može ostavljati komentar na obaveštenje, takođe komentar može izmeniti ili obrisati

---

## Tehnički zahtevi

1. Primena **SOLID** principa i **čiste arhitekture**
2. Razviti **klijentsku** i **serversku** aplikaciju
3. **TypeScript** je obavezan za korišćenje
4. Koristiti **relacionu bazu podataka**
5. Dozvoljena upotreba biblioteka za stilove (npr. **TailwindCSS**, **Bootstrap 5**)

> Neophodno je obezbediti:
>
> * Adekvatnu autentifikaciju i autorizaciju
> * Sistem upravljanja pristupa po ulogama (klijent i server)
> * Validaciju podataka (klijent i server)

---

## Način bodovanja

| Funkcionalnost                                                     | Poena  |
| ------------------------------------------------------------------ | ------ |
| Implementirana autentifikacija i autorizacija (server i klijent)   | 4      |
| Klijentska i serverska aplikacija razmenjuju JWT token             | 2      |
| Postoji 404 stranica, koristi se Protected Route mehanizam         | 3      |
| Klijentska aplikacija je stilizovana i koristi adekvatne stilove   | 5      |
| Upotrebljen autentifikacioni kontekstualni prostor nad aplikacijom | 4      |
| Implementirane sve funkcionalnosti u okviru specifikacije          | 15     |
| Koristi se relaciona baza podataka                                 | 4      |
| Primenjeni SOLID principi i čista arhitektura                      | 8      |
| Odbrana projekta: teorijska pitanja                                | 15     |
| **Ukupno**                                                         | **60** |

---

## Napomene

* Odbranu je moguće zakazati i **pre termina** definisanog od strane asistenta (računa se kao **predrok**)
* Odbrana projektnog zadatka u **predroku donosi 5 dodatnih poena**

---

## Uslovi položenosti

* Uslov za položene predispitne obaveze je da je broj osvojenih poena **36 ili više**
