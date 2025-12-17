import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { LoaderService } from '@app/shared/services';

@Component({
  selector: 'app-spinner-loader',
  standalone: true,
  imports: [NgClass],
  templateUrl: './spinner-loader.component.html',
})
export class SpinnerLoaderComponent {

  constructor(public loader: LoaderService){}

}
