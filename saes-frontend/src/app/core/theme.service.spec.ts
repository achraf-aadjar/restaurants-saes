import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.removeItem('saes_theme');
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.removeItem('saes_theme');
    document.documentElement.removeAttribute('data-theme');
  });

  it('reprend le choix gardé dans le navigateur', () => {
    localStorage.setItem('saes_theme', 'sombre');

    const service = TestBed.inject(ThemeService);

    expect(service.sombre()).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('bascule entre clair et sombre, et garde le choix', () => {
    localStorage.setItem('saes_theme', 'clair');
    const service = TestBed.inject(ThemeService);
    expect(service.sombre()).toBe(false);
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);

    service.basculer();
    expect(service.sombre()).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('saes_theme')).toBe('sombre');

    service.basculer();
    expect(service.sombre()).toBe(false);
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(localStorage.getItem('saes_theme')).toBe('clair');
  });
});
