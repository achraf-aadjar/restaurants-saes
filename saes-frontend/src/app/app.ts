import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { BarreLaterale } from './layout/barre-laterale/barre-laterale';
import { Footer } from './layout/footer/footer';
import { Header } from './layout/header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, BarreLaterale, Footer],
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {}
