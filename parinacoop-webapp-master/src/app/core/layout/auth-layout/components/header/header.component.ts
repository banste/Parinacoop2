import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ROUTE_TOKENS } from '@app/route-tokens';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  navigation = ROUTE_TOKENS;
}
