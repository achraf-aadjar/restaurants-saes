import { Component } from '@angular/core';

import { CREDITS_PHOTOS_RESTAURANTS } from '../../core/photos-restaurants';

/**
 * Page Confidentialite (organisation_travail_sujet17.pdf : loi n° 2008-12,
 * article 58). Contenu a finaliser par le binome (issue #8 du tableau).
 * Elle cite aussi l'auteur des photos libres, comme leur licence le demande.
 */
@Component({
  selector: 'app-confidentialite',
  templateUrl: './confidentialite.html',
})
export class Confidentialite {
  protected readonly credits = CREDITS_PHOTOS_RESTAURANTS;
}
