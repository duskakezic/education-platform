import { UserDto } from "../../DTOs/users/UserDto";

export interface IUserService {
     /**
     * Vraca listu svih korisnika u sistemu.
     * @returns Podatke o korisnicima u vidu liste.
     */
  getSviKorisnici(): Promise<UserDto[]>;
}