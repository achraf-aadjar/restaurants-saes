import { afterNextRender, Directive, ElementRef, inject, Injector } from '@angular/core';

/**
 * Un refus s'affiche en haut de la page ou du formulaire (Design). Quand on a
 * defile plus bas pour agir, on ne le voit pas : la page defile jusqu'a lui,
 * seulement s'il est hors de vue.
 */
@Directive({
  selector: '.message-refus',
  host: { '(document:submit)': 'apresEnvoi($event)' },
})
export class RefusVisible {
  private readonly message: HTMLElement = inject(ElementRef).nativeElement;
  private readonly injector = inject(Injector);

  constructor() {
    afterNextRender(() => this.defiler());
  }

  /**
   * Un formulaire renvoye tel quel redonne le meme refus : il reste affiche au
   * lieu de reapparaitre, on redefile donc a chaque envoi de son formulaire.
   */
  protected apresEnvoi(envoi: Event): void {
    if ((envoi.target as Element).contains(this.message)) {
      afterNextRender(() => this.defiler(), { injector: this.injector });
    }
  }

  private defiler(): void {
    this.message.scrollIntoView({ block: 'nearest' });
  }
}
