import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-connector-gallery',
  standalone: true,
  imports: [CommonModule, NzCardModule],
  template: `
    <div class="grid grid-cols-4 gap-4">
  <div *ngFor="let item of connectors" 
       (click)="onSelect.emit(item.value)"
       class="border p-4 rounded-lg cursor-pointer hover:bg-blue-50 transition-all flex flex-col items-center">
    
    <div class="w-12 h-12 flex items-center justify-center mb-2">
      <img [src]="item.icon" [alt]="item.label" class="max-w-full max-height-full object-contain" />
    </div>

    <span class="font-medium text-gray-700">{{ item.label }}</span>
  </div>
</div>
  `
})
export class ConnectorGalleryComponent {
  @Output() onSelect = new EventEmitter<string>();
  
  // connectors = [
  //   { label: 'PostgreSQL', value: 'POSTGRESQL', icon: '🐘' },
  //   { label: 'MySQL', value: 'MYSQL', icon: '🐬' },
  //   { label: 'REST API', value: 'REST_API', icon: '🌐' },
  //   { label: 'Kafka', value: 'KAFKA', icon: '⚙️' },
  //   { label: 'S3 Storage', value: 'S3', icon: '🪣' },
  //   { label: 'Snowflake', value: 'SNOWFLAKE', icon: '❄️' },
  //   { label: 'Oracle', value: 'ORACLE', icon: '🔴' }
  // ];

  connectors = [
  { label: 'PostgreSQL', value: 'POSTGRESQL', icon: 'assets/icons/postgresql.png' },
  { label: 'MySQL', value: 'MYSQL', icon: 'assets/icons/mysql.png' },
  { label: 'REST API', value: 'REST_API', icon: 'assets/icons/rest-api.png' },
  { label: 'Kafka', value: 'KAFKA', icon: 'assets/icons/kafka.png' },
  { label: 'S3 Storage', value: 'S3', icon: 'assets/icons/s3.png' },
  { label: 'Snowflake', value: 'SNOWFLAKE', icon: 'assets/icons/snowflake.png' },
  { label: 'Oracle', value: 'ORACLE', icon: 'assets/icons/oracle.png' }
];
}