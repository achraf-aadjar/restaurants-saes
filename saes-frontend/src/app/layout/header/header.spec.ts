import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { Header } from './header';

@Component({ template: '' })
class PageVide {}

describe('En-tete', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([{ path: '**', component: PageVide }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it("les liens Connexion et S'inscrire gardent la page demandee avant la connexion", async () => {
    const fixture = TestBed.createComponent(Header);
    await TestBed.inject(Router).navigateByUrl(
      '/connexion?retour=%2Fmes-reservations%3Frestaurant%3D1',
    );
    await fixture.whenStable();

    const liens = [...fixture.nativeElement.querySelectorAll('.compte a')].map((a: Element) =>
      a.getAttribute('href'),
    );
    expect(liens).toEqual([
      '/connexion?retour=%2Fmes-reservations%3Frestaurant%3D1',
      '/inscription?retour=%2Fmes-reservations%3Frestaurant%3D1',
    ]);
  });
});
