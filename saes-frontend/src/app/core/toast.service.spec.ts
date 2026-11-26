import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ToastService } from './toast.service';

describe('ToastService', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('affiche un message puis le retire tout seul', () => {
    const service = TestBed.inject(ToastService);

    service.afficher('Thieboudienne ajouté au panier');
    expect(service.courant()?.message).toBe('Thieboudienne ajouté au panier');

    vi.advanceTimersByTime(3600);
    expect(service.courant()).toBeNull();
  });

  it('remplace le message en cours et repart pour toute la durée', () => {
    const service = TestBed.inject(ToastService);

    service.afficher('Premier');
    vi.advanceTimersByTime(3000);
    service.afficher('Second');
    vi.advanceTimersByTime(3000);

    expect(service.courant()?.message).toBe('Second');
    vi.advanceTimersByTime(600);
    expect(service.courant()).toBeNull();
  });
});
