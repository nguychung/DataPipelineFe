import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, NzTableModule, NzButtonModule, NzTagModule],
  template: `
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Flows</h2>
      <button nz-button nzType="primary" routerLink="/flows/create">
        <span nz-icon nzType="plus"></span> Create
      </button>
    </div>

    <nz-table #basicTable [nzData]="listOfData" class="shadow-sm rounded-lg overflow-hidden">
      <thead>
        <tr>
          <th>Id</th>
          <th>Namespace</th>
          <th>Last execution</th>
          <th>Status</th>
          <th>Triggers</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let data of basicTable.data">
          <td class="font-medium text-purple-600">{{ data.id }}</td>
          <td>{{ data.namespace }}</td>
          <td>{{ data.lastExec }}</td>
          <td>
            <nz-tag [nzColor]="'success'">SUCCESS</nz-tag>
          </td>
          <td>⏰</td>
        </tr>
      </tbody>
    </nz-table>
  `
})
export class FlowListComponent {
  listOfData = [
    { id: 'fetch-and-upsert-data-tram-do-mua', namespace: 'company.team', lastExec: 'Wed, May 6, 2026 4:30 PM' },
    { id: 'fetch-and-upsert-data-thai-nguyen', namespace: 'company.team', lastExec: 'Wed, May 6, 2026 1:00 AM' },
    { id: 'data-engineering-pipeline', namespace: 'tutorial', lastExec: '-' }
  ];
}