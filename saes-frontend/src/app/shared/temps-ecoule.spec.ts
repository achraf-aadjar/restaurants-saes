import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TempsEcoule } from './temps-ecoule';

@Component({
  imports: [TempsEcoule],
  template: `<app-temps-ecoule [depuis]="depuis" />`,
})
class Hote {
  depuis = new Date().toISOString();
}

function rendu(minutes: number): ComponentFixture<Hote> {
  const fixture = TestBed.createComponent(Hote);
  fixture.componentInstance.depuis = new Date(Date.now() - minutes * 60_000).toISOString();
  fixture.detectChanges();
  return fixture;
}

describe('TempsEcoule', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it('écrit les minutes écoulées', () => {
    expect(rendu(12).nativeElement.textContent).toContain('12 min');
  });

  it('passe aux heures au-delà de soixante minutes', () => {
    expect(rendu(95).nativeElement.textContent).toContain('1 h 35');
    expect(rendu(120).nativeElement.textContent).toContain('2 h');
  });

  it("signale l'attente : neutre, puis attention, puis urgence", () => {
    expect(rendu(5).nativeElement.querySelector('.temps').className).toBe('temps');
    expect(rendu(25).nativeElement.querySelector('.temps').className).toContain('attention');
    expect(rendu(40).nativeElement.querySelector('.temps').className).toContain('urgence');
  });

  it('se met à jour sans recharger la page', async () => {
    const fixture = rendu(5);
    vi.advanceTimersByTime(60_000);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('6 min');
  });
});
