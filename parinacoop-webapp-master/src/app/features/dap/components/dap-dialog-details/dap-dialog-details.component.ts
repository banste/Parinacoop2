import { CurrencyPipe, DatePipe, NgClass, PercentPipe } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { Dap } from '../../models/dap.model';
import { DapStatusPipe } from '../../pipes/dap-status.pipe';
import { DapTypePipe } from '../../pipes/dap-type.pipe';
import { DetailComponent } from '../detail.component';
import { MatIconModule } from '@angular/material/icon';
import { IdPadPipe } from '../../pipes/id-pad.pipe';

@Component({
  standalone: true,
  imports: [
    NgClass,
    MatDialogModule,
    MatButtonModule,
    CurrencyPipe,
    DatePipe,
    DapStatusPipe,
    DapTypePipe,
    DetailComponent,
    PercentPipe,
    IdPadPipe,
    MatIconModule,
  ],
  templateUrl: './dap-dialog-details.component.html',
})
export class DapDialogDetailsComponent implements OnInit {
  constructor(
    @Inject(MAT_DIALOG_DATA) public currentDap: Dap,
    private dialogRef: MatDialogRef<DapDialogDetailsComponent>,
  ) {}
  ngOnInit(): void {
    this.dialogRef.afterClosed().subscribe(() => {
      console.log('The dialog was closed');
    });
  }
}
