import { UserAuthDataDto } from "../../DTOs/auth/UserAuthDataDto";

export interface IAuthService {
    /**
     * Prijavljuje korisnika sa datim korisničkim imenom i lozinkom.
     * @param korisnickoIme - Korisničko ime korisnika.
     * @param lozinka - Lozinka korisnika.
     * @returns Podatke o korisniku ako je prijava uspešna, ili prazan objekat ako nije.
     */
  prijava(korisnickoIme: string, lozinka: string): Promise<UserAuthDataDto>;

  /**
   * Registruje novog korisnika sa datim korisničkim imenom i lozinkom.
   * @param korisnickoIme - Korisničko ime korisnika.
   * @param lozinka - Lozinka korisnika.
   * @param uloga - Uloga korisnika u sistemu.
   * @returns Podatke o korisniku ako je registracija uspešna, ili prazan objekat ako nije.
  */
  registracija(korisnickoIme: string, uloga: string, lozinka: string): Promise<UserAuthDataDto>;
}
