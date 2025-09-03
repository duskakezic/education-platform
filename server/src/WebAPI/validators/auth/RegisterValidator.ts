import { RezultatValidacije } from '../../../Domain/types/ValidationResult';

export function validacijaPodatakaAuth(korisnickoIme?: string, lozinka?: string): RezultatValidacije {
  if (!korisnickoIme || !lozinka) {
    return { uspesno: false, poruka: 'Корисничко име и лозинка су обавезни.' };
  }

  if (korisnickoIme.length < 3) {
    return { uspesno: false, poruka: 'Корисничко име мора имати најмање 3 карактера.' };
  }

  if (lozinka.length < 6) {
    return { uspesno: false, poruka: 'Лозинка мора имати најмање 6 карактера.' };
  }

  if (lozinka.length > 20) {
    return { uspesno: false, poruka: 'Лозинка може имати највише 20 карактера.' };
  }

  return { uspesno: true };
}
