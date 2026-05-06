import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-connector-gallery',
  standalone: true,
  imports: [CommonModule, NzCardModule],
  template: `
    <div class="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
      <div *ngFor="let item of connectors" 
           (click)="onSelect.emit(item.value)"
           class="cursor-pointer hover:shadow-md transition-all border rounded-md p-4 flex flex-col items-center bg-white">
        <span class="text-2xl mb-2">{{item.icon}}</span>
        <span class="font-medium text-sm">{{item.label}}</span>
      </div>
    </div>
  `
})
export class ConnectorGalleryComponent {
  @Output() onSelect = new EventEmitter<string>();
  
  connectors = [
    { label: 'PostgreSQL', value: 'POSTGRESQL', icon: '🐘' },
    { label: 'MySQL', value: 'MYSQL', icon: '🐬' },
    { label: 'REST API', value: 'REST_API', icon: '🌐' },
    { label: 'Kafka', value: 'KAFKA', icon: '⚙️' },
    { label: 'S3 Storage', value: 'S3', icon: '🪣' },
    { label: 'Snowflake', value: 'SNOWFLAKE', icon: '❄️' },
    { label: 'Oracle', value: 'ORACLE', icon: '🔴' }
  ];
}