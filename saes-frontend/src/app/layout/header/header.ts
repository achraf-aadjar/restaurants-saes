import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly menuOuvert = signal(false);
  protected readonly menuMobileOuvert = signal(false);

  protected basculerMenu(): void {
    this.menuOuvert.update((v) => !v);
  }

  protected basculerMenuMobile(): void {
    this.menuMobileOuvert.update((v) => !v);
  }

  protected seDeconnecter(): void {
    this.menuOuvert.set(false);
    this.auth.deconnecter();
    this.router.navigate(['/menus']);
  }

  protected estAdministrateur(): boolean {
    return this.auth.aLeRole('ADMINISTRATEUR');
  }

  protected rolePersonnel(): string | null {
    const utilisateur = this.auth.utilisateur();
    if (!utilisateur) return null;
    const roles = utilisateur.roles.filter((r) => r !== 'CLIENT');
    return roles.length > 0 ? roles.join(', ') : null;
  }
}
