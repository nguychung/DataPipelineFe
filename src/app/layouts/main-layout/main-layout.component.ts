import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NzLayoutModule, NzMenuModule, NzIconModule],
  template: `
    <nz-layout class="min-h-screen">
      <nz-sider nzCollapsible nzWidth="200px">
        <div class="logo h-16 flex items-center justify-center text-white font-bold text-xl">
          <span class="text-purple-400">●</span> LOGO
        </div>
        <ul nz-menu nzTheme="dark" nzMode="inline">
          <li nz-menu-item nzSelected routerLink="/flows">
            <span nz-icon nzType="deployment-unit"></span>
            <span>Flows</span>
          </li>
          <li nz-menu-item>
            <span nz-icon nzType="dashboard"></span>
            <span>Dashboards</span>
          </li>
        </ul>
      </nz-sider>
      <nz-layout>
        <nz-content class="bg-gray-100 p-6">
          <router-outlet></router-outlet>
        </nz-content>
      </nz-layout>
    </nz-layout>
  `
})
export class MainLayoutComponent {}
