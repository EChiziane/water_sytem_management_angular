import { Component } from '@angular/core';

@Component({
  selector: 'app-quantities-cards',
  standalone: false,
  templateUrl: './quantities-cards.component.html',
  styleUrl: './quantities-cards.component.scss'
})
export class QuantitiesCardsComponent {
  quantityCards = [
    { volume: 4, materials: this.getMaterials() },
    { volume: 7, materials: this.getMaterials() },
    { volume: 18, materials: this.getMaterials() },
    { volume: 20, materials: this.getMaterials() },
    { volume: 22, materials: this.getMaterials() }
  ];

  getMaterials() {
    return [
      { name: 'Areia Grossa', truckImg: 'assets/truck.png', materialImg: 'assets/areia_grossa.png' },
      { name: 'Pedra', truckImg: 'assets/truck.png', materialImg: 'assets/pedra.png' },
      { name: 'Areia Vermelha', truckImg: 'assets/truck.png', materialImg: 'assets/saibro.png' },
      { name: 'Areia Fina', truckImg: 'assets/truck.png', materialImg: 'assets/areia_fina.png' }
    ];
  }
}
